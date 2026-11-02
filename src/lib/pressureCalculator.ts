import { PressureFeatures } from './featureEngineering';

/**
 * Pressure Weight Calculation
 *
 * Required run rate > 10 → 1.4
 * Required run rate > 8 → 1.2
 * Wickets remaining < 4 → +0.2
 *
 * Additional factors:
 * - Late match stage bonus
 * - Low wickets in hand pressure
 */
export function calculatePressureWeight(pressure: PressureFeatures): number {
  let weight = 1.0;

  // Required run rate pressure
  if (pressure.requiredRunRate > 10) {
    weight = 1.4;
  } else if (pressure.requiredRunRate > 8) {
    weight = 1.2;
  } else if (pressure.requiredRunRate > 6) {
    weight = 1.1;
  }

  // Wickets remaining pressure
  if (pressure.wicketsRemaining < 4) {
    weight += 0.2;
  } else if (pressure.wicketsRemaining < 6) {
    weight += 0.1;
  }

  // Match stage modifier
  if (pressure.matchStage === 'late') {
    weight += 0.1;
  }

  return Math.min(weight, 2.0); // Cap at 2.0
}

/**
 * Get pressure level label for UI
 */
export function getPressureLevel(weight: number): { level: string; color: string } {
  if (weight >= 1.6) return { level: 'Extreme', color: '#ef4444' };
  if (weight >= 1.4) return { level: 'High', color: '#f97316' };
  if (weight >= 1.2) return { level: 'Medium', color: '#eab308' };
  return { level: 'Low', color: '#22c55e' };
}
