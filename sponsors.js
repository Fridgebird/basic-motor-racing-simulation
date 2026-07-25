// sponsors.js — Title sponsor assignments per team, from 1966 onwards.
//
// HOW TO EDIT:
//   Each team entry is an array of { fromYear, sponsor } objects, sorted
//   earliest first. The active sponsor for a given display year is the most
//   recent entry whose fromYear is ≤ that year.
//
//   To change a sponsor: edit the `sponsor` string.
//   To add a new sponsor period: append { fromYear: YYYY, sponsor: '...' }.
//   To remove a sponsor entirely: delete all entries for that team,
//     or set the array to [].
//
//   Sponsors display as "<Sponsor> <Team Name>" on the team profile page.
//   No other page is affected.
//
//   Teams had no title sponsors before 1966 — entries before that year
//   are ignored by getTitleSponsor().

export const TITLE_SPONSORS = {

  hartwell: [
    { fromYear: 1966, sponsor: 'Apex Petroleum' },
    { fromYear: 1976, sponsor: 'Clearway Oils' },
    { fromYear: 1991, sponsor: 'Beaumont Finance' },
    { fromYear: 2001, sponsor: 'Meridian Telecom' },
  ],

  frd: [
    { fromYear: 1966, sponsor: 'Barnstable Tyres' },
    { fromYear: 1981, sponsor: 'Southern Cross Fuels' },
    { fromYear: 1996, sponsor: 'Pacific Instruments' },
    { fromYear: 2006, sponsor: 'Kestrel Systems' },
  ],

  ferrosso: [
    { fromYear: 1966, sponsor: 'Agip Sportivo' },
    { fromYear: 1976, sponsor: 'Tricolore' },
    { fromYear: 1991, sponsor: 'Medici Financial' },
    { fromYear: 2006, sponsor: 'Veloce Mobile' },
  ],

  vettura: [
    { fromYear: 1966, sponsor: 'Banca Centrale' },
    { fromYear: 1981, sponsor: 'Mirabile' },
    { fromYear: 1996, sponsor: 'Azzurra' },
    { fromYear: 2006, sponsor: 'Palazzo Media' },
  ],

  kaiserwerke: [
    { fromYear: 1966, sponsor: 'DeutscheGas' },
    { fromYear: 1976, sponsor: 'Rheingold' },
    { fromYear: 1991, sponsor: 'Kontinental Bank' },
    { fromYear: 2001, sponsor: 'Nordlicht Energy' },
  ],

  mistral: [
    { fromYear: 1966, sponsor: 'Triomphe', url: 'https://example.com/' },
    { fromYear: 1981, sponsor: 'Lumière' },
    { fromYear: 1996, sponsor: 'Châtelain Finance' },
    { fromYear: 2006, sponsor: 'Vent Nouveau' },
  ],

  alpenring: [
    { fromYear: 1966, sponsor: 'Helvetica' },
    { fromYear: 1976, sponsor: 'Gipfel Watches' },
    { fromYear: 1991, sponsor: 'Edelweiss Bank' },
    { fromYear: 2001, sponsor: 'Kristall' },
  ],

  deltaBravo: [
    { fromYear: 1966, sponsor: 'Cormorant' },
    { fromYear: 1981, sponsor: 'Tempest' },
    { fromYear: 1996, sponsor: 'Halo Systems' },
    { fromYear: 2006, sponsor: 'Vector' },
  ],

  eaglecrest: [
    { fromYear: 1966, sponsor: 'TipTop' },
    { fromYear: 1976, sponsor: 'Condor Fuels' },
    { fromYear: 1991, sponsor: 'Whitmore & Sons' },
    { fromYear: 2001, sponsor: 'Sterling Logistics' },
  ],

  sakura: [
    { fromYear: 1966, sponsor: 'Nishida' },
    { fromYear: 1981, sponsor: 'Kenzan' },
    { fromYear: 1996, sponsor: 'Hinode' },
    { fromYear: 2006, sponsor: 'Fujimoto' },
  ],

  santos: [
    { fromYear: 1966, sponsor: 'Ouro Verde' },
    { fromYear: 1976, sponsor: 'Samaúma' },
    { fromYear: 1991, sponsor: 'Atlântico' },
    { fromYear: 2001, sponsor: 'Vento Sul' },
  ],

  oconnell: [
    { fromYear: 1966, sponsor: 'Shannon Petroleum' },
    { fromYear: 1981, sponsor: 'Cloverleaf' },
    { fromYear: 1996, sponsor: 'Tara Finance' },
    { fromYear: 2006, sponsor: 'Emerald' },
  ],

};

/**
 * Returns the active sponsor entry { fromYear, sponsor, url? } for a team in
 * a given display year, or null if no sponsor applies (before 1966, or team
 * not listed). The url field is optional — omit or set to null/undefined for
 * sponsors without a web presence.
 * @param {string} teamId
 * @param {number} displayYear  e.g. 1971
 * @returns {{ fromYear: number, sponsor: string, url?: string }|null}
 */
export function getTitleSponsorEntry(teamId, displayYear) {
  if (displayYear < 1966) return null;
  const entries = TITLE_SPONSORS[teamId];
  if (!entries || entries.length === 0) return null;
  let active = null;
  for (const e of entries) {
    if (e.fromYear <= displayYear) active = e;
    else break;
  }
  return active;
}
