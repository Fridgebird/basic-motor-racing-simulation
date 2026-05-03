// drivers.js — The driver pool for Simple Motor Racing
//
// APPEND-ONLY. Never reorder or delete entries — IDs must stay stable forever.
// Add new drivers at the bottom when the pool needs expanding.
//
// Fields:
//   id            — sequential integer, never reused
//   firstName     — given name
//   lastName      — family name (≤ 10 chars for timing sheet column)
//   nationality   — country string (for flavour; not used in sim)
//   gender        — 'male' | 'female'
//   birthYear     — calendar year (Season 1 = 1930; so age = displayYear - birthYear)
//   startTeam     — team id from data.js; this driver's team when they first become active
//   portraitIndex — index into the driver sprite sheet (row-major, 0-based)
//
// Base stats (S1 starting point; worldstate.js generates career-arc values per season):
//   baseSkill       — raw pace ceiling (0–100)
//   baseConsistency — reliability of performance (0–100)
//   baseAggression  — tyre wear driver / overtake style (0–100)
//
// Season 1 (1930): drivers must be born ≤ 1910 to be at least 20 years old.
// Drivers born after 1910 enter as rookies in the appropriate season.

export const DRIVER_POOL = [

  // ── Hartwell Racing (Great Britain) ──────────────────────────────────────────
  {
    id: 0,
    firstName: 'Thomas',      lastName: 'Aldridge',
    nationality: 'british',   gender: 'male',
    birthYear: 1900,          startTeam: 'hartwell',  portraitIndex: 0,
    baseSkill: 78,            baseConsistency: 80,     baseAggression: 65,
  },
  {
    id: 1,
    firstName: 'Vera',        lastName: 'Whitmore',
    nationality: 'french',    gender: 'female',
    birthYear: 1903,          startTeam: 'hartwell',  portraitIndex: 1,
    baseSkill: 72,            baseConsistency: 84,     baseAggression: 52,
  },

  // ── Flinders Racing Developments (Australia) ─────────────────────────────────
  {
    id: 2,
    firstName: 'Bill',     lastName: 'Reardon',
    nationality: 'australian', gender: 'male',
    birthYear: 1898,          startTeam: 'frd',       portraitIndex: 2,
    baseSkill: 65,            baseConsistency: 72,     baseAggression: 78,
  },
  {
    id: 3,
    firstName: 'Agnes',       lastName: 'McAllister',
    nationality: 'british',   gender: 'female',
    birthYear: 1905,          startTeam: 'frd',       portraitIndex: 3,
    baseSkill: 62,            baseConsistency: 76,     baseAggression: 58,
  },

  // ── Scuderia Ferrosso (Italy) ─────────────────────────────────────────────────
  {
    id: 4,
    firstName: 'Carlo',       lastName: 'Ferri',
    nationality: 'italian',   gender: 'male',
    birthYear: 1895,          startTeam: 'ferrosso',  portraitIndex: 4,
    baseSkill: 85,            baseConsistency: 78,     baseAggression: 82,
  },
  {
    id: 5,
    firstName: 'Rosa',        lastName: 'Lamberti',
    nationality: 'german',    gender: 'female',
    birthYear: 1902,          startTeam: 'ferrosso',  portraitIndex: 5,
    baseSkill: 80,            baseConsistency: 82,     baseAggression: 60,
  },

  // ── Vettura Corse (Italy) ─────────────────────────────────────────────────────
  {
    id: 6,
    firstName: 'Enzo',        lastName: 'Moretti',
    nationality: 'italian',   gender: 'male',
    birthYear: 1899,          startTeam: 'vettura',   portraitIndex: 6,
    baseSkill: 74,            baseConsistency: 70,     baseAggression: 75,
  },
  {
    id: 7,
    firstName: 'Giulia',      lastName: 'Benedetti',
    nationality: 'italian',   gender: 'female',
    birthYear: 1906,          startTeam: 'vettura',   portraitIndex: 7,
    baseSkill: 68,            baseConsistency: 75,     baseAggression: 62,
  },

  // ── Kaiserwerke GP (Germany) ──────────────────────────────────────────────────
  {
    id: 8,
    firstName: 'Friedrich',   lastName: 'Braun',
    nationality: 'german',    gender: 'male',
    birthYear: 1893,          startTeam: 'kaiserwerke', portraitIndex: 8,
    baseSkill: 82,            baseConsistency: 85,     baseAggression: 55,
  },
  {
    id: 9,
    firstName: 'Hildegard',   lastName: 'Vogel',
    nationality: 'austrian',  gender: 'female',
    birthYear: 1901,          startTeam: 'kaiserwerke', portraitIndex: 9,
    baseSkill: 76,            baseConsistency: 88,     baseAggression: 48,
  },

  // ── Écurie Mistral (France) ───────────────────────────────────────────────────
  {
    id: 10,
    firstName: 'Henri',       lastName: 'Renard',
    nationality: 'french',    gender: 'male',
    birthYear: 1897,          startTeam: 'mistral',   portraitIndex: 10,
    baseSkill: 80,            baseConsistency: 82,     baseAggression: 68,
  },
  {
    id: 11,
    firstName: 'Marguerite',  lastName: 'Leconte',
    nationality: 'belgian',   gender: 'female',
    birthYear: 1904,          startTeam: 'mistral',   portraitIndex: 11,
    baseSkill: 77,            baseConsistency: 86,     baseAggression: 55,
  },

  // ── Alpenring Motorsport (Austria) ────────────────────────────────────────────
  {
    id: 12,
    firstName: 'Rudolf',      lastName: 'Ziegler',
    nationality: 'austrian',  gender: 'male',
    birthYear: 1896,          startTeam: 'alpenring', portraitIndex: 12,
    baseSkill: 66,            baseConsistency: 73,     baseAggression: 70,
  },
  {
    id: 13,
    firstName: 'Gertrude',    lastName: 'Mayer',
    nationality: 'austrian',  gender: 'female',
    birthYear: 1908,          startTeam: 'alpenring', portraitIndex: 13,
    baseSkill: 60,            baseConsistency: 78,     baseAggression: 52,
  },

  // ── Delta Bravo Racing (Great Britain) ───────────────────────────────────────
  {
    id: 14,
    firstName: 'Arthur',      lastName: 'Pemberton',
    nationality: 'british',   gender: 'male',
    birthYear: 1900,          startTeam: 'deltaBravo', portraitIndex: 14,
    baseSkill: 70,            baseConsistency: 74,     baseAggression: 72,
  },
  {
    id: 15,
    firstName: 'Constance',   lastName: 'Baxter',
    nationality: 'american',  gender: 'female',
    birthYear: 1907,          startTeam: 'deltaBravo', portraitIndex: 15,
    baseSkill: 67,            baseConsistency: 79,     baseAggression: 58,
  },

  // ── Eaglecrest Racing (USA) ───────────────────────────────────────────────────
  {
    id: 16,
    firstName: 'Earl',        lastName: 'Morrison',
    nationality: 'american',  gender: 'male',
    birthYear: 1894,          startTeam: 'eaglecrest', portraitIndex: 16,
    baseSkill: 73,            baseConsistency: 71,     baseAggression: 80,
  },
  {
    id: 17,
    firstName: 'Dorothy',     lastName: 'Crane',
    nationality: 'british',   gender: 'female',
    birthYear: 1903,          startTeam: 'eaglecrest', portraitIndex: 17,
    baseSkill: 69,            baseConsistency: 77,     baseAggression: 63,
  },

  // ── Sakura Grand Prix (Japan) ─────────────────────────────────────────────────
  {
    id: 18,
    firstName: 'Kenji',       lastName: 'Tanaka',
    nationality: 'japanese',  gender: 'male',
    birthYear: 1901,          startTeam: 'sakura',    portraitIndex: 18,
    baseSkill: 81,            baseConsistency: 87,     baseAggression: 60,
  },
  {
    id: 19,
    firstName: 'Yuki',        lastName: 'Nakamura',
    nationality: 'japanese',  gender: 'female',
    birthYear: 1906,          startTeam: 'sakura',    portraitIndex: 19,
    baseSkill: 77,            baseConsistency: 90,     baseAggression: 52,
  },

  // ── Santos Automotive (Brazil) ────────────────────────────────────────────────
  {
    id: 20,
    firstName: 'Eduardo',     lastName: 'Cavalcanti',
    nationality: 'brazilian', gender: 'male',
    birthYear: 1898,          startTeam: 'santos',    portraitIndex: 20,
    baseSkill: 63,            baseConsistency: 66,     baseAggression: 82,
  },
  {
    id: 21,
    firstName: 'Isabel',      lastName: 'Nogueira',
    nationality: 'argentinian', gender: 'female',
    birthYear: 1905,          startTeam: 'santos',    portraitIndex: 21,
    baseSkill: 59,            baseConsistency: 70,     baseAggression: 65,
  },

  // ── O'Connell Racing (Ireland) ────────────────────────────────────────────────
  {
    id: 22,
    firstName: 'Patrick',     lastName: "O'Sullivan",
    nationality: 'irish',     gender: 'male',
    birthYear: 1896,          startTeam: 'oconnell',  portraitIndex: 22,
    baseSkill: 64,            baseConsistency: 68,     baseAggression: 76,
  },
  {
    id: 23,
    firstName: 'Bridget',     lastName: 'Flanagan',
    nationality: 'irish',     gender: 'female',
    birthYear: 1909,          startTeam: 'oconnell',  portraitIndex: 23,
    baseSkill: 61,            baseConsistency: 72,     baseAggression: 60,
  },

  // ── Rookie pool — enters from Season 2 onward ─────────────────────────────────
  // Born 1911–1920; each cohort of 2–3 drivers becomes eligible (age 20–22) across S2–S12.
  // startTeam is a fallback label only — worldstate.js assigns rookies to vacant slots.

  // 1911 cohort (age 20 in S2, 1931)
  {
    id: 24,
    firstName: 'Javier',      lastName: 'Ruiz',
    nationality: 'spanish',   gender: 'male',
    birthYear: 1911,          startTeam: 'hartwell',    portraitIndex: 24,
    baseSkill: 74,            baseConsistency: 78,       baseAggression: 70,
  },
  {
    id: 25,
    firstName: 'Lies',        lastName: 'van Dijk',
    nationality: 'dutch',     gender: 'female',
    birthYear: 1911,          startTeam: 'frd',         portraitIndex: 25,
    baseSkill: 69,            baseConsistency: 83,       baseAggression: 54,
  },
  {
    id: 26,
    firstName: 'Emil',        lastName: 'Steiner',
    nationality: 'swiss',     gender: 'male',
    birthYear: 1911,          startTeam: 'ferrosso',    portraitIndex: 26,
    baseSkill: 81,            baseConsistency: 76,       baseAggression: 66,
  },

  // 1912 cohort (age 20 in S3, 1932)
  {
    id: 27,
    firstName: 'Sigrid',      lastName: 'Lund',
    nationality: 'swedish',   gender: 'female',
    birthYear: 1912,          startTeam: 'vettura',     portraitIndex: 27,
    baseSkill: 77,            baseConsistency: 85,       baseAggression: 50,
  },
  {
    id: 28,
    firstName: 'Andrzej',     lastName: 'Kowal',
    nationality: 'polish',    gender: 'male',
    birthYear: 1912,          startTeam: 'kaiserwerke', portraitIndex: 28,
    baseSkill: 65,            baseConsistency: 70,       baseAggression: 74,
  },

  // 1913 cohort (age 20 in S4, 1933)
  {
    id: 29,
    firstName: 'Ruth',        lastName: 'Pretorius',
    nationality: 'south african', gender: 'female',
    birthYear: 1913,          startTeam: 'mistral',     portraitIndex: 29,
    baseSkill: 72,            baseConsistency: 80,       baseAggression: 62,
  },
  {
    id: 30,
    firstName: 'Luis',        lastName: 'Castillo',
    nationality: 'mexican',   gender: 'male',
    birthYear: 1913,          startTeam: 'alpenring',   portraitIndex: 30,
    baseSkill: 68,            baseConsistency: 65,       baseAggression: 84,
  },
  {
    id: 31,
    firstName: 'Carmen',      lastName: 'Vega',
    nationality: 'argentinian', gender: 'female',
    birthYear: 1913,          startTeam: 'deltaBravo',  portraitIndex: 31,
    baseSkill: 79,            baseConsistency: 74,       baseAggression: 71,
  },

  // 1914 cohort (age 20 in S5, 1934)
  {
    id: 32,
    firstName: 'Henry',       lastName: 'Lafleur',
    nationality: 'canadian',  gender: 'male',
    birthYear: 1914,          startTeam: 'eaglecrest',  portraitIndex: 32,
    baseSkill: 63,            baseConsistency: 69,       baseAggression: 77,
  },
  {
    id: 33,
    firstName: 'Marta',       lastName: 'Novak',
    nationality: 'czech',     gender: 'female',
    birthYear: 1914,          startTeam: 'sakura',      portraitIndex: 33,
    baseSkill: 75,            baseConsistency: 88,       baseAggression: 47,
  },

  // 1915 cohort (age 20 in S6, 1935)
  {
    id: 34,
    firstName: 'Paavo',       lastName: 'Maki',
    nationality: 'finnish',   gender: 'male',
    birthYear: 1915,          startTeam: 'santos',      portraitIndex: 34,
    baseSkill: 82,            baseConsistency: 73,       baseAggression: 79,
  },
  {
    id: 35,
    firstName: 'Ingrid',      lastName: 'Dahl',
    nationality: 'norwegian', gender: 'female',
    birthYear: 1915,          startTeam: 'oconnell',    portraitIndex: 35,
    baseSkill: 70,            baseConsistency: 82,       baseAggression: 56,
  },
  {
    id: 36,
    firstName: 'Istvan',      lastName: 'Fekete',
    nationality: 'hungarian', gender: 'male',
    birthYear: 1915,          startTeam: 'hartwell',    portraitIndex: 36,
    baseSkill: 66,            baseConsistency: 67,       baseAggression: 80,
  },

  // 1916 cohort (age 20 in S7, 1936)
  {
    id: 37,
    firstName: 'Ana',         lastName: 'Monteiro',
    nationality: 'portuguese', gender: 'female',
    birthYear: 1916,          startTeam: 'frd',         portraitIndex: 37,
    baseSkill: 73,            baseConsistency: 81,       baseAggression: 59,
  },
  {
    id: 38,
    firstName: 'Wei',         lastName: 'Chen',
    nationality: 'chinese',   gender: 'male',
    birthYear: 1916,          startTeam: 'ferrosso',    portraitIndex: 38,
    baseSkill: 78,            baseConsistency: 86,       baseAggression: 53,
  },

  // 1917 cohort (age 20 in S8, 1937)
  {
    id: 39,
    firstName: 'Priya',       lastName: 'Sharma',
    nationality: 'indian',    gender: 'female',
    birthYear: 1917,          startTeam: 'vettura',     portraitIndex: 39,
    baseSkill: 76,            baseConsistency: 84,       baseAggression: 61,
  },
  {
    id: 40,
    firstName: 'Jack',        lastName: 'Galloway',
    nationality: 'new zealander', gender: 'male',
    birthYear: 1917,          startTeam: 'kaiserwerke', portraitIndex: 40,
    baseSkill: 71,            baseConsistency: 72,       baseAggression: 75,
  },
  {
    id: 41,
    firstName: 'Karen',       lastName: 'Holm',
    nationality: 'danish',    gender: 'female',
    birthYear: 1917,          startTeam: 'mistral',     portraitIndex: 41,
    baseSkill: 67,            baseConsistency: 79,       baseAggression: 58,
  },

  // 1918 cohort (age 20 in S9, 1938)
  {
    id: 42,
    firstName: 'Roy',         lastName: 'Sullivan',
    nationality: 'american',  gender: 'male',
    birthYear: 1918,          startTeam: 'alpenring',   portraitIndex: 42,
    baseSkill: 64,            baseConsistency: 68,       baseAggression: 81,
  },
  {
    id: 43,
    firstName: 'Sylvia',      lastName: 'Grant',
    nationality: 'british',   gender: 'female',
    birthYear: 1918,          startTeam: 'deltaBravo',  portraitIndex: 43,
    baseSkill: 83,            baseConsistency: 77,       baseAggression: 64,
  },

  // 1919 cohort (age 20 in S10, 1939)
  {
    id: 44,
    firstName: 'Marco',       lastName: 'Grassi',
    nationality: 'italian',   gender: 'male',
    birthYear: 1919,          startTeam: 'eaglecrest',  portraitIndex: 44,
    baseSkill: 70,            baseConsistency: 75,       baseAggression: 73,
  },
  {
    id: 45,
    firstName: 'Elsa',        lastName: 'Werner',
    nationality: 'german',    gender: 'female',
    birthYear: 1919,          startTeam: 'sakura',      portraitIndex: 45,
    baseSkill: 74,            baseConsistency: 87,       baseAggression: 49,
  },

  // 1920 cohort (age 20 in S11, 1940)
  {
    id: 46,
    firstName: 'Paul',        lastName: 'Lebrun',
    nationality: 'french',    gender: 'male',
    birthYear: 1920,          startTeam: 'santos',      portraitIndex: 46,
    baseSkill: 80,            baseConsistency: 71,       baseAggression: 68,
  },
  {
    id: 47,
    firstName: 'Sofia',       lastName: 'Lima',
    nationality: 'brazilian', gender: 'female',
    birthYear: 1920,          startTeam: 'oconnell',    portraitIndex: 47,
    baseSkill: 62,            baseConsistency: 73,       baseAggression: 67,
  },

  // add new entries below this line — always append, never reorder

];
