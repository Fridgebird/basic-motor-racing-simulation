// simulation.js — Sector-by-sector race engine
//
// One call to tick(rng) advances every car through one sector.
// 3 sectors × 70 laps = 210 ticks for a full race.
//
// Call initRace() in state.js first to get the rng, then drive the loop:
//   const rng = initRace(seed);
//   while (!isRaceOver()) tick(rng);

import { COMPOUNDS, CIRCUIT } from './data.js';
import { cars, race, raceLog, updatePositions } from './state.js';

// ─── Tuning Constants ─────────────────────────────────────────────────────────
// These scale the raw probability formulas to produce realistic retirement rates.
// Adjust these to tune how often events fire without touching the core formulas.

// Driver error checks happen every sector.
// At CRASH_SCALE=0.004, de Cesaris (consistency 50) has ~0.2% crash chance per sector
// → ~34% chance of crashing over a full race. Prost (96) → ~3%.
const CRASH_SCALE = 0.004;

// Slow sector (spin / lock-up) probability scale. Same driver: ~0.7% per sector → ~77% chance
// of at least one slow sector during a race. Adds drama without retiring the car.
const SLOW_SCALE  = 0.018;

// Reliability check happens once per lap.
// At FAILURE_SCALE=0.016, McLaren (engine 85, chassis 92) has ~0.35% failure chance per lap
// → ~22% any-failure probability over 70 laps; ~7% retirement.
// Arrows (Megatron, engine 62, chassis 70): ~0.87% → ~46% any failure; ~14% retirement.
const FAILURE_SCALE = 0.016;

// Driver aggression scales tyre wear. At 0.4, maximum aggression (100) adds 40% extra wear.
const AGGRESSION_WEAR_SCALE = 0.4;

// Worn-tyre consistency penalty. At full wear (1.0) a driver loses up to 25 consistency points,
// raising their crash and slow-sector thresholds.
const WORN_TYRE_CONSISTENCY_PENALTY = 25;

// ─── Dirty air / overtaking constants ────────────────────────────────────────
// Dirty air applies when the gap to the car ahead is within DIRTY_AIR_RANGE.
//
// DIRTY_AIR_AERO_LOSS: fraction of aero effectiveness lost at gap = 0.
//   At 0.40, a car right on another's tail loses 40% of their aero advantage.
//   Effect scales linearly to zero at DIRTY_AIR_RANGE.
//   On S1 (aeroWeight 0.05) this costs ~0.9 s/lap at maximum proximity.
//   On S2 (aeroWeight 0.01) the effect is minimal — straights are largely unaffected.
// DIRTY_AIR_WEAR_MULT: extra tyre wear fraction at gap = 0; scales linearly.
//   At 0.20, a car at maximum proximity takes 20% more tyre wear per sector.
const DIRTY_AIR_RANGE     = 1.00;  // seconds
const DIRTY_AIR_AERO_LOSS = 0.40;
const DIRTY_AIR_WEAR_MULT = 0.20;

// Overtake attempt fires when gap < OVERTAKE_RANGE and the following car has a
// pace advantage (fresher tyres / lighter fuel). Outcome is probabilistic.
// FAILED_OVERTAKE_PENALTY: seconds added to following car on a failed attempt —
//   represents backing out of the move and losing momentum.
const OVERTAKE_RANGE          = 0.30;  // seconds
const FAILED_OVERTAKE_PENALTY = 0.40;  // seconds

// ─── Failure labels ────────────────────────────────────────────────────────────
const FAILURE_LABELS = [
  'Engine', 'Gearbox', 'Turbo', 'Oil pressure',
  'Hydraulics', 'Suspension', 'Aero damage',
];

// ─── tick ──────────────────────────────────────────────────────────────────────
// Advance every car through one sector. Must be called with the rng returned
// by initRace() so the full sequence is contiguous and replayable.
export function tick(rng) {

  // ── Advance race clock ──────────────────────────────────────────────────────
  race.sector += 1;
  if (race.sector > 3) {
    race.sector = 1;
    race.lap   += 1;
  }
  race.tick += 1;

  const sectorDef  = CIRCUIT.sectors[race.sector - 1];
  const isEndOfLap = race.sector === 3;

  // ── Build dirty-air proximity map ──────────────────────────────────────────
  // Snapshot cumulative times before any car is processed this sector.
  // cars[] is already sorted by position from the previous updatePositions() call,
  // so iterating forward gives us the nearest active car ahead for each car.
  const gapAhead = new Map(); // car → gap (seconds) to nearest active car ahead
  let lastActiveCar = null;
  for (const car of cars) {
    if (car.status === 'retired') continue;
    if (lastActiveCar !== null) {
      gapAhead.set(car, Math.max(0, car.cumulativeTime - lastActiveCar.cumulativeTime));
    }
    lastActiveCar = car;
  }

  // ── Process each car ─────────────────────────────────────────────────────────
  for (const car of cars) {
    if (car.status === 'retired') continue;

    // 'pitted' is a display state set at end of previous lap; clear it now
    if (car.status === 'pitted') car.status = 'racing';

    const events  = [];
    const factors = {};
    const rolls   = {};

    // ── 1. Engine factor ────────────────────────────────────────────────────
    // Higher power → closer to 1.0 (no penalty). Lower power → factor rises above 1.0.
    // Formula: 1.0 + (1 - power/100) × sectorPowerWeight
    const engineFactor = 1.0 + (1 - car.engine.power / 100) * sectorDef.powerWeight;
    factors.engine = +engineFactor.toFixed(4);

    // ── 2. Chassis factor ───────────────────────────────────────────────────
    // Dirty air reduces effective aero when following closely.
    // proximity = 1.0 at gap=0 (fully in dirty air), 0.0 at gap=DIRTY_AIR_RANGE.
    // Effect is strongest in corner-heavy sectors (high aeroWeight) and minimal
    // on the power straight (low aeroWeight) — falls out of the formula naturally.
    const proximity    = Math.max(0, 1 - (gapAhead.get(car) ?? Infinity) / DIRTY_AIR_RANGE);
    const effectiveAero = car.team.aero * (1 - proximity * DIRTY_AIR_AERO_LOSS);
    const chassisFactor = 1.0 + (1 - effectiveAero / 100) * sectorDef.aeroWeight;
    factors.chassis  = +chassisFactor.toFixed(4);
    factors.dirtyAir = +proximity.toFixed(3); // 0 = clean air, 1 = maximum dirty air

    // ── 3. Setup factor ─────────────────────────────────────────────────────
    // Formula: 1.0 + (1 - setup/100) × 0.04
    // Perfect setup (100) = no penalty; worst setup (0) = 4% slower
    const setupFactor = 1.0 + (1 - car.setup / 100) * 0.04;
    factors.setup = +setupFactor.toFixed(4);

    // ── 4. Fuel factor ──────────────────────────────────────────────────────
    // Formula: 1.0 + (currentFuel / maxFuel) × 0.03
    // Full tank = 3% slower than empty
    const fuelFactor = 1.0 + (car.fuel / CIRCUIT.fuelCapacity) * 0.03;
    factors.fuel = +fuelFactor.toFixed(4);

    // ── 5. Tyre factor ──────────────────────────────────────────────────────
    // grip = normalised effective grip considering manufacturer, compound and wear
    // Formula: tyreFactor = 1.0 + (1 - grip) × 0.08
    const compound        = COMPOUNDS[car.compound];
    const effectiveMaxGrip = Math.min(100, car.tyres.maxGrip + compound.gripModifier);
    const grip             = (effectiveMaxGrip / 100) * (1 - car.tyreWear); // 0–1
    const tyreFactor       = 1.0 + (1 - grip) * tyreConfig.penaltyCoeff;
    factors.tyre = +tyreFactor.toFixed(4);

    // ── 6. Reliability factor ───────────────────────────────────────────────
    // Persists from earlier failures (can stack). 1.0 = healthy.
    factors.reliability = +car.reliabilityFactor.toFixed(4);

    // ── 7. Driver factor + error check ─────────────────────────────────────
    // Worn tyres lower effective consistency, widening crash/slow thresholds.
    const wornTyrePenalty      = car.tyreWear * WORN_TYRE_CONSISTENCY_PENALTY;
    const effectiveConsistency = Math.max(10, car.driver.consistency - wornTyrePenalty);

    // One raw roll (0–1) serves both the error-threshold check and the
    // consistency-bounded skill calculation (see below).
    const errorRoll = rng();
    rolls.errorRoll = +errorRoll.toFixed(4);

    const crashThreshold = (1 - effectiveConsistency / 100) * CRASH_SCALE;
    const slowThreshold  = (1 - effectiveConsistency / 100) * SLOW_SCALE;

    let driverFactor;
    let crashOccurred = false;

    if (errorRoll < crashThreshold) {
      // ── Crash — retirement ──────────────────────────────────────────────
      crashOccurred = true;
      driverFactor  = 1.0;  // irrelevant; car is retiring this tick
      events.push({ type: 'driver_error', severity: 'crash' });

    } else if (errorRoll < slowThreshold) {
      // ── Slow sector — spin or lock-up ───────────────────────────────────
      // Penalty: 8–20% time loss on this sector only
      const penalty = 1.08 + rng() * 0.12;
      driverFactor  = penalty;
      events.push({ type: 'driver_error', severity: 'slow_sector', penalty: +penalty.toFixed(3) });

    } else {
      // ── Normal sector ───────────────────────────────────────────────────
      // Remap errorRoll from [0,1] into [consistency/100, 1.0] to produce
      // a roll that's bounded by the driver's consistency.
      // High consistency → roll clusters near 1.0 → effectiveSkill near raw skill.
      const consistencyRoll = effectiveConsistency / 100
        + errorRoll * (1 - effectiveConsistency / 100);
      rolls.consistencyRoll = +consistencyRoll.toFixed(4);

      const effectiveSkill = car.driver.skill * consistencyRoll;
      // Formula: 1.0 + (1 - effectiveSkill/100) × 0.05
      driverFactor = 1.0 + (1 - effectiveSkill / 100) * 0.05;
    }

    factors.driver = +driverFactor.toFixed(4);

    // ── Sector time ─────────────────────────────────────────────────────────
    // All factors multiply the base sector time; higher factor = slower
    const sectorTime = sectorDef.baseSectorTime
      * engineFactor
      * chassisFactor
      * setupFactor
      * fuelFactor
      * tyreFactor
      * car.reliabilityFactor
      * driverFactor;

    car.cumulativeTime += sectorTime;
    car.currentSectorTimes.push(+sectorTime.toFixed(3));

    // ── Tyre wear accumulation ───────────────────────────────────────────────
    // Formula: wear += baseWearRate × compoundMult × sectorWearWeight × aggressionMult × trackAbrasiveness × dirtyAirMult
    // dirtyAirMult: following in turbulent air increases tyre stress.
    const aggressionMult  = 1.0 + (car.driver.aggression / 100) * AGGRESSION_WEAR_SCALE;
    const dirtyAirWearMult = 1.0 + proximity * DIRTY_AIR_WEAR_MULT;
    const wearDelta = car.tyres.wearRate
      * compound.wearMultiplier
      * sectorDef.wearWeight
      * aggressionMult
      * CIRCUIT.trackAbrasiveness
      * dirtyAirWearMult;
    car.tyreWear = Math.min(1, car.tyreWear + wearDelta);

    // ── Fuel burn ────────────────────────────────────────────────────────────
    // Base rate × engine's thirst multiplier × sector throttle demand
    // Average fuelWeight across 3 sectors = 1.0, so per-lap total stays consistent
    const fuelBurnPerSector = (CIRCUIT.baseFuelBurnPerLap / 3)
      * car.engine.fuelBurnRate
      * sectorDef.fuelWeight;
    car.fuel = Math.max(0, car.fuel - fuelBurnPerSector);

    // ── End-of-lap processing ────────────────────────────────────────────────
    if (isEndOfLap) {
      car.stintLap++;

      // Finalise lap time from accumulated sector times
      car.lastLapTime = +car.currentSectorTimes.reduce((a, b) => a + b, 0).toFixed(3);
      car.currentSectorTimes = [];

      // Reliability check — once per lap, not per sector (avoids excessive failures)
      // Formula: failureThreshold = (1 - engineRel/100 × chassisRel/100) × FAILURE_SCALE
      if (!crashOccurred) {
        const failureThreshold = (1 - (car.engine.reliability / 100) * (car.team.chassisReliability / 100))
          * FAILURE_SCALE;
        const failureRoll = rng();
        rolls.failureRoll = +failureRoll.toFixed(4);

        if (failureRoll < failureThreshold) {
          const outcomeRoll = rng();

          if (outcomeRoll < 0.30) {
            // 30% chance → mechanical retirement
            const label = FAILURE_LABELS[Math.floor(rng() * FAILURE_LABELS.length)];
            events.push({ type: 'mechanical', severity: 'retirement', label });
            car.status        = 'retired';
            car.retiredReason = 'mechanical';
            car.degradedLabel = label;
            car.retiredLap    = race.lap;

          } else {
            // 70% chance → degraded performance for remainder of race
            // Severity kept small so a damaged car remains a plausible finisher:
            // 1.005–1.025 adds roughly 0.4–1.9 s/lap; anything worse retires instead.
            // reliabilityFactor stacks if the car suffers multiple failures.
            const severity = 1.005 + rng() * 0.02; // 1.005–1.025
            car.reliabilityFactor *= severity;
            const label = FAILURE_LABELS[Math.floor(rng() * FAILURE_LABELS.length)];
            car.degradedLabel = label;  // stored on car state for live display
            events.push({ type: 'mechanical', severity: 'degraded', label, factor: +severity.toFixed(3) });
          }
        }
      }

      // Ran out of fuel — retirement (shouldn't happen with good AI, but guard against it)
      if (car.fuel <= 0 && race.lap < CIRCUIT.totalLaps) {
        if (car.status !== 'retired') {
          events.push({ type: 'mechanical', severity: 'retirement', label: 'Fuel' });
          car.status        = 'retired';
          car.retiredReason = 'mechanical';
          car.degradedLabel = 'Fuel';
          car.retiredLap    = race.lap;
        }
      }

      // Pit stop AI — evaluated once per lap after reliability check
      if (car.status === 'racing' && shouldPit(car, rng)) {
        const pitEvent = executePitStop(car, rng);
        events.push(pitEvent);
        car.status = 'pitted';  // display state; cleared at start of next sector
      }
    }

    // ── Crash retirement ─────────────────────────────────────────────────────
    if (crashOccurred) {
      car.status        = 'retired';
      car.retiredReason = 'crash';
      car.retiredLap    = race.lap;
    }

    // ── Race log entry ───────────────────────────────────────────────────────
    raceLog.entries.push({
      tick:           race.tick,
      lap:            race.lap,
      sector:         race.sector,
      car:            car.driver.name,
      factors,
      rolls,
      wear:           +car.tyreWear.toFixed(4),
      fuel:           +car.fuel.toFixed(2),
      sectorTime:     +sectorTime.toFixed(3),
      cumulativeTime: +car.cumulativeTime.toFixed(3),
      events,
    });
  }

  // ── Resolve overtake attempts ──────────────────────────────────────────────
  // Sort active cars by updated cumulative time to find genuine proximity.
  // Only the car immediately ahead is considered — one attempted pass per sector.
  const activeSorted = cars
    .filter(c => c.status !== 'retired')
    .sort((a, b) => a.cumulativeTime - b.cumulativeTime);

  for (let i = 1; i < activeSorted.length; i++) {
    const ahead  = activeSorted[i - 1];
    const behind = activeSorted[i];
    const gap    = behind.cumulativeTime - ahead.cumulativeTime;

    if (gap <= 0 || gap >= OVERTAKE_RANGE) continue;

    const delta = paceDelta(behind, ahead);
    if (delta <= 0) continue; // behind car has no pace advantage — no attempt

    const prob = overtakeProbability(behind, ahead, sectorDef);
    const roll = rng();

    if (roll < prob) {
      // ── Successful overtake ───────────────────────────────────────────────
      // Place the overtaking car just ahead in cumulative time.
      behind.cumulativeTime = ahead.cumulativeTime - 0.05;
      raceLog.entries.push({
        tick: race.tick, lap: race.lap, sector: race.sector,
        car:    behind.driver.name,
        events: [{ type: 'overtake', passed: ahead.driver.name, result: 'success',
                   gap: +gap.toFixed(3), prob: +prob.toFixed(3), roll: +roll.toFixed(4) }],
      });
    } else {
      // ── Failed attempt ────────────────────────────────────────────────────
      // Penalty for backing out of the move — gap opens back up.
      behind.cumulativeTime += FAILED_OVERTAKE_PENALTY;
      raceLog.entries.push({
        tick: race.tick, lap: race.lap, sector: race.sector,
        car:    behind.driver.name,
        events: [{ type: 'overtake', passed: ahead.driver.name, result: 'failed',
                   gap: +gap.toFixed(3), prob: +prob.toFixed(3), roll: +roll.toFixed(4) }],
      });
    }
  }

  updatePositions();
}

// ─── Overtaking helpers ───────────────────────────────────────────────────────

// Returns the pace advantage of 'behind' over 'ahead' based on current tyre and
// fuel state. Positive = behind car is faster right now.
function paceDelta(behind, ahead) {
  function tyrePlusFuel(car) {
    const compound        = COMPOUNDS[car.compound];
    const effectiveMaxGrip = Math.min(100, car.tyres.maxGrip + compound.gripModifier);
    const grip             = (effectiveMaxGrip / 100) * (1 - car.tyreWear);
    return (1.0 + (1 - grip) * tyreConfig.penaltyCoeff)   // tyreFactor
         + (1.0 + (car.fuel / CIRCUIT.fuelCapacity) * 0.03); // fuelFactor
  }
  return tyrePlusFuel(ahead) - tyrePlusFuel(behind); // positive = behind is faster
}

// Returns the probability (0–1) of a successful overtake attempt.
// Scaled by pace advantage, driver aggression, and sector type.
function overtakeProbability(behind, ahead, sectorDef) {
  const delta = paceDelta(behind, ahead);
  let prob = 0.25 + delta * 3;
  prob += (behind.driver.aggression - 50) / 100 * 0.20; // aggression ±0.10

  // Sector modifier: power straight = much easier to pass; tight corners = very hard
  if (sectorDef.id === 2) prob *= 1.50;
  if (sectorDef.id === 1) prob *= 0.55;

  return Math.min(0.80, Math.max(0, prob));
}

// ─── Pit Stop AI ──────────────────────────────────────────────────────────────

// Override wear threshold range for experiments. Set wearMin === wearMax for a
// fixed threshold, or leave as default {0.60, 0.70} for normal random behaviour.
export const pitConfig  = { wearMin: 0.60, wearMax: 0.70 };
export const tyreConfig = { penaltyCoeff: 0.16 };

// Returns true if this car should pit at the end of the current lap.
function shouldPit(car, rng) {
  // Only evaluate at lap boundary
  if (race.sector !== 3) return false;

  // No point pitting in the last 3 laps
  if (race.lap >= CIRCUIT.totalLaps - 3) return false;

  // Emergency fuel stop — checked BEFORE the stop count limit so a car can
  // always pit to avoid running out. Triggers when < 3 laps of fuel remain.
  const effectiveBurnPerLap = CIRCUIT.baseFuelBurnPerLap * car.engine.fuelBurnRate;
  const fuelLapsLeft = car.fuel / effectiveBurnPerLap;
  const raceLapsLeft = CIRCUIT.totalLaps - race.lap;
  if (fuelLapsLeft < 3 && raceLapsLeft > 3) return true;

  // Normal wear-triggered stop: cap at 3 planned stops per race
  if (car.stopsMade >= 3) return false;

  // Normal trigger: tyre wear exceeds threshold.
  // Small rng jitter so teams don't all pit on the same lap.
  const wearThreshold = pitConfig.wearMin + rng() * (pitConfig.wearMax - pitConfig.wearMin);
  return car.tyreWear >= wearThreshold;
}

// Executes the pit stop: adds stop duration to cumulativeTime, refuels, fits new tyres.
// Returns the pit event object for the race log.
function executePitStop(car, rng) {
  // Tyre change and fuelling run in parallel; stop ends when the slower is done.
  // Crew rating affects tyre change only — the fuel rig rate is fixed hardware.
  const tyreChangeTime = CIRCUIT.baseTyreChangeTime * (1 + (1 - car.team.pitCrewRating / 100));

  // Compound choice:
  //   First two stops → medium (pace during the middle stints)
  //   Final stop      → hard  (durability to the flag)
  const newCompound = car.stopsMade < 2 ? 'medium' : 'hard';

  // Refuel: work out how many planned stops remain and load enough fuel for the
  // next stint. Targets 3 total stops; after the 3rd just load to the finish.
  // car.stopsMade is still the pre-increment value here.
  const MAX_STOPS       = 3;
  const lapsLeft        = CIRCUIT.totalLaps - race.lap;
  const stopsRemaining  = Math.max(0, MAX_STOPS - 1 - car.stopsMade);
  const lapsUntilNextStop = stopsRemaining > 0
    ? Math.ceil(lapsLeft / (stopsRemaining + 1))
    : lapsLeft;
  const effectiveBurnPerLap = CIRCUIT.baseFuelBurnPerLap * car.engine.fuelBurnRate;
  const fuelTarget = Math.min(
    CIRCUIT.fuelCapacity,
    car.fuel + lapsUntilNextStop * effectiveBurnPerLap * 1.10,  // 10% safety buffer
  );
  const fuelAdded = +(fuelTarget - car.fuel).toFixed(1);

  // Fuelling runs in parallel with tyre change; stop ends when the slower is done.
  const fuellingTime = fuelAdded * CIRCUIT.fuelRigRate;
  const duration     = +Math.max(tyreChangeTime, fuellingTime).toFixed(1);
  car.cumulativeTime += duration;

  car.fuel     = fuelTarget;
  car.compound = newCompound;
  car.tyreWear = 0;
  car.stintLap = 0;
  car.stopsMade++;

  return {
    type:          'pit',
    compound:      newCompound,
    duration,
    tyreChangeTime: +tyreChangeTime.toFixed(1),
    fuellingTime:   +fuellingTime.toFixed(1),
    fuelAdded,
  };
}

// ─── Race control helpers ──────────────────────────────────────────────────────

// Returns true once the final sector of the final lap has been processed.
export function isRaceOver() {
  return race.lap >= CIRCUIT.totalLaps && race.sector >= 3;
}

// Convenience: run the entire race to completion in one call.
// The renderer will typically call tick() one at a time instead.
export function runRace(rng) {
  while (!isRaceOver()) {
    tick(rng);
  }
}
