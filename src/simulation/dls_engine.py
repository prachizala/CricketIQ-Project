"""Duckworth-Lewis-Stern (DLS) rain interruption target recalculator."""


class DLSEngine:
    """Calculates revised victory targets under rain interruptions for white-ball cricket."""

    @staticmethod
    def compute_revised_target(first_innings_total: int, revised_overs: int, total_overs: int = 20) -> int:
        """Computes standardized revised target score proportional to available overs."""
        if revised_overs >= total_overs:
            return first_innings_total + 1
        over_ratio = revised_overs / total_overs
        revised_score = int(first_innings_total * over_ratio)
        return revised_score + 1
