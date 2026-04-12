// Tyre wear analysis — isolates tyre behaviour with all other factors held constant.
// Run with: node tyre_analysis.mjs

// ── Constants (copied from simulation.js / data.js) ────────────────────────
const AGGRESSION_WEAR_SCALE = 0.4;
const PENALTY_COEFF         = 0.06;

const CIRCUIT = {
  trackAbrasiveness: 0.80,
  fuelCapacity:      100,
  sectors: [
    { baseSectorTime: 28.0, wearWeight: 1.30, powerWeight: 0.02, aeroWeight: 0.05 },
    { baseSectorTime: 22.0, wearWeight: 0.70, powerWeight: 0.06, aeroWeight: 0.01 },
    { baseSectorTime: 25.0, wearWeight: 1.00, powerWeight: 0.03, aeroWeight: 0.03 },
  ],
};

const TYRES = {
  goodyear: { maxGrip: 90, wearRate: 0.016, name: 'Goodyear' },
  pirelli:  { maxGrip: 85, wearRate: 0.020, name: 'Pirelli'  },
};

const COMPOUNDS = {
  soft:   { wearMultiplier: 1.4, gripModifier:  10, name: 'Soft'   },
  medium: { wearMultiplier: 1.0, gripModifier:   0, name: 'Medium' },
  hard:   { wearMultiplier: 0.7, gripModifier: -30, name: 'Hard'   },
};

// ── Fixed "average" car — everything except tyres held equal ───────────────
// Engine power=70, Chassis aero=70, Setup=70, Driver skill=70 aggression=50,
// Fuel=50kg (50% capacity, representing mid-stint).
const AVG = {
  power:      70,
  aero:       70,
  setup:      70,
  skill:      70,
  aggression: 50,
  fuel:       50,
};

// Compute the base lap time for our average car (tyre factor = 1.0)
function baseLapTime() {
  return CIRCUIT.sectors.reduce((sum, s) => {
    const ef = 1.0 + (1 - AVG.power / 100) * s.powerWeight;
    const cf = 1.0 + (1 - AVG.aero  / 100) * s.aeroWeight;
    const sf = 1.0 + (1 - AVG.setup / 100) * 0.04;
    const ff = 1.0 + (AVG.fuel / 100)       * 0.03;   // fuelCapacity=100 so fraction = fuel/100
    // Use average consistency roll (0.85 for consistency=70)
    const consistencyRoll = 0.70 + 0.5 * 0.30;  // mid-range roll for consistency=70
    const effectiveSkill  = AVG.skill * consistencyRoll;
    const df = 1.0 + (1 - effectiveSkill / 100) * 0.05;
    return sum + s.baseSectorTime * ef * cf * sf * ff * df;
  }, 0);
}

// Tyre factor given wear and compound+manufacturer combo
function tyreFactor(wear, tyre, compound) {
  const effectiveMaxGrip = Math.min(100, tyre.maxGrip + compound.gripModifier);
  const grip = (effectiveMaxGrip / 100) * (1 - wear);
  return 1.0 + (1 - grip) * PENALTY_COEFF;
}

// Wear added per lap (sum of all 3 sectors)
function wearPerLap(tyre, compound) {
  const aggressionMult = 1.0 + (AVG.aggression / 100) * AGGRESSION_WEAR_SCALE;
  return CIRCUIT.sectors.reduce((sum, s) =>
    sum + tyre.wearRate * compound.wearMultiplier * s.wearWeight
        * aggressionMult * CIRCUIT.trackAbrasiveness,
    0);
}

// ── Run analysis ────────────────────────────────────────────────────────────
const base = baseLapTime();
console.log(`\nBase lap time (tyre factor = 1.0): ${base.toFixed(2)}s\n`);
console.log('='.repeat(72));

for (const [tyreName, tyre] of Object.entries(TYRES)) {
  for (const [compoundName, compound] of Object.entries(COMPOUNDS)) {
    const wpl   = wearPerLap(tyre, compound);
    const label = `${tyre.name} ${compound.name}`;

    console.log(`\n── ${label} ─────────────────────────────`);
    console.log(`   Wear per lap: ${(wpl * 100).toFixed(2)}%  |  Canvas at lap: ${(1 / wpl).toFixed(1)}`);
    console.log(`\n   Lap  Wear    TyreFactor  LapTime   ΔvsNew`);
    console.log(`   ───  ──────  ──────────  ────────  ──────`);

    let wear        = 0;
    let totalTime   = 0;
    let lapCount    = 0;
    const newFactor = tyreFactor(0, tyre, compound);
    const newLap    = base * newFactor;

    while (wear < 1.0) {
      lapCount++;
      const tf  = tyreFactor(wear, tyre, compound);
      const lt  = base * tf;
      totalTime += lt;

      const delta = lt - newLap;
      const pitMarker = wear >= 0.60 && wear < 0.60 + wpl ? ' ← pit window' : '';

      console.log(
        `   ${String(lapCount).padStart(3)}  ${(wear * 100).toFixed(1).padStart(5)}%  ` +
        `${tf.toFixed(4)}      ${lt.toFixed(2)}s   +${delta.toFixed(2)}s${pitMarker}`
      );

      wear = Math.min(1, wear + wpl);
      if (wear >= 1.0) {
        // Show the final "canvas" lap
        const tf2 = tyreFactor(1.0, tyre, compound);
        const lt2 = base * tf2;
        totalTime += lt2;
        lapCount++;
        console.log(
          `   ${String(lapCount).padStart(3)}  100.0%  ` +
          `${tf2.toFixed(4)}      ${lt2.toFixed(2)}s   +${(lt2 - newLap).toFixed(2)}s  ← canvas`
        );
        break;
      }
    }

    const avgLapTime = totalTime / lapCount;
    console.log(`\n   Stint avg lap time: ${avgLapTime.toFixed(2)}s over ${lapCount} laps`);
  }
}

// ── Head-to-head summary ────────────────────────────────────────────────────
console.log('\n' + '='.repeat(72));
console.log('\nHEAD-TO-HEAD SUMMARY (Goodyear)\n');
console.log('  Compound  New lap    At pit window   Canvas    Stint avg   Laps to pit');
console.log('  ────────  ─────────  ─────────────   ───────   ─────────   ───────────');

for (const [compoundName, compound] of Object.entries(COMPOUNDS)) {
  const tyre   = TYRES.goodyear;
  const wpl    = wearPerLap(tyre, compound);
  const newLap = base * tyreFactor(0, tyre, compound);
  const pitWear = 0.65;
  const pitLap  = base * tyreFactor(pitWear, tyre, compound);
  const canvasLap = base * tyreFactor(1.0, tyre, compound);
  const lapsToPit = (pitWear / wpl).toFixed(1);

  // Avg over stint to pit threshold
  let totalTime = 0, lapCount = 0, wear = 0;
  while (wear < pitWear) {
    totalTime += base * tyreFactor(wear, tyre, compound);
    lapCount++;
    wear += wpl;
  }
  const avgStint = totalTime / lapCount;

  console.log(
    `  ${compound.name.padEnd(8)}  ${newLap.toFixed(2)}s    ${pitLap.toFixed(2)}s          ` +
    `${canvasLap.toFixed(2)}s    ${avgStint.toFixed(2)}s      ${lapsToPit} laps`
  );
}
