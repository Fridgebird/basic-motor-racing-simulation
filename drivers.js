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

  // ── Expanded pool (IDs 48–247) — placeholder names for long-run playtesting ──────
  // No portraitIndex → initials fallback. Replace with full entries when building
  // the permanent driver narrative archive.

  { id: 48,  firstName: 'Thomas',    lastName: 'Whitfield', nationality: 'british',       gender: 'male',   rookieAge: 20 },
  { id: 49,  firstName: 'Simone',    lastName: 'Picart',    nationality: 'french',        gender: 'female', rookieAge: 21 },
  { id: 50,  firstName: 'Klaus',     lastName: 'Becker',    nationality: 'german',        gender: 'male',   rookieAge: 22 },
  { id: 51,  firstName: 'Giulia',    lastName: 'Ferrara',   nationality: 'italian',       gender: 'female', rookieAge: 20 },
  { id: 52,  firstName: 'Felipe',    lastName: 'Ramos',     nationality: 'brazilian',     gender: 'male',   rookieAge: 21 },
  { id: 53,  firstName: 'Takashi',   lastName: 'Kato',      nationality: 'japanese',      gender: 'male',   rookieAge: 22 },
  { id: 54,  firstName: 'Astrid',    lastName: 'Lund',      nationality: 'swedish',       gender: 'female', rookieAge: 20 },
  { id: 55,  firstName: 'Rafael',    lastName: 'Torres',    nationality: 'spanish',       gender: 'male',   rookieAge: 21 },
  { id: 56,  firstName: 'Karen',     lastName: 'Nash',      nationality: 'australian',    gender: 'female', rookieAge: 22 },
  { id: 57,  firstName: 'Aaron',     lastName: 'Hart',      nationality: 'american',      gender: 'male',   rookieAge: 20 },
  { id: 58,  firstName: 'Yuki',      lastName: 'Tanaka',    nationality: 'japanese',      gender: 'female', rookieAge: 21 },
  { id: 59,  firstName: 'Lars',      lastName: 'Nilsson',   nationality: 'swedish',       gender: 'male',   rookieAge: 22 },
  { id: 60,  firstName: 'Ana',       lastName: 'Vieira',    nationality: 'brazilian',     gender: 'female', rookieAge: 20 },
  { id: 61,  firstName: 'Stefan',    lastName: 'Kraus',     nationality: 'german',        gender: 'male',   rookieAge: 21 },
  { id: 62,  firstName: 'Carmen',    lastName: 'Flores',    nationality: 'spanish',       gender: 'female', rookieAge: 22 },
  { id: 63,  firstName: 'Shane',     lastName: 'Webb',      nationality: 'australian',    gender: 'male',   rookieAge: 20 },
  { id: 64,  firstName: 'Nathalie',  lastName: 'Blanc',     nationality: 'french',        gender: 'female', rookieAge: 21 },
  { id: 65,  firstName: 'Mikko',     lastName: 'Laine',     nationality: 'finnish',       gender: 'male',   rookieAge: 22 },
  { id: 66,  firstName: 'Isabel',    lastName: 'Mora',      nationality: 'spanish',       gender: 'female', rookieAge: 20 },
  { id: 67,  firstName: 'Jeroen',    lastName: 'Kuiper',    nationality: 'dutch',         gender: 'male',   rookieAge: 21 },
  { id: 68,  firstName: 'Riikka',    lastName: 'Lehto',     nationality: 'finnish',       gender: 'female', rookieAge: 22 },
  { id: 69,  firstName: 'Thiago',    lastName: 'Lima',      nationality: 'brazilian',     gender: 'male',   rookieAge: 20 },
  { id: 70,  firstName: 'Chiara',    lastName: 'Russo',     nationality: 'italian',       gender: 'female', rookieAge: 21 },
  { id: 71,  firstName: 'Edward',    lastName: 'Barker',    nationality: 'british',       gender: 'male',   rookieAge: 22 },
  { id: 72,  firstName: 'Sabine',    lastName: 'Ritter',    nationality: 'german',        gender: 'female', rookieAge: 20 },
  { id: 73,  firstName: 'Lorenzo',   lastName: 'Mazza',     nationality: 'italian',       gender: 'male',   rookieAge: 21 },
  { id: 74,  firstName: 'Ashley',    lastName: 'Moore',     nationality: 'american',      gender: 'female', rookieAge: 22 },
  { id: 75,  firstName: 'Kenji',     lastName: 'Hayashi',   nationality: 'japanese',      gender: 'male',   rookieAge: 20 },
  { id: 76,  firstName: 'Eero',      lastName: 'Makinen',   nationality: 'finnish',       gender: 'male',   rookieAge: 21 },
  { id: 77,  firstName: 'Valentina', lastName: 'Rossi',     nationality: 'italian',       gender: 'female', rookieAge: 22 },
  { id: 78,  firstName: 'Antoine',   lastName: 'Moreau',    nationality: 'french',        gender: 'male',   rookieAge: 20 },
  { id: 79,  firstName: 'Michelle',  lastName: 'Bird',      nationality: 'australian',    gender: 'female', rookieAge: 21 },
  { id: 80,  firstName: 'Rodrigo',   lastName: 'Pinto',     nationality: 'brazilian',     gender: 'male',   rookieAge: 22 },
  { id: 81,  firstName: 'Ingrid',    lastName: 'Strand',    nationality: 'norwegian',     gender: 'female', rookieAge: 20 },
  { id: 82,  firstName: 'Miguel',    lastName: 'Vargas',    nationality: 'spanish',       gender: 'male',   rookieAge: 21 },
  { id: 83,  firstName: 'Akiko',     lastName: 'Watanabe',  nationality: 'japanese',      gender: 'female', rookieAge: 22 },
  { id: 84,  firstName: 'Craig',     lastName: 'Fox',       nationality: 'australian',    gender: 'male',   rookieAge: 20 },
  { id: 85,  firstName: 'Elena',     lastName: 'Rubio',     nationality: 'spanish',       gender: 'female', rookieAge: 21 },
  { id: 86,  firstName: 'Tyler',     lastName: 'Woods',     nationality: 'american',      gender: 'male',   rookieAge: 22 },
  { id: 87,  firstName: 'Anke',      lastName: 'Vogel',     nationality: 'german',        gender: 'female', rookieAge: 20 },
  { id: 88,  firstName: 'Matteo',    lastName: 'Bruno',     nationality: 'italian',       gender: 'male',   rookieAge: 21 },
  { id: 89,  firstName: 'Beatriz',   lastName: 'Faria',     nationality: 'portuguese',    gender: 'female', rookieAge: 22 },
  { id: 90,  firstName: 'Michael',   lastName: 'Braun',     nationality: 'german',        gender: 'male',   rookieAge: 20 },
  { id: 91,  firstName: 'Karin',     lastName: 'Sund',      nationality: 'swedish',       gender: 'female', rookieAge: 21 },
  { id: 92,  firstName: 'Jean',      lastName: 'Aubert',    nationality: 'french',        gender: 'male',   rookieAge: 22 },
  { id: 93,  firstName: 'Naomi',     lastName: 'Kobayashi', nationality: 'japanese',      gender: 'female', rookieAge: 20 },
  { id: 94,  firstName: 'George',    lastName: 'Croft',     nationality: 'british',       gender: 'male',   rookieAge: 21 },
  { id: 95,  firstName: 'Mariana',   lastName: 'Belo',      nationality: 'brazilian',     gender: 'female', rookieAge: 22 },
  { id: 96,  firstName: 'Ryo',       lastName: 'Sato',      nationality: 'japanese',      gender: 'male',   rookieAge: 20 },
  { id: 97,  firstName: 'Dorothy',   lastName: 'Shaw',      nationality: 'british',       gender: 'female', rookieAge: 21 },
  { id: 98,  firstName: 'Blake',     lastName: 'Stone',     nationality: 'american',      gender: 'male',   rookieAge: 22 },
  { id: 99,  firstName: 'Yvette',    lastName: 'Aurel',     nationality: 'french',        gender: 'female', rookieAge: 20 },
  { id: 100, firstName: 'Roberto',   lastName: 'Vitale',    nationality: 'italian',       gender: 'male',   rookieAge: 21 },
  { id: 101, firstName: 'Sunita',    lastName: 'Nair',      nationality: 'indian',        gender: 'female', rookieAge: 22 },
  { id: 102, firstName: 'Piotr',     lastName: 'Nowak',     nationality: 'polish',        gender: 'male',   rookieAge: 20 },
  { id: 103, firstName: 'Kofi',      lastName: 'Asante',    nationality: 'ghanaian',      gender: 'male',   rookieAge: 21 },
  { id: 104, firstName: 'Lucia',     lastName: 'Vidal',     nationality: 'spanish',       gender: 'female', rookieAge: 22 },
  { id: 105, firstName: 'Emilio',    lastName: 'Ramirez',   nationality: 'mexican',       gender: 'male',   rookieAge: 20 },
  { id: 106, firstName: 'Sigrid',    lastName: 'Berg',      nationality: 'norwegian',     gender: 'female', rookieAge: 21 },
  { id: 107, firstName: 'Franco',    lastName: 'Gallo',     nationality: 'italian',       gender: 'male',   rookieAge: 22 },
  { id: 108, firstName: 'Sari',      lastName: 'Niemi',     nationality: 'finnish',       gender: 'female', rookieAge: 20 },
  { id: 109, firstName: 'Gustavo',   lastName: 'Alves',     nationality: 'brazilian',     gender: 'male',   rookieAge: 21 },
  { id: 110, firstName: 'Fatou',     lastName: 'Diallo',    nationality: 'senegalese',    gender: 'female', rookieAge: 22 },
  { id: 111, firstName: 'Naoki',     lastName: 'Yamada',    nationality: 'japanese',      gender: 'male',   rookieAge: 20 },
  { id: 112, firstName: 'Monika',    lastName: 'Fischer',   nationality: 'german',        gender: 'female', rookieAge: 21 },
  { id: 113, firstName: 'William',   lastName: 'Moss',      nationality: 'british',       gender: 'male',   rookieAge: 22 },
  { id: 114, firstName: 'Aminata',   lastName: 'Toure',     nationality: 'senegalese',    gender: 'female', rookieAge: 20 },
  { id: 115, firstName: 'Derek',     lastName: 'Cole',      nationality: 'american',      gender: 'male',   rookieAge: 21 },
  { id: 116, firstName: 'Francisca', lastName: 'Pinto',     nationality: 'portuguese',    gender: 'female', rookieAge: 22 },
  { id: 117, firstName: 'Gabriel',   lastName: 'Nunes',     nationality: 'brazilian',     gender: 'male',   rookieAge: 20 },
  { id: 118, firstName: 'Emi',       lastName: 'Suzuki',    nationality: 'japanese',      gender: 'female', rookieAge: 21 },
  { id: 119, firstName: 'Andras',    lastName: 'Fekete',    nationality: 'hungarian',     gender: 'male',   rookieAge: 22 },
  { id: 120, firstName: 'Marjolein', lastName: 'Bos',       nationality: 'dutch',         gender: 'female', rookieAge: 20 },
  { id: 121, firstName: 'Vikram',    lastName: 'Rao',       nationality: 'indian',        gender: 'male',   rookieAge: 21 },
  { id: 122, firstName: 'Nicole',    lastName: 'Dale',      nationality: 'australian',    gender: 'female', rookieAge: 22 },
  { id: 123, firstName: 'Alain',     lastName: 'Renard',    nationality: 'french',        gender: 'male',   rookieAge: 20 },
  { id: 124, firstName: 'Olga',      lastName: 'Sorokina',  nationality: 'czech',         gender: 'female', rookieAge: 21 },
  { id: 125, firstName: 'Grant',     lastName: 'Lowe',      nationality: 'australian',    gender: 'male',   rookieAge: 22 },
  { id: 126, firstName: 'Luciana',   lastName: 'Ruiz',      nationality: 'argentinian',   gender: 'female', rookieAge: 20 },
  { id: 127, firstName: 'Wolfgang',  lastName: 'Koch',      nationality: 'german',        gender: 'male',   rookieAge: 21 },
  { id: 128, firstName: 'Marta',     lastName: 'Blanco',    nationality: 'spanish',       gender: 'female', rookieAge: 22 },
  { id: 129, firstName: 'Femi',      lastName: 'Adeyemi',   nationality: 'nigerian',      gender: 'male',   rookieAge: 20 },
  { id: 130, firstName: 'Haruka',    lastName: 'Ito',       nationality: 'japanese',      gender: 'female', rookieAge: 21 },
  { id: 131, firstName: 'Sanjay',    lastName: 'Kapoor',    nationality: 'indian',        gender: 'male',   rookieAge: 22 },
  { id: 132, firstName: 'Pilar',     lastName: 'Cano',      nationality: 'spanish',       gender: 'female', rookieAge: 20 },
  { id: 133, firstName: 'Bjorn',     lastName: 'Strand',    nationality: 'swedish',       gender: 'male',   rookieAge: 21 },
  { id: 134, firstName: 'Ngozi',     lastName: 'Obi',       nationality: 'nigerian',      gender: 'female', rookieAge: 22 },
  { id: 135, firstName: 'Lucas',     lastName: 'Silva',     nationality: 'brazilian',     gender: 'male',   rookieAge: 20 },
  { id: 136, firstName: 'Tracey',    lastName: 'Swift',     nationality: 'australian',    gender: 'female', rookieAge: 21 },
  { id: 137, firstName: 'Javier',    lastName: 'Gil',       nationality: 'spanish',       gender: 'male',   rookieAge: 22 },
  { id: 138, firstName: 'Claudia',   lastName: 'Berger',    nationality: 'german',        gender: 'female', rookieAge: 20 },
  { id: 139, firstName: 'Arthur',    lastName: 'Reid',      nationality: 'british',       gender: 'male',   rookieAge: 21 },
  { id: 140, firstName: 'Kofi',      lastName: 'Mensah',    nationality: 'ghanaian',      gender: 'male',   rookieAge: 22 },
  { id: 141, firstName: 'Carla',     lastName: 'Ferreira',  nationality: 'portuguese',    gender: 'female', rookieAge: 20 },
  { id: 142, firstName: 'Tibor',     lastName: 'Varga',     nationality: 'hungarian',     gender: 'male',   rookieAge: 21 },
  { id: 143, firstName: 'Heli',      lastName: 'Aho',       nationality: 'finnish',       gender: 'female', rookieAge: 22 },
  { id: 144, firstName: 'Daniele',   lastName: 'Moretti',   nationality: 'italian',       gender: 'male',   rookieAge: 20 },
  { id: 145, firstName: 'Morgan',    lastName: 'Scott',     nationality: 'american',      gender: 'female', rookieAge: 21 },
  { id: 146, firstName: 'Kohei',     lastName: 'Inoue',     nationality: 'japanese',      gender: 'male',   rookieAge: 22 },
  { id: 147, firstName: 'Hanneke',   lastName: 'Visser',    nationality: 'dutch',         gender: 'female', rookieAge: 20 },
  { id: 148, firstName: 'Wade',      lastName: 'Pierce',    nationality: 'american',      gender: 'male',   rookieAge: 21 },
  { id: 149, firstName: 'Inge',      lastName: 'Hartmann',  nationality: 'german',        gender: 'female', rookieAge: 22 },
  { id: 150, firstName: 'Eduardo',   lastName: 'Rocha',     nationality: 'brazilian',     gender: 'male',   rookieAge: 20 },
  { id: 151, firstName: 'Greta',     lastName: 'Nyman',     nationality: 'swedish',       gender: 'female', rookieAge: 21 },
  { id: 152, firstName: 'Marek',     lastName: 'Novak',     nationality: 'czech',         gender: 'male',   rookieAge: 22 },
  { id: 153, firstName: 'Divya',     lastName: 'Menon',     nationality: 'indian',        gender: 'female', rookieAge: 20 },
  { id: 154, firstName: 'Glenn',     lastName: 'Ward',      nationality: 'australian',    gender: 'male',   rookieAge: 21 },
  { id: 155, firstName: 'Sylvie',    lastName: 'Morel',     nationality: 'french',        gender: 'female', rookieAge: 22 },
  { id: 156, firstName: 'Pietro',    lastName: 'Serra',     nationality: 'italian',       gender: 'male',   rookieAge: 20 },
  { id: 157, firstName: 'Amara',     lastName: 'Diagne',    nationality: 'senegalese',    gender: 'female', rookieAge: 21 },
  { id: 158, firstName: 'Gerhard',   lastName: 'Stein',     nationality: 'german',        gender: 'male',   rookieAge: 22 },
  { id: 159, firstName: 'Colette',   lastName: 'Faure',     nationality: 'french',        gender: 'female', rookieAge: 20 },
  { id: 160, firstName: 'Brett',     lastName: 'Burns',     nationality: 'australian',    gender: 'male',   rookieAge: 21 },
  { id: 161, firstName: 'Agnieszka', lastName: 'Witek',     nationality: 'polish',        gender: 'female', rookieAge: 22 },
  { id: 162, firstName: 'Raul',      lastName: 'Navarro',   nationality: 'mexican',       gender: 'male',   rookieAge: 20 },
  { id: 163, firstName: 'Irene',     lastName: 'Papadaki',  nationality: 'greek',         gender: 'female', rookieAge: 21 },
  { id: 164, firstName: 'Nicolas',   lastName: 'Garnier',   nationality: 'french',        gender: 'male',   rookieAge: 22 },
  { id: 165, firstName: 'Madison',   lastName: 'King',      nationality: 'american',      gender: 'female', rookieAge: 20 },
  { id: 166, firstName: 'Enrico',    lastName: 'Amato',     nationality: 'italian',       gender: 'male',   rookieAge: 21 },
  { id: 167, firstName: 'Meena',     lastName: 'Pillai',    nationality: 'indian',        gender: 'female', rookieAge: 22 },
  { id: 168, firstName: 'Frank',     lastName: 'Smit',      nationality: 'dutch',         gender: 'male',   rookieAge: 20 },
  { id: 169, firstName: 'Camille',   lastName: 'Roux',      nationality: 'french',        gender: 'female', rookieAge: 21 },
  { id: 170, firstName: 'Arun',      lastName: 'Krishnan',  nationality: 'indian',        gender: 'male',   rookieAge: 22 },
  { id: 171, firstName: 'Patricia',  lastName: 'Holt',      nationality: 'british',       gender: 'female', rookieAge: 20 },
  { id: 172, firstName: 'Tunde',     lastName: 'Bakare',    nationality: 'nigerian',      gender: 'male',   rookieAge: 21 },
  { id: 173, firstName: 'Akosua',    lastName: 'Amponsah',  nationality: 'ghanaian',      gender: 'female', rookieAge: 22 },
  { id: 174, firstName: 'Miroslav',  lastName: 'Horak',     nationality: 'czech',         gender: 'male',   rookieAge: 20 },
  { id: 175, firstName: 'Monique',   lastName: 'Dupont',    nationality: 'french',        gender: 'female', rookieAge: 21 },
  { id: 176, firstName: 'Kyle',      lastName: 'Marsh',     nationality: 'american',      gender: 'male',   rookieAge: 22 },
  { id: 177, firstName: 'Daniela',   lastName: 'Pires',     nationality: 'portuguese',    gender: 'female', rookieAge: 20 },
  { id: 178, firstName: 'Taiki',     lastName: 'Ogawa',     nationality: 'japanese',      gender: 'male',   rookieAge: 21 },
  { id: 179, firstName: 'Lena',      lastName: 'Baum',      nationality: 'german',        gender: 'female', rookieAge: 22 },
  { id: 180, firstName: 'Santiago',  lastName: 'Perez',     nationality: 'colombian',     gender: 'male',   rookieAge: 20 },
  { id: 181, firstName: 'Anja',      lastName: 'DeVries',   nationality: 'dutch',         gender: 'female', rookieAge: 21 },
  { id: 182, firstName: 'Peter',     lastName: 'Knox',      nationality: 'british',       gender: 'male',   rookieAge: 22 },
  { id: 183, firstName: 'Fernanda',  lastName: 'Melo',      nationality: 'brazilian',     gender: 'female', rookieAge: 20 },
  { id: 184, firstName: 'Antti',     lastName: 'Kari',      nationality: 'finnish',       gender: 'male',   rookieAge: 21 },
  { id: 185, firstName: 'Paloma',    lastName: 'Vega',      nationality: 'spanish',       gender: 'female', rookieAge: 22 },
  { id: 186, firstName: 'Emeka',     lastName: 'Okafor',    nationality: 'nigerian',      gender: 'male',   rookieAge: 20 },
  { id: 187, firstName: 'Birgitta',  lastName: 'Ek',        nationality: 'swedish',       gender: 'female', rookieAge: 21 },
  { id: 188, firstName: 'Robert',    lastName: 'Birch',     nationality: 'british',       gender: 'male',   rookieAge: 22 },
  { id: 189, firstName: 'Mio',       lastName: 'Kimura',    nationality: 'japanese',      gender: 'female', rookieAge: 20 },
  { id: 190, firstName: 'Dieter',    lastName: 'Wolf',      nationality: 'german',        gender: 'male',   rookieAge: 21 },
  { id: 191, firstName: 'Rocio',     lastName: 'Serrano',   nationality: 'spanish',       gender: 'female', rookieAge: 22 },
  { id: 192, firstName: 'Bruno',     lastName: 'Rocha',     nationality: 'brazilian',     gender: 'male',   rookieAge: 20 },
  { id: 193, firstName: 'Hannelore', lastName: 'Muller',    nationality: 'german',        gender: 'female', rookieAge: 21 },
  { id: 194, firstName: 'Knut',      lastName: 'Odegard',   nationality: 'norwegian',     gender: 'male',   rookieAge: 22 },
  { id: 195, firstName: 'Luciana',   lastName: 'Gomes',     nationality: 'brazilian',     gender: 'female', rookieAge: 20 },
  { id: 196, firstName: 'David',     lastName: 'Fleming',   nationality: 'british',       gender: 'male',   rookieAge: 21 },
  { id: 197, firstName: 'Sachiko',   lastName: 'Fujii',     nationality: 'japanese',      gender: 'female', rookieAge: 22 },
  { id: 198, firstName: 'Clint',     lastName: 'Lawson',    nationality: 'american',      gender: 'male',   rookieAge: 20 },
  { id: 199, firstName: 'Beatrix',   lastName: 'Sandor',    nationality: 'hungarian',     gender: 'female', rookieAge: 21 },
  { id: 200, firstName: 'Francois',  lastName: 'Petit',     nationality: 'french',        gender: 'male',   rookieAge: 22 },
  { id: 201, firstName: 'Amina',     lastName: 'Diallo',    nationality: 'moroccan',      gender: 'female', rookieAge: 20 },
  { id: 202, firstName: 'Pieter',    lastName: 'Claes',     nationality: 'belgian',       gender: 'male',   rookieAge: 21 },
  { id: 203, firstName: 'Yemi',      lastName: 'Adebayo',   nationality: 'nigerian',      gender: 'female', rookieAge: 22 },
  { id: 204, firstName: 'Richard',   lastName: 'Drew',      nationality: 'british',       gender: 'male',   rookieAge: 20 },
  { id: 205, firstName: 'Katarzyna', lastName: 'Kowal',     nationality: 'polish',        gender: 'female', rookieAge: 21 },
  { id: 206, firstName: 'Hiroki',    lastName: 'Nakamura',  nationality: 'japanese',      gender: 'male',   rookieAge: 22 },
  { id: 207, firstName: 'Birte',     lastName: 'Holm',      nationality: 'danish',        gender: 'female', rookieAge: 20 },
  { id: 208, firstName: 'Oscar',     lastName: 'Herrera',   nationality: 'mexican',       gender: 'male',   rookieAge: 21 },
  { id: 209, firstName: 'Renata',    lastName: 'Almeida',   nationality: 'brazilian',     gender: 'female', rookieAge: 22 },
  { id: 210, firstName: 'Tobias',    lastName: 'Jung',      nationality: 'german',        gender: 'male',   rookieAge: 20 },
  { id: 211, firstName: 'Aoi',       lastName: 'Nishida',   nationality: 'japanese',      gender: 'female', rookieAge: 21 },
  { id: 212, firstName: 'Charles',   lastName: 'Orr',       nationality: 'british',       gender: 'male',   rookieAge: 22 },
  { id: 213, firstName: 'Ama',       lastName: 'Boateng',   nationality: 'ghanaian',      gender: 'female', rookieAge: 20 },
  { id: 214, firstName: 'Lance',     lastName: 'Drury',     nationality: 'american',      gender: 'male',   rookieAge: 21 },
  { id: 215, firstName: 'Ursula',    lastName: 'Brandt',    nationality: 'german',        gender: 'female', rookieAge: 22 },
  { id: 216, firstName: 'Andres',    lastName: 'Molina',    nationality: 'colombian',     gender: 'male',   rookieAge: 20 },
  { id: 217, firstName: 'Silvia',    lastName: 'Riva',      nationality: 'italian',       gender: 'female', rookieAge: 21 },
  { id: 218, firstName: 'Mats',      lastName: 'Lindqvist', nationality: 'swedish',       gender: 'male',   rookieAge: 22 },
  { id: 219, firstName: 'Pooja',     lastName: 'Iyer',      nationality: 'indian',        gender: 'female', rookieAge: 20 },
  { id: 220, firstName: 'Wayne',     lastName: 'Frost',     nationality: 'australian',    gender: 'male',   rookieAge: 21 },
  { id: 221, firstName: 'Adriana',   lastName: 'Souza',     nationality: 'brazilian',     gender: 'female', rookieAge: 22 },
  { id: 222, firstName: 'Stig',      lastName: 'Andersen',  nationality: 'danish',        gender: 'male',   rookieAge: 20 },
  { id: 223, firstName: 'Monica',    lastName: 'Leone',     nationality: 'italian',       gender: 'female', rookieAge: 21 },
  { id: 224, firstName: 'Nikhil',    lastName: 'Bhat',      nationality: 'indian',        gender: 'male',   rookieAge: 22 },
  { id: 225, firstName: 'Elsa',      lastName: 'Lindgren',  nationality: 'swedish',       gender: 'female', rookieAge: 20 },
  { id: 226, firstName: 'Sergio',    lastName: 'Palma',     nationality: 'italian',       gender: 'male',   rookieAge: 21 },
  { id: 227, firstName: 'Taylor',    lastName: 'Reed',      nationality: 'american',      gender: 'female', rookieAge: 22 },
  { id: 228, firstName: 'Arne',      lastName: 'Bakke',     nationality: 'norwegian',     gender: 'male',   rookieAge: 20 },
  { id: 229, firstName: 'Brigitte',  lastName: 'Huber',     nationality: 'austrian',      gender: 'female', rookieAge: 21 },
  { id: 230, firstName: 'Alberto',   lastName: 'Cruz',      nationality: 'mexican',       gender: 'male',   rookieAge: 22 },
  { id: 231, firstName: 'Abena',     lastName: 'Ofori',     nationality: 'ghanaian',      gender: 'female', rookieAge: 20 },
  { id: 232, firstName: 'Jack',      lastName: 'Gould',     nationality: 'new zealander', gender: 'male',   rookieAge: 21 },
  { id: 233, firstName: 'Nadia',     lastName: 'Moussa',    nationality: 'moroccan',      gender: 'female', rookieAge: 22 },
  { id: 234, firstName: 'Ville',     lastName: 'Heino',     nationality: 'finnish',       gender: 'male',   rookieAge: 20 },
  { id: 235, firstName: 'Joanna',    lastName: 'Mucha',     nationality: 'polish',        gender: 'female', rookieAge: 21 },
  { id: 236, firstName: 'Pedro',     lastName: 'Sousa',     nationality: 'portuguese',    gender: 'male',   rookieAge: 22 },
  { id: 237, firstName: 'Sakura',    lastName: 'Goto',      nationality: 'japanese',      gender: 'female', rookieAge: 20 },
  { id: 238, firstName: 'Marc',      lastName: 'Jansen',    nationality: 'belgian',       gender: 'male',   rookieAge: 21 },
  { id: 239, firstName: 'Chidi',     lastName: 'Okeke',     nationality: 'nigerian',      gender: 'male',   rookieAge: 22 },
  { id: 240, firstName: 'Helga',     lastName: 'Aas',       nationality: 'norwegian',     gender: 'female', rookieAge: 20 },
  { id: 241, firstName: 'Claudio',   lastName: 'Vargas',    nationality: 'argentinian',   gender: 'male',   rookieAge: 21 },
  { id: 242, firstName: 'Neha',      lastName: 'Joshi',     nationality: 'indian',        gender: 'female', rookieAge: 22 },
  { id: 243, firstName: 'Philip',    lastName: 'Grant',     nationality: 'british',       gender: 'male',   rookieAge: 20 },
  { id: 244, firstName: 'Viviane',   lastName: 'Lopes',     nationality: 'brazilian',     gender: 'female', rookieAge: 21 },
  { id: 245, firstName: 'Gunnar',    lastName: 'Vik',       nationality: 'norwegian',     gender: 'male',   rookieAge: 22 },
  { id: 246, firstName: 'Rosa',      lastName: 'Medina',    nationality: 'spanish',       gender: 'female', rookieAge: 20 },
  { id: 247, firstName: 'Shota',     lastName: 'Miyamoto',  nationality: 'japanese',      gender: 'male',   rookieAge: 21 },

  // add new entries below this line — always append, never reorder
  // new rookie-pool entries need rookieAge (not birthYear)

];
