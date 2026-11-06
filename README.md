<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" />
  <img src="https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178c6?style=for-the-badge&logo=typescript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?style=for-the-badge&logo=tailwindcss" />
  <img src="https://img.shields.io/badge/XGBoost-ML-ff6600?style=for-the-badge" />
  <img src="https://img.shields.io/badge/SHAP-Explainable_AI-22c55e?style=for-the-badge" />
</p>

<h1 align="center">CricketIQ</h1>
<p align="center"><strong>ML-Powered Cricket Impact Metric — Measuring What Performances Actually Meant</strong></p>

<p align="center">
  Built for the <strong>CricHeroes Hackathon 2025</strong> — Impact Metric Track
</p>

---

## What is CricketIQ?

CricketIQ measures how much a player **actually influenced a match outcome** — not just what they scored. Every innings gets a score from **0 to 100** using:

```
Impact = Performance × Context × Pressure × Knockout
```

| Factor | What It Captures |
|--------|-----------------|
| **Performance** | Runs, wickets, strike rate, economy, boundaries, dot balls |
| **Context** | Powerplay vs middle vs death overs, chasing vs setting |
| **Pressure** | Required run rate, wickets remaining, defending low totals |
| **Knockout** | 15% boost for playoff/final matches |

All weights are **learned from real data** by an XGBoost model trained on 1,169 IPL matches. Every score is **fully explainable** through SHAP.

---

## 🚀 Advanced Analytics Modules

CricketIQ includes 8 dedicated interactive modules for deep sports analytics:

| Module | Route | What It Does |
|--------|-------|--------------|
| **Fantasy Captaincy & Smart XI** | `/fantasy-predictor` | Projects venue-adjusted fantasy points (PFP) and algorithmically recommends optimal Captain (2x) & Vice-Captain (1.5x) picks. |
| **Clutch vs Flat-Track Index** | `/clutch-index` | 2D crisis resilience scatter plot categorizing players into Clutch Heroes vs Flat-Track Accumulators. |
| **Stadium Intelligence** | `/venues` | Venue par score normalizer, toss advantage trends, and ground dimension analytics. |
| **H2H Tactical Matchups** | `/matchups` | Head-to-head batter vs bowler faceoffs with dismissal counts, strike rates, and vulnerability scoring. |
| **What-If Match Simulator** | `/simulator` | Counterfactual match replay engine evaluating impact score deltas under altered scenarios. |
| **IPL Auction Purse Optimizer** | `/auction-optimizer` | 100 Cr purse solver and player Fair Market Value / Return-on-Investment (ROI) auditor. |
| **AI Tactical Scout** | `/scout` | Natural language query search engine for scouting phase specialists, anchors, and death bowlers. |
| **Win Probability Added (WPA)** | `/matches/[id]` | Over-by-over live win probability curve and match turning point detector. |

---

## Quick Start

### Prerequisites

- Node.js >= 18
- Python >= 3.10 (only for ML training — not needed to run the app)
- npm or yarn

### 1. Clone and Install

```bash
git clone https://github.com/prachizala/CricketIQ-Project.git
cd CricketIQ-Project
npm install
```

### 2. Run the App

The ML weights and preprocessed data are **already included** in `src/data/`. No training needed to run.

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 3. Build for Production

```bash
npx next build
npx next start
```

---

## Reproducing the Full Pipeline (Optional)

If you want to regenerate everything from scratch using the raw IPL CSV data:

### Step 1: Preprocess IPL Data

```bash
node scripts/preprocess.mjs
```

**Input:** `ipl_male_csv2/` — Ball-by-ball CSVs for 1,169 IPL matches
**Output:** `src/data/matches.json` + `src/data/playerInnings.json`

This reads every ball from every match and aggregates:
- Batting stats per player per innings (runs, SR, boundaries, phase splits)
- Bowling stats per player per innings (wickets, economy, dots, phase splits)
- Context features (chasing, RRR, wickets remaining, batting position)
- Knockout detection (last 4 matches per season = playoffs)

### Step 2: Train the ML Model

```bash
pip install -r scripts/requirements.txt
python3 scripts/train_model.py
```

**Input:** `src/data/playerInnings.json` + `src/data/matches.json`
**Output:**
- `src/data/model_weights.json` — Learned weights, context/pressure multipliers, model metrics
- `src/data/feature_importance.json` — 39 features ranked by importance
- `src/data/shap_values.json` — SHAP explainability data for 200 players

### Step 3: Run the App

```bash
npm run dev
```

The Next.js frontend reads the JSON files at build time. **Zero Python dependency at runtime.**

Training also exports `.pkl` models to `model-template/` for standalone inference (see below).

---

## Python Inference Template (Plug & Play)

A standalone Python template to run the trained XGBoost model — **no Next.js needed**. Two modes: batch CSV processing or a live REST API.

### Mode 1: CSV Batch

```bash
cd model-template
pip install -r requirements.txt

# Score all innings in a CSV
python scripts/run_model.py --input data/sample_input.csv --type both

# Save results
python scripts/run_model.py --input data/sample_input.csv --type batting --output output/scores.csv
```

### Mode 2: REST API

```bash
# Start the API server
python scripts/run_model.py --mode api --port 5000

# Score a single innings
curl -X POST http://localhost:5000/score \
  -H "Content-Type: application/json" \
  -d '{"type":"batting","player":"V Kohli","runs":82,"balls_faced":53,"strike_rate":154.7,"fours":8,"sixes":4,"is_out":1,"is_chasing":1,"required_run_rate":9.2,"wickets_remaining":6,"boundary_pct":22.6,"dot_ball_pct":30.2,"runs_in_powerplay":15,"runs_in_middle":42,"runs_in_death":25,"balls_in_powerplay":10,"balls_in_middle":25,"balls_in_death":18,"batting_position":3,"run_rate_diff":1.5,"is_knockout":0,"first_innings_total":175}'
```

**API Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/score` | Score a single innings (send JSON, get impact back) |
| `POST` | `/score/batch` | Score multiple innings at once |
| `GET` | `/health` | Health check |

### What's Inside

```
model-template/
├── model/
│   ├── batting_model.pkl         # Serialized XGBoost batting model
│   └── bowling_model.pkl         # Serialized XGBoost bowling model
├── features/
│   └── feature_engineering.py    # Full 39-feature pipeline (mirrors TypeScript)
├── scripts/
│   └── run_model.py              # CLI + API server in one file
├── data/
│   ├── sample_input.csv          # Example innings (batting + bowling)
│   └── model_weights.json        # ML weights for context/pressure
├── output/                       # Generated impact scores
├── requirements.txt              # xgboost, pandas, numpy, flask
└── README.md                     # Detailed usage docs
```

### How It Works

```
CSV or JSON → 39 Features → XGBoost .pkl → P × C × W × K → Sigmoid → 0-100 Score
```

The Python feature engineering mirrors the TypeScript pipeline exactly:
- **21 batting features** + **18 bowling features**
- Context weight (phase detection + chasing bonus)
- Pressure weight (RRR tiers + wickets + bowler defending simulation)
- Knockout multiplier (1.15x for playoffs)
- Sigmoid normalization (batting: median=40, bowling: median=28)

### CLI Options

| Flag | Default | Description |
|------|---------|-------------|
| `--mode` | `cli` | `cli` (CSV batch) or `api` (REST server) |
| `--input` | (required in cli) | Path to input CSV |
| `--type` | `both` | `batting`, `bowling`, or `both` |
| `--output` | stdout | Save results to CSV file |
| `--port` | `5000` | API server port (api mode) |

### Response Fields

| Field | Description |
|-------|-------------|
| `impact_score` | Final 0-100 normalized score |
| `performance_score` | Raw ML-weighted performance |
| `context_weight` | Phase + chasing multiplier |
| `pressure_weight` | RRR + wickets pressure |
| `knockout_mult` | 1.15x for playoffs, 1.0x otherwise |
| `xgb_raw_prediction` | Raw XGBoost model output |

---

## How the Algorithm Works

### Performance Score

**Batting:**
```
score = (runs × 0.5 × w₁) + (strikeRate × 0.2 × w₂) + (fours × 2 × w₃) + (sixes × 3 × w₄) + (deathRuns × 0.3 × w₅)
```

**Bowling:**
```
score = (wickets × 15 × w₁) + (dotBalls × 1 × w₂) + (ecoBonus × w₃) + (deathWickets × 5 × w₄)
ecoBonus = max(0, (8 - economy)) × 3
```

Each weight `w` is calibrated by the ML model using dampened ratios:
```
w = √(ML_importance / baseline)
```

This preserves the ML's ranking of what matters while keeping scores stable (sqrt prevents coefficient explosion).

**Defending Pressure Bonus (Bowlers):**
- Team set < 150 and economy < 6 → bonus = (6 - eco) × 2
- Team set < 170 and economy < 7 → bonus = (7 - eco) × 1.5

### Context Weight

Determined by which phase the player contributed most balls in:

| Phase | ML Multiplier |
|-------|------------|
| Powerplay (1-6) | 1.00x |
| Middle (7-15) | 1.07x |
| Death (16-20) | 1.05x |
| Chasing bonus | ×1.04 |

Phase detection uses **actual ball-by-ball data**, not heuristics.

### Pressure Weight

**Batsmen:**

| Condition | Weight |
|-----------|--------|
| RRR > 10 | 1.08x |
| RRR > 8 | 1.04x |
| RRR > 6 | 1.02x |
| Wickets < 4 | +0.09 |
| Wickets < 6 | +0.045 |
| Late stage | +0.1 |
| Max cap | 2.0x |

**Bowlers:** Pressure is simulated based on defending low totals and death-over bowling:
```
if defending < 160: pressureRRR = max(0, 12 - total/20)
if > 40% balls in death: pressureRRR = max(pressureRRR, 8)
```

### Knockout Multiplier

```
Playoff / Eliminator / Final → 1.15x
League match → 1.0x
```
71 knockout matches detected (last 4 matches per season across 18 IPL seasons).

### Normalization

Sigmoid curve (not linear) for natural score spread:
```
normalized = 100 / (1 + e^(-steepness × (raw - median)))
```
- Batting: median = 40, steepness = 0.026
- Bowling: median = 28, steepness = 0.030

### Rolling Impact (Player Score)

Weighted average of last 10 innings with exponential recency decay:
```
weight = 0.82^(distance from latest)
```
Latest innings = 100% weight. 10th oldest = 17% weight. Captures current form.

---

## ML Model Details

### Target Variable

```
Batting: win_factor × min(1.0, player_runs / team_total) × 100
Bowling: win_factor × min(1.0, 0.6 × wicket_share + 0.4 × economy_contribution) × 100
```

- Winners = 1.0, close-match losers = 0.55, other losers = 0.35
- Partial credit prevents "team wins = good, team loses = bad" bias

### Features

| Category | Count | Examples |
|----------|-------|---------|
| Batting | 21 | runs, balls_faced, strike_rate, fours, sixes, boundary_pct, dot_ball_pct, phase runs/balls, batting_position, run_rate_diff |
| Bowling | 18 | wickets, economy, dot_balls, dot_ball_pct, phase wickets/runs/balls |
| Context | included | is_chasing, is_knockout, first_innings_total |
| **Total** | **39** | |

### Model Configuration

```python
XGBRegressor(
    n_estimators=400,
    max_depth=6,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    min_child_weight=3,
    gamma=0.1
)
```

### Performance

| Metric | Batting | Bowling |
|--------|---------|---------|
| R² (test) | 0.7868 | 0.5971 |
| R² (5-fold CV) | 0.7819 ± 0.02 | 0.6111 ± 0.04 |
| MAE | 2.76 pts | 3.42 pts |
| RMSE | 5.40 | 6.91 |

### Top Feature Importances

**Batting:** Runs (43.7%) > Balls Faced (13.8%) > Wickets Remaining (4.6%) > Chasing (4.3%) > Run Rate Diff (3.9%)

**Bowling:** Wickets (42.0%) > Middle Over Wickets (8.8%) > Powerplay Wickets (6.5%) > Death Over Wickets (6.5%) > Chasing Context (6.4%)

---

## Project Structure

```
cricket-impact/
├── scripts/
│   ├── preprocess.mjs          # IPL CSV → JSON pipeline
│   ├── train_model.py          # XGBoost training + SHAP + .pkl export
│   └── requirements.txt        # Python dependencies
│
├── model-template/             # Standalone Python inference (plug & play)
│   ├── model/
│   │   ├── batting_model.pkl   # Serialized XGBoost batting model
│   │   └── bowling_model.pkl   # Serialized XGBoost bowling model
│   ├── features/
│   │   └── feature_engineering.py  # 39-feature pipeline (mirrors TS)
│   ├── scripts/
│   │   └── run_model.py        # CLI: --input, --type, --output
│   ├── data/
│   │   ├── sample_input.csv    # Example innings data
│   │   └── model_weights.json  # ML weights copy
│   ├── output/                 # Generated impact scores
│   ├── requirements.txt
│   └── README.md
│
├── src/
│   ├── lib/
│   │   ├── impactEngine.ts     # Core: P × C × W × K scoring
│   │   ├── featureEngineering.ts # Feature extraction
│   │   ├── contextDetector.ts  # Phase-based context weights
│   │   ├── pressureCalculator.ts # RRR/wickets pressure weights
│   │   ├── types.ts            # TypeScript interfaces
│   │   ├── dataLoader.ts       # Data access layer
│   │   └── utils.ts            # Utilities
│   │
│   ├── data/
│   │   ├── matches.json        # 1,169 match records
│   │   ├── playerInnings.json  # 768 players, all innings
│   │   ├── model_weights.json  # ML weights + metrics
│   │   ├── feature_importance.json # 39 features ranked
│   │   └── shap_values.json    # SHAP for 200 players
│   │
│   ├── components/
│   │   ├── PlayerCard.tsx      # Player summary with sparkline
│   │   ├── ImpactChart.tsx     # Performance trend charts
│   │   ├── ImpactMeter.tsx     # Circular score gauge
│   │   ├── ShapWaterfall.tsx   # SHAP explainability chart
│   │   ├── LeaderboardTable.tsx
│   │   ├── MatchSummary.tsx
│   │   ├── PlayerComparison.tsx
│   │   └── PressureTimeline.tsx
│   │
│   └── app/
│       ├── page.tsx            # Landing — formula + advanced modules showcase
│       ├── dashboard/          # Overview + charts + top players + search filters
│       ├── leaderboard/        # Ranked players with sparklines & CSV export
│       ├── model/              # Full ML methodology page
│       ├── players/[playerId]/ # Individual player profile + SHAP
│       ├── matches/[matchId]/  # Match impact breakdown + WPA timeline curve
│       ├── compare/            # Side-by-side batting & bowling radar comparison
│       ├── matchups/           # Batter vs Bowler head-to-head tactical matrix
│       ├── venues/             # Stadium intelligence & venue par normalizer
│       ├── clutch-index/       # Clutch vs Flat-Track 2D crisis resilience matrix
│       ├── fantasy-predictor/  # Fantasy Captaincy & Smart XI predictor (Dream11)
│       ├── simulator/          # Interactive what-if match simulator
│       ├── auction-optimizer/  # IPL mega-auction purse optimizer & ROI valuation
│       └── scout/              # AI tactical scouting assistant (Natural Language)
│
└── ipl_male_csv2/              # Raw IPL ball-by-ball data
    ├── {matchId}.csv           # Ball data
    └── {matchId}_info.csv      # Match metadata
```

---

## Key Design Decisions

| Decision | Reasoning |
|----------|-----------|
| **Sigmoid normalization** | Linear cap clusters scores. Sigmoid gives natural bell curve — avg = 50, elite = 85+ |
| **Partial credit for losers** | A player scoring 90 in a loss still performed. Zero credit biases toward team strength |
| **Sqrt dampening on ML ratios** | Raw ML ratios cause score explosion (4.37x). Sqrt preserves ranking, keeps scores stable |
| **Exponential recency decay** | 0.82^n makes latest innings 6x more important than oldest. Captures current form |
| **Bowler pressure simulation** | Previously all bowlers got pressure = 1.0. Now defending low totals and death bowling properly rewarded |
| **Phase detection from ball data** | Counts actual balls per phase instead of guessing from balls faced |
| **60/40 bowling target** | Pure wicket target ignores economical bowling. 60% wickets + 40% economy is fairer |

---

## Data

| Metric | Value |
|--------|-------|
| IPL matches | 1,169 |
| Batting innings | 17,708 |
| Bowling innings | 13,878 |
| Players tracked | 768 |
| Knockout matches | 71 |
| Seasons covered | 18 (2008-2024) |
| ML features | 39 |
| SHAP profiles | 200 |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 + React 19 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| Charts | Recharts 3 |
| ML Training | Python + XGBoost + SHAP |
| Data | scikit-learn + pandas + numpy |
| Inference | Standalone Python CLI (model-template/) |
| Runtime | Static JSON (no Python needed) |

---

## Score Interpretation

| Score | Label | Meaning |
|-------|-------|---------|
| 0-35 | Low | Below average contribution |
| 35-50 | Average | Standard performance |
| 50-60 | Good | Above average, solid display |
| 60-75 | High Impact | Significant game-changer |
| 75-100 | Elite | Match-winning, best in the league |

---

## License

This project was built for the CricHeroes Hackathon 2025.

---

<p align="center">
  <strong>CricketIQ</strong> — Not just what they scored. What they changed.
</p>
