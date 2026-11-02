export interface BattingInnings {
  matchId: string;
  season: string;
  date: string;
  type: 'batting';
  runs: number;
  ballsFaced: number;
  fours: number;
  sixes: number;
  strikeRate: number;
  isOut: boolean;
  isChasing: boolean;
  requiredRunRate: number;
  wicketsRemaining: number;
  opponent: string;
  matchResult: 'won' | 'lost' | 'nr';
  // ML features
  boundaryPct?: number;
  dotBallPct?: number;
  runsInPowerplay?: number;
  runsInMiddle?: number;
  runsInDeath?: number;
  ballsInPowerplay?: number;
  ballsInMiddle?: number;
  ballsInDeath?: number;
  battingPosition?: number;
  runRateDiff?: number;
  matchStagePct?: number;
  isKnockout?: boolean;
  firstInningsTotal?: number;
}

export interface BowlingInnings {
  matchId: string;
  season: string;
  date: string;
  type: 'bowling';
  wickets: number;
  runsConceded: number;
  ballsBowled: number;
  dotBalls: number;
  economy: number;
  isChasing: boolean;
  opponent: string;
  matchResult: 'won' | 'lost' | 'nr';
  // ML features
  dotBallPct?: number;
  wicketsInPowerplay?: number;
  wicketsInMiddle?: number;
  wicketsInDeath?: number;
  runsInPowerplay?: number;
  runsInMiddle?: number;
  runsInDeath?: number;
  ballsInPowerplay?: number;
  ballsInMiddle?: number;
  ballsInDeath?: number;
  isKnockout?: boolean;
  firstInningsTotal?: number;
}

export type PlayerInnings = BattingInnings | BowlingInnings;

export interface PlayerData {
  team: string;
  innings: PlayerInnings[];
}

export interface MatchData {
  matchId: string;
  season: string;
  date: string;
  venue: string;
  city: string;
  teams: string[];
  winner: string;
  winnerRuns: number;
  winnerWickets: number;
  playerOfMatch: string;
  isKnockout?: boolean;
  innings: {
    innings: number;
    battingTeam: string;
    bowlingTeam: string;
    totalRuns: number;
    totalWickets: number;
    overs: number;
  }[];
}

export interface ImpactBreakdown {
  performanceScore: number;
  contextWeight: number;
  pressureWeight: number;
  rawImpact: number;
  normalizedImpact: number;
}

export interface PlayerImpact {
  name: string;
  team: string;
  impactScore: number;
  matchesPlayed: number;
  battingAvg: number;
  bowlingAvg: number;
  strikeRate: number;
  economy: number;
  recentForm: number[];
  role: 'batsman' | 'bowler' | 'allrounder';
  winRate: number;
  lastSeason: string;
}

export interface MatchImpact {
  matchId: string;
  players: {
    name: string;
    team: string;
    impact: number;
    breakdown: ImpactBreakdown;
  }[];
}
