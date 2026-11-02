// Preprocess IPL CSV data into aggregated JSON for the app
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'ipl_male_csv2');
const OUT_DIR = path.join(__dirname, '..', 'src', 'data');

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') {
      inQuotes = !inQuotes;
    } else if (line[i] === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += line[i];
    }
  }
  result.push(current.trim());
  return result;
}

function parseCSV(text) {
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = parseCSVLine(lines[0]);
  return lines.slice(1).map(line => {
    const values = parseCSVLine(line);
    const obj = {};
    headers.forEach((h, i) => { obj[h] = values[i] || ''; });
    return obj;
  });
}

function parseInfoCSV(text) {
  const lines = text.split('\n').filter(l => l.trim());
  const info = { teams: [], players: {} };
  for (const line of lines) {
    const parts = parseCSVLine(line);
    if (parts[0] === 'info') {
      const key = parts[1];
      if (key === 'team') info.teams.push(parts[2]);
      else if (key === 'winner') info.winner = parts[2];
      else if (key === 'winner_runs') info.winner_runs = parseInt(parts[2]) || 0;
      else if (key === 'winner_wickets') info.winner_wickets = parseInt(parts[2]) || 0;
      else if (key === 'venue') info.venue = parts[2];
      else if (key === 'city') info.city = parts[2];
      else if (key === 'date') info.date = parts[2];
      else if (key === 'season') info.season = parts[2];
      else if (key === 'match_number') info.match_number = parseInt(parts[2]) || 0;
      else if (key === 'player_of_match') info.player_of_match = parts[2];
      else if (key === 'player') {
        const team = parts[2];
        if (!info.players[team]) info.players[team] = [];
        info.players[team].push(parts[3]);
      }
    }
  }
  return info;
}

// Get over number from ball notation (e.g., 0.1 -> 0, 5.3 -> 5, 15.2 -> 15)
function getOverNum(ball) {
  return Math.floor(parseFloat(ball));
}

function getPhase(overNum) {
  if (overNum < 6) return 'powerplay';
  if (overNum < 16) return 'middle';
  return 'death';
}

// Get all match IDs
const files = fs.readdirSync(DATA_DIR);
const matchIds = [...new Set(files.filter(f => !f.includes('_info') && f.endsWith('.csv')).map(f => f.replace('.csv', '')))];

console.log(`Processing ${matchIds.length} matches...`);

// First pass: find max match number per season to detect knockouts
const seasonMaxMatch = {};
for (const mid of matchIds) {
  const ip = path.join(DATA_DIR, `${mid}_info.csv`);
  if (!fs.existsSync(ip)) continue;
  const txt = fs.readFileSync(ip, 'utf-8');
  let season = '', matchNum = 0;
  for (const line of txt.split('\n')) {
    const parts = parseCSVLine(line);
    if (parts[0] === 'info' && parts[1] === 'season') season = parts[2];
    if (parts[0] === 'info' && parts[1] === 'match_number') matchNum = parseInt(parts[2]) || 0;
  }
  if (season && matchNum) {
    seasonMaxMatch[season] = Math.max(seasonMaxMatch[season] || 0, matchNum);
  }
}

function isKnockoutMatch(season, matchNumber) {
  const max = seasonMaxMatch[season] || 0;
  if (!max || !matchNumber) return false;
  // Last 4 matches of any IPL season are playoffs (Qualifier 1, Eliminator, Qualifier 2, Final)
  return matchNumber > (max - 4);
}

const allMatches = [];
const playerInnings = {};

let processed = 0;
for (const matchId of matchIds) {
  const csvPath = path.join(DATA_DIR, `${matchId}.csv`);
  const infoPath = path.join(DATA_DIR, `${matchId}_info.csv`);

  if (!fs.existsSync(csvPath) || !fs.existsSync(infoPath)) continue;

  const balls = parseCSV(fs.readFileSync(csvPath, 'utf-8'));
  const info = parseInfoCSV(fs.readFileSync(infoPath, 'utf-8'));

  if (!info.season || !info.teams.length) continue;

  const season = info.season;
  const knockout = isKnockoutMatch(season, info.match_number);

  const matchData = {
    matchId,
    season,
    date: info.date,
    venue: info.venue,
    city: info.city,
    teams: info.teams,
    winner: info.winner,
    winnerRuns: info.winner_runs,
    winnerWickets: info.winner_wickets,
    playerOfMatch: info.player_of_match,
    isKnockout: knockout,
  };

  // Process ball-by-ball for each innings
  const inningsData = {};
  const battingStats = {};
  const bowlingStats = {};

  // Track per-phase stats for batsmen and bowlers
  const battingPhaseStats = {}; // batKey -> { powerplay: {runs, balls}, middle: {...}, death: {...} }
  const bowlingPhaseStats = {}; // bowlKey -> { powerplay: {wickets, runs, balls}, ... }
  const batterFirstBall = {};   // batKey -> first ball number (for batting position)

  for (const ball of balls) {
    const inn = parseInt(ball.innings);
    const over = parseFloat(ball.ball);
    const overNum = getOverNum(over);
    const phase = getPhase(overNum);
    const striker = ball.striker;
    const bowler = ball.bowler;
    const battingTeam = ball.batting_team;
    const bowlingTeam = ball.bowling_team;
    const runsOff = parseInt(ball.runs_off_bat) || 0;
    const extras = parseInt(ball.extras) || 0;
    const wides = parseInt(ball.wides) || 0;
    const noballs = parseInt(ball.noballs) || 0;
    const wicketType = ball.wicket_type;
    const dismissed = ball.player_dismissed;

    if (!inningsData[inn]) {
      inningsData[inn] = { battingTeam, bowlingTeam, totalRuns: 0, totalWickets: 0, balls: 0, overs: [] };
    }

    inningsData[inn].totalRuns += runsOff + extras;
    if (wicketType && wicketType !== '') inningsData[inn].totalWickets++;
    if (!wides) inningsData[inn].balls++;

    // Batting stats
    const batKey = `${striker}|${battingTeam}|${inn}`;
    if (!battingStats[batKey]) {
      battingStats[batKey] = {
        player: striker, team: battingTeam, innings: inn,
        runs: 0, ballsFaced: 0, fours: 0, sixes: 0, dotBalls: 0, isOut: false
      };
    }
    if (!wides) {
      battingStats[batKey].ballsFaced++;
      battingStats[batKey].runs += runsOff;
      if (runsOff === 4) battingStats[batKey].fours++;
      if (runsOff === 6) battingStats[batKey].sixes++;
      if (runsOff === 0 && extras === 0) battingStats[batKey].dotBalls++;
    }
    if (dismissed === striker) battingStats[batKey].isOut = true;

    // Phase-level batting stats
    if (!battingPhaseStats[batKey]) {
      battingPhaseStats[batKey] = {
        powerplay: { runs: 0, balls: 0 },
        middle: { runs: 0, balls: 0 },
        death: { runs: 0, balls: 0 },
      };
    }
    if (!wides) {
      battingPhaseStats[batKey][phase].runs += runsOff;
      battingPhaseStats[batKey][phase].balls++;
    }

    // Track batting position (first ball faced in innings)
    if (!batterFirstBall[batKey]) {
      batterFirstBall[batKey] = inningsData[inn].balls;
    }

    // Bowling stats
    const bowlKey = `${bowler}|${bowlingTeam}|${inn}`;
    if (!bowlingStats[bowlKey]) {
      bowlingStats[bowlKey] = {
        player: bowler, team: bowlingTeam, innings: inn,
        runsConceded: 0, ballsBowled: 0, wickets: 0, dotBalls: 0, maidens: 0
      };
    }
    if (!wides && !noballs) bowlingStats[bowlKey].ballsBowled++;
    bowlingStats[bowlKey].runsConceded += runsOff + (wides ? parseInt(ball.wides) || 0 : 0) + (noballs ? parseInt(ball.noballs) || 0 : 0);
    if (wicketType && wicketType !== '' && wicketType !== 'run out' && wicketType !== 'retired hurt' && wicketType !== 'retired out') {
      bowlingStats[bowlKey].wickets++;
    }
    if (runsOff === 0 && extras === 0 && !wides && !noballs) bowlingStats[bowlKey].dotBalls++;

    // Phase-level bowling stats
    if (!bowlingPhaseStats[bowlKey]) {
      bowlingPhaseStats[bowlKey] = {
        powerplay: { wickets: 0, runs: 0, balls: 0 },
        middle: { wickets: 0, runs: 0, balls: 0 },
        death: { wickets: 0, runs: 0, balls: 0 },
      };
    }
    if (!wides && !noballs) bowlingPhaseStats[bowlKey][phase].balls++;
    bowlingPhaseStats[bowlKey][phase].runs += runsOff;
    if (wicketType && wicketType !== '' && wicketType !== 'run out' && wicketType !== 'retired hurt' && wicketType !== 'retired out') {
      bowlingPhaseStats[bowlKey][phase].wickets++;
    }
  }

  // Calculate target for 2nd innings context
  const inn1 = inningsData[1];
  const inn2 = inningsData[2];
  const target = inn1 ? inn1.totalRuns + 1 : 0;

  // Build per-player innings records
  for (const [key, stats] of Object.entries(battingStats)) {
    const inn = stats.innings;
    const innData = inningsData[inn];
    const isChasing = inn === 2;
    const totalBallsInInnings = innData ? innData.balls : 120;

    const sr = stats.ballsFaced > 0 ? (stats.runs / stats.ballsFaced) * 100 : 0;

    // Context
    let requiredRunRate = 0;
    let wicketsRemaining = 10;
    if (isChasing && inn2) {
      const remainingRuns = target - inn2.totalRuns;
      const remainingBalls = 120 - inn2.balls;
      requiredRunRate = remainingBalls > 0 ? (remainingRuns / (remainingBalls / 6)) : 0;
      wicketsRemaining = 10 - inn2.totalWickets;
    }

    // Phase stats for this batter
    const phases = battingPhaseStats[key] || { powerplay: { runs: 0, balls: 0 }, middle: { runs: 0, balls: 0 }, death: { runs: 0, balls: 0 } };

    // Batting position (approximate: 1-based, derived from first ball faced)
    const firstBall = batterFirstBall[key] || 0;
    let battingPosition;
    if (firstBall <= 1) battingPosition = 1;       // opener
    else if (firstBall <= 12) battingPosition = 2;  // top order
    else if (firstBall <= 36) battingPosition = 3;  // top-middle
    else if (firstBall <= 60) battingPosition = 4;  // middle
    else if (firstBall <= 90) battingPosition = 5;  // lower-middle
    else battingPosition = 6;                       // lower order

    // Boundary percentage
    const boundaries = stats.fours + stats.sixes;
    const boundaryPct = stats.ballsFaced > 0 ? (boundaries / stats.ballsFaced) * 100 : 0;

    // Dot ball percentage
    const dotBallPct = stats.ballsFaced > 0 ? (stats.dotBalls / stats.ballsFaced) * 100 : 0;

    // Current run rate at time of batting
    const currentRunRate = totalBallsInInnings > 0 ? (innData.totalRuns / (totalBallsInInnings / 6)) : 0;
    const runRateDiff = isChasing ? currentRunRate - requiredRunRate : 0;

    // Match stage percentage
    const matchStagePct = totalBallsInInnings / 120;

    const playerKey = stats.player;
    if (!playerInnings[playerKey]) playerInnings[playerKey] = { team: stats.team, innings: [] };
    playerInnings[playerKey].team = stats.team;
    playerInnings[playerKey].innings.push({
      matchId,
      season,
      date: info.date,
      type: 'batting',
      runs: stats.runs,
      ballsFaced: stats.ballsFaced,
      fours: stats.fours,
      sixes: stats.sixes,
      strikeRate: sr,
      isOut: stats.isOut,
      isChasing,
      requiredRunRate: Math.max(0, requiredRunRate),
      wicketsRemaining,
      opponent: innData ? innData.bowlingTeam : (inn === 1 ? info.teams[1] : info.teams[0]),
      matchResult: info.winner === stats.team ? 'won' : info.winner ? 'lost' : 'nr',
      // New ML features
      boundaryPct: Math.round(boundaryPct * 100) / 100,
      dotBallPct: Math.round(dotBallPct * 100) / 100,
      runsInPowerplay: phases.powerplay.runs,
      runsInMiddle: phases.middle.runs,
      runsInDeath: phases.death.runs,
      ballsInPowerplay: phases.powerplay.balls,
      ballsInMiddle: phases.middle.balls,
      ballsInDeath: phases.death.balls,
      battingPosition,
      runRateDiff: Math.round(runRateDiff * 100) / 100,
      matchStagePct: Math.round(matchStagePct * 1000) / 1000,
      // Knockout & defending context
      isKnockout: knockout,
      firstInningsTotal: inn1 ? inn1.totalRuns : 0,
    });
  }

  for (const [key, stats] of Object.entries(bowlingStats)) {
    const inn = stats.innings;
    const innData = inningsData[inn];
    const eco = stats.ballsBowled > 0 ? (stats.runsConceded / (stats.ballsBowled / 6)) : 0;

    // Phase stats for this bowler
    const phases = bowlingPhaseStats[key] || { powerplay: { wickets: 0, runs: 0, balls: 0 }, middle: { wickets: 0, runs: 0, balls: 0 }, death: { wickets: 0, runs: 0, balls: 0 } };

    // Dot ball percentage for bowling
    const dotBallPct = stats.ballsBowled > 0 ? (stats.dotBalls / stats.ballsBowled) * 100 : 0;

    const playerKey = stats.player;
    if (!playerInnings[playerKey]) playerInnings[playerKey] = { team: stats.team, innings: [] };
    playerInnings[playerKey].team = stats.team;
    playerInnings[playerKey].innings.push({
      matchId,
      season,
      date: info.date,
      type: 'bowling',
      wickets: stats.wickets,
      runsConceded: stats.runsConceded,
      ballsBowled: stats.ballsBowled,
      dotBalls: stats.dotBalls,
      economy: eco,
      isChasing: inn === 2,
      opponent: innData ? innData.battingTeam : (inn === 1 ? info.teams[1] : info.teams[0]),
      matchResult: info.winner === stats.team ? 'won' : info.winner ? 'lost' : 'nr',
      // New ML features
      dotBallPct: Math.round(dotBallPct * 100) / 100,
      wicketsInPowerplay: phases.powerplay.wickets,
      wicketsInMiddle: phases.middle.wickets,
      wicketsInDeath: phases.death.wickets,
      runsInPowerplay: phases.powerplay.runs,
      runsInMiddle: phases.middle.runs,
      runsInDeath: phases.death.runs,
      ballsInPowerplay: phases.powerplay.balls,
      ballsInMiddle: phases.middle.balls,
      ballsInDeath: phases.death.balls,
      // Knockout & defending context
      isKnockout: knockout,
      firstInningsTotal: inn1 ? inn1.totalRuns : 0,
    });
  }

  // Store innings totals in match
  matchData.innings = Object.values(inningsData).map((d, i) => ({
    innings: i + 1,
    battingTeam: d.battingTeam,
    bowlingTeam: d.bowlingTeam,
    totalRuns: d.totalRuns,
    totalWickets: d.totalWickets,
    overs: Math.floor(d.balls / 6) + (d.balls % 6) / 10,
  }));

  allMatches.push(matchData);
  processed++;
  if (processed % 100 === 0) console.log(`  Processed ${processed} matches...`);
}

console.log(`Total matches: ${allMatches.length}`);
console.log(`Total players: ${Object.keys(playerInnings).length}`);

// Sort matches by date
allMatches.sort((a, b) => (a.date || '').localeCompare(b.date || ''));

// Write output
fs.mkdirSync(OUT_DIR, { recursive: true });

fs.writeFileSync(path.join(OUT_DIR, 'matches.json'), JSON.stringify(allMatches, null, 0));
fs.writeFileSync(path.join(OUT_DIR, 'playerInnings.json'), JSON.stringify(playerInnings, null, 0));

console.log('Done! Output written to src/data/');
