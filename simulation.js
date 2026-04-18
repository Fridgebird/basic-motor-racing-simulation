// simulation.js — Sector-by-sector race engine
//
// One call to tick(rng) advances every car through one sector.
// 3 sectors × 70 laps = 210 ticks for a full race.
//
// Call initRace() in state.js first to get the rng, then drive the loop:
//   const rng = initRace(seed);
//   while (!isRaceOver()) tick(rng);

import { COMPOUNDS, CIRCUIT as DEFAULT_CIRCUIT } from './data.js';

// Active circuit — set once before running qualifying or a race.
// Defaults to the backwards-compat CIRCUIT alias (Montjuïc) until explicitly changed.
let currentCircuit = DEFAULT_CIRCUIT;

/** Set the circuit for the upcoming qualifying session or race. */
export function setCurrentCircuit(circuit) {
  currentCircuit = circuit;
}
import { cars, race, raceLog, lapChartData, updatePositions } from './state.js';

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

// Fuel load increases tyre wear — heavier car puts more stress on tyres.
// At 0.20, a full tank (100kg) adds 20% extra wear vs an empty car.
const FUEL_WEAR_COEFF = 0.20;

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
// initStrategies — call once after initRace() and before the first tick/render.
// Sets each car's starting compound and fuel load so the pre-race grid display
// shows the correct tyre choice rather than the 'medium' placeholder in state.js.
// Consumes one rng() call per car (for compound selection), same as before
// except the calls now happen here rather than inside the first tick.
export function initStrategies(rng) {
  for (const car of cars) {
    if (car.strategy) continue;  // already initialised (shouldn't happen at race start)
    const startCompound  = chooseStartingCompound(car, rng);
    const estLaps        = estimateStintLaps(car, startCompound);
    const burnPerLap     = currentCircuit.baseFuelBurnPerLap * car.engine.fuelBurnRate;
    const fuelMarginLaps = car.team.strategy.fuelMarginLaps;
    const fuelLapsTarget = estLaps + fuelMarginLaps;
    car.fuel        = Math.min(currentCircuit.fuelCapacity, Math.ceil(fuelLapsTarget * burnPerLap));
    car.compound    = startCompound;
    car.tyreHistory = [startCompound[0].toUpperCase()];
    car.strategy    = { initialized: true };
    // strategy_init event will be pushed to the race log on the first sector tick
    car._strategyInitPending = { compound: startCompound, estLaps, fuelLoaded: +car.fuel.toFixed(1) };
  }
}

export function tick(rng) {

  // ── Advance race clock ──────────────────────────────────────────────────────
  race.sector += 1;
  if (race.sector > 3) {
    race.sector = 1;
    race.lap   += 1;
  }
  race.tick += 1;

  const sectorDef  = currentCircuit.sectors[race.sector - 1];
  const isEndOfLap = race.sector === 3;

  // ── Snapshot positions before this tick for silent-pass detection ─────────
  // Keyed by driver name → position. Used after updatePositions() to find
  // cars that gained a place without a logged overtake event.
  const preTickPositions = new Map(cars.map(c => [c.driver.name, c.position]));

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

    // Log the strategy_init event on the first sector tick.
    // The compound/fuel were already set by initStrategies() before the first render.
    if (car._strategyInitPending) {
      const p = car._strategyInitPending;
      events.push({ type: 'strategy_init', compound: p.compound, estLaps: p.estLaps, fuelLoaded: p.fuelLoaded });
      delete car._strategyInitPending;
    }

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
    const fuelFactor = 1.0 + (car.fuel / currentCircuit.fuelCapacity) * 0.03;
    factors.fuel = +fuelFactor.toFixed(4);

    // ── 5. Tyre factor ──────────────────────────────────────────────────────
    // grip = normalised effective grip considering manufacturer, compound and wear
    // Formula: tyreFactor = 1.0 + (1 - grip) × penaltyCoeff
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
    // Formula: wear += baseWearRate × compoundMult × sectorWearWeight × aggressionMult × fuelWearMult × trackAbrasiveness × dirtyAirMult
    // dirtyAirMult: following in turbulent air increases tyre stress.
    const aggressionMult  = 1.0 + (car.driver.aggression / 100) * AGGRESSION_WEAR_SCALE;
    const fuelWearMult    = 1.0 + (car.fuel / currentCircuit.fuelCapacity) * FUEL_WEAR_COEFF;
    const dirtyAirWearMult = 1.0 + proximity * DIRTY_AIR_WEAR_MULT;
    const wearDelta = car.tyres.wearRate
      * compound.wearMultiplier
      * sectorDef.wearWeight
      * aggressionMult
      * fuelWearMult
      * currentCircuit.trackAbrasiveness
      * dirtyAirWearMult;
    car.tyreWear = Math.min(1, car.tyreWear + wearDelta);

    // ── Fuel burn ────────────────────────────────────────────────────────────
    // Base rate × engine's thirst multiplier × sector throttle demand
    // Average fuelWeight across 3 sectors = 1.0, so per-lap total stays consistent
    const fuelBurnPerSector = (currentCircuit.baseFuelBurnPerLap / 3)
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
      if (car.fuel <= 0 && race.lap < currentCircuit.totalLaps) {
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
                   position: ahead.position,
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

  // ── Detect silent passes ───────────────────────────────────────────────────
  // A silent pass is a position gain that wasn't generated by the overtake model
  // (i.e. the car naturally accumulated a lower cumulative time than the car
  // ahead — fresher tyres, strategic undercut, etc.).
  // We sort by cumulative time here (before updatePositions) to find who each
  // gainer actually displaced, then filter out cases where the passed car is
  // pitting (that's a strategy move, not a racing pass worth commentary).
  {
    // Set of cars that already have a formal overtake-success event this tick —
    // silent pass detection skips these to avoid double commentary.
    const overtakeEntries = raceLog.entries.filter(e => e.tick === race.tick &&
      e.events.some(ev => ev.type === 'overtake' && ev.result === 'success'));
    const overtakerSet = new Set(overtakeEntries.map(e => e.car));

    // Sort active cars by cumulative time to get new implied order
    const newOrder = cars
      .filter(c => c.status !== 'retired')
      .sort((a, b) => a.cumulativeTime - b.cumulativeTime);

    for (let i = 0; i < newOrder.length; i++) {
      const car    = newOrder[i];
      const newPos = i + 1;
      const oldPos = preTickPositions.get(car.driver.name);
      if (oldPos === undefined || newPos >= oldPos) continue;  // didn't gain

      // Skip if already covered by a formal overtake event
      if (overtakerSet.has(car.driver.name)) continue;

      // Find the car this driver actually crossed: was ahead before (smaller position)
      // and is now behind (larger position). Report the one that was closest ahead
      // (highest pre-tick position number). Using preTickByPosition.get(newPos) was
      // wrong when two cars both pass the same car in the same tick — it would blame
      // the wrong victim (e.g. "C passes B" when both B and C passed A).
      let passedCar    = null;
      let passedOldPos = -1;
      for (let j = 0; j < newOrder.length; j++) {
        const other = newOrder[j];
        if (other === car) continue;
        const otherOldPos = preTickPositions.get(other.driver.name);
        if (otherOldPos === undefined) continue;
        const otherNewPos = j + 1;
        // Was ahead before (lower position) and is now behind (higher position)
        if (otherOldPos < oldPos && otherNewPos > newPos && otherOldPos > passedOldPos) {
          passedOldPos = otherOldPos;
          passedCar    = other;
        }
      }

      if (!passedCar || passedCar.status !== 'racing') continue;

      raceLog.entries.push({
        tick: race.tick, lap: race.lap, sector: race.sector,
        car:  car.driver.name,
        events: [{ type: 'silent_pass', passed: passedCar.driver.name, position: newPos }],
      });
    }
  }

  updatePositions();

  // ── Lap chart snapshot ────────────────────────────────────────────────────
  // Record each car's position at end of every lap (sector 3 only).
  // Also capture pit compound if the car stopped this lap, for pit dot rendering.
  if (race.sector === 3) {
    const entry = {};
    for (const car of cars) {
      // Find any pit event logged for this car on this tick
      const logEntry = raceLog.entries.find(
        e => e.tick === race.tick && e.car === car.driver.name
      );
      const pitEvent = logEntry?.events.find(e => e.type === 'pit');
      entry[car.driver.name] = {
        position:    car.status === 'retired' ? null : car.position,
        pitCompound: pitEvent ? pitEvent.compound : null,
      };
    }
    lapChartData.push(entry);
  }
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
         + (1.0 + (car.fuel / currentCircuit.fuelCapacity) * 0.03); // fuelFactor
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

export const tyreConfig = { penaltyCoeff: 0.06 };

// ─── Tyre Life Estimation ─────────────────────────────────────────────────────
// Returns estimated laps for a compound before hitting the team's wear trigger.
// Two model variants, assigned per team in data.js:
//   'basic':         uses wear rate, driver aggression, track abrasiveness.
//   'fuelCorrected': also corrects for average fuel load effect on tyre stress
//                    (heavier car wears tyres faster — front runners model this).
function estimateStintLaps(car, compound) {
  const aggressionMult = 1.0 + (car.driver.aggression / 100) * AGGRESSION_WEAR_SCALE;
  const sumWearWeights = currentCircuit.sectors.reduce((s, sec) => s + sec.wearWeight, 0);
  const wearTrigger    = car.team.strategy.wearTrigger;

  let fuelWearMult = 1.0;
  if (car.team.strategy.tyreLifeModel === 'fuelCorrected') {
    // Estimate average fuel during a typical stint: ~35% of capacity (mid-range)
    const estAvgFuel = currentCircuit.fuelCapacity * 0.35;
    fuelWearMult = 1.0 + (estAvgFuel / currentCircuit.fuelCapacity) * FUEL_WEAR_COEFF;
  }

  const wearPerLap = car.tyres.wearRate
    * COMPOUNDS[compound].wearMultiplier
    * sumWearWeights
    * aggressionMult
    * fuelWearMult
    * currentCircuit.trackAbrasiveness;

  return Math.max(5, Math.floor(wearTrigger / wearPerLap));
}

// Choose starting compound by probability weighted on driver aggression.
// Aggressive drivers (like Mansell, agg=88): ~66% soft, ~26% medium, ~8% hard.
// Moderate (agg=50): ~37% soft, ~36% medium, ~27% hard.
// Conservative (agg=30): ~22% soft, ~39% medium, ~39% hard.
function chooseStartingCompound(car, rng) {
  const agg   = car.driver.aggression / 100;  // normalise to 0–1
  const pSoft = agg * 0.75;                    // 0% → 75% as aggression rises
  const pHard = (1 - agg) * 0.55;             // 55% → 0%
  // pMedium fills the remainder (1 - pSoft - pHard)

  const roll = rng();
  if (roll < pSoft)       return 'soft';
  if (roll < 1 - pHard)  return 'medium';
  return 'hard';
}

// At each pit stop: choose compound based on what can reach the flag and driver aggression.
//
// Rule (softest-viable constraint):
//   soft can reach  → always soft (no reason to be harder)
//   medium can reach (not soft) → soft or medium by aggressiveness; hard excluded
//   only hard can reach, OR nothing can reach → full aggression-based distribution (S/M/H)
//
// An aggressive driver may always choose a softer compound (accepting an extra stop).
// A harder-than-necessary compound is never chosen — if medium makes the flag, hard won't be.
// One rng() call always consumed so the sequence stays deterministic.
function chooseNextCompound(car, rng) {
  const lapsRemaining = currentCircuit.totalLaps - race.lap;
  const estimates     = {};

  // Find the softest compound that can reach the flag
  let minViable = null;
  for (const compound of ['soft', 'medium', 'hard']) {
    const estLaps  = estimateStintLaps(car, compound);
    const canReach = estLaps >= lapsRemaining;
    estimates[compound] = { estLaps, canReach };
    if (canReach && minViable === null) minViable = compound;
  }

  // Aggression-based probabilities (same as starting compound)
  const agg   = car.driver.aggression / 100;
  const pSoft = agg * 0.75;
  const pHard = (1 - agg) * 0.55;
  const roll  = rng();  // always consumed

  let chosen;
  if (minViable === 'soft') {
    // Soft makes the flag — always soft regardless of aggressiveness
    chosen = 'soft';

  } else if (minViable === 'medium') {
    // Medium is softest viable — soft (extra stop) or medium by aggression; never hard
    chosen = roll < pSoft ? 'soft' : 'medium';

  } else {
    // Only hard makes the flag, or nothing does — full aggression distribution
    if      (roll < pSoft)       chosen = 'soft';
    else if (roll < 1 - pHard)  chosen = 'medium';
    else                         chosen = 'hard';
  }

  return { compound: chosen, estimates, minViable };
}

// Returns true if switching to a fresh viable compound now yields a net time
// benefit over running on the current worn compound.
//
// Two conditions must BOTH hold:
//
//   MARGINAL CONDITION — timing
//     The lap time on the current worn compound THIS lap is at least as slow as
//     the lap time the car would have on the very LAST lap of a fresh new-compound
//     stint. This is the derivative condition for the optimal one-stop pit lap:
//     no pit-stop cost appears here because in the "stop now vs stop later" case
//     both options share exactly one stop and the cost cancels out.
//
//   COST-BENEFIT GATE — elective stop guard
//     The total estimated time saving over the remaining laps exceeds the pit
//     stop cost. This prevents an elective stop late in the race when there are
//     too few laps left to claw back the pit-lane time loss.
//
// Only fires when a viable compound exists (one that reaches the flag).
// Multi-stop situations — where no compound can reach the flag — are left to
// the normal wear trigger.
function crossoverPitBenefits(car) {
  const lapsRemaining  = currentCircuit.totalLaps - race.lap;
  const aggressionMult = 1.0 + (car.driver.aggression / 100) * AGGRESSION_WEAR_SCALE;
  const sumWearWeights = currentCircuit.sectors.reduce((s, sec) => s + sec.wearWeight, 0);

  // Precompute the fuelCorrected multiplier once (same model as estimateStintLaps)
  let fuelWearMult = 1.0;
  if (car.team.strategy.tyreLifeModel === 'fuelCorrected') {
    const estAvgFuel = currentCircuit.fuelCapacity * 0.35;
    fuelWearMult = 1.0 + (estAvgFuel / currentCircuit.fuelCapacity) * FUEL_WEAR_COEFF;
  }

  // Wear per lap for any compound, using the same model as estimateStintLaps
  function wearPerLapFor(compound) {
    return car.tyres.wearRate
      * COMPOUNDS[compound].wearMultiplier
      * sumWearWeights
      * aggressionMult
      * fuelWearMult
      * currentCircuit.trackAbrasiveness;
  }

  // tyreFactor at a given wear level — same formula as the main simulation tick
  function tyreFactorAt(wear, compound) {
    const effectiveMaxGrip = Math.min(100, car.tyres.maxGrip + COMPOUNDS[compound].gripModifier);
    const grip = (effectiveMaxGrip / 100) * Math.max(0, 1 - wear);
    return 1.0 + (1 - grip) * tyreConfig.penaltyCoeff;
  }

  // ── 1. Find softest viable compound ──────────────────────────────────────
  let viableCompound = null;
  let wpl_new        = 0;
  for (const c of ['soft', 'medium', 'hard']) {
    const wpl     = wearPerLapFor(c);
    const estLaps = Math.max(5, Math.floor(car.team.strategy.wearTrigger / wpl));
    if (estLaps >= lapsRemaining) {
      viableCompound = c;
      wpl_new        = wpl;
      break;
    }
  }
  if (!viableCompound) return false;  // multi-stop territory — leave to wear trigger

  // ── 2. Marginal condition ─────────────────────────────────────────────────
  // Pit if: current worn lap time >= last lap time on fresh new compound
  const tf_current    = tyreFactorAt(car.tyreWear, car.compound);
  const wearEndNew    = Math.min(1.0, lapsRemaining * wpl_new);
  const tf_newLastLap = tyreFactorAt(wearEndNew, viableCompound);

  if (tf_current < tf_newLastLap) return false;  // not yet at the crossover

  // ── 3. Cost-benefit gate ──────────────────────────────────────────────────
  // Verify total gain over remaining stint exceeds pit stop cost.
  // Uses midpoint-of-stint average wear for both compounds.
  const wpl_current     = wearPerLapFor(car.compound);
  const wearEndCurrent  = Math.min(1.0, car.tyreWear + lapsRemaining * wpl_current);
  const tf_currentAvg   = tyreFactorAt((car.tyreWear + wearEndCurrent) / 2, car.compound);
  const tf_newAvg       = tyreFactorAt(wearEndNew / 2, viableCompound);

  const baseLapTime   = currentCircuit.sectors.reduce((s, sec) => s + sec.baseSectorTime, 0);
  const avgGainPerLap = (tf_currentAvg - tf_newAvg) * baseLapTime;
  if (avgGainPerLap <= 0) return false;  // new compound not faster on average

  const tyreChangeTime = currentCircuit.baseTyreChangeTime * (1 + (1 - car.team.pitCrewRating / 100));
  const pitStopCost    = currentCircuit.pitLaneTime + tyreChangeTime;

  return (lapsRemaining * avgGainPerLap) > pitStopCost;
}

// Returns true if this car should pit at the end of the current lap.
// Triggers: fuel below team threshold OR wear above team threshold OR
//           crossover point reached (see crossoverPitBenefits above).
// One rng() call is always consumed (for wear-trigger jitter) to keep the
// RNG sequence stable regardless of whether we pit.
function shouldPit(car, rng) {
  if (race.sector !== 3) return false;

  // Always consume one rng() call — maintains deterministic sequence
  const wearJitter = (rng() - 0.5) * 0.06;  // ±0.03 spread on wear trigger

  if (race.lap >= currentCircuit.totalLaps - 3) return false;

  const burnPerLap = currentCircuit.baseFuelBurnPerLap * car.engine.fuelBurnRate;
  const { fuelTrigger, wearTrigger } = car.team.strategy;

  // Emergency fuel stop — override everything
  if (car.fuel < burnPerLap * 2) return true;

  // Normal triggers: fuel at/below threshold OR wear at/above threshold (with jitter)
  const effectiveWearTrigger = Math.max(0.60, Math.min(0.95, wearTrigger + wearJitter));

  const lapsRemaining = currentCircuit.totalLaps - race.lap;

  // Fuel trigger: only fire if the car genuinely cannot reach the flag on current fuel.
  // Without this check, cars with e.g. 6.7 kg and only 4 laps left (needing 5.2 kg)
  // would pit unnecessarily just because fuel dipped below the team threshold.
  const fuelShort = car.fuel <= fuelTrigger && car.fuel < lapsRemaining * burnPerLap;

  // Crossover trigger: pit when running on a fresh compound is worth it overall.
  // Minimum 5-lap stint guard prevents re-triggering immediately after a stop.
  const crossover = car.stintLap >= 5 && crossoverPitBenefits(car);

  return fuelShort || car.tyreWear >= effectiveWearTrigger || crossover;
}

// Executes the pit stop: chooses compound reactively, refuels for estimated stint,
// adds stop time to cumulativeTime. Returns the pit event object for the race log.
function executePitStop(car, rng) {
  // ── Reactive compound choice ─────────────────────────────────────────────────
  // Apply softest-viable rule then aggressiveness; log all estimates for inspection.
  const { compound: newCompound, estimates, minViable } = chooseNextCompound(car, rng);
  const lapsRemaining = currentCircuit.totalLaps - race.lap;
  const isLastStint   = estimates[newCompound].canReach;  // chosen compound reaches flag

  // ── Fuel load ────────────────────────────────────────────────────────────────
  // Last stint: load exactly enough to reach the flag (+ 1 lap margin for safety).
  // Mid-race: load for estimated stint length + team safety margin.
  const burnPerLap     = currentCircuit.baseFuelBurnPerLap * car.engine.fuelBurnRate;
  const fuelLapsTarget = isLastStint
    ? lapsRemaining + 1
    : estimates[newCompound].estLaps + car.team.strategy.fuelMarginLaps;
  const fuelTarget = Math.min(currentCircuit.fuelCapacity, Math.ceil(fuelLapsTarget * burnPerLap));
  const fuelAdded  = +(Math.max(0, fuelTarget - car.fuel)).toFixed(1);

  // ── Stop time: pit lane traversal + max(tyre change, fuelling) ──────────────
  const pitLaneTime    = currentCircuit.pitLaneTime;
  const tyreChangeTime = currentCircuit.baseTyreChangeTime * (1 + (1 - car.team.pitCrewRating / 100));
  const fuellingTime   = fuelAdded > 0 ? fuelAdded * currentCircuit.fuelRigRate : 0;
  const stationaryTime = +Math.max(tyreChangeTime, fuellingTime).toFixed(1);
  const duration       = +(pitLaneTime + stationaryTime).toFixed(1);

  car.cumulativeTime += duration;
  car.fuel      = fuelTarget;
  car.compound  = newCompound;
  car.tyreHistory.push(newCompound[0].toUpperCase());
  car.tyreWear  = 0;
  car.stintLap  = 0;
  car.stopsMade++;

  return {
    type:          'pit',
    compound:      newCompound,
    duration,
    pitLaneTime,
    tyreChangeTime: +tyreChangeTime.toFixed(1),
    fuellingTime:   +fuellingTime.toFixed(1),
    fuelAdded,
    // AI reasoning logged in full so strategy decisions are inspectable
    aiEstimates: {
      lapsRemaining,
      minViable,      // softest compound that can reach the flag (or null)
      soft:   estimates.soft,
      medium: estimates.medium,
      hard:   estimates.hard,
      chosen: newCompound,
    },
  };
}

// ─── Race control helpers ──────────────────────────────────────────────────────

// Returns true once the final sector of the final lap has been processed.
export function isRaceOver() {
  return race.lap >= currentCircuit.totalLaps && race.sector >= 3;
}

// Convenience: run the entire race to completion in one call.
// The renderer will typically call tick() one at a time instead.
export function runRace(rng) {
  while (!isRaceOver()) {
    tick(rng);
  }
}

// ─── Qualifying simulation ────────────────────────────────────────────────────
//
// Sequential single-lap format: one driver at a time, all on fresh softs, ~10 kg fuel.
// Track evolves as rubber is laid — cars later in the draw order enjoy a small grip bonus.
// Driver error model: crash = no time set; spin/lockup = sector penalty but lap completes.
//
// Call runQualifyingSession(rng, circuit) after initRace(seed) has populated cars[].
// Returns results array sorted P1 → P24; pass to initRace(raceSeed, results) for the race.

const QUALI_FUEL          = 10;     // kg — minimal, just enough for one lap
const TRACK_EVO_MAX       = 0.015;  // max grip bonus for last car vs first (1.5%)

/**
 * Simulate one driver's single timed qualifying lap.
 *
 * @param {object}        car            — car object from cars[]
 * @param {function}      rng            — seeded PRNG (shared across all cars in session)
 * @param {object}        circuit        — circuit definition object
 * @param {number}        trackEvolution — 0.0 (first car, green track) → 1.0 (last, full rubber)
 * @param {function|null} onSector       — optional async callback(sectorIndex, sectorTime, isSlow, retired)
 *   Called after each sector is resolved. Use for animated qualifying UI. Awaited if present.
 * @returns {Promise<{ lapTime, sectorTimes, retired, sectorsCompleted }>}
 */
export async function simulateQualiLap(car, rng, circuit, trackEvolution, onSector = null) {
  const trackEvoBonus = trackEvolution * TRACK_EVO_MAX;

  let lapTime          = 0;
  const sectorTimes    = [];
  let sectorsCompleted = 0;

  for (let sectorIndex = 0; sectorIndex < circuit.sectors.length; sectorIndex++) {
    const sectorDef = circuit.sectors[sectorIndex];
    // ── Factor calculations (mirrors tick() for a 1-lap, no-wear scenario) ──

    const engineFactor  = 1.0 + (1 - car.engine.power / 100) * sectorDef.powerWeight;

    const chassisFactor = 1.0 + (1 - car.team.aero / 100) * sectorDef.aeroWeight;

    const setupFactor   = 1.0 + (1 - car.setup / 100) * 0.04;

    const fuelFactor    = 1.0 + (QUALI_FUEL / circuit.fuelCapacity) * 0.03;

    // Fresh soft tyre with track evolution bonus
    const compound          = COMPOUNDS['soft'];
    const effectiveMaxGrip  = Math.min(100, car.tyres.maxGrip + compound.gripModifier);
    const grip              = (effectiveMaxGrip / 100) * (1 + trackEvoBonus);  // rubber = more grip
    const tyreFactor        = 1.0 + (1 - grip) * tyreConfig.penaltyCoeff;

    // ── Driver error check ────────────────────────────────────────────────────
    const consistencyRoll = rng() * (1 - car.driver.consistency / 100) + car.driver.consistency / 100;
    const crashThreshold  = (1 - car.driver.consistency / 100) * CRASH_SCALE * 10; // slightly raised for 1 lap
    const slowThreshold   = (1 - car.driver.consistency / 100) * SLOW_SCALE  * 10;

    if (consistencyRoll < crashThreshold) {
      // ── Crash — no time set ───────────────────────────────────────────────
      raceLog.entries.push({
        tick: -1, lap: 0, sector: sectorDef.id,
        car: car.driver.name,
        factors: {},
        rolls: { consistencyRoll },
        events: [{ type: 'driver_error', severity: 'crash', session: 'qualifying' }],
      });
      if (onSector) await onSector(sectorIndex, null, false, true);
      return { lapTime: null, sectorTimes, retired: true, sectorsCompleted };
    }

    let driverFactor;
    let isSlow = false;
    if (consistencyRoll < slowThreshold) {
      // ── Spin / lock-up — sector penalty but lap continues ─────────────────
      const penaltyFactor = 1.10 + rng() * 0.12;  // 10–22% sector penalty
      driverFactor = penaltyFactor;
      isSlow = true;
      raceLog.entries.push({
        tick: -1, lap: 0, sector: sectorDef.id,
        car: car.driver.name,
        factors: {},
        rolls: { consistencyRoll },
        events: [{ type: 'driver_error', severity: 'slow_sector', penalty: penaltyFactor, session: 'qualifying' }],
      });
    } else {
      const effectiveSkill = car.driver.skill * consistencyRoll;
      driverFactor = 1.0 + (1 - effectiveSkill / 100) * 0.05;
    }

    const sectorTime = sectorDef.baseSectorTime
      * engineFactor
      * chassisFactor
      * setupFactor
      * fuelFactor
      * tyreFactor
      * driverFactor;

    sectorTimes.push(+sectorTime.toFixed(3));
    lapTime += sectorTime;
    sectorsCompleted++;

    if (onSector) await onSector(sectorIndex, +sectorTime.toFixed(3), isSlow, false);
  }

  return { lapTime: +lapTime.toFixed(3), sectorTimes, retired: false, sectorsCompleted: 3 };
}

/**
 * Run a full sequential qualifying session for all cars in cars[].
 * Call after initRace(seed) has populated cars[] with setup values.
 *
 * @param {function} rng     — seeded PRNG returned by initRace()
 * @param {object}   circuit — circuit to qualify on
 * @returns {Array} Sorted qualifying results P1→P24.
 *   Each entry: { driverName, teamId, lapTime, sectorTimes, retired, drawPosition, gridPosition, setup }
 */
export async function runQualifyingSession(rng, circuit) {
  // Draw order: Fisher-Yates shuffle using the seeded RNG.
  // Deterministic per event — same seed always produces the same draw.
  const drawOrder = [...cars];
  for (let i = drawOrder.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [drawOrder[i], drawOrder[j]] = [drawOrder[j], drawOrder[i]];
  }

  const rawResults = [];
  for (let drawIndex = 0; drawIndex < drawOrder.length; drawIndex++) {
    const car            = drawOrder[drawIndex];
    const trackEvolution = drawOrder.length > 1 ? drawIndex / (drawOrder.length - 1) : 0;
    const result = await simulateQualiLap(car, rng, circuit, trackEvolution);
    rawResults.push({
      driverName:       car.driver.name,
      teamId:           car.team.id,
      setup:            car.setup,       // carry setup through to race (parc ferme)
      lapTime:          result.lapTime,
      sectorTimes:      result.sectorTimes,
      retired:          result.retired,
      sectorsCompleted: result.sectorsCompleted,
      drawPosition:     drawIndex + 1,
    });
  }

  // Sort: fastest first, then retired cars ordered by sectors completed desc, then draw position desc
  const timed   = rawResults.filter(r => !r.retired).sort((a, b) => a.lapTime - b.lapTime);
  const retired = rawResults.filter(r => r.retired)
    .sort((a, b) =>
      b.sectorsCompleted - a.sectorsCompleted ||   // more sectors = higher grid slot
      b.drawPosition     - a.drawPosition          // later draw = higher grid slot (more track data)
    );

  const sorted = [...timed, ...retired];
  sorted.forEach((r, i) => { r.gridPosition = i + 1; });

  return sorted;
}
