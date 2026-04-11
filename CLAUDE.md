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
- **Sector rewind / replay in the renderer** — allow the viewer to step back a few sectors to review something that just happened. The race log already captures full state every sector tick, so this is a renderer/UX feature: store the last N rendered frames and allow backwards stepping. Independent of the simulation engine.
- ~~**Gap vs Interval toggle**~~ ✓ Done
- ~~**Visual car spacing strip**~~ ✓ Done — narrow canvas panel between timing sheet and commentary; dots labelled "12 SEN" style; zoom (+/−) and scroll; min spacing prevents overlap, zoom in to separate battles.
- **Position swap animation** — when an overtake is logged, briefly animate the two affected rows on the timing sheet (e.g. flash or slide) and the two dots on the spacing strip swapping positions. The Spectrum aesthetic can be relaxed here in favour of readability and drama. Complexity unknown — investigate CSS transition approach for rows vs a canvas-drawn animation for the strip dots.
- ~~**Event commentary pane**~~ ✓ Done
- **Commentary on silent passes** — position changes that happen without a wheel-to-wheel overtake attempt (car pulls ahead on pace over multiple sectors, never within 0.3s) are currently invisible in the commentary. Consider a lower-key [POS] tag for these, or a threshold (e.g. only log if the position change is P5 or better) to avoid noise from the midfield.
- **Lap chart panel** — a line chart showing each driver's race position per lap. One line per driver, x-axis = lap number, y-axis = position (1 at top). Should fit alongside the timing sheet on desktop. Use Spectrum palette; consider colour-coding by team. Good for seeing the big picture of strategy plays and position changes across the race.
- **Mobile display** — the canvas timing sheet is designed for desktop. Need a strategy for mobile: either a responsive layout that stacks panels vertically, a simplified mobile view showing only top 6 or so, or a portrait-optimised alternative renderer. Consider touch interactions (tap a driver to highlight their line on the lap chart, etc.).
- Race log viewer / replay tool — filter by car, lap range, event type; inspect factor values and rolls to diagnose model behaviour
- Practice session with lap time data
- Qualifying session to set grid
- **Per-team race strategy derived from practice data:**
  - During practice each car runs laps and the AI observes its own empirical tyre wear rate (which naturally varies by driver aggression, tyre manufacturer, and compound)
  - From observed wear rate each team calculates the lap at which wear will hit its trigger threshold, and therefore how many stops are needed
  - This produces genuine strategy differentiation: a smooth Goodyear driver may emerge as a 2-stop car while an aggressive Pirelli driver plans 3 stops
  - The pit threshold in the race is set per-car from the practice plan rather than being a shared reactive value
  - Do not shortcut this with a pre-race calculation — the emergent quality of observing wear in practice is the point
- Multiple circuits with different characteristics
- Random circuit selection or full season series
- Ambient temperature and weather effects
- Tyre compound choice per stint

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
