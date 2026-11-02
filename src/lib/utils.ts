import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(n: number, decimals: number = 1): string {
  return n.toFixed(decimals);
}

export function getImpactColor(score: number): string {
  if (score >= 75) return '#22c55e';
  if (score >= 60) return '#84cc16';
  if (score >= 50) return '#eab308';
  if (score >= 35) return '#f97316';
  return '#ef4444';
}

export function getImpactLabel(score: number): string {
  if (score >= 75) return 'Elite';
  if (score >= 60) return 'High';
  if (score >= 50) return 'Above Average';
  if (score >= 35) return 'Average';
  return 'Below Average';
}

export function getRoleIcon(role: string): string {
  switch (role) {
    case 'batsman': return '🏏';
    case 'bowler': return '🎳';
    case 'allrounder': return '⭐';
    default: return '🏏';
  }
}

export function getTeamColor(team: string): string {
  const colors: Record<string, string> = {
    'Mumbai Indians': '#004BA0',
    'Chennai Super Kings': '#FCCA06',
    'Royal Challengers Bangalore': '#EC1C24',
    'Royal Challengers Bengaluru': '#EC1C24',
    'Kolkata Knight Riders': '#3A225D',
    'Delhi Capitals': '#004C93',
    'Delhi Daredevils': '#004C93',
    'Sunrisers Hyderabad': '#FF822A',
    'Rajasthan Royals': '#EA1A85',
    'Punjab Kings': '#ED1B24',
    'Kings XI Punjab': '#ED1B24',
    'Gujarat Titans': '#1C1C2B',
    'Lucknow Super Giants': '#A72056',
    'Rising Pune Supergiant': '#6F3B8C',
    'Rising Pune Supergiants': '#6F3B8C',
    'Pune Warriors': '#2F9BE3',
    'Deccan Chargers': '#4A4A4A',
    'Gujarat Lions': '#E04F16',
    'Kochi Tuskers Kerala': '#6F2DA8',
  };
  return colors[team] || '#6366f1';
}
