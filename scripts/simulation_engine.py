"""
CricketIQ Simulation Engine & Mathematical Models
Provides core formulas for:
- Required Run Rate (RRR)
- Win Probability (Chasing equity)
- Win Probability Added (WPA)
- Impact Performance Scores (Batting & Bowling)
- Sigmoid-normalized Impact Metrics (0 to 100)
"""

import math
from typing import Dict, Any, Tuple, Optional


def calculate_required_run_rate(runs_needed: float, overs_remaining: float) -> float:
    """Calculate Required Run Rate (RRR) with boundary guards."""
    if runs_needed <= 0:
        return 0.0
    if overs_remaining <= 0:
        return float('inf')
    return runs_needed / overs_remaining


def calculate_win_probability(
    target: int,
    runs_needed: int,
    balls_left: int,
    wickets_remaining: int,
    is_knockout: bool = False
) -> float:
    """
    Calculate Chase Win Probability bounded strictly between [0.0, 1.0].
    
    Edge cases handled:
    - Target reached (runs_needed <= 0): Win probability = 1.0
    - Balls exhausted (balls_left <= 0 and runs_needed > 0): Win probability = 0.0
    - All out (wickets_remaining <= 0 and runs_needed > 0): Win probability = 0.0
    """
    if runs_needed <= 0:
        return 1.0
    if balls_left <= 0:
        return 0.0
    if wickets_remaining <= 0:
        return 0.0

    overs_remaining = balls_left / 6.0
    rrr = runs_needed / overs_remaining

    # If mathematically impossible in remaining legal deliveries (max 6 runs per ball)
    if runs_needed > balls_left * 6:
        return 0.0

    # Calibrated T20 chasing model: par required run rate is 8.5
    par_rrr = 8.5
    rrr_delta = par_rrr - rrr
    # Wickets in hand weighting (neutral at 5 wickets)
    wicket_weight = (wickets_remaining - 5) * 0.35
    
    # Knockout matches have slightly higher pressure discount on chasing
    knockout_shift = -0.15 if is_knockout else 0.0
    
    logit = 0.45 * rrr_delta + wicket_weight + knockout_shift
    
    # Logistic sigmoid
    prob = 1.0 / (1.0 + math.exp(-logit))
    return max(0.0, min(1.0, prob))


def calculate_wpa(prob_before: float, prob_after: float) -> float:
    """
    Calculate Win Probability Added (WPA) for an event.
    Returns delta bounded strictly within [-1.0, 1.0].
    """
    p_before = max(0.0, min(1.0, prob_before))
    p_after = max(0.0, min(1.0, prob_after))
    delta = p_after - p_before
    return max(-1.0, min(1.0, delta))


def calculate_batting_score(
    runs: float,
    balls: float,
    fours: int = 0,
    sixes: int = 0,
    death_runs: float = 0
) -> float:
    """
    Batting raw performance score formula:
    P_bat = (runs * 0.5) + (SR * 0.2) + (4s * 2) + (6s * 3) + (death_runs * 0.3)
    """
    if balls <= 0:
        sr = 0.0
    else:
        sr = (runs / balls) * 100.0

    score = (runs * 0.5) + (sr * 0.2) + (fours * 2.0) + (sixes * 3.0) + (death_runs * 0.3)
    return max(0.0, score)


def calculate_bowling_score(
    wickets: int,
    overs: float,
    runs_conceded: float,
    dot_balls: int = 0,
    death_wickets: int = 0
) -> float:
    """
    Bowling raw performance score formula:
    P_bowl = (wickets * 15) + (dots * 1) + max(0, (8 - eco) * 3) + (death_wickets * 5)
    """
    if overs <= 0:
        eco = 8.0
    else:
        eco = runs_conceded / overs

    eco_bonus = max(0.0, (8.0 - eco) * 3.0)
    score = (wickets * 15.0) + (dot_balls * 1.0) + eco_bonus + (death_wickets * 5.0)
    return max(0.0, score)


def sigmoid_normalize(raw_impact: float, innings_type: str = 'batting') -> float:
    """
    Normalize raw impact to [0.0, 100.0] via logistic sigmoid.
    Batting: median=40, k=0.026
    Bowling: median=28, k=0.030
    """
    if innings_type == 'batting':
        median, k = 40.0, 0.026
    else:
        median, k = 28.0, 0.030

    norm = 100.0 / (1.0 + math.exp(-k * (raw_impact - median)))
    return max(0.0, min(100.0, norm))
