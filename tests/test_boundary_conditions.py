"""Unit tests for player impact metric edge conditions."""
import unittest

class TestMetricBoundaries(unittest.TestCase):
    def test_zero_deliveries_handled(self):
        runs = 0
        balls = 0
        sr = (runs / balls * 100) if balls > 0 else 0.0
        self.assertEqual(sr, 0.0)

if __name__ == '__main__':
    unittest.main()
