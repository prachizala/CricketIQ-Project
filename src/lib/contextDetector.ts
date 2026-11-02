import { ContextFeatures } from './featureEngineering';

/**
 * Match Context Weight — different for batting vs bowling
 *
 * BATTING:
 *   Powerplay → 1.0  (field restrictions help, easier to score)
 *   Middle    → 1.15 (rebuilding / accelerating, moderate difficulty)
 *   Death     → 1.4  (high SR needed, big hitting, survival is hard)
 *
 * BOWLING:
 *   Powerplay → 1.3  (early wickets are crucial, fielding restrictions make it harder)
 *   Middle    → 1.0  (containment phase, standard difficulty)
 *   Death     → 1.5  (yorkers, variations, hardest phase to bowl)
 *
 * Chasing adds 1.1x for batting (pressure), no extra for bowling
 */
export function calculateContextWeight(context: ContextFeatures, type?: 'batting' | 'bowling'): number {
  let weight = 1.0;

  if (type === 'bowling') {
    switch (context.overPhase) {
      case 'powerplay':
        weight = 1.3;
        break;
      case 'middle':
        weight = 1.0;
        break;
      case 'death':
        weight = 1.5;
        break;
    }
  } else {
    // Batting (default)
    switch (context.overPhase) {
      case 'powerplay':
        weight = 1.0;
        break;
      case 'middle':
        weight = 1.15;
        break;
      case 'death':
        weight = 1.4;
        break;
    }

    // Chasing bonus — only for batting (chasing adds pressure on batsmen)
    if (context.isChasing) {
      weight *= 1.1;
    }
  }

  return weight;
}

/**
 * Detect match situation type for UI labeling
 */
export function detectMatchSituation(context: ContextFeatures, rrr: number, wicketsRemaining: number): string {
  if (context.isChasing && rrr > 12 && wicketsRemaining < 4) {
    return 'Crisis';
  }
  if (context.isChasing && rrr > 10) {
    return 'High Pressure Chase';
  }
  if (context.isChasing && rrr > 8) {
    return 'Moderate Chase';
  }
  if (context.overPhase === 'death') {
    return 'Death Overs';
  }
  if (context.overPhase === 'powerplay') {
    return 'Powerplay';
  }
  return 'Standard';
}
