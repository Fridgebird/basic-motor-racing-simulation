// data.js — Static world definitions for Simple Motor Racing
// All stats are 0–100 unless otherwise noted.
// Higher is always better (e.g. high reliability = fewer failures, high power = faster).
//
// NOTE: Team chassis stats (aero, chassisReliability, pitCrewRating, setupAbility, fuelCapacity)
// are S1 baseline values. worldstate.js overrides them with era-seeded values for each season.

// ─── Engine Manufacturers ─────────────────────────────────────────────────────
// power:       straight-line speed advantage; dominant factor on power sectors
// reliability: inverse of failure probability; lower = more likely to break
// fuelBurnRate: multiplier on circuit baseFuelBurnPerLap; 1.0 = baseline
//
// These are S1 baseline stats; worldstate.js regenerates them each engine era (every 3 seasons).

export const ENGINES = {
  ferrosso:    { id: 'ferrosso',    name: 'Ferrosso',    power: 82, reliability: 72, fuelBurnRate: 1.12 },
  sakura:      { id: 'sakura',      name: 'Sakura',      power: 79, reliability: 78, fuelBurnRate: 1.05 },
  kaiserwerke: { id: 'kaiserwerke', name: 'Kaiserwerke', power: 84, reliability: 70, fuelBurnRate: 1.15 },
  lanchester:  { id: 'lanchester',  name: 'Lanchester',  power: 70, reliability: 85, fuelBurnRate: 1.02 },
  sterling:    { id: 'sterling',    name: 'Sterling',    power: 72, reliability: 88, fuelBurnRate: 1.00 },
  henry:       { id: 'henry',       name: 'Henry',       power: 68, reliability: 90, fuelBurnRate: 0.98 },
  watt:        { id: 'watt',        name: 'Watt',        power: 75, reliability: 82, fuelBurnRate: 1.05 },
  barsanti:    { id: 'barsanti',    name: 'Barsanti',    power: 76, reliability: 75, fuelBurnRate: 1.08 },
  mirabeau:    { id: 'mirabeau',    name: 'Mirabeau',    power: 78, reliability: 80, fuelBurnRate: 1.10 },
  tannhauser:  { id: 'tannhauser',  name: 'Tannhäuser',  power: 80, reliability: 74, fuelBurnRate: 1.12 },
  eclipse:     { id: 'eclipse',     name: 'Éclipse',     power: 77, reliability: 78, fuelBurnRate: 1.06 },
  kosen:       { id: 'kosen',       name: 'Kōsen',       power: 73, reliability: 83, fuelBurnRate: 1.03 },
  titan:       { id: 'titan',       name: 'Titan',       power: 71, reliability: 86, fuelBurnRate: 1.00 },
  valkyr:      { id: 'valkyr',      name: 'Valkyr',      power: 74, reliability: 79, fuelBurnRate: 1.07 },
};

// ─── Tyre Manufacturers ───────────────────────────────────────────────────────
// maxGrip: peak grip level at zero wear (0–100)
// wearRate: base degradation per sector tick before compound/aggression/abrasion scaling
// letter:   single-letter code shown on timing sheet
//
// These are S1 baseline stats; worldstate.js regenerates them each tyre era (every 2 seasons).

export const TYRES = {
  blackstripe: { id: 'blackstripe', name: 'Blackstripe', letter: 'B', maxGrip: 88, wearRate: 0.0112 },
  vulcan:      { id: 'vulcan',      name: 'Vulcan',      letter: 'V', maxGrip: 86, wearRate: 0.0128 },
  saltwell:    { id: 'saltwell',    name: 'Saltwell',     letter: 'S', maxGrip: 84, wearRate: 0.0118 },
};

// Backward-compat alias
export const TYRE_MANUFACTURERS = TYRES;

// ─── Tyre Compounds ───────────────────────────────────────────────────────────
// wearMultiplier: scales the tyre manufacturer's baseWearRate each sector
// gripModifier:   added to tyre manufacturer's maxGrip (0–100 scale) before normalising

export const COMPOUNDS = {
  soft: {
    wearMultiplier: 1.4,
    gripModifier:   10,
  },
  medium: {
    wearMultiplier: 1.0,
    gripModifier:    0,
  },
  hard: {
    wearMultiplier: 0.75,
    gripModifier:  -30,
  },
};

// ─── Teams ────────────────────────────────────────────────────────────────────
// isWorks:       true if this team builds its own engine (always uses worksEngineId)
// worksEngineId: engine id for works teams; null for customer (garagiste) teams
// baseNumbers:   [lead, second] — permanent race numbers; champion's team gets [1,2] instead
// fundingLevel:  0–100; controls speed of season-end chassis development
// aero, chassisReliability, pitCrewRating, setupAbility, fuelCapacity: all seeded dynamically by worldstate.js
// strategy:      static personality — how the team makes pit decisions

export const TEAMS = [
  {
    id:                 'hartwell',
    name:               'Hartwell Racing',
    shortName:          'Hartwell',
    nationality:        'British',
    spriteRow:          0, spriteCol: 0,
    colour:             '#127517',
    isWorks:            false,
    worksEngineId:      null,
    baseNumbers:        [5, 6],
    fundingLevel:       90,
    aero:               78,
    chassisReliability: 85,
    pitCrewRating:      84,
    setupAbility:       82,
    strategy: {
      wearTrigger:    0.80,
      fuelTrigger:    7,
      fuelMarginLaps: 2,
      tyreLifeModel:  'fuelCorrected',
    },
  },
  {
    id:                 'frd',
    name:               'Flinders Racing Developments',
    shortName:          'FRD',
    nationality:        'Australian',
    spriteRow:          0, spriteCol: 1,
    colour:             '#c69753',
    isWorks:            false,
    worksEngineId:      null,
    baseNumbers:        [19, 20],
    fundingLevel:       55,
    aero:               52,
    chassisReliability: 75,
    pitCrewRating:      62,
    setupAbility:       58,
    strategy: {
      wearTrigger:    0.78,
      fuelTrigger:    8,
      fuelMarginLaps: 3,
      tyreLifeModel:  'basic',
    },
  },
  {
    id:                 'ferrosso',
    name:               'Officine Ferrosso',
    shortName:          'Ferrosso',
    nationality:        'Italian',
    spriteRow:          0, spriteCol: 2,
    colour:             '#fe3029',
    isWorks:            true,
    worksEngineId:      'ferrosso',
    baseNumbers:        [27, 28],
    fundingLevel:       88,
    aero:               82,
    chassisReliability: 72,
    pitCrewRating:      78,
    setupAbility:       88,
    strategy: {
      wearTrigger:    0.82,
      fuelTrigger:    6,
      fuelMarginLaps: 2,
      tyreLifeModel:  'fuelCorrected',
    },
  },
  {
    id:                 'vettura',
    name:               'Vettura Corse',
    shortName:          'Vettura',
    nationality:        'Italian',
    spriteRow:          0, spriteCol: 3,
    colour:             '#f6e923',
    isWorks:            false,
    worksEngineId:      null,
    baseNumbers:        [11, 12],
    fundingLevel:       62,
    aero:               60,
    chassisReliability: 78,
    pitCrewRating:      68,
    setupAbility:       65,
    strategy: {
      wearTrigger:    0.77,
      fuelTrigger:    7,
      fuelMarginLaps: 3,
      tyreLifeModel:  'basic',
    },
  },
  {
    id:                 'kaiserwerke',
    name:               'Kaiserwerke GP',
    shortName:          'Kaiserwerke',
    nationality:        'German',
    spriteRow:          1, spriteCol: 0,
    colour:             '#f2f2f2',
    isWorks:            true,
    worksEngineId:      'kaiserwerke',
    baseNumbers:        [9, 10],
    fundingLevel:       90,
    aero:               78,
    chassisReliability: 70,
    pitCrewRating:      82,
    setupAbility:       85,
    strategy: {
      wearTrigger:    0.83,
      fuelTrigger:    6,
      fuelMarginLaps: 2,
      tyreLifeModel:  'fuelCorrected',
    },
  },
  {
    id:                 'mistral',
    name:               'Écurie Mistral',
    shortName:          'Mistral',
    nationality:        'French',
    spriteRow:          1, spriteCol: 1,
    colour:             '#397ee0',
    isWorks:            false,
    worksEngineId:      null,
    baseNumbers:        [3, 4],
    fundingLevel:       68,
    aero:               72,
    chassisReliability: 80,
    pitCrewRating:      76,
    setupAbility:       70,
    strategy: {
      wearTrigger:    0.80,
      fuelTrigger:    7,
      fuelMarginLaps: 2,
      tyreLifeModel:  'fuelCorrected',
    },
  },
  {
    id:                 'alpenring',
    name:               'Alpenring Motorsport',
    shortName:          'Alpenring',
    nationality:        'Austrian',
    spriteRow:          1, spriteCol: 2,
    colour:             '#b5b5b5',
    isWorks:            false,
    worksEngineId:      null,
    baseNumbers:        [21, 22],
    fundingLevel:       48,
    aero:               50,
    chassisReliability: 82,
    pitCrewRating:      60,
    setupAbility:       55,
    strategy: {
      wearTrigger:    0.76,
      fuelTrigger:    8,
      fuelMarginLaps: 3,
      tyreLifeModel:  'basic',
    },
  },
  {
    id:                 'deltaBravo',
    name:               'Delta Bravo Racing',
    shortName:          'Delta Bravo',
    nationality:        'British',
    spriteRow:          1, spriteCol: 3,
    colour:             '#fb8d1f',
    isWorks:            false,
    worksEngineId:      null,
    baseNumbers:        [7, 8],
    fundingLevel:       65,
    aero:               62,
    chassisReliability: 76,
    pitCrewRating:      70,
    setupAbility:       68,
    strategy: {
      wearTrigger:    0.79,
      fuelTrigger:    7,
      fuelMarginLaps: 3,
      tyreLifeModel:  'basic',
    },
  },
  {
    id:                 'eaglecrest',
    name:               'Eaglecrest Racing',
    shortName:          'Eaglecrest',
    nationality:        'American',
    spriteRow:          2, spriteCol: 0,
    colour:             '#5ae5e2',
    isWorks:            false,
    worksEngineId:      null,
    baseNumbers:        [15, 16],
    fundingLevel:       70,
    aero:               65,
    chassisReliability: 84,
    pitCrewRating:      72,
    setupAbility:       70,
    strategy: {
      wearTrigger:    0.80,
      fuelTrigger:    7,
      fuelMarginLaps: 2,
      tyreLifeModel:  'fuelCorrected',
    },
  },
  {
    id:                 'sakura',
    name:               'Sakura Grand Prix',
    shortName:          'Sakura',
    nationality:        'Japanese',
    spriteRow:          2, spriteCol: 1,
    colour:             '#fe9aea',
    isWorks:            true,
    worksEngineId:      'sakura',
    baseNumbers:        [17, 18],
    fundingLevel:       72,
    aero:               75,
    chassisReliability: 75,
    pitCrewRating:      80,
    setupAbility:       74,
    strategy: {
      wearTrigger:    0.82,
      fuelTrigger:    6,
      fuelMarginLaps: 2,
      tyreLifeModel:  'fuelCorrected',
    },
  },
  {
    id:                 'santos',
    name:               'Santos Automotive',
    shortName:          'Santos',
    nationality:        'Brazilian',
    spriteRow:          2, spriteCol: 2,
    colour:             '#9e191c',
    isWorks:            false,
    worksEngineId:      null,
    baseNumbers:        [23, 24],
    fundingLevel:       30,
    aero:               40,
    chassisReliability: 65,
    pitCrewRating:      48,
    setupAbility:       38,
    strategy: {
      wearTrigger:    0.75,
      fuelTrigger:    9,
      fuelMarginLaps: 4,
      tyreLifeModel:  'basic',
    },
  },
  {
    id:                 'oconnell',
    name:               "O'Connell Racing",
    shortName:          "O'Connell",
    nationality:        'Irish',
    spriteRow:          2, spriteCol: 3,
    colour:             '#10eb25',
    isWorks:            false,
    worksEngineId:      null,
    baseNumbers:        [25, 26],
    fundingLevel:       26,
    aero:               38,
    chassisReliability: 64,
    pitCrewRating:      44,
    setupAbility:       35,
    strategy: {
      wearTrigger:    0.75,
      fuelTrigger:    9,
      fuelMarginLaps: 4,
      tyreLifeModel:  'basic',
    },
  },
];

// ─── Circuits ─────────────────────────────────────────────────────────────────
// Note: fuelCapacity is NOT on the circuit — it lives on each team (worldstate.js).
// baseFuelBurnPerLap: kg/lap at fuelBurnRate 1.0; longer/faster circuits burn more.
// trackAbrasiveness: 0.0 (smooth) → 1.0 (very rough); scales tyre wear per sector.
// pitLaneTime: seconds to traverse the pit lane (added to every stop).
// baseTyreChangeTime: seconds for a tyre change at pitCrewRating 100; scales with crew rating.
// fuelRigRate: seconds per kg of fuel added.
//
// PLACEHOLDER: circuit characteristics need tuning after playtesting.

export const CIRCUITS = {

  lobethal: {
    id:                 'lobethal',
    name:               'Lobethal Circuit',
    country:            'Australia',
    eventName:          'Australian Grand Prix',
    lengthKm:           3.31,
    totalLaps:          75,
    trackAbrasiveness:  0.30,
    baseFuelBurnPerLap: 1.10,
    pitLaneTime:        20,
    baseTyreChangeTime: 6,
    fuelRigRate:        0.12,
    sectors: [
      { id: 1, label: 'Village section',   powerWeight: 0.03, aeroWeight: 0.05, wearWeight: 1.40, fuelWeight: 0.75, baseSectorTime: 26.0 },
      { id: 2, label: 'Country blast',     powerWeight: 0.06, aeroWeight: 0.01, wearWeight: 0.75, fuelWeight: 1.45, baseSectorTime: 25.0 },
      { id: 3, label: 'Return loop',       powerWeight: 0.03, aeroWeight: 0.04, wearWeight: 1.20, fuelWeight: 0.80, baseSectorTime: 20.0 },
    ],
  },

  potrero: {
    id:                 'potrero',
    name:               'Potrero de los Funes',
    country:            'Argentina',
    eventName:          'Argentine Grand Prix',
    lengthKm:           6.28,
    totalLaps:          44,
    trackAbrasiveness:  0.28,
    baseFuelBurnPerLap: 1.75,
    pitLaneTime:        22,
    baseTyreChangeTime: 6,
    fuelRigRate:        0.12,
    sectors: [
      { id: 1, label: 'Lakeside sweep',    powerWeight: 0.03, aeroWeight: 0.04, wearWeight: 1.20, fuelWeight: 0.80, baseSectorTime: 38.0 },
      { id: 2, label: 'Back straight',     powerWeight: 0.05, aeroWeight: 0.02, wearWeight: 0.85, fuelWeight: 1.30, baseSectorTime: 45.0 },
      { id: 3, label: 'Infield complex',   powerWeight: 0.03, aeroWeight: 0.04, wearWeight: 1.10, fuelWeight: 0.90, baseSectorTime: 27.0 },
    ],
  },

  mellaha: {
    id:                 'mellaha',
    name:               'Mellaha Lake',
    country:            'Libya',
    eventName:          'Tripoli Grand Prix',
    lengthKm:           12.59,
    totalLaps:          24,
    trackAbrasiveness:  0.15,
    baseFuelBurnPerLap: 3.20,
    pitLaneTime:        24,
    baseTyreChangeTime: 6,
    fuelRigRate:        0.12,
    sectors: [
      { id: 1, label: 'City loop',         powerWeight: 0.03, aeroWeight: 0.03, wearWeight: 1.00, fuelWeight: 0.70, baseSectorTime: 58.0 },
      { id: 2, label: 'Desert straight',   powerWeight: 0.07, aeroWeight: 0.01, wearWeight: 0.60, fuelWeight: 1.60, baseSectorTime: 90.0 },
      { id: 3, label: 'Return sweep',      powerWeight: 0.04, aeroWeight: 0.03, wearWeight: 0.90, fuelWeight: 0.70, baseSectorTime: 52.0 },
    ],
  },

  bremgarten: {
    id:                 'bremgarten',
    name:               'Bremgarten',
    country:            'Switzerland',
    eventName:          'Swiss Grand Prix',
    lengthKm:           7.28,
    totalLaps:          42,
    trackAbrasiveness:  0.25,
    baseFuelBurnPerLap: 1.90,
    pitLaneTime:        22,
    baseTyreChangeTime: 6,
    fuelRigRate:        0.12,
    sectors: [
      { id: 1, label: 'Forest section',    powerWeight: 0.03, aeroWeight: 0.05, wearWeight: 1.35, fuelWeight: 0.75, baseSectorTime: 42.0 },
      { id: 2, label: 'Wohlensee blast',   powerWeight: 0.06, aeroWeight: 0.01, wearWeight: 0.70, fuelWeight: 1.40, baseSectorTime: 45.0 },
      { id: 3, label: 'Town return',       powerWeight: 0.03, aeroWeight: 0.04, wearWeight: 1.20, fuelWeight: 0.85, baseSectorTime: 33.0 },
    ],
  },

  nivelles: {
    id:                 'nivelles',
    name:               'Nivelles-Baulers',
    country:            'Belgium',
    eventName:          'Belgian Grand Prix',
    lengthKm:           3.72,
    totalLaps:          68,
    trackAbrasiveness:  0.35,
    baseFuelBurnPerLap: 1.20,
    pitLaneTime:        20,
    baseTyreChangeTime: 6,
    fuelRigRate:        0.12,
    sectors: [
      { id: 1, label: 'Technical loop',    powerWeight: 0.02, aeroWeight: 0.05, wearWeight: 1.45, fuelWeight: 0.65, baseSectorTime: 26.0 },
      { id: 2, label: 'Main straight',     powerWeight: 0.05, aeroWeight: 0.02, wearWeight: 0.85, fuelWeight: 1.35, baseSectorTime: 30.0 },
      { id: 3, label: 'Infield sequence',  powerWeight: 0.03, aeroWeight: 0.05, wearWeight: 1.30, fuelWeight: 1.00, baseSectorTime: 20.0 },
    ],
  },

  montjuic: {
    id:                 'montjuic',
    name:               'Montjuïc Circuit',
    country:            'Spain',
    eventName:          'Spanish Grand Prix',
    lengthKm:           3.791,
    totalLaps:          70,
    trackAbrasiveness:  0.50,
    baseFuelBurnPerLap: 1.30,
    pitLaneTime:        18,
    baseTyreChangeTime: 7,
    fuelRigRate:        0.12,
    sectors: [
      { id: 1, label: 'Technical corners', powerWeight: 0.02, aeroWeight: 0.05, wearWeight: 1.30, fuelWeight: 0.85, baseSectorTime: 28.0 },
      { id: 2, label: 'Avinguda climb',    powerWeight: 0.04, aeroWeight: 0.02, wearWeight: 1.00, fuelWeight: 1.10, baseSectorTime: 27.0 },
      { id: 3, label: 'Descent sector',    powerWeight: 0.05, aeroWeight: 0.03, wearWeight: 1.20, fuelWeight: 1.05, baseSectorTime: 20.0 },
    ],
  },

  rabelov: {
    id:                 'rabelov',
    name:               'Råbelövsbanan',
    country:            'Sweden',
    eventName:          'Swedish Grand Prix',
    lengthKm:           2.45,
    totalLaps:          100,
    trackAbrasiveness:  0.40,
    baseFuelBurnPerLap: 0.85,
    pitLaneTime:        18,
    baseTyreChangeTime: 6,
    fuelRigRate:        0.12,
    sectors: [
      { id: 1, label: 'Tight hairpins',    powerWeight: 0.02, aeroWeight: 0.06, wearWeight: 1.55, fuelWeight: 0.55, baseSectorTime: 18.0 },
      { id: 2, label: 'Back section',      powerWeight: 0.04, aeroWeight: 0.02, wearWeight: 0.90, fuelWeight: 1.20, baseSectorTime: 20.0 },
      { id: 3, label: 'Stadium complex',   powerWeight: 0.02, aeroWeight: 0.05, wearWeight: 1.35, fuelWeight: 1.25, baseSectorTime: 14.0 },
    ],
  },

  rouen: {
    id:                 'rouen',
    name:               'Rouen-Les-Essarts',
    country:            'France',
    eventName:          'French Grand Prix',
    lengthKm:           6.54,
    totalLaps:          45,
    trackAbrasiveness:  0.22,
    baseFuelBurnPerLap: 1.75,
    pitLaneTime:        21,
    baseTyreChangeTime: 6,
    fuelRigRate:        0.12,
    sectors: [
      { id: 1, label: 'Nouveau Monde',     powerWeight: 0.03, aeroWeight: 0.04, wearWeight: 1.10, fuelWeight: 0.80, baseSectorTime: 32.0 },
      { id: 2, label: 'Forêt blast',       powerWeight: 0.06, aeroWeight: 0.01, wearWeight: 0.70, fuelWeight: 1.45, baseSectorTime: 50.0 },
      { id: 3, label: 'Virage du Paradis', powerWeight: 0.03, aeroWeight: 0.03, wearWeight: 1.05, fuelWeight: 0.75, baseSectorTime: 23.0 },
    ],
  },

  crystalPalace: {
    id:                 'crystalPalace',
    name:               'Crystal Palace Circuit',
    country:            'Great Britain',
    eventName:          'British Grand Prix',
    lengthKm:           2.08,
    totalLaps:          120,
    trackAbrasiveness:  0.45,
    baseFuelBurnPerLap: 0.80,
    pitLaneTime:        18,
    baseTyreChangeTime: 6,
    fuelRigRate:        0.12,
    sectors: [
      { id: 1, label: 'Lower section',     powerWeight: 0.02, aeroWeight: 0.06, wearWeight: 1.65, fuelWeight: 0.50, baseSectorTime: 16.0 },
      { id: 2, label: 'South Tower',       powerWeight: 0.03, aeroWeight: 0.02, wearWeight: 0.95, fuelWeight: 1.10, baseSectorTime: 18.0 },
      { id: 3, label: 'Upper infield',     powerWeight: 0.02, aeroWeight: 0.06, wearWeight: 1.45, fuelWeight: 1.40, baseSectorTime: 14.0 },
    ],
  },

  schottenring: {
    id:                 'schottenring',
    name:               'Schottenring',
    country:            'Germany',
    eventName:          'German Grand Prix',
    lengthKm:           4.78,
    totalLaps:          55,
    trackAbrasiveness:  0.20,
    baseFuelBurnPerLap: 1.45,
    pitLaneTime:        20,
    baseTyreChangeTime: 6,
    fuelRigRate:        0.12,
    sectors: [
      { id: 1, label: 'Village exit',      powerWeight: 0.03, aeroWeight: 0.03, wearWeight: 1.00, fuelWeight: 0.85, baseSectorTime: 28.0 },
      { id: 2, label: 'Country blast',     powerWeight: 0.07, aeroWeight: 0.01, wearWeight: 0.60, fuelWeight: 1.45, baseSectorTime: 38.0 },
      { id: 3, label: 'Hairpin return',    powerWeight: 0.03, aeroWeight: 0.03, wearWeight: 1.05, fuelWeight: 0.70, baseSectorTime: 19.0 },
    ],
  },

  zeltweg: {
    id:                 'zeltweg',
    name:               'Zeltweg Aerodrome',
    country:            'Austria',
    eventName:          'Austrian Grand Prix',
    lengthKm:           3.188,
    totalLaps:          68,
    trackAbrasiveness:  0.50,
    baseFuelBurnPerLap: 1.15,
    pitLaneTime:        18,
    baseTyreChangeTime: 7,
    fuelRigRate:        0.12,
    sectors: [
      { id: 1, label: 'West section',      powerWeight: 0.04, aeroWeight: 0.04, wearWeight: 1.30, fuelWeight: 0.90, baseSectorTime: 22.8 },
      { id: 2, label: 'Main straight',     powerWeight: 0.06, aeroWeight: 0.01, wearWeight: 0.80, fuelWeight: 1.35, baseSectorTime: 18.0 },
      { id: 3, label: 'East chicane',      powerWeight: 0.03, aeroWeight: 0.05, wearWeight: 1.45, fuelWeight: 0.75, baseSectorTime: 19.0 },
    ],
  },

  keimola: {
    id:                 'keimola',
    name:               'Keimola Motor Stadium',
    country:            'Finland',
    eventName:          'Finnish Grand Prix',
    lengthKm:           4.35,
    totalLaps:          55,
    trackAbrasiveness:  0.32,
    baseFuelBurnPerLap: 1.35,
    pitLaneTime:        20,
    baseTyreChangeTime: 6,
    fuelRigRate:        0.12,
    sectors: [
      { id: 1, label: 'North loop',        powerWeight: 0.03, aeroWeight: 0.04, wearWeight: 1.25, fuelWeight: 0.80, baseSectorTime: 28.0 },
      { id: 2, label: 'Main straight',     powerWeight: 0.05, aeroWeight: 0.02, wearWeight: 0.90, fuelWeight: 1.20, baseSectorTime: 32.0 },
      { id: 3, label: 'South complex',     powerWeight: 0.03, aeroWeight: 0.04, wearWeight: 1.20, fuelWeight: 1.00, baseSectorTime: 20.0 },
    ],
  },

  monsanto: {
    id:                 'monsanto',
    name:               'Circuito de Monsanto',
    country:            'Portugal',
    eventName:          'Portuguese Grand Prix',
    lengthKm:           5.44,
    totalLaps:          48,
    trackAbrasiveness:  0.55,
    baseFuelBurnPerLap: 1.55,
    pitLaneTime:        21,
    baseTyreChangeTime: 7,
    fuelRigRate:        0.12,
    sectors: [
      { id: 1, label: 'Park entry',        powerWeight: 0.02, aeroWeight: 0.06, wearWeight: 1.55, fuelWeight: 0.60, baseSectorTime: 35.0 },
      { id: 2, label: 'Monsanto straight', powerWeight: 0.04, aeroWeight: 0.02, wearWeight: 0.95, fuelWeight: 1.15, baseSectorTime: 38.0 },
      { id: 3, label: 'Cascais section',   powerWeight: 0.02, aeroWeight: 0.05, wearWeight: 1.45, fuelWeight: 1.25, baseSectorTime: 27.0 },
    ],
  },

  ospedaletti: {
    id:                 'ospedaletti',
    name:               'Circuito di Ospedaletti',
    country:            'Italy',
    eventName:          'Italian Grand Prix',
    lengthKm:           3.78,
    totalLaps:          70,
    trackAbrasiveness:  0.42,
    baseFuelBurnPerLap: 1.25,
    pitLaneTime:        20,
    baseTyreChangeTime: 6,
    fuelRigRate:        0.12,
    sectors: [
      { id: 1, label: 'Seafront section',  powerWeight: 0.02, aeroWeight: 0.05, wearWeight: 1.40, fuelWeight: 0.70, baseSectorTime: 28.0 },
      { id: 2, label: 'Coast straight',    powerWeight: 0.05, aeroWeight: 0.02, wearWeight: 0.80, fuelWeight: 1.35, baseSectorTime: 30.0 },
      { id: 3, label: 'Hairpin return',    powerWeight: 0.03, aeroWeight: 0.04, wearWeight: 1.30, fuelWeight: 0.95, baseSectorTime: 20.0 },
    ],
  },

  ainDiab: {
    id:                 'ainDiab',
    name:               'Aïn-Diab',
    country:            'Morocco',
    eventName:          'Moroccan Grand Prix',
    lengthKm:           7.620,
    totalLaps:          35,
    trackAbrasiveness:  0.60,
    baseFuelBurnPerLap: 2.00,
    pitLaneTime:        22,
    baseTyreChangeTime: 7,
    fuelRigRate:        0.12,
    sectors: [
      { id: 1, label: 'Casablanca streets',powerWeight: 0.02, aeroWeight: 0.04, wearWeight: 1.55, fuelWeight: 0.70, baseSectorTime: 45.0 },
      { id: 2, label: 'Coastal blast',     powerWeight: 0.06, aeroWeight: 0.01, wearWeight: 0.65, fuelWeight: 1.50, baseSectorTime: 62.0 },
      { id: 3, label: 'Back section',      powerWeight: 0.03, aeroWeight: 0.04, wearWeight: 1.40, fuelWeight: 0.80, baseSectorTime: 40.0 },
    ],
  },

  jacarepagua: {
    id:                 'jacarepagua',
    name:               'Jacarepaguá',
    country:            'Brazil',
    eventName:          'Brazilian Grand Prix',
    lengthKm:           5.03,
    totalLaps:          55,
    trackAbrasiveness:  0.38,
    baseFuelBurnPerLap: 1.50,
    pitLaneTime:        21,
    baseTyreChangeTime: 6,
    fuelRigRate:        0.12,
    sectors: [
      { id: 1, label: 'North loop',        powerWeight: 0.03, aeroWeight: 0.04, wearWeight: 1.25, fuelWeight: 0.80, baseSectorTime: 32.0 },
      { id: 2, label: 'Back straight',     powerWeight: 0.05, aeroWeight: 0.02, wearWeight: 0.90, fuelWeight: 1.25, baseSectorTime: 40.0 },
      { id: 3, label: 'Infield complex',   powerWeight: 0.03, aeroWeight: 0.04, wearWeight: 1.15, fuelWeight: 0.95, baseSectorTime: 23.0 },
    ],
  },

  mine: {
    id:                 'mine',
    name:               'Mine Circuit',
    country:            'Japan',
    eventName:          'Japanese Grand Prix',
    lengthKm:           3.73,
    totalLaps:          70,
    trackAbrasiveness:  0.30,
    baseFuelBurnPerLap: 1.20,
    pitLaneTime:        20,
    baseTyreChangeTime: 6,
    fuelRigRate:        0.12,
    sectors: [
      { id: 1, label: 'Technical section', powerWeight: 0.02, aeroWeight: 0.06, wearWeight: 1.45, fuelWeight: 0.65, baseSectorTime: 25.0 },
      { id: 2, label: 'Back straight',     powerWeight: 0.04, aeroWeight: 0.02, wearWeight: 0.90, fuelWeight: 1.25, baseSectorTime: 28.0 },
      { id: 3, label: 'Final sector',      powerWeight: 0.03, aeroWeight: 0.04, wearWeight: 1.20, fuelWeight: 1.10, baseSectorTime: 19.0 },
    ],
  },

  shahAlam: {
    id:                 'shahAlam',
    name:               'Shah Alam Circuit',
    country:            'Malaysia',
    eventName:          'Malaysian Grand Prix',
    lengthKm:           5.54,
    totalLaps:          48,
    trackAbrasiveness:  0.33,
    baseFuelBurnPerLap: 1.60,
    pitLaneTime:        21,
    baseTyreChangeTime: 6,
    fuelRigRate:        0.12,
    sectors: [
      { id: 1, label: 'Stadium section',   powerWeight: 0.03, aeroWeight: 0.04, wearWeight: 1.30, fuelWeight: 0.80, baseSectorTime: 34.0 },
      { id: 2, label: 'Back straight',     powerWeight: 0.05, aeroWeight: 0.02, wearWeight: 0.85, fuelWeight: 1.25, baseSectorTime: 42.0 },
      { id: 3, label: 'Infield loop',      powerWeight: 0.03, aeroWeight: 0.04, wearWeight: 1.20, fuelWeight: 0.95, baseSectorTime: 24.0 },
    ],
  },

  riverside: {
    id:                 'riverside',
    name:               'Riverside International Raceway',
    country:            'United States',
    eventName:          'United States Grand Prix',
    lengthKm:           5.27,
    totalLaps:          52,
    trackAbrasiveness:  0.28,
    baseFuelBurnPerLap: 1.55,
    pitLaneTime:        22,
    baseTyreChangeTime: 6,
    fuelRigRate:        0.12,
    sectors: [
      { id: 1, label: 'Turn 1 complex',    powerWeight: 0.03, aeroWeight: 0.05, wearWeight: 1.20, fuelWeight: 0.80, baseSectorTime: 30.0 },
      { id: 2, label: 'Back section',      powerWeight: 0.06, aeroWeight: 0.02, wearWeight: 0.75, fuelWeight: 1.35, baseSectorTime: 38.0 },
      { id: 3, label: 'Riverside return',  powerWeight: 0.03, aeroWeight: 0.04, wearWeight: 1.10, fuelWeight: 0.85, baseSectorTime: 24.0 },
    ],
  },

  princeGeorge: {
    id:                 'princeGeorge',
    name:               'Prince George Circuit',
    country:            'South Africa',
    eventName:          'South African Grand Prix',
    lengthKm:           3.50,
    totalLaps:          72,
    trackAbrasiveness:  0.25,
    baseFuelBurnPerLap: 1.15,
    pitLaneTime:        19,
    baseTyreChangeTime: 6,
    fuelRigRate:        0.12,
    sectors: [
      { id: 1, label: 'East section',      powerWeight: 0.04, aeroWeight: 0.04, wearWeight: 1.00, fuelWeight: 0.90, baseSectorTime: 24.0 },
      { id: 2, label: 'Main straight',     powerWeight: 0.06, aeroWeight: 0.01, wearWeight: 0.70, fuelWeight: 1.35, baseSectorTime: 26.0 },
      { id: 3, label: 'West sweep',        powerWeight: 0.03, aeroWeight: 0.03, wearWeight: 1.00, fuelWeight: 0.75, baseSectorTime: 18.0 },
    ],
  },
};

// Backward-compat alias — first circuit in the season schedule
export const CIRCUIT = CIRCUITS.lobethal;

// ─── Season Schedule ──────────────────────────────────────────────────────────
// 20 rounds × 2 events (qualifying + race) = 40 entries.
// Qualifying and race share the same real-world day (see championship.js).
// eventType distinguishes qualifying (typeFlag=0) from race (typeFlag=1) for seeding.

export const SEASON_SCHEDULE = [
  { round:  1, eventType: 'qualifying', circuitId: 'lobethal'      },
  { round:  1, eventType: 'race',       circuitId: 'lobethal'      },
  { round:  2, eventType: 'qualifying', circuitId: 'potrero'       },
  { round:  2, eventType: 'race',       circuitId: 'potrero'       },
  { round:  3, eventType: 'qualifying', circuitId: 'mellaha'       },
  { round:  3, eventType: 'race',       circuitId: 'mellaha'       },
  { round:  4, eventType: 'qualifying', circuitId: 'bremgarten'    },
  { round:  4, eventType: 'race',       circuitId: 'bremgarten'    },
  { round:  5, eventType: 'qualifying', circuitId: 'nivelles'      },
  { round:  5, eventType: 'race',       circuitId: 'nivelles'      },
  { round:  6, eventType: 'qualifying', circuitId: 'montjuic'      },
  { round:  6, eventType: 'race',       circuitId: 'montjuic'      },
  { round:  7, eventType: 'qualifying', circuitId: 'rabelov'       },
  { round:  7, eventType: 'race',       circuitId: 'rabelov'       },
  { round:  8, eventType: 'qualifying', circuitId: 'rouen'         },
  { round:  8, eventType: 'race',       circuitId: 'rouen'         },
  { round:  9, eventType: 'qualifying', circuitId: 'crystalPalace' },
  { round:  9, eventType: 'race',       circuitId: 'crystalPalace' },
  { round: 10, eventType: 'qualifying', circuitId: 'schottenring'  },
  { round: 10, eventType: 'race',       circuitId: 'schottenring'  },
  { round: 11, eventType: 'qualifying', circuitId: 'zeltweg'       },
  { round: 11, eventType: 'race',       circuitId: 'zeltweg'       },
  { round: 12, eventType: 'qualifying', circuitId: 'keimola'       },
  { round: 12, eventType: 'race',       circuitId: 'keimola'       },
  { round: 13, eventType: 'qualifying', circuitId: 'monsanto'      },
  { round: 13, eventType: 'race',       circuitId: 'monsanto'      },
  { round: 14, eventType: 'qualifying', circuitId: 'ospedaletti'   },
  { round: 14, eventType: 'race',       circuitId: 'ospedaletti'   },
  { round: 15, eventType: 'qualifying', circuitId: 'ainDiab'       },
  { round: 15, eventType: 'race',       circuitId: 'ainDiab'       },
  { round: 16, eventType: 'qualifying', circuitId: 'jacarepagua'   },
  { round: 16, eventType: 'race',       circuitId: 'jacarepagua'   },
  { round: 17, eventType: 'qualifying', circuitId: 'mine'          },
  { round: 17, eventType: 'race',       circuitId: 'mine'          },
  { round: 18, eventType: 'qualifying', circuitId: 'shahAlam'      },
  { round: 18, eventType: 'race',       circuitId: 'shahAlam'      },
  { round: 19, eventType: 'qualifying', circuitId: 'riverside'     },
  { round: 19, eventType: 'race',       circuitId: 'riverside'     },
  { round: 20, eventType: 'qualifying', circuitId: 'princeGeorge'  },
  { round: 20, eventType: 'race',       circuitId: 'princeGeorge'  },
];

// ─── Calendar epoch ───────────────────────────────────────────────────────────
// Day 0 of Season 1. All day offsets are computed from this date.
export const SEASON_1_START = '2026-04-19';
