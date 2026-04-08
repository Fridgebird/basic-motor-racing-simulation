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
    // Dominant 1.5-litre turbo; McLaren won 15 of 16 races this season
    power:         95,
    reliability:   85,
    fuelBurnRate:  1.15,  // turbos drink ~15% more fuel than the NA baseline
  },
  ferrari: {
    name: 'Ferrari 035/L',
    // Strong turbo but Ferrari chassis limited its potential
    power:         88,
    reliability:   73,
    fuelBurnRate:  1.12,
  },
  megatron: {
    name: 'Megatron M12/13',
    // BMW-derived turbo supplied to Arrows; powerful but fragile
    power:         82,
    reliability:   62,
    fuelBurnRate:  1.10,
  },
  ford: {
    name: 'Ford Cosworth DFZ',
    // 3.5-litre normally-aspirated V8; well down on power but supremely reliable
    power:         52,
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
    wearRate: 0.016,
  },
  pirelli: {
    name: 'Pirelli',
    // Challenger supplier; slightly lower peak grip, wears a touch faster
    maxGrip:  85,
    wearRate: 0.020,
  },
};

// ─── Tyre Compounds ───────────────────────────────────────────────────────────
// wearMultiplier: scales the tyre manufacturer's baseWearRate each sector
// gripModifier:   added to tyre manufacturer's maxGrip (0–100 scale) before normalising
//                 Soft gives a raw pace advantage; hard preserves grip deep into a stint

export const COMPOUNDS = {
  soft: {
    wearMultiplier: 1.4,
    gripModifier:    5,
  },
  medium: {
    wearMultiplier: 1.0,
    gripModifier:    0,
  },
  hard: {
    wearMultiplier: 0.7,
    gripModifier:   -5,
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
    engine:             'honda',
    tyres:              'goodyear',
    // MP4/4: arguably the most dominant F1 car ever built
    aero:               95,
    chassisReliability: 92,
    pitCrewRating:      96,
    setupAbility:       93,
  },
  {
    id:                 'ferrari',
    name:               'Ferrari',
    engine:             'ferrari',
    tyres:              'goodyear',
    // F1/87-88C: Berger won the last two races but was well off McLaren's pace
    aero:               84,
    chassisReliability: 80,
    pitCrewRating:      80,
    setupAbility:       82,
  },
  {
    id:                 'lotus',
    name:               'Lotus',
    engine:             'honda',
    tyres:              'goodyear',
    // 100T: Honda power in a much less refined chassis; shadow of the great Lotus teams
    aero:               76,
    chassisReliability: 72,
    pitCrewRating:      72,
    setupAbility:       74,
  },
  {
    id:                 'williams',
    name:               'Williams',
    engine:             'ford',
    tyres:              'goodyear',
    // FW12: excellent chassis but Ford NA engine left them short of turbo pace
    aero:               86,
    chassisReliability: 85,
    pitCrewRating:      86,
    setupAbility:       88,
  },
  {
    id:                 'benetton',
    name:               'Benetton',
    engine:             'ford',
    tyres:              'pirelli',
    // B188: best of the NA runners; Nannini and Boutsen regularly points-scoring
    aero:               80,
    chassisReliability: 82,
    pitCrewRating:      78,
    setupAbility:       80,
  },
  {
    id:                 'arrows',
    name:               'Arrows',
    engine:             'megatron',
    tyres:              'goodyear',
    // A10B: Megatron power with a solid chassis; turbo reliability a constant concern
    aero:               72,
    chassisReliability: 70,
    pitCrewRating:      70,
    setupAbility:       72,
  },
  {
    id:                 'march',
    name:               'March',
    engine:             'ford',
    tyres:              'pirelli',
    // 881: Capelli gave Senna a genuine scare at Portugal; good aerodynamics for budget team
    aero:               75,
    chassisReliability: 74,
    pitCrewRating:      68,
    setupAbility:       70,
  },
  {
    id:                 'tyrrell',
    name:               'Tyrrell',
    engine:             'ford',
    tyres:              'goodyear',
    // 017: reliable midfield points-scorer; Palmer and Bailey rarely threatened top six
    aero:               68,
    chassisReliability: 76,
    pitCrewRating:      65,
    setupAbility:       67,
  },
  {
    id:                 'rial',
    name:               'Rial',
    engine:             'ford',
    tyres:              'pirelli',
    // ARC1: small new team; de Cesaris carried it to some surprise results
    aero:               60,
    chassisReliability: 66,
    pitCrewRating:      58,
    setupAbility:       55,
  },
  {
    id:                 'minardi',
    name:               'Minardi',
    engine:             'ford',
    tyres:              'goodyear',
    // M188: passionate Italian team, perpetually at the back; Martini showed flashes of pace
    aero:               57,
    chassisReliability: 64,
    pitCrewRating:      55,
    setupAbility:       52,
  },
  {
    id:                 'dallara',
    name:               'Dallara',
    engine:             'ford',
    tyres:              'goodyear',
    // BMS 188: Caffi occasionally punched above weight; car limited by budget
    aero:               56,
    chassisReliability: 63,
    pitCrewRating:      52,
    setupAbility:       50,
  },
  {
    id:                 'ligier',
    name:               'Ligier',
    engine:             'ford',
    tyres:              'pirelli',
    // JS31: experienced French team in decline; Arnoux a wily veteran
    aero:               64,
    chassisReliability: 71,
    pitCrewRating:      62,
    setupAbility:       62,
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
    team:        'mclaren',
    // 8 wins in 1988; qualifying pace was essentially supernatural
    skill:       99,
    consistency: 87,
    aggression:  82,
  },
  {
    name:        'Prost',
    team:        'mclaren',
    // 7 wins, World Champion; the Professor — metronomic, devastatingly consistent
    skill:       97,
    consistency: 96,
    aggression:  50,
  },

  // ── Ferrari ─────────────────────────────────────────────────────────────────
  {
    name:        'Berger',
    team:        'ferrari',
    // Won the last two races of the season; fast but error-prone
    skill:       85,
    consistency: 76,
    aggression:  80,
  },
  {
    name:        'Alboreto',
    team:        'ferrari',
    // Past his peak by 1988 but still a safe, measured driver
    skill:       81,
    consistency: 80,
    aggression:  60,
  },

  // ── Lotus ───────────────────────────────────────────────────────────────────
  {
    name:        'Piquet',
    team:        'lotus',
    // Three-time champion; Honda power couldn't rescue an uninspiring package
    skill:       88,
    consistency: 83,
    aggression:  65,
  },
  {
    name:        'Nakajima',
    team:        'lotus',
    // Honda-backed; competent but outclassed in this company
    skill:       64,
    consistency: 71,
    aggression:  53,
  },

  // ── Williams ─────────────────────────────────────────────────────────────────
  {
    name:        'Mansell',
    team:        'williams',
    // Lion-hearted racer; spectacular but occasionally wild
    skill:       91,
    consistency: 74,
    aggression:  88,
  },
  {
    name:        'Patrese',
    team:        'williams',
    // Steady, experienced; a strong second driver
    skill:       82,
    consistency: 80,
    aggression:  67,
  },

  // ── Benetton ─────────────────────────────────────────────────────────────────
  {
    name:        'Boutsen',
    team:        'benetton',
    // Smooth, precise Belgian; excellent on circuits suiting the car
    skill:       78,
    consistency: 83,
    aggression:  58,
  },
  {
    name:        'Nannini',
    team:        'benetton',
    // Quick Italian with an attacking style; won in Japan the following year
    skill:       76,
    consistency: 73,
    aggression:  72,
  },

  // ── Arrows ───────────────────────────────────────────────────────────────────
  {
    name:        'Cheever',
    team:        'arrows',
    // Hard-charger; capable of strong performances on his day
    skill:       74,
    consistency: 72,
    aggression:  74,
  },
  {
    name:        'Warwick',
    team:        'arrows',
    // Underrated talent; consistently strong despite never having a front-running car
    skill:       77,
    consistency: 76,
    aggression:  77,
  },

  // ── March ────────────────────────────────────────────────────────────────────
  {
    name:        'Gugelmin',
    team:        'march',
    // Promising Brazilian; solid if unspectacular
    skill:       72,
    consistency: 73,
    aggression:  66,
  },
  {
    name:        'Capelli',
    team:        'march',
    // Very nearly won Portugal '88; showed genuine top-level pace
    skill:       76,
    consistency: 70,
    aggression:  70,
  },

  // ── Tyrrell ──────────────────────────────────────────────────────────────────
  {
    name:        'Bailey',
    team:        'tyrrell',
    // Julian Bailey — strong in F3 but struggled to translate to F1
    skill:       57,
    consistency: 60,
    aggression:  57,
  },
  {
    name:        'Palmer',
    team:        'tyrrell',
    // Jonathan Palmer — journeyman with occasional points; won the Jim Clark Trophy
    skill:       63,
    consistency: 68,
    aggression:  53,
  },

  // ── Rial ─────────────────────────────────────────────────────────────────────
  {
    name:        'de Cesaris',
    team:        'rial',
    // Notoriously fast on Saturday, crash-prone on Sunday; feared and erratic
    skill:       74,
    consistency: 50,
    aggression:  86,
  },
  {
    name:        'Danner',
    team:        'rial',
    // Christian Danner — German veteran; safe pair of hands for a small team
    skill:       60,
    consistency: 63,
    aggression:  63,
  },

  // ── Minardi ──────────────────────────────────────────────────────────────────
  {
    name:        'Martini',
    team:        'minardi',
    // Pierluigi Martini — loyal to Minardi; showed the car's true potential
    skill:       65,
    consistency: 67,
    aggression:  62,
  },
  {
    name:        'Sala',
    team:        'minardi',
    // Luis Perez Sala — steady Spanish pay driver
    skill:       57,
    consistency: 59,
    aggression:  59,
  },

  // ── Dallara ──────────────────────────────────────────────────────────────────
  {
    name:        'Caffi',
    team:        'dallara',
    // Alex Caffi — spirited Italian; unlapped himself from the leaders occasionally
    skill:       68,
    consistency: 64,
    aggression:  65,
  },
  {
    name:        'Modena',
    team:        'dallara',
    // Stefano Modena — quick on his day; later raced for Brabham and Tyrrell
    skill:       64,
    consistency: 62,
    aggression:  63,
  },

  // ── Ligier ───────────────────────────────────────────────────────────────────
  {
    name:        'Arnoux',
    team:        'ligier',
    // René Arnoux — wily veteran; faded pace but race-craft intact
    skill:       73,
    consistency: 70,
    aggression:  75,
  },
  {
    name:        'Johansson',
    team:        'ligier',
    // Stefan Johansson — dropped by Ferrari, found a home at Ligier; dependable
    skill:       70,
    consistency: 73,
    aggression:  61,
  },
];

// ─── Circuit ─────────────────────────────────────────────────────────────────
// A fictional composite circuit capturing the spirit of a classic 1988 grand prix venue.
// 70 laps, long race distance, mixed layout with a distinctive power straight.
//
// Sector breakdown:
//   S1 — Technical corners: tight sequence demanding chassis aero and driver finesse
//   S2 — Power straight + chicane: engine-dominant; low downforce, high speed
//   S3 — Mixed flowing section: balanced demands; tyre wear bites here at race end
//
// Sector weights feed directly into the simulation formulas:
//   engineFactor  = 1.0 + (1 - power/100)  × powerWeight
//   chassisFactor = 1.0 + (1 - aero/100)   × aeroWeight
//   wear         += baseWearRate × wearWeight × aggressionMult × trackAbrasiveness
//
// baseSectorTime: ideal sector time in seconds for a theoretically perfect car.
// Lap sum = 28 + 22 + 25 = 75s base → ~87.5 min race time at the front (before factors)

export const CIRCUIT = {
  name:               'Circuit de Vitesse',
  totalLaps:          70,
  trackAbrasiveness:  0.80,   // 0–1; high = harder on tyres (like a rough street circuit)
  fuelCapacity:       100,    // kg maximum fuel load
  baseFuelBurnPerLap: 3.50,   // kg/lap baseline (NA); turbos multiply via engine.fuelBurnRate
  baseStopTime:       25,     // seconds for a stationary pit stop before crew quality scaling

  sectors: [
    {
      id:          1,
      label:       'Technical corners',
      // Favours chassis aero and driver skill; wears tyres hard; less full-throttle
      powerWeight: 0.02,
      aeroWeight:  0.05,
      wearWeight:  1.30,
      fuelWeight:  0.85,  // tight corners = partial throttle → lower fuel burn
      baseSectorTime: 28.0,
    },
    {
      id:          2,
      label:       'Power straight',
      // Engine horsepower dominant; easy on tyres; sustained full throttle
      powerWeight: 0.06,
      aeroWeight:  0.01,
      wearWeight:  0.70,
      fuelWeight:  1.30,  // flat-out → highest fuel burn of the three sectors
      baseSectorTime: 22.0,
    },
    {
      id:          3,
      label:       'Mixed flowing',
      // Balanced demands; average fuelWeight across all 3 sectors = 1.0
      powerWeight: 0.03,
      aeroWeight:  0.03,
      wearWeight:  1.00,
      fuelWeight:  0.85,
      baseSectorTime: 25.0,
    },
  ],
};
