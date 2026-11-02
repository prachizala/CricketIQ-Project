import { BattingInnings, BowlingInnings, PlayerInnings } from './types';

export interface BattingFeatures {
  runs: number;
  ballsFaced: number;
  strikeRate: number;
  fours: number;
  sixes: number;
  boundaries: number;
  dotBallPercentage: number;
}

export interface BowlingFeatures {
  wickets: number;
  runsConceded: number;
  ballsBowled: number;
  dotBalls: number;
  economy: number;
  overs: number;
}

export interface ContextFeatures {
  overPhase: 'powerplay' | 'middle' | 'death';
  isChasing: boolean;
  opponent: string;
}

export interface PressureFeatures {
  requiredRunRate: number;
  wicketsRemaining: number;
  ballsRemaining: number;
  matchStage: 'early' | 'middle' | 'late';
}

export function extractBattingFeatures(innings: BattingInnings): BattingFeatures {
  return {
    runs: innings.runs,
    ballsFaced: innings.ballsFaced,
    strikeRate: innings.strikeRate,
    fours: innings.fours,
    sixes: innings.sixes,
    boundaries: innings.fours + innings.sixes,
    dotBallPercentage: innings.ballsFaced > 0
      ? ((innings.ballsFaced - innings.runs) / innings.ballsFaced) * 100
      : 0,
  };
}

export function extractBowlingFeatures(innings: BowlingInnings): BowlingFeatures {
  return {
    wickets: innings.wickets,
    runsConceded: innings.runsConceded,
    ballsBowled: innings.ballsBowled,
    dotBalls: innings.dotBalls,
    economy: innings.economy,
    overs: innings.ballsBowled / 6,
  };
}

export function extractContextFeatures(innings: PlayerInnings): ContextFeatures {
  // Determine phase where the player contributed most using actual phase data
  let overPhase: 'powerplay' | 'middle' | 'death' = 'middle';

  if (innings.type === 'batting') {
    const bat = innings as BattingInnings;
    const ppBalls = bat.ballsInPowerplay || 0;
    const midBalls = bat.ballsInMiddle || 0;
    const deathBalls = bat.ballsInDeath || 0;
    if (ppBalls >= midBalls && ppBalls >= deathBalls) overPhase = 'powerplay';
    else if (deathBalls >= midBalls) overPhase = 'death';
    else overPhase = 'middle';
  } else {
    const bowl = innings as BowlingInnings;
    const ppBalls = bowl.ballsInPowerplay || 0;
    const midBalls = bowl.ballsInMiddle || 0;
    const deathBalls = bowl.ballsInDeath || 0;
    if (ppBalls >= midBalls && ppBalls >= deathBalls) overPhase = 'powerplay';
    else if (deathBalls >= midBalls) overPhase = 'death';
    else overPhase = 'middle';
  }

  return {
    overPhase,
    isChasing: innings.isChasing,
    opponent: innings.opponent,
  };
}

export function extractPressureFeatures(innings: PlayerInnings): PressureFeatures {
  if (innings.type === 'batting') {
    const rrr = innings.requiredRunRate;
    const wk = innings.wicketsRemaining;
    return {
      requiredRunRate: rrr,
      wicketsRemaining: wk,
      ballsRemaining: 120,
      matchStage: rrr > 10 ? 'late' : rrr > 6 ? 'middle' : 'early',
    };
  }

  // Bowlers face pressure too:
  // - When defending (bowling 2nd innings), the RRR tells how hard batsmen are pushing
  // - When the first innings total is low, every run conceded matters more
  // - Death-over bowling is inherently high pressure
  const bowl = innings as BowlingInnings;
  const deathBalls = bowl.ballsInDeath || 0;
  const totalBalls = bowl.ballsBowled || 1;
  const deathPct = deathBalls / totalBalls;

  // Bowler pressure: economy relative to par (8 RPO)
  const ecoPressure = bowl.economy > 10 ? 10 : bowl.economy;
  // First innings total — lower total = more pressure on bowler to be economical
  const firstTotal = ('firstInningsTotal' in innings ? innings.firstInningsTotal : 0) || 0;
  const defendingLow = !bowl.isChasing && firstTotal > 0 && firstTotal < 160;

  let pressureRRR = 0;
  if (defendingLow) {
    // Simulate pressure: defending 140 feels like chasing at RRR 9+
    pressureRRR = Math.max(0, 12 - (firstTotal / 20));
  }
  if (deathPct > 0.4) {
    // Bowled mainly in death overs — inherently high pressure
    pressureRRR = Math.max(pressureRRR, 8);
  }

  return {
    requiredRunRate: pressureRRR,
    wicketsRemaining: 10, // not directly applicable to bowlers
    ballsRemaining: 120,
    matchStage: deathPct > 0.4 ? 'late' : ecoPressure > 8 ? 'middle' : 'early',
  };
}
