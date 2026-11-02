"""
CricketIQ ML Training Pipeline
Trains XGBoost on IPL ball-by-ball data to learn Impact Score weights.
Outputs: model_weights.json, feature_importance.json, shap_values.json
"""

import json
import os
import sys
import shutil
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error
import xgboost as xgb
import shap
import joblib

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(SCRIPT_DIR, '..', 'src', 'data')
OUT_DIR = DATA_DIR


def load_data():
    """Load preprocessed JSON data."""
    with open(os.path.join(DATA_DIR, 'playerInnings.json'), 'r') as f:
        player_innings = json.load(f)
    with open(os.path.join(DATA_DIR, 'matches.json'), 'r') as f:
        matches = json.load(f)
    return player_innings, matches


def build_match_lookup(matches):
    """Build lookup: matchId -> { team totals, winner, margin }."""
    lookup = {}
    for m in matches:
        lookup[m['matchId']] = {
            'winner': m.get('winner', ''),
            'winner_runs': m.get('winnerRuns', 999),
            'winner_wickets': m.get('winnerWickets', 999),
            'innings': {inn['battingTeam']: inn for inn in m.get('innings', [])},
        }
    return lookup


def build_feature_matrix(player_innings, match_lookup):
    """Build feature matrix from player innings data.

    Target variable design:
    - Winners get full credit for their contribution
    - Losers get partial credit (35%) — they still had impact, the team failed
    - Close-match losers get more credit (55%) — they nearly won
    - Bowling target blends wicket share (60%) + economy contribution (40%)
    """
    rows = []

    for player_name, pdata in player_innings.items():
        team = pdata.get('team', '')

        for inn in pdata.get('innings', []):
            match_id = inn.get('matchId', '')
            match_info = match_lookup.get(match_id)
            if not match_info:
                continue

            won = inn.get('matchResult') == 'won'

            # How close was the match?
            margin_runs = match_info.get('winner_runs', 999)
            margin_wickets = match_info.get('winner_wickets', 999)
            close_match = margin_runs < 20 or margin_wickets < 3

            # Winners=1.0, close losers=0.55, other losers=0.35
            if won:
                win_factor = 1.0
            elif close_match:
                win_factor = 0.55
            else:
                win_factor = 0.35

            if inn['type'] == 'batting':
                team_inn = match_info['innings'].get(team) or match_info['innings'].get(inn.get('opponent', ''))
                team_total = team_inn['totalRuns'] if team_inn else 1

                player_share = min(inn['runs'] / max(team_total, 1), 1.0)
                target = win_factor * player_share * 100

                row = {
                    'player': player_name,
                    'type': 'batting',
                    'target': target,
                    'season': inn.get('season', ''),
                    # Core features
                    'runs': inn.get('runs', 0),
                    'balls_faced': inn.get('ballsFaced', 0),
                    'strike_rate': inn.get('strikeRate', 0),
                    'fours': inn.get('fours', 0),
                    'sixes': inn.get('sixes', 0),
                    'is_out': 1 if inn.get('isOut') else 0,
                    'is_chasing': 1 if inn.get('isChasing') else 0,
                    'required_run_rate': inn.get('requiredRunRate', 0),
                    'wickets_remaining': inn.get('wicketsRemaining', 10),
                    # ML features
                    'boundary_pct': inn.get('boundaryPct', 0),
                    'dot_ball_pct': inn.get('dotBallPct', 0),
                    'runs_in_powerplay': inn.get('runsInPowerplay', 0),
                    'runs_in_middle': inn.get('runsInMiddle', 0),
                    'runs_in_death': inn.get('runsInDeath', 0),
                    'balls_in_powerplay': inn.get('ballsInPowerplay', 0),
                    'balls_in_middle': inn.get('ballsInMiddle', 0),
                    'balls_in_death': inn.get('ballsInDeath', 0),
                    'batting_position': inn.get('battingPosition', 4),
                    'run_rate_diff': inn.get('runRateDiff', 0),
                    'is_knockout': 1 if inn.get('isKnockout') else 0,
                    'first_innings_total': inn.get('firstInningsTotal', 0),
                }
                rows.append(row)

            elif inn['type'] == 'bowling':
                # Find the opposition innings this bowler bowled against
                opp_inn = None
                for t, d in match_info['innings'].items():
                    if t != team:
                        opp_inn = d
                        break
                total_wickets = opp_inn['totalWickets'] if opp_inn else 1
                total_runs_opp = opp_inn['totalRuns'] if opp_inn else 1

                # Wicket contribution (60%)
                wicket_share = inn.get('wickets', 0) / max(total_wickets, 1)

                # Economy contribution (40%) — bowled more overs while conceding fewer runs
                balls = inn.get('ballsBowled', 0)
                overs = balls / 6 if balls > 0 else 0
                overs_share = overs / 20  # fraction of team overs bowled
                runs_share = inn.get('runsConceded', 0) / max(total_runs_opp, 1)
                economy_contribution = max(0, overs_share - runs_share)

                player_share = min(0.6 * wicket_share + 0.4 * economy_contribution, 1.0)
                target = win_factor * player_share * 100

                row = {
                    'player': player_name,
                    'type': 'bowling',
                    'target': target,
                    'season': inn.get('season', ''),
                    # Core features
                    'wickets': inn.get('wickets', 0),
                    'runs_conceded': inn.get('runsConceded', 0),
                    'balls_bowled': inn.get('ballsBowled', 0),
                    'dot_balls': inn.get('dotBalls', 0),
                    'economy': inn.get('economy', 0),
                    'is_chasing': 1 if inn.get('isChasing') else 0,
                    # ML features
                    'dot_ball_pct': inn.get('dotBallPct', 0),
                    'wickets_in_powerplay': inn.get('wicketsInPowerplay', 0),
                    'wickets_in_middle': inn.get('wicketsInMiddle', 0),
                    'wickets_in_death': inn.get('wicketsInDeath', 0),
                    'runs_in_powerplay': inn.get('runsInPowerplay', 0),
                    'runs_in_middle': inn.get('runsInMiddle', 0),
                    'runs_in_death': inn.get('runsInDeath', 0),
                    'balls_in_powerplay': inn.get('ballsInPowerplay', 0),
                    'balls_in_middle': inn.get('ballsInMiddle', 0),
                    'balls_in_death': inn.get('ballsInDeath', 0),
                    'is_knockout': 1 if inn.get('isKnockout') else 0,
                    'first_innings_total': inn.get('firstInningsTotal', 0),
                }
                rows.append(row)

    return rows


BATTING_FEATURES = [
    'runs', 'balls_faced', 'strike_rate', 'fours', 'sixes',
    'is_out', 'is_chasing', 'required_run_rate', 'wickets_remaining',
    'boundary_pct', 'dot_ball_pct',
    'runs_in_powerplay', 'runs_in_middle', 'runs_in_death',
    'balls_in_powerplay', 'balls_in_middle', 'balls_in_death',
    'batting_position', 'run_rate_diff',
    'is_knockout', 'first_innings_total',
]

BOWLING_FEATURES = [
    'wickets', 'runs_conceded', 'balls_bowled', 'dot_balls', 'economy',
    'is_chasing', 'dot_ball_pct',
    'wickets_in_powerplay', 'wickets_in_middle', 'wickets_in_death',
    'runs_in_powerplay', 'runs_in_middle', 'runs_in_death',
    'balls_in_powerplay', 'balls_in_middle', 'balls_in_death',
    'is_knockout', 'first_innings_total',
]

FEATURE_LABELS = {
    'runs': 'Runs Scored',
    'balls_faced': 'Balls Faced',
    'strike_rate': 'Strike Rate',
    'fours': 'Fours',
    'sixes': 'Sixes',
    'is_out': 'Dismissed',
    'is_chasing': 'Chasing',
    'required_run_rate': 'Required Run Rate',
    'wickets_remaining': 'Wickets Remaining',
    'boundary_pct': 'Boundary %',
    'dot_ball_pct': 'Dot Ball %',
    'runs_in_powerplay': 'Powerplay Runs',
    'runs_in_middle': 'Middle Over Runs',
    'runs_in_death': 'Death Over Runs',
    'balls_in_powerplay': 'Powerplay Balls',
    'balls_in_middle': 'Middle Over Balls',
    'balls_in_death': 'Death Over Balls',
    'batting_position': 'Batting Position',
    'run_rate_diff': 'Run Rate Differential',
    'match_stage_pct': 'Match Stage %',
    'wickets': 'Wickets Taken',
    'runs_conceded': 'Runs Conceded',
    'balls_bowled': 'Balls Bowled',
    'dot_balls': 'Dot Balls',
    'economy': 'Economy Rate',
    'wickets_in_powerplay': 'Powerplay Wickets',
    'wickets_in_middle': 'Middle Over Wickets',
    'wickets_in_death': 'Death Over Wickets',
    'is_knockout': 'Knockout Match',
    'first_innings_total': 'First Innings Total',
}


def train_model(rows, model_type='batting'):
    """Train XGBoost model for batting or bowling."""
    features = BATTING_FEATURES if model_type == 'batting' else BOWLING_FEATURES
    filtered = [r for r in rows if r['type'] == model_type]

    if len(filtered) < 100:
        print(f"  Skipping {model_type}: only {len(filtered)} rows")
        return None, None, None

    df = pd.DataFrame(filtered)
    X = df[features].fillna(0)
    y = df['target'].fillna(0)

    # Train/test split stratified by season
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    print(f"\n  {model_type.upper()} Model:")
    print(f"  Training samples: {len(X_train)}, Test samples: {len(X_test)}")

    # Train XGBoost
    model = xgb.XGBRegressor(
        max_depth=6,
        n_estimators=400,
        learning_rate=0.05,
        objective='reg:squarederror',
        subsample=0.8,
        colsample_bytree=0.8,
        min_child_weight=3,
        gamma=0.1,
        random_state=42,
        verbosity=0,
    )

    model.fit(X_train, y_train, eval_set=[(X_test, y_test)], verbose=False)

    # Evaluate
    y_pred = model.predict(X_test)
    r2 = r2_score(y_test, y_pred)
    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))

    # Cross-validation
    cv_scores = cross_val_score(model, X, y, cv=5, scoring='r2')

    print(f"  R² (test): {r2:.4f}")
    print(f"  MAE: {mae:.2f}")
    print(f"  RMSE: {rmse:.2f}")
    print(f"  CV R² (5-fold): {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")

    metrics = {
        'r2': round(r2, 4),
        'mae': round(mae, 2),
        'rmse': round(rmse, 2),
        'cv_r2_mean': round(cv_scores.mean(), 4),
        'cv_r2_std': round(cv_scores.std(), 4),
        'train_samples': len(X_train),
        'test_samples': len(X_test),
    }

    return model, features, metrics


def extract_feature_importance(model, features, model_type):
    """Extract and format feature importance."""
    importance = model.feature_importances_
    items = []
    for feat, imp in zip(features, importance):
        items.append({
            'feature': feat,
            'importance': round(float(imp), 4),
            'label': FEATURE_LABELS.get(feat, feat),
            'category': model_type,
        })
    items.sort(key=lambda x: x['importance'], reverse=True)
    return items


def compute_shap_values(model, rows, features, model_type, player_innings, top_n=100):
    """Compute SHAP values for top players."""
    filtered = [r for r in rows if r['type'] == model_type]
    df = pd.DataFrame(filtered)
    X = df[features].fillna(0)

    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(X)
    base_value = float(explainer.expected_value)

    # Group by player, average SHAP values
    player_shap = {}
    for idx, row in enumerate(filtered):
        player = row['player']
        if player not in player_shap:
            player_shap[player] = {'shap_sum': np.zeros(len(features)), 'count': 0, 'target_sum': 0}
        player_shap[player]['shap_sum'] += shap_values[idx]
        player_shap[player]['count'] += 1
        player_shap[player]['target_sum'] += row['target']

    # Get top players by average target (impact)
    player_avg = {}
    for player, data in player_shap.items():
        avg_target = data['target_sum'] / data['count']
        avg_shap = data['shap_sum'] / data['count']
        player_avg[player] = {
            'avg_target': avg_target,
            'avg_shap': avg_shap,
            'count': data['count'],
        }

    # Sort by average target, take top N
    sorted_players = sorted(player_avg.items(), key=lambda x: x[1]['avg_target'], reverse=True)[:top_n]

    result = {}
    for player, data in sorted_players:
        shap_features = []
        for i, feat in enumerate(features):
            val = float(data['avg_shap'][i])
            if abs(val) > 0.01:  # Only include meaningful contributions
                shap_features.append({
                    'name': FEATURE_LABELS.get(feat, feat),
                    'feature': feat,
                    'value': round(val, 2),
                })
        # Sort by absolute value
        shap_features.sort(key=lambda x: abs(x['value']), reverse=True)

        result[player] = {
            'base_value': round(base_value, 2),
            'final_score': round(data['avg_target'], 2),
            'innings_count': data['count'],
            'type': model_type,
            'features': shap_features[:8],  # Top 8 contributors
        }

    return result


def derive_weights(model, features, model_type):
    """Derive interpretable weights from the XGBoost model using feature importance."""
    importance = {k: float(v) for k, v in zip(features, model.feature_importances_)}

    if model_type == 'batting':
        # Derive batting weights scaled relative to importance
        total_imp = sum(importance.values())
        if total_imp == 0:
            total_imp = 1

        weights = {}
        for feat in features:
            weights[feat] = round(importance[feat] / total_imp, 4)

        # Also derive context multipliers from phase importance
        pp_imp = importance.get('runs_in_powerplay', 0) + importance.get('balls_in_powerplay', 0)
        mid_imp = importance.get('runs_in_middle', 0) + importance.get('balls_in_middle', 0)
        death_imp = importance.get('runs_in_death', 0) + importance.get('balls_in_death', 0)
        phase_total = pp_imp + mid_imp + death_imp
        if phase_total > 0:
            pp_ratio = pp_imp / phase_total
            mid_ratio = mid_imp / phase_total
            death_ratio = death_imp / phase_total
            # Convert to multipliers (normalize so powerplay = 1.0)
            if pp_ratio > 0:
                context_multipliers = {
                    'powerplay': 1.0,
                    'middle': round(mid_ratio / pp_ratio, 2) if pp_ratio > 0 else 1.2,
                    'death': round(death_ratio / pp_ratio, 2) if pp_ratio > 0 else 1.5,
                    'chasing': round(1.0 + importance.get('is_chasing', 0) / total_imp, 2),
                }
            else:
                context_multipliers = {'powerplay': 1.0, 'middle': 1.2, 'death': 1.5, 'chasing': 1.1}
        else:
            context_multipliers = {'powerplay': 1.0, 'middle': 1.2, 'death': 1.5, 'chasing': 1.1}

        # Pressure multipliers from RRR importance
        rrr_imp = importance.get('required_run_rate', 0) / total_imp
        wk_imp = importance.get('wickets_remaining', 0) / total_imp
        pressure_multipliers = {
            'rrr_high': round(1.0 + rrr_imp * 4, 2),    # Scale to ~1.4
            'rrr_medium': round(1.0 + rrr_imp * 2, 2),   # Scale to ~1.2
            'wickets_low': round(wk_imp * 2, 2),          # Scale to ~0.2
        }

        return weights, context_multipliers, pressure_multipliers

    else:
        # Bowling weights
        total_imp = sum(importance.values()) or 1
        weights = {}
        for feat in features:
            weights[feat] = round(importance[feat] / total_imp, 4)
        return weights, None, None


def main():
    print("=" * 60)
    print("CricketIQ ML Training Pipeline")
    print("=" * 60)

    # Load data
    print("\n[1/5] Loading data...")
    player_innings, matches = load_data()
    match_lookup = build_match_lookup(matches)
    print(f"  Loaded {len(player_innings)} players, {len(matches)} matches")

    # Build feature matrix
    print("\n[2/5] Building feature matrix...")
    rows = build_feature_matrix(player_innings, match_lookup)
    batting_rows = [r for r in rows if r['type'] == 'batting']
    bowling_rows = [r for r in rows if r['type'] == 'bowling']
    print(f"  Batting innings: {len(batting_rows)}")
    print(f"  Bowling innings: {len(bowling_rows)}")

    # Train models
    print("\n[3/5] Training XGBoost models...")
    bat_model, bat_features, bat_metrics = train_model(rows, 'batting')
    bowl_model, bowl_features, bowl_metrics = train_model(rows, 'bowling')

    # Extract feature importance
    print("\n[4/5] Extracting feature importance & SHAP values...")
    feature_importance = []
    if bat_model:
        feature_importance += extract_feature_importance(bat_model, bat_features, 'batting')
    if bowl_model:
        feature_importance += extract_feature_importance(bowl_model, bowl_features, 'bowling')

    # Compute SHAP values
    shap_values = {}
    if bat_model:
        print("  Computing batting SHAP values...")
        bat_shap = compute_shap_values(bat_model, rows, bat_features, 'batting', player_innings)
        shap_values.update(bat_shap)
    if bowl_model:
        print("  Computing bowling SHAP values...")
        bowl_shap = compute_shap_values(bowl_model, rows, bowl_features, 'bowling', player_innings)
        # Merge bowling SHAP into players (prefer batting if exists)
        for player, data in bowl_shap.items():
            if player not in shap_values:
                shap_values[player] = data
            else:
                # Player has both batting and bowling — store bowling separately
                shap_values[player]['bowling'] = data

    # Derive weights
    print("\n[5/5] Deriving model weights & exporting...")
    bat_weights, context_mult, pressure_mult = derive_weights(bat_model, bat_features, 'batting') if bat_model else ({}, None, None)
    bowl_weights, _, _ = derive_weights(bowl_model, bowl_features, 'bowling') if bowl_model else ({}, None, None)

    # Export model_weights.json
    model_weights = {
        'batting_weights': bat_weights,
        'bowling_weights': bowl_weights,
        'context_multipliers': context_mult or {'powerplay': 1.0, 'middle': 1.2, 'death': 1.5, 'chasing': 1.1},
        'pressure_multipliers': pressure_mult or {'rrr_high': 1.4, 'rrr_medium': 1.2, 'wickets_low': 0.2},
        'model_metrics': {
            'batting': bat_metrics,
            'bowling': bowl_metrics,
        },
        'training_info': {
            'model': 'XGBoost',
            'total_matches': len(matches),
            'total_batting_innings': len(batting_rows),
            'total_bowling_innings': len(bowling_rows),
            'features_batting': len(BATTING_FEATURES),
            'features_bowling': len(BOWLING_FEATURES),
        },
    }

    with open(os.path.join(OUT_DIR, 'model_weights.json'), 'w') as f:
        json.dump(model_weights, f, indent=2)
    print(f"  Wrote model_weights.json")

    # Export feature_importance.json
    with open(os.path.join(OUT_DIR, 'feature_importance.json'), 'w') as f:
        json.dump(feature_importance, f, indent=2)
    print(f"  Wrote feature_importance.json ({len(feature_importance)} features)")

    # Export shap_values.json
    with open(os.path.join(OUT_DIR, 'shap_values.json'), 'w') as f:
        json.dump(shap_values, f, indent=2)
    print(f"  Wrote shap_values.json ({len(shap_values)} players)")

    # Export .pkl models for inference template
    TEMPLATE_DIR = os.path.join(SCRIPT_DIR, '..', 'model-template')
    TEMPLATE_MODEL_DIR = os.path.join(TEMPLATE_DIR, 'model')
    TEMPLATE_DATA_DIR = os.path.join(TEMPLATE_DIR, 'data')
    os.makedirs(TEMPLATE_MODEL_DIR, exist_ok=True)
    os.makedirs(TEMPLATE_DATA_DIR, exist_ok=True)

    if bat_model:
        joblib.dump(bat_model, os.path.join(TEMPLATE_MODEL_DIR, 'batting_model.pkl'))
        print(f"  Exported batting_model.pkl")
    if bowl_model:
        joblib.dump(bowl_model, os.path.join(TEMPLATE_MODEL_DIR, 'bowling_model.pkl'))
        print(f"  Exported bowling_model.pkl")

    # Copy model_weights.json to template
    shutil.copy2(
        os.path.join(OUT_DIR, 'model_weights.json'),
        os.path.join(TEMPLATE_DATA_DIR, 'model_weights.json')
    )
    print(f"  Copied model_weights.json to template")

    print("\n" + "=" * 60)
    print("Training complete!")
    if bat_metrics:
        print(f"  Batting  R²: {bat_metrics['r2']:.4f} | MAE: {bat_metrics['mae']:.2f}")
    if bowl_metrics:
        print(f"  Bowling  R²: {bowl_metrics['r2']:.4f} | MAE: {bowl_metrics['mae']:.2f}")
    print("=" * 60)


if __name__ == '__main__':
    main()
