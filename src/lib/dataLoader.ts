import { PlayerData, MatchData, PlayerImpact } from './types';
import { calculatePlayerImpact, calculateMatchImpact } from './impactEngine';

// Import preprocessed data
import matchesJson from '@/data/matches.json';
import playerInningsJson from '@/data/playerInnings.json';

const matchesData = matchesJson as unknown as MatchData[];
const playerInningsData = playerInningsJson as unknown as Record<string, PlayerData>;

let _playerImpactCache: PlayerImpact[] | null = null;

export function getMatches(): MatchData[] {
  return matchesData;
}

export function getMatchById(matchId: string): MatchData | undefined {
  return matchesData.find(m => m.matchId === matchId);
}

export function getRecentMatches(n: number = 20): MatchData[] {
  return [...matchesData].sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, n);
}

export function getAllPlayerData(): Record<string, PlayerData> {
  return playerInningsData;
}

export function getPlayerData(name: string): PlayerData | undefined {
  return playerInningsData[name];
}

export function getAllPlayerImpacts(): PlayerImpact[] {
  if (_playerImpactCache) return _playerImpactCache;

  const impacts: PlayerImpact[] = [];
  for (const [name, data] of Object.entries(playerInningsData)) {
    // Only include players with meaningful data (at least 5 matches)
    const matchIds = new Set(data.innings.map(i => i.matchId));
    if (matchIds.size >= 5) {
      impacts.push(calculatePlayerImpact(name, data));
    }
  }

  _playerImpactCache = impacts.sort((a, b) => b.impactScore - a.impactScore);
  return _playerImpactCache;
}

export function getTopPlayers(n: number = 10): PlayerImpact[] {
  return getAllPlayerImpacts().slice(0, n);
}

export function getMatchImpactPlayers(matchId: string) {
  return calculateMatchImpact(matchId, playerInningsData);
}

export function getPlayersByTeam(team: string): PlayerImpact[] {
  return getAllPlayerImpacts().filter(p => p.team === team);
}

export function getSeasons(): string[] {
  const seasons = new Set(matchesData.map(m => m.season).filter(Boolean));
  return [...seasons].sort().reverse();
}

export function getTeams(): string[] {
  const teams = new Set(matchesData.flatMap(m => m.teams));
  return [...teams].sort();
}

export function getPlayersByRole(role: 'batsman' | 'bowler' | 'allrounder'): PlayerImpact[] {
  return getAllPlayerImpacts().filter(p => p.role === role);
}
