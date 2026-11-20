"""Batter versus bowler matchup tactical matrix generator."""


class MatchupMatrixGenerator:
    """Computes head-to-head tactical efficiency metrics between batter and bowler."""

    @staticmethod
    def compute_matchup_metrics(balls_faced: int, runs_scored: int, dismissals: int) -> dict:
        """Returns head-to-head strike rate, average, and dot ball percentage."""
        strike_rate = (runs_scored / balls_faced * 100.0) if balls_faced > 0 else 0.0
        batting_avg = (runs_scored / dismissals) if dismissals > 0 else float(runs_scored)
        return {
            "balls_faced": balls_faced,
            "runs_scored": runs_scored,
            "dismissals": dismissals,
            "strike_rate": round(strike_rate, 2),
            "batting_average": round(batting_avg, 2),
        }
