"""
CricketIQ Feature Engineering Pipeline
Mirrors the TypeScript feature engineering from src/lib/

Input: CSV row with player innings stats
Output: Feature dict ready for XGBoost prediction + context/pressure weights
"""

import math
import numpy as np

# Feature lists must match train_model.py exactly
BATTING_FEATURES = [
    'runs', 'balls_faced', 'strike_rate', 'fours', 'sixes',
    'is_out', 'is_chasing', 'required_run_rate', 'wickets_remaining',
    'boundary_pct', 'dot_ball_pct',
    'runs_in_powerplay', 'runs_in_middle', 'runs_in_death',
    'balls_in_powerplay', 'balls_in_middle', 'balls_in_death',
    'batting_position', 'run_rate_diff',
    'is_knockout', 'first_innings_total',
]

BOWLING_FEATURES = [
    'wickets', 'runs_conceded', 'balls_bowled', 'dot_balls', 'economy',
    'is_chasing', 'dot_ball_pct',
    'wickets_in_powerplay', 'wickets_in_middle', 'wickets_in_death',
    'runs_in_powerplay', 'runs_in_middle', 'runs_in_death',
    'balls_in_powerplay', 'balls_in_middle', 'balls_in_death',
    'is_knockout', 'first_innings_total',
]


def extract_batting_features(row):
    """Extract 21 batting features from a CSV row dict."""
    return {
        'runs': float(row.get('runs', 0)),
        'balls_faced': float(row.get('balls_faced', 0)),
        'strike_rate': float(row.get('strike_rate', 0)),
        'fours': float(row.get('fours', 0)),
        'sixes': float(row.get('sixes', 0)),
        'is_out': float(row.get('is_out', 0)),
        'is_chasing': float(row.get('is_chasing', 0)),
        'required_run_rate': float(row.get('required_run_rate', 0)),
        'wickets_remaining': float(row.get('wickets_remaining', 10)),
        'boundary_pct': float(row.get('boundary_pct', 0)),
        'dot_ball_pct': float(row.get('dot_ball_pct', 0)),
        'runs_in_powerplay': float(row.get('runs_in_powerplay', 0)),
        'runs_in_middle': float(row.get('runs_in_middle', 0)),
        'runs_in_death': float(row.get('runs_in_death', 0)),
        'balls_in_powerplay': float(row.get('balls_in_powerplay', 0)),
        'balls_in_middle': float(row.get('balls_in_middle', 0)),
        'balls_in_death': float(row.get('balls_in_death', 0)),
        'batting_position': float(row.get('batting_position', 4)),
        'run_rate_diff': float(row.get('run_rate_diff', 0)),
        'is_knockout': float(row.get('is_knockout', 0)),
        'first_innings_total': float(row.get('first_innings_total', 0)),
    }


def extract_bowling_features(row):
    """Extract 18 bowling features from a CSV row dict."""
    return {
        'wickets': float(row.get('wickets', 0)),
        'runs_conceded': float(row.get('runs_conceded', 0)),
        'balls_bowled': float(row.get('balls_bowled', 0)),
        'dot_balls': float(row.get('dot_balls', 0)),
        'economy': float(row.get('economy', 0)),
        'is_chasing': float(row.get('is_chasing', 0)),
        'dot_ball_pct': float(row.get('dot_ball_pct', 0)),
        'wickets_in_powerplay': float(row.get('wickets_in_powerplay', 0)),
        'wickets_in_middle': float(row.get('wickets_in_middle', 0)),
        'wickets_in_death': float(row.get('wickets_in_death', 0)),
        'runs_in_powerplay': float(row.get('runs_in_powerplay', 0)),
        'runs_in_middle': float(row.get('runs_in_middle', 0)),
        'runs_in_death': float(row.get('runs_in_death', 0)),
        'balls_in_powerplay': float(row.get('balls_in_powerplay', 0)),
        'balls_in_middle': float(row.get('balls_in_middle', 0)),
        'balls_in_death': float(row.get('balls_in_death', 0)),
        'is_knockout': float(row.get('is_knockout', 0)),
        'first_innings_total': float(row.get('first_innings_total', 0)),
    }


def detect_over_phase(row, innings_type):
    """Determine which phase the player contributed most balls in."""
    if innings_type == 'batting':
        pp = float(row.get('balls_in_powerplay', 0))
        mid = float(row.get('balls_in_middle', 0))
        death = float(row.get('balls_in_death', 0))
    else:
        pp = float(row.get('balls_in_powerplay', 0))
        mid = float(row.get('balls_in_middle', 0))
        death = float(row.get('balls_in_death', 0))

    if pp >= mid and pp >= death:
        return 'powerplay'
    elif death >= mid:
        return 'death'
    return 'middle'


def calculate_context_weight(row, innings_type, ml_weights=None):
    """
    Context weight based on phase and chasing status.
    Uses ML-learned multipliers when available.
    """
    phase = detect_over_phase(row, innings_type)
    is_chasing = bool(float(row.get('is_chasing', 0)))

    if ml_weights and 'context_multipliers' in ml_weights:
        cm = ml_weights['context_multipliers']
        weight = cm.get(phase, 1.0)
        if is_chasing:
            weight *= cm.get('chasing', 1.1)
        return weight

    # Rule-based fallback
    phase_weights = {'powerplay': 1.0, 'middle': 1.2, 'death': 1.5}
    weight = phase_weights.get(phase, 1.0)
    if is_chasing:
        weight *= 1.1
    return weight


def calculate_pressure_weight(row, innings_type, ml_weights=None):
    """
    Pressure weight based on RRR, wickets, and match stage.
    Uses ML-learned multipliers when available.
    """
    if innings_type == 'batting':
        rrr = float(row.get('required_run_rate', 0))
        wk = float(row.get('wickets_remaining', 10))
        match_stage = 'late' if rrr > 10 else ('middle' if rrr > 6 else 'early')
    else:
        # Bowler pressure simulation
        balls_bowled = float(row.get('balls_bowled', 1)) or 1
        death_balls = float(row.get('balls_in_death', 0))
        death_pct = death_balls / balls_bowled
        economy = float(row.get('economy', 0))
        first_total = float(row.get('first_innings_total', 0))
        is_chasing = bool(float(row.get('is_chasing', 0)))
        defending_low = not is_chasing and first_total > 0 and first_total < 160

        rrr = 0
        if defending_low:
            rrr = max(0, 12 - first_total / 20)
        if death_pct > 0.4:
            rrr = max(rrr, 8)

        wk = 10
        match_stage = 'late' if death_pct > 0.4 else ('middle' if economy > 8 else 'early')

    if ml_weights and 'pressure_multipliers' in ml_weights:
        pm = ml_weights['pressure_multipliers']
        weight = 1.0
        if rrr > 10:
            weight = pm.get('rrr_high', 1.4)
        elif rrr > 8:
            weight = pm.get('rrr_medium', 1.2)
        elif rrr > 6:
            weight = 1.0 + (pm.get('rrr_medium', 1.2) - 1.0) * 0.5

        if wk < 4:
            weight += pm.get('wickets_low', 0.2)
        elif wk < 6:
            weight += pm.get('wickets_low', 0.2) * 0.5

        if match_stage == 'late':
            weight += 0.1

        return min(weight, 2.0)

    # Rule-based fallback
    weight = 1.0
    if rrr > 10:
        weight = 1.4
    elif rrr > 8:
        weight = 1.2
    elif rrr > 6:
        weight = 1.1

    if wk < 4:
        weight += 0.2
    elif wk < 6:
        weight += 0.1

    if match_stage == 'late':
        weight += 0.1

    return min(weight, 2.0)


def ml_ratio(ml_weight, baseline):
    """Soft-ratio: sqrt dampening to prevent coefficient explosion."""
    raw = (ml_weight if ml_weight else baseline) / baseline
    return math.sqrt(raw)


def calculate_batting_performance(row, ml_weights=None):
    """
    Batting performance score using ML-weighted formula.
    score = (runs * 0.5 * w1) + (SR * 0.2 * w2) + (4s * 2 * w3) + (6s * 3 * w4) + (death_runs * 0.3 * w5)
    """
    runs = float(row.get('runs', 0))
    sr = float(row.get('strike_rate', 0))
    fours = float(row.get('fours', 0))
    sixes = float(row.get('sixes', 0))
    death_runs = float(row.get('runs_in_death', 0))

    if ml_weights and 'batting_weights' in ml_weights:
        w = ml_weights['batting_weights']
        runs_w = ml_ratio(w.get('runs', 0.15), 0.15)
        sr_w = ml_ratio(w.get('strike_rate', 0.04), 0.04)
        fours_w = ml_ratio(w.get('fours', 0.03), 0.03)
        sixes_w = ml_ratio(w.get('sixes', 0.03), 0.03)
        death_w = ml_ratio(w.get('runs_in_death', 0.03), 0.03)

        score = (runs * 0.5 * runs_w +
                 sr * 0.2 * sr_w +
                 fours * 2 * fours_w +
                 sixes * 3 * sixes_w +
                 death_runs * 0.3 * death_w)
        return max(0, score)

    # Rule-based fallback
    return runs * 0.5 + sr * 0.2 + fours * 2 + sixes * 3


def calculate_bowling_performance(row, ml_weights=None):
    """
    Bowling performance score using ML-weighted formula.
    score = (wickets * 15 * w1) + (dots * 1 * w2) + (eco_bonus * w3) + (death_wk * 5 * w4)
    """
    wickets = float(row.get('wickets', 0))
    dot_balls = float(row.get('dot_balls', 0))
    economy = float(row.get('economy', 0))
    death_wickets = float(row.get('wickets_in_death', 0))

    if ml_weights and 'bowling_weights' in ml_weights:
        w = ml_weights['bowling_weights']
        wk_w = ml_ratio(w.get('wickets', 0.2), 0.2)
        dot_w = ml_ratio(w.get('dot_balls', 0.03), 0.03)
        eco_w = ml_ratio(w.get('economy', 0.03), 0.03)
        death_wk_w = ml_ratio(w.get('wickets_in_death', 0.06), 0.06)

        eco_bonus = max(0, (8 - economy)) * 3 * eco_w
        score = (wickets * 15 * wk_w +
                 dot_balls * 1 * dot_w +
                 eco_bonus +
                 death_wickets * 5 * death_wk_w)
        return max(0, score)

    # Rule-based fallback
    eco_bonus = max(0, (8 - economy)) * 3
    return wickets * 15 + dot_balls * 1 + eco_bonus


def calculate_defending_pressure_bonus(row, innings_type):
    """Bonus for bowlers defending low totals with good economy."""
    if innings_type != 'bowling':
        return 0

    is_chasing = bool(float(row.get('is_chasing', 0)))
    if is_chasing:
        return 0

    first_total = float(row.get('first_innings_total', 0))
    if first_total <= 0:
        return 0

    economy = float(row.get('economy', 0))

    if first_total < 150 and economy < 6:
        return (6 - economy) * 2
    if first_total < 170 and economy < 7:
        return (7 - economy) * 1.5
    return 0


def sigmoid_normalize(raw_impact, innings_type):
    """
    Normalize raw impact to 0-100 using logistic sigmoid.
    Batting: median=40, steepness=0.026
    Bowling: median=28, steepness=0.030
    """
    if innings_type == 'batting':
        median, steepness = 40, 0.026
    else:
        median, steepness = 28, 0.030

    normalized = 100 / (1 + math.exp(-steepness * (raw_impact - median)))
    return max(0, min(100, normalized))


def calculate_impact(row, innings_type, ml_weights=None):
    """
    Full impact calculation pipeline:
    Impact = Performance x Context x Pressure x Knockout -> Sigmoid normalize

    Returns dict with all components for transparency.
    """
    # 1. Performance score
    if innings_type == 'batting':
        performance = calculate_batting_performance(row, ml_weights)
    else:
        performance = calculate_bowling_performance(row, ml_weights)
        performance += calculate_defending_pressure_bonus(row, innings_type)

    # 2. Context weight
    context_weight = calculate_context_weight(row, innings_type, ml_weights)

    # 3. Pressure weight
    pressure_weight = calculate_pressure_weight(row, innings_type, ml_weights)

    # 4. Knockout multiplier
    is_knockout = bool(float(row.get('is_knockout', 0)))
    knockout_mult = 1.15 if is_knockout else 1.0

    # 5. Raw impact
    raw_impact = performance * context_weight * pressure_weight * knockout_mult

    # 6. Sigmoid normalization
    impact_score = sigmoid_normalize(raw_impact, innings_type)

    return {
        'performance': round(performance, 2),
        'context_weight': round(context_weight, 4),
        'pressure_weight': round(pressure_weight, 4),
        'knockout_mult': knockout_mult,
        'raw_impact': round(raw_impact, 2),
        'impact_score': round(impact_score, 1),
    }
