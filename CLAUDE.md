# Motor Racing Simulation — Project Brief for Claude Code

## What This Is
A casual motor racing simulation game with a Sinclair Spectrum / 8-bit aesthetic.
The viewer watches a full race unfold via a live timing sheet. No player involvement in v1.
Built in vanilla HTML + JavaScript. No frameworks. No build tools.

## Tech Stack
- **Platform:** Single HTML file to start, splitting into JS modules as complexity grows
- **Rendering:** HTML Canvas for Spectrum-style display
- **Hosting:** GitHub Pages
- **Style:** Sinclair Spectrum aesthetic — monospace/pixel fonts, limited colour palette (black, white, cyan, yellow, red, green, magenta), chunky text

---

## Architecture

### 1. Data Layer (`data.js`)
Static definitions loaded at game start:
- 12 teams, each with 2 drivers
- Each team uses one of 4 engine manufacturers and one of 2 tyre manufacturers
- Driver attributes: skill (0–100), aggression, consistency
- Engine attributes: power (affects straight-line speed), reliability (failure chance per lap)
- Tyre manufacturer attributes: grip (peak), wear rate, available compounds (soft/medium/hard)
- Chassis attributes: aero efficiency, corner vs straight bias, reliability
- Circuit definition: total laps (70), corner ratio, straight ratio, track abrasiveness

### 2. Simulation Engine (`simulation.js`)
Core race logic — runs **sector by sector** (3 sectors per lap, so 210 ticks for a 70-lap race):
- **Sector time calculator:** each lap time is split into 3 sector times, weighted by circuit characteristics
  - Sector 1: e.g. technical corners — favours chassis aero, driver skill
  - Sector 2: e.g. long straight — favours engine power
  - Sector 3: e.g. mixed — balanced
- **Lap time:** sum of 3 sector times; cumulative race time drives leaderboard gaps
- **Tyre wear model:** degrades grip per sector; each sector has its own wear rate multiplier (e.g. high-load corner sectors wear tyres faster than straights); overall rate also affected by compound, track abrasiveness, and driving style
- **Fuel burn model:** reduces fuel load each lap; affects car weight and therefore sector times
- **Pit stop AI:** each team calculates optimal stop windows; pit stops occur between sectors so cars visibly drop back in real time; stop duration varies by team pit crew rating
- **Mechanical failure:** random chance per lap based on engine/chassis reliability; see Simulation Formulas section for full model
- **Driver error / crash:** random chance per sector based on consistency stat; see Simulation Formulas section for full model
- **Overtaking model (later):** dirty air effect when following closely in a sector; affects sector time, tyre wear, fuel burn

### 3. Race State Manager (`state.js`)
Tracks live race data:
- Current lap number and current sector (1, 2, or 3)
- Per-car: position, gap to leader, current sector, tyre age, tyre compound, fuel load, stops made, last lap time, all sector times, cumulative race time, status (racing/pitted/retired)
- Gaps calculated from cumulative race time — naturally handles cars being at different points on the track

### 4. Renderer (`renderer.js`)
Draws the Spectrum-style timing display onto Canvas:
- Live leaderboard, updating each lap
- Columns: Position, Driver, Team, Last Lap, Gap, Tyre Age, Stops, Status
- Colour coding: position changes (green/red), pit stop laps (yellow), retirements (grey)
- Spectrum palette only — no gradients, no anti-aliasing

---

## V1 Feature Scope (build this first)
- [x] Single circuit, 70 laps
- [x] 24 cars (12 teams × 2 drivers), AI strategies only
- [x] Live updating timing sheet leaderboard
- [x] Tyre wear and fuel load simulation
- [x] AI pit stop decisions per team
- [x] Mechanical failures / retirements
- [x] Spectrum aesthetic renderer
- [ ] ~~Player involvement~~ (later)
- [ ] ~~Overtaking model~~ (later)
- [ ] ~~Practice / qualifying~~ (later)
- [ ] ~~Multiple circuits~~ (later)
- [ ] ~~Season / championship mode~~ (later)

---

## Backlog (do not build yet)
- ~~Overtaking model with dirty air and proximity effects~~ ✓ Done
- ~~Cap degraded mechanical failure severity~~ ✓ Done
- ~~**Sector rewind / replay in the renderer**~~ ✓ Done — ◀/▶ buttons enabled in pause mode; each sector tick is snapshotted after tick(); stepping back/forward updates timing sheet, spacing strip, and commentary. Forward step plays the FLIP row-swap animation. Stepping back renders neutrally (no misleading colours).
- ~~**Gap vs Interval toggle**~~ ✓ Done
- ~~**Visual car spacing strip**~~ ✓ Done — narrow canvas panel between timing sheet and commentary; dots labelled "12 SEN" style; zoom (+/−) and scroll; min spacing prevents overlap, zoom in to separate battles.
- ~~**Position swap animation**~~ ✓ Done — FLIP technique animates rows on the timing sheet; strip dot animation deferred.
- ~~**Event commentary pane**~~ ✓ Done
- ~~**Commentary focus filter**~~ ✓ Done — ALL / TOP 10 / TOP 5 button in commentary header; rebuilds feed on change.
- ~~**Commentary on silent passes**~~ ✓ Done — detected in tick(), logged as silent_pass events, displayed with pace-based verbs ("powers past", "glides past" etc.). Wheel-to-wheel overtake verbs now circuit-aware (derived from sector powerWeight vs aeroWeight).
- ~~**Simulation sanity checking**~~ ✓ Done — analysis.html runs 5 isolated parameter tests: setup spread, tyre compound factors (both manufacturers), wear rates, fuel load effect, reliability rates. All values verified as sensible. Model confirmed: setup costs up to ~2 mins at worst, hard tyre ~1.8s/lap slower than soft on fresh rubber, full tank ~2.25s/lap penalty, reliability creates meaningful but not excessive retirements. Tyre manufacturer nuance (Pirelli wears faster, not less grippy on peak) validated.
- ~~**Smarter pit stop strategy**~~ ✓ Done — Replaced pre-planned fixed strategies with a fully reactive per-stop AI. Starting compound chosen probabilistically by driver aggression (Mansell ~66% soft, conservative drivers lean hard). At each stop: estimates stint life for all 3 compounds, picks softest-viable compound (softest that reaches flag); if none can reach, uses aggression distribution across all three. Fuel loaded for estimated stint + per-team safety margin. Per-team wearTrigger (75–85%), fuelTrigger (5–9 kg), fuelMarginLaps, and tyreLifeModel ('basic'/'fuelCorrected') assigned in data.js. All AI estimates logged in race log for inspection. Pit lane timing: ~18s traversal + max(tyre change, fuelling); fuelRigRate 0.12s/kg so full refuel ~12s stationary. Result: 59% 2-stop / 39% 3-stop / 2% 4-stop across 8 races; all 3 compounds in active use.
- ~~**Tyre history in tyre column**~~ ✓ Done — column now shows full compound sequence e.g. "SHM (7)" with previous compounds greyed (45% opacity) and current compound bold. tyreHistory[] added to car state; populated on strategy_init and each pit stop; snapshot-copied for replay correctness. Pit commentary also now correctly shows estimated stint length on pit entries.
- ~~**Lap chart panel**~~ ✓ Done — canvas below timing sheet; one line per driver coloured by team; second driver dashed; pit stop dots (red=soft, yellow=medium, white=hard); start compound dot; "11 PRO" labels at both ends; top x-axis with lap tick every 10 laps; rewinds correctly with sector replay.
- **UI improvements mini-backlog** (tackle in order, desktop-first but plan for mobile throughout):
  1. ~~**Team+engine concat in team column**~~ ✓ Done — "MCLAREN-HONDA" style; Ferrari deduped to "FERRARI"; column widened to 130px.
  2. ~~**Tyre manufacturer column**~~ ✓ Done — single letter "G"/"P" in "TYRE" column after team; compound history column renamed "COMP".
  3. ~~**Frozen columns + horizontal scroll**~~ ✓ Done — POS, #, DRIVER sticky with `position: sticky`; table wrapped in `overflow-x: auto` div; driver column has separator border + shadow.
  4. ~~**Team colours**~~ ✓ Done — team colour dot (3×20px strip) next to each driver name; colours defined in data.js and used in lap chart lines.
  5. ~~**Grand Prix name in header**~~ ✓ Done — info bar now shows "S1 R1 · Spanish Grand Prix — Race" derived from championship context; circuits have `country` and `eventName` fields.
  6. **Freeze controls at top** — hold until screen layout is designed (multi-screen navigation will reshape the header area entirely).
  7. **Hide wear/fuel columns** — user toggle to hide the WEAR and FUEL columns, to increase the mystery of what teams are doing; choice saved in localStorage.
- ~~**Mobile display — portrait layout**~~ ✓ Done — portrait media query (`max-width:600px, orientation:portrait`): driver sticky disabled (prevented overlap), columns tightened to 306px total (fits 320px phones), driver label shortened to 3-letter surname, last-lap/gap show tenths only, wear/fuel/health columns collapse to 18px icon-only with tyre-circle, fuel-bar, and ❗ icons; icons use `--icon-fg` CSS custom property so `tr.gained/lost` colour changes don't bleed into them; health column header hidden; driver tracker narrowed to 60px, default zoom 30s, zoom label removed.
- Race log viewer / replay tool — filter by car, lap range, event type; inspect factor values and rolls to diagnose model behaviour
- ~~**Qualifying session**~~ ✓ Done — `qualifying.html`: sequential single-lap format, all on softs, random draw order (seeded RNG shuffle), track evolution bonus (1.5% grip gain for last car), sector-by-sector animation with onSector callback, crash = NO TIME / spin = time penalty. Results saved to localStorage for parc ferme handoff to race.
- ~~**Multiple circuits**~~ ✓ Done — 4 real defunct venues in `CIRCUITS` map: Montjuïc (Spain, balanced), Reims-Gueux (France, power), Ain-Diab (Morocco, street), Zeltweg Aerodrome (Austria, tyre-destroyer). `CIRCUIT` alias kept for backwards compat.
- ~~**Season schedule / calendar**~~ ✓ Done — `SEASON_SCHEDULE` in data.js (16 entries: 8 rounds × qualifying+race). `championship.js`: `getCurrentEvent()` resolves today's date to season/round; `getSeedForEvent()` for deterministic seeds; dev mode via `smr_dev_offset` in localStorage. **Qualifying and race share the same day** — `getEventForRound` uses `numRounds*(season-1)+(round-1)` as dayOffset; `race.html` silently pre-runs qualifying if not cached so the grid is always deterministic.
- ~~**Championship points and standings**~~ ✓ Done — `championship.js`: `addRaceResult()` calculates points (25-18-15-12-10-8-6-4-2-1) and saves to localStorage; `getStandings()` returns sorted driver/constructor tables. `standings.html` renders both.
- ~~**Multi-page navigation**~~ ✓ Done — `qualifying.html`, `standings.html`, and `index.html` (race) linked via topbar nav. All pages share same JS modules.
- **Dev mode access control** — currently `?dev=1` URL param activates dev mode (toggleable, persists in localStorage). Before deploying publicly, decide whether this is acceptable or whether it should be gated behind a secret param value (e.g. `?dev=xk7q2`) to prevent casual visitors from watching future races early. Current stance: don't worry about it — no real harm, but revisit before launch.
- ~~**Per-team fuel tank capacity**~~ ✓ Done — `fuelCapacity` moved from circuit to team. Each team has a distinct tank size (range ~85–140 kg); `car.fuelCapacity` set in `initRace()`; all 8 simulation.js references updated to use `car.fuelCapacity` instead of `circuit.fuelCapacity`.
- ~~**Tyre wear scaled by circuit length**~~ ✓ Done — `wearDelta` (and the AI estimators `estimateStintLaps` / `crossoverPitBenefits`) now multiply by `circuit.lengthKm / 5.0`. Fleet average is 5.0km; Lobethal (3.31km) = ×0.66, Bremgarten (7.28km) = ×1.46. Produces real strategic variety across the calendar: short circuits tend to 0–1 stop, longer ones push toward 2–3 stops.
- ~~**Qualifying page UX cleanup**~~ ✓ Done — Watch-quali screen now shows only START QUALIFYING on arrival (cached results no longer auto-render or show replay/rerun buttons). Result is still accessible via the calendar's Quali Result button. After watching, only GO TO RACE is shown.
- ~~**Tyre compound pip visibility**~~ ✓ Done — Previous-stint pips now use hollow rings (outline in compound colour) instead of filled dots at 35% opacity. Hard compound changed from #888888 to #ffffff (pure white) so red/yellow/white rings are clearly distinct.
- ~~**Rookie driver pool expansion + dynamic ages**~~ ✓ Done — Added 24 rookie drivers (IDs 24–47) covering diverse nationalities and equal gender split. Replaced fixed `birthYear` on rookies with `rookieAge` (20/21/22); `worldstate.js` computes `birthYear = displayYear(entrySeasonSeason) - rookieAge` when a vacancy is filled. Pool is now a queue: rookies enter in ID order whenever a slot opens, always at the right age, with no eligibility window that can expire. Roster entries carry `birthYear` throughout so career arc and retirement maths stay correct. Performance-firing threshold also lowered (range 40–60 instead of 50–80) to prevent mass-firing of developing drivers.
- **Lap time trend across a stint — review design intent** — currently lap times get slower as a stint progresses (tyres wear → less grip → slower). In real F1 the opposite is often true: fuel burns off faster than tyres degrade, so cars get quicker lap by lap until the tyres finally go off. Decide whether to model this — it would require the fuel factor to outweigh the tyre factor in the early-to-mid stint, reversing the current balance. Viewers may expect the "getting quicker" narrative. Worth a deliberate decision before changing anything.
- ~~**Commentary colours — CRASH and OUT should be red not purple**~~ ✓ Done — `tag-crash` and `tag-out` now `#ff4444`. Purple reserved for fastest-lap.
- ~~**Pre-race screen — show lap count**~~ ✓ Done — renderer pre-race branch sets `lapSector = \`${currentCircuit.totalLaps} LAPS\`` instead of empty string.
- ~~**Multi-stop pit strategy planner**~~ ✓ Done — `crossoverPitBenefits()` now has a second branch for multi-stop territory (when no compound can reach the flag). It asks: is stopping NOW for fresh tyres worth the extra pit, given the pace gained over the laps until the natural wear trigger fires anyway? Compares average tyre factor on worn current compound vs fresh soft using midpoint approximation. Aggression-based threshold: aggressive drivers (agg≈1) stop early if they can recoup ~30% of pit cost; conservative (agg≈0) need ~80%. Guards: no trigger if < 10 laps remain or wear trigger is < 5 laps away. Produces undercut behaviour for aggressive soft starters; hard starters unaffected (they have a viable compound and go through the one-stop branch). Starting compound choice is still aggression-weighted random — strategic starting compound selection is a separate future item.
- **Botched pit stop** — probability-based (linked to pit crew rating); can add up to ~30 extra seconds on top of the normal stop time. Adds jeopardy and unpredictability, especially for lower-ranked teams.
- **Flat spot from spin** — when a driver error produces a spin/lock-up, there is a chance of a flat spot on the tyre. Flat spot adds a percentage penalty to effective tyre wear and may auto-trigger a pit stop if the wear is severe enough.
- **Rain and wet-weather tyres** — rain can arrive mid-race or at the start; requires a separate wet compound with different grip/wear characteristics; teams must decide when to switch. Major feature, plan carefully.
- **Fuel obfuscation** — in the 1980s, fuel gauges were imprecise. Each team has a per-season "fuel sensor accuracy" rating. The displayed fuel level and the AI pit trigger are based on the team's estimated fuel reading (noisy); real fuel level is used only for actual pace calculation and detecting true fuel-out. Creates drama when a team miscalculates and pits unnecessarily (or worse, runs dry thinking they have more than they do).
- **Era car images** — in the multi-season world, every 5-year regulation era uses a different vector-art template for car silhouettes (progressively more modern from era 1 onward). Used on team/driver profile screens. Templates are SVG, recoloured per team livery.
- Ambient temperature and weather effects (separate from rain — affects tyre behaviour, engine cooling etc.)
- ~~**Multi-season world architecture — Phase 1 foundation**~~ ✓ Done — Full architecture implemented: `drivers.js` (append-only pool, 24 S1 placeholder drivers); `worldstate.js` (era detection, seeded stat functions, career arc, engine/tyre contracting, driver lifecycle, car numbers, season snapshot); `data.js` rewritten with 12 new teams + 14 engine manufacturers + 3 tyre manufacturers + 20 circuits + 40-entry SEASON_SCHEDULE (20 rounds × qualifying+race); `state.js` extended — `initRace()` accepts optional `snapshot` 4th arg, falls back to static data if null; `simulation.js` — all `circuit.fuelCapacity` refs replaced with `car.fuelCapacity`; `race.html` and `qualifying.html` call `getSeasonSnapshot()` and pass snapshot to `initRace()`; `championship.js`/`results.html` — `ensurePastResultsCached` receives `getSeasonSnapshot` via `simFns` and passes snapshot to every `initRace()` call. Season 1 = year 1930; champion's team runs #1/#2; era reset every 5 seasons (chassis), 3 (engine), 2 (tyre).
- ~~**Branding and visual restyle**~~ ✓ Done — full rebrand applied to index.html. Dark theme with CSS design tokens (--bg, --mid, --lo, --dim, --accent). Square/Squareo fonts. Topbar with "Simple Motor Racing" brand, live pill, lap/sector counter in info bar. Team colour dot + stacked driver/team-engine name. Pip dots for tyre compounds (red/yellow/grey). Fastest lap tracked and shown in purple. Full-row position-swap flash animation. analysis.html left in original Spectrum style.
- ~~**Lap record removed from circuit page**~~ ✓ Done — was a non-functional stub; lap times are not stored in race results so there was no data source. Removed from `circuit.html`.
- ~~**Fictional 20-circuit calendar**~~ ✓ Done — all circuits replaced in `data.js` with 20 fictional venues (hawkesbury → bushveld) drawn from `circuits.md`. Each circuit has `location`, `type`, `character`, `profile` fields in addition to simulation stats. `SEASON_SCHEDULE` updated to 40 entries. `CIRCUIT` alias points to hawkesbury.
- ~~**Circuit profile page redesign**~~ ✓ Done — `circuit.html` redesigned: event name with 2:1 country flag (72×36px fixed, object-fit cover), circuit name, city·country location, type·character metadata, profile paragraph in system sans-serif for legibility. Round ◀/▶ navigation buttons at top. NAT_CODE map covers all 20 circuit countries.
- ~~**Season summaries for profile pages**~~ ✓ Done — `championship.js` now writes a compact `smr_season_summary_N` to localStorage after `ensurePastResultsCached` finishes each season. Each summary contains per-driver stats keyed by `driverId` (wins, podiums, points, raceStarts, retirements, champion flag) and per-constructor stats. `getCareerStats(driverId)` and `getConstructorHistory(teamId)` scan all cached summaries. Profile pages will trigger full-history computation on first visit — fast (~1–3s cold, instant on repeat visits). `resetWorld()` now also clears summaries.
- ~~**Driver and team profile pages**~~ ✓ Done — `driver.html`: portrait (CSS sprite sheet, see below), name, nationality, age/birth year, career totals (seasons, races, wins, podiums, titles, points), season-by-season history table with championship position and ★ for champion. `team.html`: per-team 16:9 car image (`car_sprites_[era]_[imageId].png`) beside a square team logo (`logo_sprites_[era]_[imageId].png`) in a 25:9 flex row; both update when navigating seasons; onerror placeholder fallback for missing images. Full name, nationality, career totals, season detail pane (chassis ID, engine, tyre, driver chips with portrait), prev/next season pane nav, and season history table. Each team has a distinct chassis naming formula in `getChassisId()`. Driver names in timing sheet are now clickable links to `driver.html`.
- ~~**Driver portrait sprite sheets**~~ ✓ Done — portraits stored as 4×4 sheets at 256px per cell (`driver_sprites_16x16_1.png` covers indices 0–15, sheet 2 covers 16–31). `driver.html` uses CSS `background-image` / `background-position` sprite technique; indices 32+ fall back to coloured initials. All 32 drivers in `drivers.js` (IDs 0–31) named from actual portrait appearances. Team renamed Scuderia → **Officine Ferrosso**. Profile page fonts switched to Square.ttf (filled) for all weights.
- ~~**Clickable driver and team links throughout**~~ ✓ Done — driver names are clickable in: live timing sheet (`race.html` via renderer), race result table, qualifying result table, championship standings sidebar (all in `results.html`). Team names are clickable in: race result, qualifying result, constructor standings, and champion banner in `results.html`. `driverId` added to qualifying result entries so links work on new results; `getStandings`/`getStandingsThroughRound` now include `driverId` on driver objects.
- ~~**Future-race access gating**~~ ✓ Done — `circuit.html`: QUALIFYING → and RACE → buttons show as `.footer-btn.locked` (dimmed, `pointer-events:none`) for rounds whose `dayOffset > todayOffset`; imports `getTodayDayOffset` and uses `getEventForRound` to check. `qualifying.html`: `btnStart` disabled with tooltip if `event.dayOffset > getTodayDayOffset()`.
- ~~**Qualifying watch-screen polish**~~ ✓ Done — ON TRACK panel now shows a 48×48 driver portrait (CSS sprite, same technique as driver profile page; initials fallback for indices ≥32). Team label in both ON TRACK and PROVISIONAL CLASSIFICATION now uses `shortName - engineName` format (e.g. `HARTWELL - LANCHESTER`); works teams that share name with their engine show only the team name (e.g. `FERROSSO`). Labels built synchronously from snapshot instead of a lazy data.js import.
- ~~**Circuit profile paragraph font**~~ ✓ Done — `.circuit-profile` uses IBM Plex Sans variable font (`IBMPlexSans-VariableFont_wdth,wght.ttf`, weight 300) with system sans-serif fallback.
- ~~**Driver stats fully seeded**~~ ✓ Done — `baseSkill`, `baseConsistency`, `baseAggression` removed from all entries in `drivers.js`; `worldstate.js` now derives `peakSkill` (55–95), `peakConsistency` (50–95), `peakAggression` (35–85) via `seededFloat(worldSeed + SALT_DRIVER, driverId, 101/102/103)`. `startTeam` also removed from all rookie entries (was dead data — rookies always fill the next vacant slot regardless). New driver entries only need: `id`, `firstName`, `lastName`, `nationality`, `gender`, `portraitIndex`, plus `birthYear`+`startTeam` (S1) or `rookieAge` (rookies).
- ~~**World stat development rate tuning**~~ ✓ Done — Chassis dev rate raised to 50 (×fundingLevel/100 per season); engine dev rate raised to 40; tyre grip dev rate raised to 40; tyre wear improvement 0.0010. Tyre era extended from 2 to 5 seasons (same as chassis era). Tyre maxGrip era-start range widened to 70–94. Engine and tyre contracts both lock in for 3 seasons. Santos and O'Connell fundingLevel raised to 40. Analysis tool `export_stats.mjs` added to verify 15-season stat progression (run with `node export_stats.mjs`).
- ~~**Replace Roosevelt Island with Douglas Circuit**~~ ✓ Done — Round 17 (American Grand Prix) replaced: Roosevelt Island street circuit (New York) swapped for Douglas Circuit (Roseburg, Oregon), a purpose-built track through old-growth Douglas fir forest. trackAbrasiveness 0.60 — highest on the calendar, above Rovaniemi's 0.50. 5.2 km, 62 laps; tyre wear is the defining strategic story. circuits.md and data.js updated.
- ~~**Season numbers replaced with display years across all UI**~~ ✓ Done — Calendar header/nav, qualifying info bar, results info bar, standings header/nav and season pane nav, team season pane label: all now show the year (e.g. "1941") instead of season number ("S11"). Season/S# columns removed from history tables on driver.html and team.html.
- ~~**Qualifying and race result navigation buttons**~~ ✓ Done — "QUALIFYING RESULT →" button added to qualifying watch screen (end of session); "GO TO RACE →" button added to qualifying result page (results.html); "RACE RESULT →" button added to race screen (end of race, hidden on replay/reset).
- ~~**Qualifying watch screen — position panel**~~ ✓ Done — Position shown in a dedicated right-hand panel (64px wide) with 34px number, separate from the lap time/gap box. Resets per driver, white for P1.
- ~~**Loading indicator visibility**~~ ✓ Done — "COMPUTING HISTORY…" on drivers.html and team.html raised from invisible var(--dim) to var(--lo) (matching topbar nav links) with a 1.6s pulse animation.
- ~~**Standings page team labels**~~ ✓ Done — Drivers table: new TEAM column showing SHORTNAME-ENGINE (works teams deduplicated, e.g. "SAKURA" not "SAKURA-SAKURA"), with colour dot and team profile link. Constructors table: team name column updated to same SHORTNAME-ENGINE format.
- ~~**Race page tab switcher**~~ ✓ Done — Sticky frozen tab bar (GRID | RACE | LAP CHART | COMMENTARY | STANDINGS) in the race page header; driver tracker strip always visible on right; controls always visible. GRID shows qualifying order with car number, team colour dot, SHORT-ENGINE team label, interval to pole. STANDINGS shows championship through round N-1 (pre-race context) with car number column and team colour dot. STOPS column removed (redundant with comp/age). `runQualifyingSession` (silent path) now includes `driverId` and `carNumber` in results.
- ~~**Home page and calendar split**~~ ✓ Done — `index.html` rewritten as a home page showing today's race (hero, circuit stats, action buttons with spoiler confirm); calendar moved to `calendar.html`; HOME nav link added to all pages.
- ~~**Live commentary bar**~~ ✓ Done — Always-visible single-line strip in the sticky header mirrors the latest commentary entry via MutationObserver; shows colour-coded tags and team colour mark; visible on all tabs.
- ~~**Commentary team colour markers**~~ ✓ Done — ■ (U+25A0 filled square, 8px) before each driver name in the commentary feed, coloured by team. PASS entries show a second ■ before the passed driver's name in their team colour.
- ~~**Home page race subtitle**~~ ✓ Done — "World Championship · Round X of Y" subtitle added below the race title on `index.html`.
- ~~**Qualifying page mobile layout**~~ ✓ Done — `flex-direction: column` media query at 640px; provisional classification stacks below on-track panel instead of off-screen to the right. Speed selector and start/pause/result buttons moved to top of on-track panel, above the ON TRACK heading.
- ~~**Qualifying leaderboard update delay**~~ ✓ Done — removed the `sectorPause() × 2` delay between lap result appearing and provisional classification refreshing; classification now updates immediately when position is shown.
- ~~**Spoiler-free standings / driver / team pages**~~ ✓ Done — standings.html, drivers.html, driver.html, and team.html all cap data at the last completed race before today. `getLastCompletedRace()` and `formatAsOfLabel()` added to `championship.js`; `ensurePastResultsCached` changed to skip today's race (`>=` instead of `>`), writes season summaries only for complete seasons, and actively deletes stale current-season summaries. All four pages show "AS OF [year] · ROUND [N] · [event name]" label.
- ~~**Tyre compound rebalance**~~ ✓ Done — Two-pass fix. Pass 1: hard `gripModifier` -30 → -8 (from 2.4% to ~1% fresh pace deficit); medium `wearMultiplier` 1.00 → 0.85 (more durable). Pass 2: hard `gripModifier` -8 → -4 (~0.5s/lap fresh deficit, below the ~0.67s/lap breakeven where hard strategy wins on a long circuit); `chooseNextCompound` in simulation.js updated — when medium is softest viable, conservative drivers now have up to 35% probability of choosing hard instead of always rejecting it. Design intent: hard is very slightly the optimal dry strategy, creating a real tradeoff against future rain-tyre risk. Fuel overcounting fix: `initStrategies` caps the stint estimate at `currentCircuit.totalLaps` before computing initial fuel load, preventing hard starters from filling to tank capacity for a race they would never drive that far on one set.
- **GitHub Actions canonical results** — a daily cron job pre-computes all past race and qualifying results and pushes a canonical JSON to the repo. Visitors fetch this instead of computing locally. Eliminates the cold-start cost entirely and enables server-side narrative features (season recaps, RSS feed of results, push notifications). Requires a GitHub Actions workflow, a small Node script to run the simulation headlessly, and a fetch-first / compute-fallback strategy on the client. Worth implementing once the game has real users.

---

### Primary Direction: Zero-Player Persistent Global World

This is the main target for the project going forward. Everything built from here should serve this vision.

**Core concept:** A soap opera you watch, not a game you play. One deterministic race per day, globally shared. Every visitor sees the same race. The drama comes from following drivers and teams across seasons — rivalries, retirements, comeback stories, team politics.

**Tone and emphasis:**
- Personality and backstory are as important as stats. Every driver should feel like a character.
- Drivers have distinct styles (aggressive, smooth, consistent, erratic) that play out visibly in races.
- The human story is the product — results tables and lap charts are the medium, not the point.
- Both male and female drivers populate the world in equal measure. This is fictional, so there are no historical constraints.
- All teams, drivers, circuits and names are fictional.

**Season structure:**
- ~16–20 races per season across circuits with distinct characteristics (power track, street circuit, tyre-destroyer, high-altitude etc.)
- One race per day in the global world; locally can be navigated freely
- Points system: top 10 finishers score (25-18-15-12-10-8-6-4-2-1); driver and constructor standings both tracked
- Qualifying session precedes each race to set the grid

**Driver lifecycle:**
- Drivers have an age attribute; age +1 each season
- Retirement probability rises above ~35, near-certain by ~45 (varies by driver "longevity" trait)
- Retiring drivers are replaced by rookies drawn from the fictional name pool
- Driver transfers between teams happen at season end — triggered by performance, contract status, team budget changes; adds soap opera texture
- Career stats accumulated across all seasons: wins, podiums, poles, fastest laps, championships, seasons active
- Driver profile pages showing career arc, personality traits, notable races

**Team lifecycle:**
- Teams persist and evolve; stats (aero, reliability, setupAbility) improve gradually within a regulation era
- Field convergence: 3-lap deficit plausible at era start; backmarkers within 1–2 laps by year 4–5
- Regulation reset every 5 seasons: new baseline stats drawn from wider distribution, recreating divergence
- Convergence rate is a per-team parameter (bigger/richer teams converge faster)
- Tyre manufacturer characteristics drift slowly each season within defined bounds (see tyre drift note in backlog)

**Determinism and replayability:**
- Seed derived from calendar date (`parseInt(YYYYMMDD)`) for the daily global race
- Same date = same race for every visitor worldwide
- Full season history replayable from the initial seed chain

**State persistence:**
- Option A (preferred for launch): Pure client-side replay with localStorage caching of season-end snapshots. Returning visitors compute only today's race (~2ms). Cold-cache worst case at season 50 is ~2s.
- Option B (upgrade path): GitHub Actions daily cron writes canonical results JSON to repo; enables narrative/announcement features.

**Driver name pool:**
- ~500–600 fictional profiles, diverse nationalities and genders in equal proportion
- Pulled sequentially by ID; append-only so existing assignments never change
- Surnames ≤ 10 characters (timing sheet column constraint)
- Nationality drives name style (e.g. Scandinavian, Latin American, East Asian, African, etc.)

**Views and screens needed (to be designed):**
- Live race view (current timing sheet + driver tracker + lap chart + commentary)
- Qualifying view
- Season standings (driver and constructor)
- Race results archive
- Driver profile (career stats, personality, team history, notable moments)
- Team profile (history, current lineup, season trajectory)
- Championship history (past winners, era summaries)

**What is explicitly NOT in scope:**
- Player involvement / strategy control (pure spectator experience)
- Practice sessions (dropped)
- Single-player team management mode (separate future fork if ever)

---

## Session discipline
- **At the end of every session:** commit all changes with a clean descriptive message and push to GitHub. Also update this CLAUDE.md — mark completed backlog items as done, add any new backlog items discussed.

## Coding Conventions
- Vanilla JS only — no npm, no bundlers, no frameworks
- Keep simulation logic completely separate from rendering logic
- All random events must use a seedable RNG so races can be replicated
- Lap time formula should be modular — easy to add/remove variables
- Comment all simulation formulas clearly
- **Every sector tick must write a full entry to the race log** — all factor values, all random rolls, all events; this is essential for debugging, tuning, and replayability

---

## Race Log

Every sector tick appends a structured entry to a `raceLog` array held in memory. The seed value is stored at the top so any race can be replicated exactly.

**Per-tick log entry:**
```js
{
  tick: 47,              // absolute tick number (1–210)
  lap: 16,              // current lap
  sector: 2,            // current sector (1, 2, or 3)
  car: "Senna",         // driver name
  factors: {
    engine:      1.008, // all multipliers applied this sector
    chassis:     1.012,
    tyre:        1.031,
    fuel:        1.021,
    driver:      1.003,
    reliability: 1.0
  },
  rolls: {
    consistencyRoll: 0.94,  // all random rolls made this sector
    failureRoll:     0.87
  },
  wear:            0.34,    // tyre wear at end of sector
  fuel:            61.2,    // fuel load at end of sector
  sectorTime:      28.4,    // computed sector time in seconds
  cumulativeTime:  1423.7,  // total race time at end of sector
  events: []                // any notable events this sector (see below)
}
```

**Event entries (appended to `events` array):**
```js
// Mechanical failure
{ type: "mechanical", severity: "degraded", label: "Turbo", factor: 1.14 }
{ type: "mechanical", severity: "retirement", label: "Engine" }

// Driver error
{ type: "driver_error", severity: "crash" }
{ type: "driver_error", severity: "slow_sector", penalty: 1.18 }

// Pit stop
{ type: "pit", compound: "medium", duration: 26.3, fuelAdded: 40.0 }
```

**Log header (stored once at race start):**
```js
raceLog.seed = 198804;   // RNG seed — store to replay the race identically
raceLog.entries = [];    // sector tick entries appended here
```

**Implementation notes:**
- `raceLog` lives in `state.js` alongside live race state
- No file I/O — in-memory only during the session
- Post-race, the log can be inspected in the browser console for debugging
- A log viewer / replay tool is a backlog item — filter by car, lap range, event type

---

## File Structure (target)
```
index.html        ← entry point, canvas element, game loop
data.js           ← all static team/driver/engine/tyre/circuit data
simulation.js     ← lap time calc, tyre wear, fuel, pit AI, failures
state.js          ← live race state + raceLog array, updated each sector
renderer.js       ← canvas drawing, timing sheet, Spectrum style
```

---

## Known Design Decisions
- Simulation runs sector by sector (3 sectors per lap = 210 ticks for a 70-lap race)
- Each sector is weighted differently per circuit (e.g. sector 2 = long straight favours engine power)
- Cumulative race time is the source of truth for gaps and leaderboard order — naturally handles cars being at different track positions
- Pit stops occur between sectors so position changes are visible in real time
- Mid-race refuelling is allowed
- 4 engine manufacturers, 2 tyre manufacturers
- Tyre compounds: soft, medium, hard (wear rate vs grip tradeoff)
- Pit crew quality varies by team (affects stop time)
- Mechanical failures have three outcomes: degraded performance (persistent lap time penalty for rest of race), or retirement
- Driver errors have three outcomes: crash/retirement, heavy sector penalty (spin, lock-up), or normal
- Tyre wear can reduce effective consistency, increasing crash probability late in a stint
- No player in v1 — pure simulation viewer
- **Late-race double-stop by backmarkers is intentional emergent behaviour** — backmarker teams use `tyreLifeModel: 'basic'` (no fuel correction in wear estimate) and have tight `fuelMarginLaps`. Combined with `shouldPit`'s ±0.03 wear jitter, they occasionally pit late (e.g. lap 65) on softs, then get caught out on the very next lap when jitter pushes the wear trigger down just as the soft degrades. Better-run teams (McLaren, Williams) use `fuelCorrected` estimates and more conservative margins, so this mistake belongs to the midfield and backmarkers. Do not "fix" this — it is soap opera.

---

## Simulation Formulas

### Sector Time
```
sectorTime = baseSectorTime
           × engineFactor(sector)
           × chassisFactor(sector)
           × tyreFactor
           × fuelFactor
           × driverFactor
           × reliabilityFactor
           × setupFactor
```
All factors sit at 1.0 for a perfect car/driver. Higher = slower.

---

### 1. Engine Factor
```
engineFactor = 1.0 + (1 - power/100) × sectorPowerWeight
```
- `power` — 0–100 engine stat
- `sectorPowerWeight` — per-sector constant: S1 corners=0.02, S2 straight=0.06, S3 mixed=0.03
- Honda (95) vs Ford DFZ (52) creates ~2.5% gap on the straight

---

### 2. Chassis Factor
```
chassisFactor = 1.0 + (1 - aero/100) × sectorAeroWeight
```
- `aero` — 0–100 chassis stat
- `sectorAeroWeight` — S1 corners=0.05, S2 straight=0.01, S3 mixed=0.03

---

### 3. Tyre Factor
```
grip = tyreMaxGrip × (1 - wear)
tyreFactor = 1.0 + (1 - grip) × 0.08
```
Wear accumulates each sector:
```
wear += baseWearRate × sectorWearWeight × aggressionMultiplier × trackAbrasiveness
```
- `tyreMaxGrip` — 0–100 tyre manufacturer stat
- `baseWearRate` — per compound: soft > medium > hard
- `sectorWearWeight` — high for corner-heavy sectors
- `aggressionMultiplier` — derived from driver aggression stat
- `trackAbrasiveness` — circuit constant

---

### 4. Fuel Factor
```
fuelFactor = 1.0 + (currentFuel / maxFuel) × 0.03
```
- Full tank = 3% slower than empty
- Fuel burns at fixed rate per sector, slightly modified by engine type

---

### 5. Driver Factor
```
consistencyRoll = random between (consistency/100) and 1.0
effectiveSkill = skill × consistencyRoll
driverFactor = 1.0 + (1 - effectiveSkill/100) × 0.05
```
- `skill` — 0–100 raw pace
- `consistency` — 0–100, narrows the random roll range
- High consistency (e.g. Prost 92) = nearly always hits theoretical best
- Low consistency (e.g. Bailey 45) = wide lap-to-lap variation

**Driver error outcomes — checked per sector:**
```
crashThreshold = (1 - consistency/100) × 0.05
slowThreshold  = (1 - consistency/100) × 0.20

if consistencyRoll < crashThreshold  → retirement (crash)
if consistencyRoll < slowThreshold   → heavy sector penalty (spin/lock-up)
else                                 → normal driverFactor calculation
```
- Worn tyres temporarily reduce effective consistency, raising crash probability late in a stint
- Aggression stat can nudge crashThreshold upward when defending/attacking (later, with overtaking model)

---

### 6. Reliability Factor
Checked once per lap (not per sector) to avoid excessive failures:
```
failureRoll = random 0–1
failureThreshold = 1 - (engineReliability/100 × chassisReliability/100)

if failureRoll < failureThreshold:
    — 70% chance → degraded performance for remainder of race
        reliabilityFactor = 1.08 to 1.20 (severity rolled randomly)
        label assigned: "Gearbox", "Turbo", "Aero damage", "Oil pressure" etc.
    — 30% chance → retirement (mechanical)
```
- `reliabilityFactor` persists for all remaining sectors once set
- Can stack if multiple failures occur (car deteriorates progressively)
- `reliabilityFactor` = 1.0 normally (no effect)

---

### 7. Pit Stop Duration
```
pitStopDuration = baseStopTime × (1 + (1 - pitCrewRating/100) × 0.3)
```
- `baseStopTime` — fixed constant (e.g. 25 seconds)
- `pitCrewRating` — 0–100 team stat
- Best crew (100) = 25.0s, worst crew (40) = 29.5s
- Duration added directly to car's cumulative race time

---

### 8. Setup Factor
```
setupFactor = 1.0 + (1 - setup/100) × 0.04
```
- Perfect setup (100) = no penalty; worst setup (0) = 4% slower across all sectors (~2–3s per lap)
- `setup` is a per-car value, rolled fresh each session (practice, qualifying, or once before race if no prior sessions)

**Setup improvement roll (once per session):**
```
newSetup = currentSetup + random(0, (setupAbility/100) × (100 - currentSetup))
```
- Diminishing returns — the closer to 100, the harder to improve further
- `setupAbility` — 0–100 team stat; high ability (McLaren 90) converges quickly, low ability (Zakspeed 35) plateaus early
- In v1 (no practice/qualifying), each car rolls setup once before race start

**Setup roll logged as an event:**
```js
{ type: "setup_roll", previous: 61, result: 74, sessionType: "pre_race" }
```

---

### Variable Summary (all 0–100)

| Variable | Belongs to | Effect |
|---|---|---|
| `skill` | Driver | Raw one-lap pace |
| `consistency` | Driver | Narrows random variation; affects crash risk |
| `aggression` | Driver | Increases tyre wear rate |
| `power` | Engine | Weighted to straight sectors |
| `engineReliability` | Engine | Mechanical failure probability |
| `aero` | Chassis | Weighted to corner sectors |
| `chassisReliability` | Chassis | Mechanical failure probability |
| `pitCrewRating` | Team | Pit stop duration |
| `setupAbility` | Team | How effectively setup improves each session |
| `setup` | Car (per race) | Rolled each session; poor setup adds up to 4% time penalty |
| `tyreMaxGrip` | Tyre manufacturer | Peak grip level |
| `tyreWearRate` | Tyre manufacturer | How fast grip degrades |
