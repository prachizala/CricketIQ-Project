"""Win Probability Added (WPA) and ball-by-ball leverage calculation engine."""


class WPACalculator:
    """Calculates player WPA delta based on state transition in win probability."""

    @staticmethod
    def calculate_wpa_delta(pre_ball_prob: float, post_ball_prob: float) -> float:
        """Returns the net percentage win probability shift caused by the delivery."""
        return round(post_ball_prob - pre_ball_prob, 4)

    @staticmethod
    def calculate_leverage_index(runs_needed: int, balls_remaining: int, wickets_lost: int) -> float:
        """Computes situational pressure leverage index for the batting team."""
        if balls_remaining <= 0:
            return 0.0
        required_rr = (runs_needed / balls_remaining) * 6
        wickets_in_hand = 10 - wickets_lost
        return round((required_rr / 6.0) * (10.0 / max(wickets_in_hand, 1)), 2)
