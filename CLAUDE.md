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
- **Lap chart panel** — a line chart showing each driver's race position per lap. One line per driver, x-axis = lap number, y-axis = position (1 at top). Should fit alongside the timing sheet on desktop. Use Spectrum palette; consider colour-coding by team. Good for seeing the big picture of strategy plays and position changes across the race.
- **UI improvements mini-backlog** (tackle in order, desktop-first but plan for mobile throughout):
  1. ~~**Team+engine concat in team column**~~ ✓ Done — "MCLAREN-HONDA" style; Ferrari deduped to "FERRARI"; column widened to 130px.
  2. ~~**Tyre manufacturer column**~~ ✓ Done — single letter "G"/"P" in "TYRE" column after team; compound history column renamed "COMP".
  3. ~~**Frozen columns + horizontal scroll**~~ ✓ Done — POS, #, DRIVER sticky with `position: sticky`; table wrapped in `overflow-x: auto` div; driver column has separator border + shadow.
  4. **Team colours** — colour-code each team's row/name; prerequisite for the lap chart where colours are essential. Consider small team logo next to driver name eventually.
  5. **Grand Prix name in header** — e.g. "1988 Season · Race 1 · Swedish Grand Prix · Anderstorp". Requires circuit/race metadata to be defined in data.js.
- **Mobile display** — the canvas timing sheet is designed for desktop. Need a strategy for mobile: either a responsive layout that stacks panels vertically, a simplified mobile view showing only top 6 or so, or a portrait-optimised alternative renderer. Consider touch interactions (tap a driver to highlight their line on the lap chart, etc.). The frozen-columns + horizontal-scroll item above is the first step.
- Race log viewer / replay tool — filter by car, lap range, event type; inspect factor values and rolls to diagnose model behaviour
- Practice session with lap time data
- **Qualifying session** — interesting to watch; will be added before championship mode. No practice sessions — dropped from scope.
- Multiple circuits with different characteristics
- Ambient temperature and weather effects
- Tyre compound choice per stint

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
