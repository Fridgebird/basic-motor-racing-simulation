// data.js — Static definitions for the 1988 motor racing simulation
// All stats are 0–100 unless otherwise noted.
// Higher is always better (e.g. high reliability = fewer failures, high power = faster).

// ─── Engine Manufacturers ─────────────────────────────────────────────────────
// power:       straight-line speed advantage; dominant factor on power sectors
// reliability: inverse of failure probability; lower = more likely to break
//
// 1988 context: turbo engines (Honda, Ferrari, Megatron) dwarf the normally-aspirated
// Ford Cosworth DFZ in power but are heavier and less reliable. Final year of the turbo era.

export const ENGINES = {
  honda: {
    name: 'Honda RA168E',
    // Best turbo of the era; compressed from historical dominance for game balance
    power:         86,
    reliability:   85,
    fuelBurnRate:  1.15,  // turbos drink ~15% more fuel than the NA baseline
  },
  ferrari: {
    name: 'Ferrari 035/L',
    // Strong turbo; genuine threat on fast circuits
    power:         84,
    reliability:   73,
    fuelBurnRate:  1.12,
  },
  megatron: {
    name: 'Megatron M12/13',
    // BMW-derived turbo supplied to Arrows; powerful but fragile
    power:         79,
    reliability:   62,
    fuelBurnRate:  1.10,
  },
  ford: {
    name: 'Ford Cosworth DFZ',
    // 3.5-litre normally-aspirated V8; raised from historical deficit for game balance
    power:         68,
    reliability:   92,
    fuelBurnRate:  1.00,  // baseline
  },
};

// ─── Tyre Manufacturers ───────────────────────────────────────────────────────
// maxGrip: peak grip level at zero wear (0–100)
// wearRate: base degradation per sector tick before compound/aggression/abrasion scaling
//           (~0.012–0.022 keeps tyres meaningful across a 70-lap race)

export const TYRES = {
  goodyear: {
    name: 'Goodyear',
    // Dominant supplier in 1988; well-developed across all compounds
    maxGrip:  90,
    wearRate: 0.0107,
  },
  pirelli: {
    name: 'Pirelli',
    // Challenger supplier; slightly lower peak grip, wears a touch faster
    maxGrip:  85,
    wearRate: 0.0134,
  },
};

// ─── Tyre Compounds ───────────────────────────────────────────────────────────
// wearMultiplier: scales the tyre manufacturer's baseWearRate each sector
// gripModifier:   added to tyre manufacturer's maxGrip (0–100 scale) before normalising
//                 Soft gives a raw pace advantage; hard preserves grip deep into a stint

export const COMPOUNDS = {
  soft: {
    wearMultiplier: 1.4,
    gripModifier:   10,   // Goodyear soft caps at 100 (perfect grip); Pirelli soft = 95
  },
  medium: {
    wearMultiplier: 1.0,
    gripModifier:    0,
  },
  hard: {
    wearMultiplier: 0.75,  // ~1.8s/lap slower than new soft; degrades less dramatically
    gripModifier:  -30,    // hard lasts ~30 laps on high abrasion, ~50 on medium, ~80+ on low
  },
};

// ─── Teams ────────────────────────────────────────────────────────────────────
// aero:               chassis aerodynamic efficiency; weighted to corner sectors
// chassisReliability: inverse of chassis-related failure probability
// pitCrewRating:      affects pit stop duration (100 = minimum stop time)
// setupAbility:       how efficiently the team converts practice/race prep into setup quality

export const TEAMS = [
  {
    id:                 'mclaren',
    name:               'McLaren',
    colour:             '#fc3b3e',   // Marlboro red
    engine:             'honda',
    tyres:              'goodyear',
    // Best car of the era; reduced from historical dominance for game balance
    aero:               85,
    chassisReliability: 92,
    pitCrewRating:      96,
    setupAbility:       93,
    // Reactive pit strategy parameters
    strategy: {
      wearTrigger:    0.85,           // pit when tyre wear exceeds this
      fuelTrigger:    5,              // pit when fuel drops below this (kg)
      fuelMarginLaps: 1,              // extra laps of fuel loaded as safety margin
      tyreLifeModel:  'fuelCorrected', // accounts for fuel load effect on tyre stress
    },
  },
  {
    id:                 'ferrari',
    name:               'Ferrari',
    colour:             '#de0803',   // Scuderia red
    engine:             'ferrari',
    tyres:              'goodyear',
    // F1/87-88C: Berger won the last two races but was well off McLaren's pace
    aero:               84,
    chassisReliability: 80,
    pitCrewRating:      80,
    setupAbility:       82,
    strategy: {
      wearTrigger:    0.82,
      fuelTrigger:    6,
      fuelMarginLaps: 2,
      tyreLifeModel:  'fuelCorrected',
    },
  },
  {
    id:                 'lotus',
    name:               'Lotus',
    colour:             '#ffdd00',   // Camel yellow
    engine:             'honda',
    tyres:              'goodyear',
    // 100T: Honda power in a much less refined chassis; shadow of the great Lotus teams
    aero:               76,
    chassisReliability: 72,
    pitCrewRating:      72,
    setupAbility:       74,
    strategy: {
      wearTrigger:    0.80,
      fuelTrigger:    6,
      fuelMarginLaps: 2,
      tyreLifeModel:  'basic',
    },
  },
  {
    id:                 'williams',
    name:               'Williams',
    colour:             '#003da5',   // Canon blue
    engine:             'ford',
    tyres:              'goodyear',
    // FW12: excellent chassis but Ford NA engine left them short of turbo pace
    aero:               86,
    chassisReliability: 85,
    pitCrewRating:      86,
    setupAbility:       88,
    strategy: {
      wearTrigger:    0.78,
      fuelTrigger:    7,
      fuelMarginLaps: 3,
      tyreLifeModel:  'fuelCorrected',  // methodical team, good data
    },
  },
  {
    id:                 'benetton',
    name:               'Benetton',
    colour:             '#00a550',   // Benetton green
    engine:             'ford',
    tyres:              'pirelli',
    // B188: best of the NA runners; Nannini and Boutsen regularly points-scoring
    aero:               80,
    chassisReliability: 82,
    pitCrewRating:      78,
    setupAbility:       80,
    strategy: {
      wearTrigger:    0.78,
      fuelTrigger:    7,
      fuelMarginLaps: 2,
      tyreLifeModel:  'basic',
    },
  },
  {
    id:                 'arrows',
    name:               'Arrows',
    colour:             '#ff8c00',   // Arrows amber
    engine:             'megatron',
    tyres:              'goodyear',
    // A10B: Megatron power with a solid chassis; turbo reliability a constant concern
    aero:               72,
    chassisReliability: 70,
    pitCrewRating:      70,
    setupAbility:       72,
    strategy: {
      wearTrigger:    0.76,
      fuelTrigger:    7,
      fuelMarginLaps: 3,
      tyreLifeModel:  'basic',
    },
  },
  {
    id:                 'march',
    name:               'March',
    colour:             '#009688',   // March teal
    engine:             'ford',
    tyres:              'pirelli',
    // 881: Capelli gave Senna a genuine scare at Portugal; good aerodynamics for budget team
    aero:               75,
    chassisReliability: 74,
    pitCrewRating:      68,
    setupAbility:       70,
    strategy: {
      wearTrigger:    0.78,
      fuelTrigger:    7,
      fuelMarginLaps: 3,
      tyreLifeModel:  'basic',
    },
  },
  {
    id:                 'tyrrell',
    name:               'Tyrrell',
    colour:             '#cccccc',   // Tyrrell white/silver (black would vanish on dark bg)
    engine:             'ford',
    tyres:              'goodyear',
    // 017: reliable midfield points-scorer; Palmer and Bailey rarely threatened top six
    aero:               68,
    chassisReliability: 76,
    pitCrewRating:      65,
    setupAbility:       67,
    strategy: {
      wearTrigger:    0.77,
      fuelTrigger:    8,
      fuelMarginLaps: 3,
      tyreLifeModel:  'basic',
    },
  },
  {
    id:                 'rial',
    name:               'Rial',
    colour:             '#aaaaaa',   // Rial silver-grey
    engine:             'ford',
    tyres:              'pirelli',
    // ARC1: small new team; de Cesaris carried it to some surprise results
    aero:               60,
    chassisReliability: 66,
    pitCrewRating:      58,
    setupAbility:       55,
    strategy: {
      wearTrigger:    0.76,
      fuelTrigger:    8,
      fuelMarginLaps: 4,
      tyreLifeModel:  'basic',
    },
  },
  {
    id:                 'minardi',
    name:               'Minardi',
    colour:             '#1a3a8a',   // Minardi navy
    engine:             'ford',
    tyres:              'goodyear',
    // M188: passionate Italian team, perpetually at the back; Martini showed flashes of pace
    aero:               57,
    chassisReliability: 64,
    pitCrewRating:      55,
    setupAbility:       52,
    strategy: {
      wearTrigger:    0.75,
      fuelTrigger:    9,
      fuelMarginLaps: 4,
      tyreLifeModel:  'basic',
    },
  },
  {
    id:                 'dallara',
    name:               'Dallara',
    colour:             '#cc4422',   // Dallara brick red
    engine:             'ford',
    tyres:              'goodyear',
    // BMS 188: Caffi occasionally punched above weight; car limited by budget
    aero:               56,
    chassisReliability: 63,
    pitCrewRating:      52,
    setupAbility:       50,
    strategy: {
      wearTrigger:    0.75,
      fuelTrigger:    9,
      fuelMarginLaps: 4,
      tyreLifeModel:  'basic',
    },
  },
  {
    id:                 'ligier',
    name:               'Ligier',
    colour:             '#0044cc',   // Ligier French blue
    engine:             'ford',
    tyres:              'pirelli',
    // JS31: experienced French team in decline; Arnoux a wily veteran
    aero:               64,
    chassisReliability: 71,
    pitCrewRating:      62,
    setupAbility:       62,
    strategy: {
      wearTrigger:    0.77,
      fuelTrigger:    8,
      fuelMarginLaps: 3,
      tyreLifeModel:  'basic',
    },
  },
];

// ─── Drivers ──────────────────────────────────────────────────────────────────
// skill:       raw single-lap pace; principal component of sector time
// consistency: narrows random roll range; high value = repeatable laptimes
//              also reduces crash/error probability
// aggression:  increases tyre wear per sector; useful for overtaking (later)
//              can also slightly raise crash threshold

export const DRIVERS = [
  // ── McLaren ─────────────────────────────────────────────────────────────────
  {
    name:        'Senna',
    number:      12,
    team:        'mclaren',
    // Exceptional qualifier and racer; reduced from historical dominance for game balance
    skill:       92,
    consistency: 87,
    aggression:  82,
  },
  {
    name:        'Prost',
    number:      11,
    team:        'mclaren',
    // The Professor — metronomic, devastatingly consistent; reduced for game balance
    skill:       92,
    consistency: 89,
    aggression:  50,
  },

  // ── Ferrari ─────────────────────────────────────────────────────────────────
  {
    name:        'Berger',
    number:      28,
    team:        'ferrari',
    // Won the last two races of the season; fast but error-prone
    skill:       85,
    consistency: 76,
    aggression:  80,
  },
  {
    name:        'Alboreto',
    number:      27,
    team:        'ferrari',
    // Past his peak by 1988 but still a safe, measured driver
    skill:       81,
    consistency: 80,
    aggression:  60,
  },

  // ── Lotus ───────────────────────────────────────────────────────────────────
  {
    name:        'Piquet',
    number:      1,
    team:        'lotus',
    // Three-time champion; Honda power couldn't rescue an uninspiring package
    skill:       88,
    consistency: 83,
    aggression:  65,
  },
  {
    name:        'Nakajima',
    number:      2,
    team:        'lotus',
    // Honda-backed; competent but outclassed in this company
    skill:       64,
    consistency: 71,
    aggression:  53,
  },

  // ── Williams ─────────────────────────────────────────────────────────────────
  {
    name:        'Mansell',
    number:      5,
    team:        'williams',
    // Lion-hearted racer; spectacular but occasionally wild
    skill:       91,
    consistency: 74,
    aggression:  88,
  },
  {
    name:        'Patrese',
    number:      6,
    team:        'williams',
    // Steady, experienced; a strong second driver
    skill:       82,
    consistency: 80,
    aggression:  67,
  },

  // ── Benetton ─────────────────────────────────────────────────────────────────
  {
    name:        'Boutsen',
    number:      20,
    team:        'benetton',
    // Smooth, precise Belgian; excellent on circuits suiting the car
    skill:       78,
    consistency: 83,
    aggression:  58,
  },
  {
    name:        'Nannini',
    number:      19,
    team:        'benetton',
    // Quick Italian with an attacking style; won in Japan the following year
    skill:       76,
    consistency: 73,
    aggression:  72,
  },

  // ── Arrows ───────────────────────────────────────────────────────────────────
  {
    name:        'Cheever',
    number:      9,
    team:        'arrows',
    // Hard-charger; capable of strong performances on his day
    skill:       74,
    consistency: 72,
    aggression:  74,
  },
  {
    name:        'Warwick',
    number:      10,
    team:        'arrows',
    // Underrated talent; consistently strong despite never having a front-running car
    skill:       77,
    consistency: 76,
    aggression:  77,
  },

  // ── March ────────────────────────────────────────────────────────────────────
  {
    name:        'Gugelmin',
    number:      16,
    team:        'march',
    // Promising Brazilian; solid if unspectacular
    skill:       72,
    consistency: 73,
    aggression:  66,
  },
  {
    name:        'Capelli',
    number:      17,
    team:        'march',
    // Very nearly won Portugal '88; showed genuine top-level pace
    skill:       76,
    consistency: 70,
    aggression:  70,
  },

  // ── Tyrrell ──────────────────────────────────────────────────────────────────
  {
    name:        'Bailey',
    number:      3,
    team:        'tyrrell',
    // Julian Bailey — strong in F3 but struggled to translate to F1
    skill:       57,
    consistency: 60,
    aggression:  57,
  },
  {
    name:        'Palmer',
    number:      4,
    team:        'tyrrell',
    // Jonathan Palmer — journeyman with occasional points; won the Jim Clark Trophy
    skill:       63,
    consistency: 68,
    aggression:  53,
  },

  // ── Rial ─────────────────────────────────────────────────────────────────────
  {
    name:        'de Cesaris',
    number:      38,
    team:        'rial',
    // Notoriously fast on Saturday, crash-prone on Sunday; feared and erratic
    skill:       74,
    consistency: 50,
    aggression:  86,
  },
  {
    name:        'Danner',
    number:      39,
    team:        'rial',
    // Christian Danner — German veteran; safe pair of hands for a small team
    skill:       60,
    consistency: 63,
    aggression:  63,
  },

  // ── Minardi ──────────────────────────────────────────────────────────────────
  {
    name:        'Martini',
    number:      23,
    team:        'minardi',
    // Pierluigi Martini — loyal to Minardi; showed the car's true potential
    skill:       65,
    consistency: 67,
    aggression:  62,
  },
  {
    name:        'Sala',
    number:      24,
    team:        'minardi',
    // Luis Perez Sala — steady Spanish pay driver
    skill:       57,
    consistency: 59,
    aggression:  59,
  },

  // ── Dallara ──────────────────────────────────────────────────────────────────
  {
    name:        'Caffi',
    number:      36,
    team:        'dallara',
    // Alex Caffi — spirited Italian; unlapped himself from the leaders occasionally
    skill:       68,
    consistency: 64,
    aggression:  65,
  },
  {
    name:        'Modena',
    number:      37,
    team:        'dallara',
    // Stefano Modena — quick on his day; later raced for Brabham and Tyrrell
    skill:       64,
    consistency: 62,
    aggression:  63,
  },

  // ── Ligier ───────────────────────────────────────────────────────────────────
  {
    name:        'Arnoux',
    number:      25,
    team:        'ligier',
    // René Arnoux — wily veteran; faded pace but race-craft intact
    skill:       73,
    consistency: 70,
    aggression:  75,
  },
  {
    name:        'Johansson',
    number:      26,
    team:        'ligier',
    // Stefan Johansson — dropped by Ferrari, found a home at Ligier; dependable
    skill:       70,
    consistency: 73,
    aggression:  61,
  },
];

// ─── Circuits ────────────────────────────────────────────────────────────────
// All real defunct racing venues — no longer active in top-level motorsport.
//
// Sector weights feed directly into the simulation formulas:
//   engineFactor  = 1.0 + (1 - power/100)  × powerWeight
//   chassisFactor = 1.0 + (1 - aero/100)   × aeroWeight
//   wear         += baseWearRate × wearWeight × aggressionMult × trackAbrasiveness
//
// baseSectorTime: ideal sector time in seconds for a theoretically perfect car.
// fuelCapacity / baseFuelBurnPerLap sized so turbo engines (×1.15) are just over a
// full tank per race distance — creating meaningful pit strategy variation.

export const CIRCUITS = {

  // ── Montjuïc ─────────────────────────────────────────────────────────────
  // Barcelona hillside park circuit. Last F1 use: 1975 Spanish Grand Prix (abandoned
  // after a first-lap pile-up). Flowing and technical with significant elevation changes.
  // Balanced demands — no single factor dominates.
  // Lap sum: 28 + 22 + 25 = 75s → ~87.5 min race at front
  montjuic: {
    id:                 'montjuic',
    name:               'Montjuïc',
    country:            'Spain',
    eventName:          'Spanish Grand Prix',
    lengthKm:           3.791,
    totalLaps:          70,
    trackAbrasiveness:  0.50,
    fuelCapacity:       100,
    baseFuelBurnPerLap: 1.30,  // 70 laps × 1.30 × 1.15 turbo = 104.7 kg — just over tank
    pitLaneTime:        18,
    baseTyreChangeTime: 7,
    fuelRigRate:        0.12,
    sectors: [
      {
        id:          1,
        label:       'Technical corners',
        powerWeight: 0.02,
        aeroWeight:  0.05,
        wearWeight:  1.30,
        fuelWeight:  0.85,
        baseSectorTime: 28.0,
      },
      {
        id:          2,
        label:       'Power straight',
        powerWeight: 0.06,
        aeroWeight:  0.01,
        wearWeight:  0.70,
        fuelWeight:  1.30,
        baseSectorTime: 22.0,
      },
      {
        id:          3,
        label:       'Mixed flowing',
        powerWeight: 0.03,
        aeroWeight:  0.03,
        wearWeight:  1.00,
        fuelWeight:  0.85,
        baseSectorTime: 25.0,
      },
    ],
  },

  // ── Reims-Gueux ──────────────────────────────────────────────────────────
  // Ultra-fast triangle circuit outside Reims. Last F1 use: 1966 French Grand Prix.
  // Two enormous straights connected by slow corners — pure engine circuit.
  // Low tyre wear (few corners); high fuel burn (sustained full throttle).
  // Lap sum: 20 + 18 + 19 = 57s → ~71 min race at front
  reims: {
    id:                 'reims',
    name:               'Reims-Gueux',
    country:            'France',
    eventName:          'French Grand Prix',
    lengthKm:           8.302,
    totalLaps:          75,
    trackAbrasiveness:  0.12,
    fuelCapacity:       110,
    baseFuelBurnPerLap: 1.15,  // 75 laps × 1.15 × 1.15 turbo = 99.2 kg — within 110 kg tank, no-stop viable
    pitLaneTime:        16,
    baseTyreChangeTime: 7,
    fuelRigRate:        0.12,
    sectors: [
      {
        id:          1,
        label:       'Thillois hairpin',
        // Slow hairpin — brief chassis/aero moment; easy on tyres
        powerWeight: 0.02,
        aeroWeight:  0.04,
        wearWeight:  0.80,
        fuelWeight:  0.60,
        baseSectorTime: 20.0,
      },
      {
        id:          2,
        label:       'Soissons straight',
        // Long flat-out blast — engine power dominant above all else
        powerWeight: 0.09,
        aeroWeight:  0.01,
        wearWeight:  0.50,
        fuelWeight:  1.70,
        baseSectorTime: 18.0,
      },
      {
        id:          3,
        label:       'Garenne sweep',
        // Fast kink back to the hairpin — still power-biased, minimal aero load
        powerWeight: 0.05,
        aeroWeight:  0.02,
        wearWeight:  0.70,
        fuelWeight:  1.40,
        baseSectorTime: 19.0,
      },
    ],
  },

  // ── Ain-Diab ─────────────────────────────────────────────────────────────
  // Casablanca seafront street circuit. Only F1 appearance: 1958 Moroccan Grand Prix.
  // Tight harbourside bends, a long seafront blast, narrow chicanes. High attrition.
  // Heavy aero demands; rough surface and walls punish mistakes harshly.
  // Lap sum: 32 + 26 + 30 = 88s → ~88 min race at front
  ain_diab: {
    id:                 'ain_diab',
    name:               'Ain-Diab',
    country:            'Morocco',
    eventName:          'Moroccan Grand Prix',
    lengthKm:           7.620,
    totalLaps:          60,
    trackAbrasiveness:  0.80,
    fuelCapacity:       100,
    baseFuelBurnPerLap: 1.45,  // 60 laps × 1.45 × 1.15 turbo = 100.1 kg — just over tank
    pitLaneTime:        20,    // slower pit lane on street circuit
    baseTyreChangeTime: 7,
    fuelRigRate:        0.12,
    sectors: [
      {
        id:          1,
        label:       'Harbourside bends',
        // Tight, technical — aero and driver finesse; walls close, tyres suffer
        powerWeight: 0.01,
        aeroWeight:  0.07,
        wearWeight:  1.50,
        fuelWeight:  0.70,
        baseSectorTime: 32.0,
      },
      {
        id:          2,
        label:       'Seafront blast',
        // Long coastal straight — engine briefly matters
        powerWeight: 0.05,
        aeroWeight:  0.02,
        wearWeight:  0.90,
        fuelWeight:  1.20,
        baseSectorTime: 26.0,
      },
      {
        id:          3,
        label:       'Casino chicanes',
        // Narrow twisting section back to the pits — high aero load, punishing on tyres
        powerWeight: 0.02,
        aeroWeight:  0.06,
        wearWeight:  1.40,
        fuelWeight:  0.90,
        baseSectorTime: 30.0,
      },
    ],
  },

  // ── Zeltweg Aerodrome ─────────────────────────────────────────────────────
  // Original bumpy concrete aerodrome circuit in Styria. Only F1 appearance: 1964 Austrian
  // Grand Prix. Notoriously destructive — rough surface broke cars and shredded tyres.
  // Heavy wear on everything; the circuit that earns its reputation as the tyre-destroyer.
  // Lap sum: 27 + 24 + 23 = 74s → ~84 min race at front
  zeltweg: {
    id:                 'zeltweg',
    name:               'Zeltweg Aerodrome',
    country:            'Austria',
    eventName:          'Austrian Grand Prix',
    lengthKm:           3.188,
    totalLaps:          68,
    trackAbrasiveness:  0.60,
    fuelCapacity:       100,
    baseFuelBurnPerLap: 1.25,  // 68 laps × 1.25 × 1.15 turbo = 97.75 kg — within tank
    pitLaneTime:        17,
    baseTyreChangeTime: 7,
    fuelRigRate:        0.12,
    sectors: [
      {
        id:          1,
        label:       'Concrete sweep',
        // Fast open sweeper on rough concrete — high-speed cornering load
        powerWeight: 0.03,
        aeroWeight:  0.06,
        wearWeight:  1.80,
        fuelWeight:  1.00,
        baseSectorTime: 27.0,
      },
      {
        id:          2,
        label:       'Rough back straight',
        // Bumpiest section — cars crash over expansion joints; drains mechanical reliability
        powerWeight: 0.04,
        aeroWeight:  0.03,
        wearWeight:  1.60,
        fuelWeight:  1.10,
        baseSectorTime: 24.0,
      },
      {
        id:          3,
        label:       'Blast to finish',
        // Full-throttle run to the line — power matters, tyres still suffering
        powerWeight: 0.05,
        aeroWeight:  0.02,
        wearWeight:  1.20,
        fuelWeight:  1.30,
        baseSectorTime: 23.0,
      },
    ],
  },

};

// Backwards compatibility alias — used by simulation.js and state.js until they are
// updated to accept a circuit parameter.
export const CIRCUIT = CIRCUITS.montjuic;

// ─── Season Schedule ─────────────────────────────────────────────────────────
// Each entry represents one calendar day in the global world.
// eventType: 'qualifying' | 'race'
// The order defines the season rhythm — put qualifying before its race on adjacent days
// (separate real-time days) or combine them however desired by rearranging entries.

export const SEASON_1_START = '2026-04-19';  // epoch date for season 1, day 0

export const SEASON_SCHEDULE = [
  { round: 1,  eventType: 'qualifying', circuitId: 'montjuic'  },
  { round: 1,  eventType: 'race',       circuitId: 'montjuic'  },
  { round: 2,  eventType: 'qualifying', circuitId: 'reims'     },
  { round: 2,  eventType: 'race',       circuitId: 'reims'     },
  { round: 3,  eventType: 'qualifying', circuitId: 'ain_diab'  },
  { round: 3,  eventType: 'race',       circuitId: 'ain_diab'  },
  { round: 4,  eventType: 'qualifying', circuitId: 'zeltweg'   },
  { round: 4,  eventType: 'race',       circuitId: 'zeltweg'   },
  { round: 5,  eventType: 'qualifying', circuitId: 'reims'     },
  { round: 5,  eventType: 'race',       circuitId: 'reims'     },
  { round: 6,  eventType: 'qualifying', circuitId: 'ain_diab'  },
  { round: 6,  eventType: 'race',       circuitId: 'ain_diab'  },
  { round: 7,  eventType: 'qualifying', circuitId: 'zeltweg'   },
  { round: 7,  eventType: 'race',       circuitId: 'zeltweg'   },
  { round: 8,  eventType: 'qualifying', circuitId: 'montjuic'  },
  { round: 8,  eventType: 'race',       circuitId: 'montjuic'  },
];
