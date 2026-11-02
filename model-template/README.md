# CricketIQ — Python Inference Template

Standalone Python template to run CricketIQ's XGBoost impact model. Two modes: **CSV batch** or **REST API**. No Next.js needed.

---

## Quick Start — CSV Batch

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Run on sample data
python scripts/run_model.py --input data/sample_input.csv --type both

# 3. Save results to CSV
python scripts/run_model.py --input data/sample_input.csv --type batting --output output/impact_scores.csv
```

## Quick Start — REST API

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Start the API server
python scripts/run_model.py --mode api --port 5000

# 3. Score an innings (from another terminal)
curl -X POST http://localhost:5000/score \
  -H "Content-Type: application/json" \
  -d '{"type":"batting","player":"V Kohli","runs":82,"balls_faced":53,"strike_rate":154.7,"fours":8,"sixes":4,"is_out":1,"is_chasing":1,"required_run_rate":9.2,"wickets_remaining":6,"boundary_pct":22.6,"dot_ball_pct":30.2,"runs_in_powerplay":15,"runs_in_middle":42,"runs_in_death":25,"balls_in_powerplay":10,"balls_in_middle":25,"balls_in_death":18,"batting_position":3,"run_rate_diff":1.5,"is_knockout":0,"first_innings_total":175}'
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/score` | Score a single innings — send player stats as JSON |
| `POST` | `/score/batch` | Score multiple innings — send `{"innings": [...]}` |
| `GET` | `/health` | Health check |

**`POST /score` example request:**
```json
{
  "type": "batting",
  "player": "V Kohli",
  "runs": 82,
  "balls_faced": 53,
  "strike_rate": 154.7,
  "fours": 8,
  "sixes": 4,
  "is_chasing": 1,
  "required_run_rate": 9.2,
  "wickets_remaining": 6,
  "is_knockout": 0,
  "first_innings_total": 175
}
```

**Response:**
```json
{
  "player": "V Kohli",
  "type": "batting",
  "impact_score": 93.0,
  "performance_score": 119.66,
  "context_weight": 1.1232,
  "pressure_weight": 1.04,
  "knockout_mult": 1.0,
  "raw_impact": 139.78,
  "xgb_raw_prediction": 37.74
}
```

**`POST /score/batch` example:**
```json
{
  "innings": [
    { "type": "batting", "player": "V Kohli", "runs": 82, "..." : "..." },
    { "type": "bowling", "player": "JJ Bumrah", "wickets": 3, "..." : "..." }
  ]
}
```

---

## Input Format

Your CSV (or JSON body) must have these fields depending on innings type:

### Batting (21 features)

| Column | Description | Example |
|--------|-------------|---------|
| `player` | Player name | V Kohli |
| `match_id` | Match identifier | 1234 |
| `type` | Must be `batting` | batting |
| `runs` | Runs scored | 82 |
| `balls_faced` | Deliveries faced | 53 |
| `strike_rate` | Runs per 100 balls | 154.7 |
| `fours` | Number of 4s | 8 |
| `sixes` | Number of 6s | 4 |
| `is_out` | 1 if dismissed, 0 otherwise | 1 |
| `is_chasing` | 1 if batting 2nd, 0 if setting | 1 |
| `required_run_rate` | RRR for chase (0 if setting) | 9.2 |
| `wickets_remaining` | Wickets in hand | 6 |
| `boundary_pct` | % of balls that are boundaries | 22.6 |
| `dot_ball_pct` | % of dot balls faced | 30.2 |
| `runs_in_powerplay` | Runs in overs 1-6 | 15 |
| `runs_in_middle` | Runs in overs 7-15 | 42 |
| `runs_in_death` | Runs in overs 16-20 | 25 |
| `balls_in_powerplay` | Balls faced in powerplay | 10 |
| `balls_in_middle` | Balls faced in middle overs | 25 |
| `balls_in_death` | Balls faced in death overs | 18 |
| `batting_position` | Order position (1-11) | 3 |
| `run_rate_diff` | Current RR minus required RR | 1.5 |
| `is_knockout` | 1 if playoff/final, 0 otherwise | 0 |
| `first_innings_total` | First innings score (context) | 175 |

### Bowling (18 features)

| Column | Description | Example |
|--------|-------------|---------|
| `player` | Player name | JJ Bumrah |
| `match_id` | Match identifier | 1234 |
| `type` | Must be `bowling` | bowling |
| `wickets` | Wickets taken | 3 |
| `runs_conceded` | Runs given away | 22 |
| `balls_bowled` | Deliveries bowled | 24 |
| `dot_balls` | Deliveries with 0 runs | 14 |
| `economy` | Runs per over | 5.5 |
| `is_chasing` | 1 if bowler's team is chasing | 0 |
| `dot_ball_pct` | % of dot balls | 58.3 |
| `wickets_in_powerplay` | Wickets in overs 1-6 | 1 |
| `wickets_in_middle` | Wickets in overs 7-15 | 1 |
| `wickets_in_death` | Wickets in overs 16-20 | 1 |
| `runs_in_powerplay` | Runs conceded in powerplay | 0 |
| `runs_in_middle` | Runs conceded in middle | 0 |
| `runs_in_death` | Runs conceded in death | 0 |
| `balls_in_powerplay` | Balls bowled in powerplay | 0 |
| `balls_in_middle` | Balls bowled in middle | 0 |
| `balls_in_death` | Balls bowled in death | 0 |
| `is_knockout` | 1 if playoff/final | 0 |
| `first_innings_total` | First innings score | 175 |

---

## Output / Response Fields

| Field | Description |
|-------|-------------|
| `player` | Player name |
| `match_id` | Match identifier |
| `type` | batting or bowling |
| `impact_score` | Final 0-100 score (sigmoid normalized) |
| `performance_score` | ML-weighted performance |
| `context_weight` | Phase + chasing multiplier |
| `pressure_weight` | RRR + wickets pressure multiplier |
| `knockout_mult` | 1.15x for playoffs, 1.0x otherwise |
| `raw_impact` | Performance x Context x Pressure x Knockout |
| `xgb_raw_prediction` | Raw XGBoost model output |

---

## How Impact is Calculated

```
CSV or JSON → 39 Features → XGBoost .pkl → P × C × W × K → Sigmoid → 0-100 Score
```

1. **Performance**: ML-weighted batting/bowling formula
2. **Context**: Phase (powerplay/middle/death) + chasing bonus
3. **Pressure**: Required run rate + wickets in hand
4. **Knockout**: 15% boost for playoff matches
5. **Sigmoid**: `100 / (1 + e^(-steepness * (raw - median)))`

---

## CLI Options

```
python scripts/run_model.py [--mode cli|api] [--input <csv>] [--type batting|bowling|both] [--output <csv>] [--port 5000]
```

| Flag | Default | Description |
|------|---------|-------------|
| `--mode` | `cli` | `cli` (CSV batch) or `api` (REST server) |
| `--input` | (required in cli) | Path to input CSV |
| `--type` | `both` | Process batting, bowling, or both |
| `--output` | stdout | Save results to CSV file |
| `--port` | `5000` | API server port (api mode) |

---

## Score Interpretation

| Score | Label | Meaning |
|-------|-------|---------|
| 0-35 | Low | Below average contribution |
| 35-50 | Average | Standard performance |
| 50-60 | Good | Above average |
| 60-75 | High Impact | Significant game-changer |
| 75-100 | Elite | Match-winning performance |

---

## Retraining

To retrain the model with new data:

```bash
# From the project root (not model-template/)
python3 scripts/train_model.py
```

This regenerates `model-template/model/*.pkl` and `model-template/data/model_weights.json`.

---

Part of [CricketIQ](../) — ML-Powered Cricket Impact Metric for the CricHeroes Hackathon 2025.
