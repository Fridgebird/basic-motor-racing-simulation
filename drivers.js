// drivers.js — The driver pool for Simple Motor Racing
//
// APPEND-ONLY. Never reorder or delete entries — IDs must stay stable forever.
// Add new drivers at the bottom when the pool needs expanding.
//
// Fields (all drivers):
//   id            — sequential integer, never reused
//   firstName     — given name
//   lastName      — family name (≤ 10 chars for timing sheet column)
//   nationality   — country string (for flavour; not used in sim)
//   gender        — 'male' | 'female'
//   portraitIndex — index into the driver sprite sheet (row-major, 0-based)
//                   Sheets: driver_sprites_16x16_1.png (0–15), driver_sprites_16x16_2.png (16–31)
//
// Season 1 starters only:
//   birthYear     — calendar year; must be ≤ 1910 so driver is at least 20 in 1930
//   startTeam     — team id from data.js; determines their S1 slot
//
// Rookie pool only (Season 2+):
//   rookieAge     — age when they enter (20–22); birthYear computed from entry season
//   (no startTeam — rookies fill whichever slot opens through retirement or firing)
//
// All stats (skill, consistency, aggression) are seeded from worldSeed + driverId
// in worldstate.js — do not author them here.

export const DRIVER_POOL = [

  // ── Hartwell Racing (Great Britain) ──────────────────────────────────────────
  {
    id: 0,
    firstName: 'Marco',        lastName: 'Alessi',
    nationality: 'italian',    gender: 'male',
    birthYear: 1900,           startTeam: 'hartwell',  portraitIndex: 0,
  },
  {
    id: 1,
    firstName: 'Eileen',       lastName: 'Burke',
    nationality: 'irish',      gender: 'female',
    birthYear: 1903,           startTeam: 'hartwell',  portraitIndex: 1,
  },

  // ── Flinders Racing Developments (Australia) ─────────────────────────────────
  {
    id: 2,
    firstName: 'Carlos',       lastName: 'Medina',
    nationality: 'spanish',    gender: 'male',
    birthYear: 1898,           startTeam: 'frd',       portraitIndex: 2,
  },
  {
    id: 3,
    firstName: 'Agnes',        lastName: 'Nolan',
    nationality: 'irish',      gender: 'female',
    birthYear: 1905,           startTeam: 'frd',       portraitIndex: 3,
  },

  // ── Officine Ferrosso (Italy) ─────────────────────────────────────────────────
  {
    id: 4,
    firstName: 'Hiroshi',      lastName: 'Abe',
    nationality: 'japanese',   gender: 'male',
    birthYear: 1895,           startTeam: 'ferrosso',  portraitIndex: 4,
  },
  {
    id: 5,
    firstName: 'Sofia',        lastName: 'Esposito',
    nationality: 'italian',    gender: 'female',
    birthYear: 1902,           startTeam: 'ferrosso',  portraitIndex: 5,
  },

  // ── Vettura Corse (Italy) ─────────────────────────────────────────────────────
  {
    id: 6,
    firstName: 'Alistair',     lastName: 'Quinn',
    nationality: 'irish',      gender: 'male',
    birthYear: 1899,           startTeam: 'vettura',   portraitIndex: 6,
  },
  {
    id: 7,
    firstName: 'Rajan',        lastName: 'Mehta',
    nationality: 'indian',     gender: 'male',
    birthYear: 1906,           startTeam: 'vettura',   portraitIndex: 7,
  },

  // ── Kaiserwerke GP (Germany) ──────────────────────────────────────────────────
  {
    id: 8,
    firstName: 'Teresa',       lastName: 'Morales',
    nationality: 'spanish',    gender: 'female',
    birthYear: 1893,           startTeam: 'kaiserwerke', portraitIndex: 8,
  },
  {
    id: 9,
    firstName: 'Jiaming',      lastName: 'Wu',
    nationality: 'chinese',    gender: 'male',
    birthYear: 1901,           startTeam: 'kaiserwerke', portraitIndex: 9,
  },

  // ── Écurie Mistral (France) ───────────────────────────────────────────────────
  {
    id: 10,
    firstName: 'Amara',        lastName: 'Diallo',
    nationality: 'senegalese', gender: 'female',
    birthYear: 1897,           startTeam: 'mistral',   portraitIndex: 10,
  },
  {
    id: 11,
    firstName: 'Giacomo',      lastName: 'Rossi',
    nationality: 'italian',    gender: 'male',
    birthYear: 1904,           startTeam: 'mistral',   portraitIndex: 11,
  },

  // ── Alpenring Motorsport (Austria) ────────────────────────────────────────────
  {
    id: 12,
    firstName: 'Andrei',       lastName: 'Horak',
    nationality: 'czech',      gender: 'male',
    birthYear: 1896,           startTeam: 'alpenring', portraitIndex: 12,
  },
  {
    id: 13,
    firstName: 'Violet',       lastName: 'Ashton',
    nationality: 'british',    gender: 'female',
    birthYear: 1908,           startTeam: 'alpenring', portraitIndex: 13,
  },

  // ── Delta Bravo Racing (Great Britain) ───────────────────────────────────────
  {
    id: 14,
    firstName: 'Roberto',      lastName: 'Vargas',
    nationality: 'argentinian', gender: 'male',
    birthYear: 1900,           startTeam: 'deltaBravo', portraitIndex: 14,
  },
  {
    id: 15,
    firstName: 'Marta',        lastName: 'Szabo',
    nationality: 'hungarian',  gender: 'female',
    birthYear: 1907,           startTeam: 'deltaBravo', portraitIndex: 15,
  },

  // ── Eaglecrest Racing (USA) ───────────────────────────────────────────────────
  {
    id: 16,
    firstName: 'Erik',         lastName: 'Lindqvist',
    nationality: 'swedish',    gender: 'male',
    birthYear: 1894,           startTeam: 'eaglecrest', portraitIndex: 16,
  },
  {
    id: 17,
    firstName: 'Leila',        lastName: 'Mansour',
    nationality: 'moroccan',   gender: 'female',
    birthYear: 1903,           startTeam: 'eaglecrest', portraitIndex: 17,
  },

  // ── Sakura Grand Prix (Japan) ─────────────────────────────────────────────────
  {
    id: 18,
    firstName: 'Nikos',        lastName: 'Stavros',
    nationality: 'greek',      gender: 'male',
    birthYear: 1901,           startTeam: 'sakura',    portraitIndex: 18,
  },
  {
    id: 19,
    firstName: 'Fiona',        lastName: 'Gallagher',
    nationality: 'irish',      gender: 'female',
    birthYear: 1906,           startTeam: 'sakura',    portraitIndex: 19,
  },

  // ── Santos Automotive (Brazil) ────────────────────────────────────────────────
  {
    id: 20,
    firstName: 'Kwame',        lastName: 'Asante',
    nationality: 'ghanaian',   gender: 'male',
    birthYear: 1898,           startTeam: 'santos',    portraitIndex: 20,
  },
  {
    id: 21,
    firstName: 'Yuki',         lastName: 'Hashimoto',
    nationality: 'japanese',   gender: 'female',
    birthYear: 1905,           startTeam: 'santos',    portraitIndex: 21,
  },

  // ── O'Connell Racing (Ireland) ────────────────────────────────────────────────
  {
    id: 22,
    firstName: 'Hassan',       lastName: 'Khalil',
    nationality: 'egyptian',   gender: 'male',
    birthYear: 1896,           startTeam: 'oconnell',  portraitIndex: 22,
  },
  {
    id: 23,
    firstName: 'Beatrice',     lastName: 'Forde',
    nationality: 'british',    gender: 'female',
    birthYear: 1909,           startTeam: 'oconnell',  portraitIndex: 23,
  },

  // ── Rookie pool — enters from Season 2 onward ─────────────────────────────────
  // These drivers have rookieAge instead of birthYear.
  // worldstate.js assigns them to the next vacant slot regardless of season;
  // their birthYear is computed as displayYear(entryseason) - rookieAge.
  // Add new entries here whenever the pool needs expanding — always append, never reorder.

  {
    id: 24,
    firstName: 'Diego',        lastName: 'Montoya',
    nationality: 'colombian',  gender: 'male',
    rookieAge: 21,             portraitIndex: 24,
  },
  {
    id: 25,
    firstName: 'Isabelle',     lastName: 'Fontaine',
    nationality: 'french',     gender: 'female',
    rookieAge: 20,             portraitIndex: 25,
  },
  {
    id: 26,
    firstName: 'Cedric',       lastName: 'Holt',
    nationality: 'british',    gender: 'male',
    rookieAge: 22,             portraitIndex: 26,
  },
  {
    id: 27,
    firstName: 'Adaeze',       lastName: 'Okafor',
    nationality: 'nigerian',   gender: 'female',
    rookieAge: 21,             portraitIndex: 27,
  },
  {
    id: 28,
    firstName: 'Luis',         lastName: 'Reyes',
    nationality: 'mexican',    gender: 'male',
    rookieAge: 20,             portraitIndex: 28,
  },
  {
    id: 29,
    firstName: 'Nadia',        lastName: 'Farouk',
    nationality: 'egyptian',   gender: 'female',
    rookieAge: 22,             portraitIndex: 29,
  },
  {
    id: 30,
    firstName: 'Douglas',      lastName: 'Walsh',
    nationality: 'british',    gender: 'male',
    rookieAge: 21,             portraitIndex: 30,
  },
  {
    id: 31,
    firstName: 'Valentina',    lastName: 'Cruz',
    nationality: 'argentinian', gender: 'female',
    rookieAge: 20,             portraitIndex: 31,
  },
  {
    id: 32,
    firstName: 'Henry',        lastName: 'Lafleur',
    nationality: 'canadian',   gender: 'male',
    rookieAge: 22,             portraitIndex: 32,
  },
  {
    id: 33,
    firstName: 'Marta',        lastName: 'Novak',
    nationality: 'czech',      gender: 'female',
    rookieAge: 21,             portraitIndex: 33,
  },
  {
    id: 34,
    firstName: 'Paavo',        lastName: 'Maki',
    nationality: 'finnish',    gender: 'male',
    rookieAge: 20,             portraitIndex: 34,
  },
  {
    id: 35,
    firstName: 'Ingrid',       lastName: 'Dahl',
    nationality: 'norwegian',  gender: 'female',
    rookieAge: 22,             portraitIndex: 35,
  },
  {
    id: 36,
    firstName: 'Istvan',       lastName: 'Fekete',
    nationality: 'hungarian',  gender: 'male',
    rookieAge: 21,             portraitIndex: 36,
  },
  {
    id: 37,
    firstName: 'Ana',          lastName: 'Monteiro',
    nationality: 'portuguese', gender: 'female',
    rookieAge: 20,             portraitIndex: 37,
  },
  {
    id: 38,
    firstName: 'Wei',          lastName: 'Chen',
    nationality: 'chinese',    gender: 'male',
    rookieAge: 22,             portraitIndex: 38,
  },
  {
    id: 39,
    firstName: 'Priya',        lastName: 'Sharma',
    nationality: 'indian',     gender: 'female',
    rookieAge: 21,             portraitIndex: 39,
  },
  {
    id: 40,
    firstName: 'Jack',         lastName: 'Galloway',
    nationality: 'new zealander', gender: 'male',
    rookieAge: 20,             portraitIndex: 40,
  },
  {
    id: 41,
    firstName: 'Karen',        lastName: 'Holm',
    nationality: 'danish',     gender: 'female',
    rookieAge: 22,             portraitIndex: 41,
  },
  {
    id: 42,
    firstName: 'Roy',          lastName: 'Sullivan',
    nationality: 'american',   gender: 'male',
    rookieAge: 21,             portraitIndex: 42,
  },
  {
    id: 43,
    firstName: 'Sylvia',       lastName: 'Grant',
    nationality: 'british',    gender: 'female',
    rookieAge: 20,             portraitIndex: 43,
  },
  {
    id: 44,
    firstName: 'Marco',        lastName: 'Grassi',
    nationality: 'italian',    gender: 'male',
    rookieAge: 22,             portraitIndex: 44,
  },
  {
    id: 45,
    firstName: 'Elsa',         lastName: 'Werner',
    nationality: 'german',     gender: 'female',
    rookieAge: 21,             portraitIndex: 45,
  },
  {
    id: 46,
    firstName: 'Paul',         lastName: 'Lebrun',
    nationality: 'french',     gender: 'male',
    rookieAge: 20,             portraitIndex: 46,
  },
  {
    id: 47,
    firstName: 'Sofia',        lastName: 'Lima',
    nationality: 'brazilian',  gender: 'female',
    rookieAge: 22,             portraitIndex: 47,
  },

  // add new entries below this line — always append, never reorder
  // new rookie-pool entries need rookieAge (not birthYear)

];
