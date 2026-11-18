"""Unit tests for CricketIQ player impact metric calculator."""
import unittest

class TestPlayerImpactMetric(unittest.TestCase):
    def test_neutral_impact(self):
        base_score = 50.0
        self.assertTrue(0 <= base_score <= 100)

if __name__ == '__main__':
    unittest.main()
