# CricketIQ — ML-Powered Cricket Impact Metric
## Minor Project Technical Report & Documentation

---

### Project Metadata
* **Project Title:** CricketIQ: ML-Powered Match-Winning Cricket Impact Metric
* **Academic Submission:** Minor Project (B.Tech / B.E. / BCA / MCA / B.Sc Computer Science)
* **Domain:** Sports Analytics, Machine Learning, Web Engineering
* **GitHub Repository:** [https://github.com/prachizala/CricketIQ-Project.git](https://github.com/prachizala/CricketIQ-Project.git)
* **Dataset:** 1,169 IPL matches (ball-by-ball records from 2008 to 2024, ~31,500+ innings)

---

## 1. Abstract
Traditional cricket statistics (batting average, strike rate, economy rate) treat all runs and wickets identically, failing to account for match situations. An 80 scored in an already-lost league game is statistically rewarded more than an explosive 35* in a tense playoff chase.

**CricketIQ** introduces an interpretable, contextual impact metric that calculates a single score from **0 to 100** evaluating how much an individual performance actually influenced the match outcome. The metric integrates:
1. **Core Performance:** Runs, wickets, scoring speed, boundary frequency, economy rate.
2. **Phase Context:** Powerplay vs Middle vs Death overs.
3. **Situational Pressure:** Required Run Rate (RRR), wickets in hand, defending low totals.
4. **Match Gravity:** Playoff / Final match multiplier.

Weights and phase multipliers are derived using an **XGBoost Regressor** trained on historical IPL ball-by-ball records with **SHAP (SHapley Additive exPlanations)** for explainable AI. The frontend is built on **Next.js 16**, **React 19**, and **Tailwind CSS**, providing instant client-side evaluations without server latency.

---

## 2. Problem Statement & Motivation
Cricket has evolved rapidly with T20 leagues, yet player performance metrics remain largely anchored in 19th-century counting stats:
* **No Situational Awareness:** Hitting 15 runs in the 20th over against yorkers has a vastly different win impact than scoring 15 runs during a low-pressure powerplay.
* **Chasing Asymmetry:** Batting second with wickets falling and a soaring required run rate carries immense psychological and tactical pressure that traditional averages erase.
* **Bowler Undervaluation:** Bowling 4 overs for 22 runs defending a modest target of 145 is often a match-winning effort, but cricket awards MVP to a batter scoring a standard 50.
* **Knockout Gravity:** High-stakes elimination games demand higher mental resilience than mid-season dead rubbers.

**CricketIQ solves this** by replacing misleading cumulative stats with a unified, transparent **Impact Metric (0–100)**.

---

## 3. Mathematical Modeling & Metric Formulation

### 3.1 The Four-Pillar Equation
Every innings receives an Impact Score calculated as:

$$\text{Impact} = \text{Performance Score} \times \text{Context Multiplier} \times \text{Pressure Multiplier} \times \text{Knockout Multiplier}$$

### 3.2 Performance Score

#### Batting Performance ($P_{\text{bat}}$):
$$P_{\text{bat}} = (\text{Runs} \times 0.5 \times w_{\text{runs}}) + (\text{SR} \times 0.2 \times w_{\text{sr}}) + (\text{Fours} \times 2 \times w_{4s}) + (\text{Sixes} \times 3 \times w_{6s}) + (\text{DeathRuns} \times 0.3 \times w_{\text{death}})$$

Where $w_i = \sqrt{\frac{\text{XGBoost Importance}_i}{\text{Baseline}_i}}$ dampens extreme outliers while preserving empirical data rankings.

#### Bowling Performance ($P_{\text{bowl}}$):
$$P_{\text{bowl}} = (\text{Wickets} \times 15 \times w_{\text{wk}}) + (\text{DotBalls} \times 1 \times w_{\text{dot}}) + \max(0, 8 - \text{Economy}) \times 3 \times w_{\text{eco}} + (\text{DeathWickets} \times 5 \times w_{\text{deathWk}}) + B_{\text{defense}}$$

Where $B_{\text{defense}}$ is a defense bonus awarded to bowlers defending low team totals ($<150$ or $<170$) with strict economy.

### 3.3 Context Multiplier ($C$)
Accounts for the game phase where the player delivered the majority of their balls:

| Phase | Batting Multiplier | Bowling Multiplier | Tactical Rationale |
| :--- | :---: | :---: | :--- |
| **Powerplay (Overs 0–5)** | 1.00x | 1.30x | Fielding restrictions aid batters; wickets here severely derail opposition. |
| **Middle (Overs 6–15)** | 1.08x | 1.00x | Spinners and field spread; strike rotation and acceleration phase. |
| **Death (Overs 16–19)** | 1.06x | 1.50x | High risk boundaries; yorkers and variations make death bowling hardest. |
| **Chasing Factor** | 1.04x – 1.10x | 1.00x | Psychological target pressure on batters. |

### 3.4 Pressure Multiplier ($R$)
Evaluates the tactical crisis of the moment:
* $\text{RRR} > 10.0 \implies 1.40\times$
* $\text{RRR} > 8.0 \implies 1.20\times$
* Wickets remaining $< 4 \implies +0.20$ bonus
* Wickets remaining $< 6 \implies +0.10$ bonus
* Capped safely at $2.0\times$ to prevent score runaway.

### 3.5 Knockout Multiplier ($K$)
* Playoff / Qualifier / Final matches: $1.15\times$ (+15% championship gravity).
* League matches: $1.00\times$.

### 3.6 Logistic (Sigmoid) Normalization
To map raw impact into an intuitive **0 to 100** scale without hard clipping:

$$S_{\text{impact}} = \frac{100}{1 + e^{-k \cdot (\text{RawImpact} - \text{Median})}}$$

* **Batting:** $\text{Median} = 40$, $k = 0.026$
* **Bowling:** $\text{Median} = 28$, $k = 0.030$

This maps an average innings to $\sim 50$, a solid contribution to $60-75$, and rare match-winning masterclasses to $85-98$.

---

## 4. System Architecture

```
+-----------------------------------------------------------+
|                   Ball-by-Ball IPL CSVs                   |
|                   (1,169 Matches, 2008-2024)              |
+-----------------------------+-----------------------------+
                              |
                              v
             [ scripts/preprocess.mjs ]
       - Aggregates ball-by-ball data per innings
       - Extracts phase splits (PP, Middle, Death)
       - Computes match state (RRR, Wickets, Knockouts)
                              |
              +---------------+---------------+
              |                               |
              v                               v
     [ src/data/matches.json ]     [ src/data/playerInnings.json ]
              |                               |
              +---------------+---------------+
                              |
                              v
             [ scripts/train_model.py ]
       - XGBoost Regressor (400 trees, lr=0.05)
       - 5-Fold Cross Validation
       - SHAP TreeExplainer Feature Attribution
                              |
              +---------------+---------------+
              |                               |
              v                               v
   [ model_weights.json ]           [ shap_values.json ]
   [ feature_importance.json ]      [ batting/bowling.pkl ]
                              |
                              v
               [ src/lib/impactEngine.ts ]
          - Client-side zero-latency inference engine
          - Exponential recency rolling window (Decay = 0.82)
                              |
                              v
                 [ Next.js 16 Web Dashboard ]
    - Leaderboards, Head-to-Head Comparison, Match Analyzer
```

---

## 5. Technology Stack

| Layer | Technologies Used | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | Next.js 16 (App Router), React 19, TypeScript 5 | Responsive SPA/SSR UI and routing |
| **Styling** | Tailwind CSS v4, Lucide React | Modern mobile-first dark/light UI |
| **Data Visualization** | Recharts, SVG Canvas | Interactive radar charts, bar charts, sparklines |
| **Machine Learning** | Python 3.11, XGBoost, Scikit-learn, SHAP, Joblib | Model training and explainable AI |
| **Standalone Inference**| Python Flask, Pandas, NumPy | REST API & CSV batch CLI tool |
| **Version Control** | Git & GitHub | Source tracking and team collaboration |

---

## 6. Features & Modules

1. **Analytics Dashboard (`/dashboard`):**
   * High-level macro statistics across 1,169 matches.
   * Player score distributions (Elite, High, Good, Average, Below Average).
   * Average impact breakdown categorized by role (Batters, Bowlers, All-rounders).
2. **Impact Leaderboard (`/leaderboard`):**
   * Filterable rankings by Team and Role.
   * Instant search across 578 qualified players.
   * Recent 10-match performance sparklines showing player form trends.
3. **Head-to-Head Comparison (`/compare`):**
   * Multi-dimensional Radar Chart adapting to roles (e.g., Strike Rate/Batting Avg for batters, Economy/Bowling Avg for bowlers).
   * Side-by-side metric breakdown.
4. **Match Analyzer (`/matches/[id]`):**
   * Scoreboard correctly mapped to batting orders.
   * Match Impact Leader chart with interactive contextual tooltips (Base performance, context multiplier, pressure multiplier).
5. **Player Deep Dive (`/players/[id]`):**
   * Detailed breakdown under pressure vs standard conditions.
   * Inning-by-inning impact history and SHAP explainability indicators.

---

## 7. Viva Voce / Examination Q&A Cheat Sheet

**Q1: What is the main innovation of CricketIQ?**
* *Answer:* Traditional cricket statistics measure cumulative volume without context. CricketIQ measures match outcome influence by weighting performances by match phase, situational pressure (RRR, wickets in hand), and championship stakes, calibrated via machine learning.

**Q2: Why use XGBoost rather than deep neural networks?**
* *Answer:* Tabular sports statistics have structured tabular features where gradient boosted trees (XGBoost) consistently outperform deep neural networks in sample efficiency, resistance to overfitting, and native support for tree-based SHAP explainability.

**Q3: How are recent performances prioritized over past records?**
* *Answer:* CricketIQ applies an exponential recency decay formula: $\text{Weight}_i = 0.82^{\text{distance}}$, where the most recent match has approximately $5\times$ the weight of a match played 10 innings ago.

**Q4: How does the web app run fast without waiting for Python?**
* *Answer:* The heavy ML model is used offline to learn the optimal feature importances and multiplier curves. These weights are compiled into a lightweight TypeScript engine executed directly in the browser with 0ms server latency.

---

## 8. Conclusion & Future Enhancements
CricketIQ provides an objective, transparent, and context-aware metric for evaluating cricket players. Future enhancements include:
* Pitch degradation tracking (Day/Night, pitch turn and bounce index).
* Ball-by-ball live streaming integration via WebSockets.
* Application across Test Cricket and ODI formats.
