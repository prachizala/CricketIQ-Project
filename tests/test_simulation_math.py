"""
CricketIQ Simulation Math Unit Tests
Validates:
- Batting and bowling performance scoring math
- Win Probability Added (WPA) mathematical bounds [0.0, 1.0]
- Sigmoid normalization [0.0, 100.0]
- Critical cricket match edge cases:
  * 0 balls remaining (loss vs win)
  * Target reached (runs_needed <= 0)
  * 0 wickets remaining (all out)
  * Impossible run requirements
  * RRR singularities (0 overs left)
"""

import math
import os
import sys
import unittest

# Ensure scripts directory is on Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'scripts')))

from simulation_engine import (
    calculate_required_run_rate,
    calculate_win_probability,
    calculate_wpa,
    calculate_batting_score,
    calculate_bowling_score,
    sigmoid_normalize,
)


class TestScoreCalculations(unittest.TestCase):
    """Test batting, bowling, and normalized impact score formulations."""

    def test_batting_score_zero_case(self):
        """Zero runs off zero balls should evaluate to 0.0 without division by zero."""
        score = calculate_batting_score(runs=0, balls=0, fours=0, sixes=0)
        self.assertEqual(score, 0.0)

    def test_batting_score_standard_performance(self):
        """Verify batting score calculation for standard innings."""
        # 50 runs off 30 balls (SR = 166.67), 4 fours, 2 sixes, 10 death runs
        # P_bat = (50 * 0.5) + (166.6667 * 0.2) + (4 * 2) + (2 * 3) + (10 * 0.3)
        # = 25 + 33.333 + 8 + 6 + 3 = 75.333
        score = calculate_batting_score(runs=50, balls=30, fours=4, sixes=2, death_runs=10)
        self.assertAlmostEqual(score, 75.333, places=2)

    def test_bowling_score_standard_performance(self):
        """Verify bowling score calculation including economy bonus."""
        # 3 wickets, 4 overs (24 balls), 20 runs conceded (eco = 5.0), 12 dot balls, 1 death wicket
        # Eco bonus = (8.0 - 5.0) * 3 = 9.0
        # P_bowl = (3 * 15) + (12 * 1) + 9.0 + (1 * 5) = 45 + 12 + 9 + 5 = 71.0
        score = calculate_bowling_score(wickets=3, overs=4.0, runs_conceded=20, dot_balls=12, death_wickets=1)
        self.assertEqual(score, 71.0)

    def test_sigmoid_normalization_bounds(self):
        """Sigmoid normalized scores must strictly be within [0.0, 100.0]."""
        for raw in [-100.0, -10.0, 0.0, 28.0, 40.0, 100.0, 500.0, 10000.0]:
            bat_norm = sigmoid_normalize(raw, innings_type='batting')
            bowl_norm = sigmoid_normalize(raw, innings_type='bowling')
            self.assertGreaterEqual(bat_norm, 0.0)
            self.assertLessEqual(bat_norm, 100.0)
            self.assertGreaterEqual(bowl_norm, 0.0)
            self.assertLessEqual(bowl_norm, 100.0)


class TestWinProbabilityAndWPABounds(unittest.TestCase):
    """Test Win Probability estimates and Win Probability Added bounds."""

    def test_win_probability_bounded_zero_to_one(self):
        """Win probability must strictly remain between 0.0 and 1.0 across diverse game states."""
        scenarios = [
            (180, 45, 24, 6),    # 45 needed off 24 balls, 6 wickets in hand
            (200, 10, 18, 9),    # Easy chase
            (160, 80, 30, 2),    # Difficult chase
            (140, 1, 60, 10),    # Practically won
            (220, 100, 12, 1),   # Practically lost
        ]
        for target, runs_needed, balls_left, wickets in scenarios:
            prob = calculate_win_probability(target, runs_needed, balls_left, wickets)
            self.assertGreaterEqual(prob, 0.0, f"Failed lower bound for {runs_needed} off {balls_left}")
            self.assertLessEqual(prob, 1.0, f"Failed upper bound for {runs_needed} off {balls_left}")

    def test_wpa_delta_bounds(self):
        """Win Probability Added (WPA) delta must strictly fall within [-1.0, 1.0]."""
        test_pairs = [
            (0.50, 0.75),   # +0.25 swing
            (0.80, 0.20),   # -0.60 swing
            (0.00, 1.00),   # +1.00 max swing
            (1.00, 0.00),   # -1.00 max loss swing
            (0.45, 0.45),   # 0.00 neutral event
        ]
        for p_before, p_after in test_pairs:
            wpa = calculate_wpa(p_before, p_after)
            self.assertGreaterEqual(wpa, -1.0)
            self.assertLessEqual(wpa, 1.0)
            self.assertAlmostEqual(wpa, p_after - p_before, places=5)


class TestSimulationEdgeCases(unittest.TestCase):
    """Verify critical boundary and edge cases in cricket match progression."""

    def test_zero_balls_left_and_target_not_reached(self):
        """When 0 balls remain and runs are still needed, win probability must be exactly 0.0."""
        prob = calculate_win_probability(target=180, runs_needed=4, balls_left=0, wickets_remaining=5)
        self.assertEqual(prob, 0.0)

    def test_target_reached_edge_case(self):
        """When runs needed <= 0 at any ball count, win probability must be exactly 1.0."""
        self.assertEqual(calculate_win_probability(target=160, runs_needed=0, balls_left=12, wickets_remaining=4), 1.0)
        self.assertEqual(calculate_win_probability(target=160, runs_needed=-3, balls_left=5, wickets_remaining=6), 1.0)
        self.assertEqual(calculate_win_probability(target=160, runs_needed=0, balls_left=0, wickets_remaining=2), 1.0)

    def test_zero_wickets_remaining_all_out(self):
        """When wickets remaining <= 0 and target is not reached, win probability must be 0.0."""
        prob = calculate_win_probability(target=175, runs_needed=15, balls_left=18, wickets_remaining=0)
        self.assertEqual(prob, 0.0)

    def test_impossible_run_requirement(self):
        """If runs needed exceed max possible legal delivery scoring (6 * balls_left), win probability must be 0.0."""
        # 37 needed off 6 balls is impossible without extras
        prob = calculate_win_probability(target=200, runs_needed=37, balls_left=6, wickets_remaining=5)
        self.assertEqual(prob, 0.0)

    def test_required_run_rate_singularities(self):
        """calculate_required_run_rate should handle 0 overs left and 0 runs needed without throwing."""
        # 0 runs needed -> 0.0 RRR
        self.assertEqual(calculate_required_run_rate(runs_needed=0, overs_remaining=4.0), 0.0)
        self.assertEqual(calculate_required_run_rate(runs_needed=-2, overs_remaining=2.0), 0.0)
        
        # 0 overs remaining with runs needed -> infinity
        rrr_inf = calculate_required_run_rate(runs_needed=10, overs_remaining=0)
        self.assertTrue(math.isinf(rrr_inf))

        # Normal case
        rrr_normal = calculate_required_run_rate(runs_needed=36, overs_remaining=3.0)
        self.assertEqual(rrr_normal, 12.0)

    def test_extreme_pressure_chase_progression(self):
        """Simulate Rinku Singh miraculous final over chase: 29 needed off 6 balls."""
        # Ball 0 (start of over): 29 off 6 balls, 3 wickets in hand
        p0 = calculate_win_probability(target=205, runs_needed=29, balls_left=6, wickets_remaining=3)
        self.assertGreater(p0, 0.0)
        self.assertLess(p0, 0.15)  # Very low probability

        # Ball 1: 6 runs -> 23 off 5 balls
        p1 = calculate_win_probability(target=205, runs_needed=23, balls_left=5, wickets_remaining=3)
        wpa1 = calculate_wpa(p0, p1)
        self.assertGreater(wpa1, 0.0)
        self.assertGreater(p1, p0)

        # Ball 5: 5 needed off 1 ball
        p5 = calculate_win_probability(target=205, runs_needed=5, balls_left=1, wickets_remaining=3)
        self.assertGreaterEqual(p5, 0.0)
        self.assertLessEqual(p5, 1.0)

        # Ball 6: 6 runs hit -> 0 needed (target reached!)
        p6 = calculate_win_probability(target=205, runs_needed=-1, balls_left=0, wickets_remaining=3)
        self.assertEqual(p6, 1.0)
        wpa_final = calculate_wpa(p5, p6)
        self.assertGreater(wpa_final, 0.9)
        self.assertLessEqual(wpa_final, 1.0)


if __name__ == '__main__':
    unittest.main()
