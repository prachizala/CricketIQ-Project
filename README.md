<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.1-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19.2-61dafb?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-3178c6?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4.0-38bdf8?style=for-the-badge&logo=tailwindcss" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/XGBoost-Regressor-ff6600?style=for-the-badge" alt="XGBoost" />
  <img src="https://img.shields.io/badge/SHAP-Explainable_AI-22c55e?style=for-the-badge" alt="SHAP" />
  <img src="https://img.shields.io/badge/IPL_Data-18_Seasons-blue?style=for-the-badge" alt="IPL Data" />
</p>

<h1 align="center">🏏 CricketIQ</h1>
<p align="center">
  <strong>Next-Gen Machine Learning Cricket Analytics & Match Intelligence Platform</strong><br>
  <em>Measuring What Performances Actually Meant — Beyond Traditional Counting Stats</em>
</p>

<p align="center">
  <a href="https://github.com/prachizala/CricketIQ-Project"><strong>GitHub Repository</strong></a> &bull;
  <a href="#-what-is-cricketiq">Overview</a> &bull;
  <a href="#-advanced-analytics-suite-8-modules">Feature Modules</a> &bull;
  <a href="#-the-impact-algorithm--mathematical-formulation">Math & ML Pipeline</a> &bull;
  <a href="#-quick-start">Quick Start</a> &bull;
  <a href="#-python-inference-template-rest-api">Standalone Python API</a>
</p>

---

## 📖 What is CricketIQ?

Traditional cricket statistics (batting averages, strike rates, economy rates) treat all runs and wickets identically. A batter scoring an effortless 65* in an already-decided dead rubber gets higher statistical praise than a batter scoring a tense, match-winning 38* under soaring required run rates in a knockout final.

**CricketIQ** solves this fundamental flaw by replacing crude counting stats with an interpretable, situation-aware **Impact Metric (0 to 100)**:

$$\text{Impact} = \text{Performance} \times \text{Context} \times \text{Pressure} \times \text{Knockout}$$

Trained on **1,169 IPL matches (2008–2024)** and over **31,500+ ball-by-ball innings**, CricketIQ uses **XGBoost Regressors** and **SHAP (SHapley Additive exPlanations)** to objectively evaluate every delivery, phase leverage, match stakes, and crisis pressure.

---

## 🚀 Advanced Analytics Suite (8 Modules)

CricketIQ features 8 interactive, production-grade sports analytics tools:

| Module | Route | What It Does |
|---|:---:|---|
| ⚡ **Fantasy Captaincy & Smart XI** | [`/fantasy-predictor`](#1-fantasy-captaincy--smart-xi-predictor) | Projects venue-adjusted fantasy points (PFP), Dream11 rule constraint solver, optimal Captain (2x) & Vice-Captain (1.5x) picks, and 1-click clipboard lineup exporter. |
| 🛡️ **Clutch vs Flat-Track Index** | [`/clutch-index`](#2-clutch-vs-flat-track-crisis-index) | Interactive 2D scatter matrix mapping High-Pressure Impact vs Low-Pressure Impact, separating Big-Match Clutch Heroes from Flat-Track Bullies. |
| 🏟️ **Stadium Intelligence & Par Normalizer** | [`/venues`](#3-stadium-intelligence--venue-par-normalizer) | Ground dimensions, toss advantage curves, pitch behavior traits, and venue-adjusted par score normalization across premier IPL stadiums. |
| 🎯 **H2H Tactical Matchup Matrix** | [`/matchups`](#4-batter-vs-bowler-head-to-head-matrix) | Granular batter vs bowler faceoffs tracking historical balls faced, strike rates, dismissals, dot ball percentages, and matchup dominance ratings. |
| 🎲 **What-If Match Simulator** | [`/simulator`](#5-what-if-match-simulator-counterfactual-engine) | Counterfactual match replay engine allowing users to alter boundaries, extra wickets, or run-rate requirements to observe real-time impact delta recalculations. |
| 💰 **IPL Mega-Auction Purse Optimizer** | [`/auction-optimizer`](#6-ipl-mega-auction-purse-optimizer) | Algorithmic 100 Cr squad knapsack optimizer, Fair Bid Price calculator, and player Return-On-Investment (ROI) valuation auditor. |
| 🤖 **AI Tactical Scouting Assistant** | [`/scout`](#7-ai-tactical-scouting-assistant) | Natural Language Query (NLQ) search interface enabling scouts and analysts to query death specialists, anchor batters, and powerplay enforcers. |
| 📈 **Win Probability Added (WPA) Curves** | [`/matches/[id]`](#8-over-by-over-win-probability-added-wpa) | Over-by-over live win probability timeline and automated turning point detector highlighting match-altering shifts. |

---

## 🛠️ Feature Walkthrough

### 1. Fantasy Captaincy & Smart XI Predictor (`/fantasy-predictor`)
- **Pitch-Calibrated Projections:** Custom modifiers for 6 major venues (e.g. +22% batting boost at Chinnaswamy, +30% spin boost at Chepauk).
- **Rule Enforcement:** Enforces standard 100-credit budget, 11 players, team limits (max 7 from one team), and role requirements (min 1 WK, 3 BAT, 1 AR, 3 BOWL).
- **Preset Strategies:** 1-click generation for **Balanced XI**, **Grand League (High Ceiling) XI**, or **Safe Head-to-Head (H2H) XI**.
- **Captaincy Multipliers:** Recommends optimal Captain (2.0x) and Vice-Captain (1.5x) based on points ceiling vs floor consistency.

### 2. Clutch vs Flat-Track Crisis Index (`/clutch-index`)
- Evaluates individual temperament by plotting crisis performance (Pressure $\ge 1.25$) against cruise performance (Pressure $< 0.90$).
- Categorizes players into 4 distinct quadrants:
  - 🛡️ **Big-Match Clutch Heroes** (High crisis, high cruise impact)
  - ⚡ **Crisis Specialists** (Low cruise volume, but excels when the team is in trouble)
  - ☀️ **Flat-Track Dominators** (Exploits weak situations, fades during pressure spikes)
  - 🔄 **Developing Anchors**

### 3. Stadium Intelligence & Venue Par Normalizer (`/venues`)
- Normalizes individual scores against venue par totals (e.g. 150 at Chepauk carries higher win equity than 185 at Chinnaswamy).
- Tracks toss advantage biases (Bat First vs Bowl First win percentages).
- Provides pitch behavior breakdowns (Batting Paradise, Spin Friendly, Pace & Bounce, Balanced).

### 4. Batter vs Bowler Head-to-Head Matrix (`/matchups`)
- Search any batter and bowler to inspect historical head-to-head records across 18 IPL seasons.
- Detailed metrics: Balls faced, runs conceded, strike rate, dismissals, dot ball percentage, and tactical matchup advantage rating.

### 5. What-If Match Simulator (`/simulator`)
- Select any real IPL innings and simulate counterfactual "What-If" scenarios.
- Interactive controls: Adjust runs scored, boundaries, dot balls, or wickets conceded.
- Live recalculation displays how the player's Impact Score and the match outcome delta would have shifted.

### 6. IPL Mega-Auction Purse Optimizer (`/auction-optimizer`)
- Knapsack squad builder adhering to IPL squad constraints (₹100 Cr budget cap, 11 players, max 4 overseas).
- Valuation Auditor: Evaluates any player's fair market bid price vs actual auction bids to detect **Overpaid Risks**, **Fair Value Contracts**, and **Steal Buys**.

### 7. AI Tactical Scouting Assistant (`/scout`)
- Natural language query parser: Type queries like *"death bowlers with low economy"*, *"aggressive powerplay openers"*, or *"spin all-rounders"* to instantly discover matching candidates.

### 8. Over-by-Over Win Probability Added (WPA) (`/matches/[id]`)
- Over-by-over Win Probability timeline showing how each phase shifted match control.
- Automatically flags match turning points where single overs produced catastrophic or game-winning win probability swings.

---

## 🧮 The Impact Algorithm & Mathematical Formulation

### 1. The Four-Pillar Equation
$$\text{Impact} = \text{Performance Score} \times \text{Context Multiplier} \times \text{Pressure Multiplier} \times \text{Knockout Multiplier}$$

### 2. Performance Scoring
- **Batting ($P_{\text{bat}}$):**
  $$P_{\text{bat}} = (\text{Runs} \times 0.5 \times w_1) + (\text{SR} \times 0.2 \times w_2) + (\text{Fours} \times 2 \times w_3) + (\text{Sixes} \times 3 \times w_4) + (\text{DeathRuns} \times 0.3 \times w_5)$$
- **Bowling ($P_{\text{bowl}}$):**
  $$P_{\text{bowl}} = (\text{Wickets} \times 15 \times w_1) + (\text{DotBalls} \times 1 \times w_2) + (\text{EconomyBonus} \times w_3) + (\text{DeathWickets} \times 5 \times w_4)$$
  $$\text{EconomyBonus} = \max(0, (8.0 - \text{Economy})) \times 3$$

### 3. Context & Phase Multipliers
| Match Phase | Overs | Multiplier | Rationale |
|---|:---:|:---:|---|
| **Powerplay** | 1 – 6 | 1.00x | Field restrictions, boundary exploitation vs new-ball swing. |
| **Middle Overs** | 7 – 15 | 1.07x | Spin handling, rotation of strike, and consolidating without losing wickets. |
| **Death Overs** | 16 – 20 | 1.05x | High-risk boundary hitting and yorker execution. |
| **Chasing Inning** | 2nd Inn | ×1.04 | Scoreboard pressure penalty & chasing target gravity. |

### 4. Pressure Multiplier
- **Batters:** Calculated dynamically from Required Run Rate (RRR) and wickets in hand ($RRR > 10 \rightarrow 1.08\times$; Wickets $< 4 \rightarrow +0.09$; capped at $2.0\times$).
- **Bowlers:** Defending low totals bonus:
  $$\text{If target} < 160: \quad \text{Defending Pressure} = \max(0, 12 - \frac{\text{Total}}{20})$$

### 5. Knockout Multiplier
- Playoff, Eliminator, Qualifier, or Final match: **$1.15\times$**
- Standard league game: **$1.0\times$**

### 6. Sigmoid Normalization (0–100 Scale)
To prevent unnatural clustering at extremes, scores are mapped using a sigmoid transformation:
$$\text{Normalized Score} = \frac{100}{1 + e^{-k \cdot (\text{Raw} - \text{Median})}}$$
- **Batting:** $\text{Median} = 40.0, \quad k = 0.026$
- **Bowling:** $\text{Median} = 28.0, \quad k = 0.030$

---

## ⚡ Quick Start

### Prerequisites
- **Node.js** >= 18.0.0
- **npm** or **yarn**

### 1. Clone & Install
```bash
git clone https://github.com/prachizala/CricketIQ-Project.git
cd CricketIQ-Project
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Production Build
```bash
npm run build
npm run start
```

*Note: All ML weights and 578 player profiles are precomputed in `src/data/`. Zero Python runtime dependency is needed to run the web application!*

---

## 🐍 Standalone Python Inference & REST API

For data scientists or backend integrations, a standalone Python package is included under `model-template/`:

```bash
cd model-template
pip install -r requirements.txt
```

### Run Batch CSV Scoring
```bash
python scripts/run_model.py --input data/sample_input.csv --type both --output output/scores.csv
```

### Launch Flask REST API
```bash
python scripts/run_model.py --mode api --port 5000
```

### Test API via cURL
```bash
curl -X POST http://localhost:5000/score \
  -H "Content-Type: application/json" \
  -d '{
    "type": "batting",
    "player": "V Kohli",
    "runs": 82,
    "balls_faced": 53,
    "strike_rate": 154.7,
    "fours": 8,
    "sixes": 4,
    "is_out": 1,
    "is_chasing": 1,
    "required_run_rate": 9.2,
    "wickets_remaining": 6
  }'
```

---

## 🏗️ Project Architecture

```
CricketIQ-Project/
├── src/
│   ├── app/
│   │   ├── page.tsx               # Homepage — Hero, methodology & module showcase
│   │   ├── layout.tsx             # Root layout with responsive navigation & footer
│   │   ├── dashboard/             # League overview, season filter, & match search
│   │   ├── leaderboard/           # Top impact rankings with sparklines & CSV export
│   │   ├── compare/               # Side-by-side batting & bowling radar comparison
│   │   ├── matchups/              # Batter vs bowler tactical faceoff matrix
│   │   ├── venues/                # Stadium intelligence & venue par normalizer
│   │   ├── clutch-index/          # 2D crisis resilience scatter plot
│   │   ├── fantasy-predictor/     # Fantasy Captaincy & Smart XI Dream11 predictor
│   │   ├── simulator/             # Interactive counterfactual match simulator
│   │   ├── auction-optimizer/     # IPL 100 Cr purse optimizer & ROI valuation
│   │   ├── scout/                 # AI tactical scouting assistant (Natural Language)
│   │   ├── how-it-works/          # Deep-dive methodology & scoring formulas
│   │   ├── players/[playerId]/    # Individual player career profile & SHAP breakdown
│   │   └── matches/[matchId]/     # Match impact summary & WPA over-by-over curve
│   ├── components/                # Reusable UI cards, charts, & navigation
│   ├── data/                      # Precomputed leaderboard, weights, & match data
│   └── lib/                       # Feature engineering, ML formulas, & types
├── model-template/                # Standalone Python inference package & REST API
├── scripts/                       # Training, preprocessing & extraction scripts
├── package.json                   # Project metadata & npm dependencies
└── README.md                      # Comprehensive documentation
```

---

## 📊 Dataset & Scale

| Metric | Dimension |
|---|---|
| **IPL Matches Analyzed** | 1,169 matches |
| **Ball-by-Ball Records** | ~280,000+ deliveries |
| **Total Innings Processed** | 31,586 innings (17,708 batting + 13,878 bowling) |
| **Seasons Covered** | 18 seasons (2008 – 2024) |
| **Unique Players Tracked** | 768 players |
| **Engineered Features** | 39 contextual ML features |
| **Explainable AI Profiles** | 200 SHAP-profiled players |

---

## 💻 Tech Stack

- **Frontend Framework:** Next.js 16 (App Router) & React 19
- **Type Safety:** TypeScript 5
- **Styling & Design:** Tailwind CSS 4 & Lucide Icons
- **Data Visualization:** Recharts 3 (Radar charts, Area curves, Bar charts, Scatter plots)
- **Machine Learning Core:** Python 3.10+, XGBoost Regressors, SHAP
- **Data Processing:** pandas, NumPy, scikit-learn

---

## 📄 License & Attribution

This project is open-source under the MIT License. Developed for sports analytics research, competitive intelligence, and hackathon presentation.

<p align="center">
  <strong>CricketIQ</strong> &mdash; <em>Not just what they scored. What they changed.</em>
</p>
