#!/usr/bin/env python3
"""
CricketIQ Inference — CLI + API
Run XGBoost model on cricket innings data to generate impact scores.

Modes:
    CLI:  python run_model.py --input data/sample_input.csv --type both
    API:  python run_model.py --mode api --port 5000
"""

import argparse
import json
import os
import sys

import joblib
import numpy as np
import pandas as pd

# Add parent dir so we can import features module
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from features.feature_engineering import (
    BATTING_FEATURES,
    BOWLING_FEATURES,
    extract_batting_features,
    extract_bowling_features,
    calculate_impact,
)

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.join(SCRIPT_DIR, '..')
MODEL_DIR = os.path.join(ROOT_DIR, 'model')
DATA_DIR = os.path.join(ROOT_DIR, 'data')


def load_model(innings_type):
    """Load serialized XGBoost model."""
    path = os.path.join(MODEL_DIR, f'{innings_type}_model.pkl')
    if not os.path.exists(path):
        print(f"Error: Model file not found at {path}")
        print("Run `python3 scripts/train_model.py` from the project root first.")
        sys.exit(1)
    return joblib.load(path)


def load_ml_weights():
    """Load ML weights for context/pressure multipliers."""
    path = os.path.join(DATA_DIR, 'model_weights.json')
    if os.path.exists(path):
        with open(path) as f:
            return json.load(f)
    return None


def score_innings(row_dict, innings_type, model, ml_weights):
    """Score a single innings and return result dict."""
    features_list = BATTING_FEATURES if innings_type == 'batting' else BOWLING_FEATURES
    extract_fn = extract_batting_features if innings_type == 'batting' else extract_bowling_features

    features = extract_fn(row_dict)
    feature_values = np.array([[features[f] for f in features_list]])
    xgb_prediction = float(model.predict(feature_values)[0])
    impact = calculate_impact(row_dict, innings_type, ml_weights)

    return {
        'player': row_dict.get('player', 'Unknown'),
        'match_id': row_dict.get('match_id', ''),
        'type': innings_type,
        'xgb_raw_prediction': round(xgb_prediction, 2),
        'performance_score': impact['performance'],
        'context_weight': impact['context_weight'],
        'pressure_weight': impact['pressure_weight'],
        'knockout_mult': impact['knockout_mult'],
        'raw_impact': impact['raw_impact'],
        'impact_score': impact['impact_score'],
    }


def process_innings(df, innings_type, model, ml_weights):
    """Process a DataFrame of innings and return impact scores."""
    results = []
    for _, row in df.iterrows():
        result = score_innings(row.to_dict(), innings_type, model, ml_weights)
        results.append(result)
    return results


# ── CLI Mode ──────────────────────────────────────────────────────────────

def run_cli(args):
    """CSV-based batch inference."""
    ml_weights = load_ml_weights()
    if ml_weights:
        print(f"Loaded ML weights (batting R²={ml_weights['model_metrics']['batting']['r2']}, "
              f"bowling R²={ml_weights['model_metrics']['bowling']['r2']})")

    df = pd.read_csv(args.input)
    print(f"Loaded {len(df)} rows from {args.input}")

    all_results = []

    if args.type in ('batting', 'both'):
        bat_df = df[df['type'] == 'batting'] if 'type' in df.columns else df
        if len(bat_df) > 0:
            bat_model = load_model('batting')
            bat_results = process_innings(bat_df, 'batting', bat_model, ml_weights)
            all_results.extend(bat_results)
            print(f"Processed {len(bat_results)} batting innings")

    if args.type in ('bowling', 'both'):
        bowl_df = df[df['type'] == 'bowling'] if 'type' in df.columns else df
        if len(bowl_df) > 0:
            bowl_model = load_model('bowling')
            bowl_results = process_innings(bowl_df, 'bowling', bowl_model, ml_weights)
            all_results.extend(bowl_results)
            print(f"Processed {len(bowl_results)} bowling innings")

    if not all_results:
        print("No results to output.")
        return

    result_df = pd.DataFrame(all_results)

    if args.output:
        os.makedirs(os.path.dirname(args.output) or '.', exist_ok=True)
        result_df.to_csv(args.output, index=False)
        print(f"\nWrote {len(result_df)} scores to {args.output}")
    else:
        print(f"\n{'='*80}")
        print("IMPACT SCORES")
        print(f"{'='*80}")
        print(result_df.to_string(index=False))

    print(f"\n--- Summary ---")
    print(f"Total innings: {len(result_df)}")
    print(f"Avg impact score: {result_df['impact_score'].mean():.1f}")
    print(f"Min: {result_df['impact_score'].min():.1f} | Max: {result_df['impact_score'].max():.1f}")


# ── API Mode ──────────────────────────────────────────────────────────────

def run_api(port):
    """Start a Flask REST API for real-time scoring."""
    try:
        from flask import Flask, request, jsonify
    except ImportError:
        print("Flask not installed. Run: pip install flask")
        print("Then retry: python run_model.py --mode api")
        sys.exit(1)

    app = Flask(__name__)
    ml_weights = load_ml_weights()
    models = {}

    print(f"\nLoading models...")
    models['batting'] = load_model('batting')
    models['bowling'] = load_model('bowling')
    print(f"Models loaded successfully.")

    @app.route('/health', methods=['GET'])
    def health():
        return jsonify({'status': 'ok', 'model': 'CricketIQ XGBoost'})

    @app.route('/score', methods=['POST'])
    def score():
        """
        Score a single innings.

        POST /score
        {
            "type": "batting",
            "player": "V Kohli",
            "runs": 82, "balls_faced": 53, "strike_rate": 154.7,
            "fours": 8, "sixes": 4, "is_out": 1, "is_chasing": 1,
            "required_run_rate": 9.2, "wickets_remaining": 6,
            "boundary_pct": 22.6, "dot_ball_pct": 30.2,
            "runs_in_powerplay": 15, "runs_in_middle": 42, "runs_in_death": 25,
            "balls_in_powerplay": 10, "balls_in_middle": 25, "balls_in_death": 18,
            "batting_position": 3, "run_rate_diff": 1.5,
            "is_knockout": 0, "first_innings_total": 175
        }
        """
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON body provided'}), 400

        innings_type = data.get('type', 'batting')
        if innings_type not in ('batting', 'bowling'):
            return jsonify({'error': 'type must be "batting" or "bowling"'}), 400

        model = models[innings_type]
        result = score_innings(data, innings_type, model, ml_weights)
        return jsonify(result)

    @app.route('/score/batch', methods=['POST'])
    def score_batch():
        """
        Score multiple innings at once.

        POST /score/batch
        {
            "innings": [
                { "type": "batting", "player": "V Kohli", "runs": 82, ... },
                { "type": "bowling", "player": "JJ Bumrah", "wickets": 3, ... }
            ]
        }
        """
        data = request.get_json()
        if not data or 'innings' not in data:
            return jsonify({'error': 'Provide {"innings": [...]}'}), 400

        results = []
        for inn in data['innings']:
            innings_type = inn.get('type', 'batting')
            if innings_type not in ('batting', 'bowling'):
                continue
            model = models[innings_type]
            result = score_innings(inn, innings_type, model, ml_weights)
            results.append(result)

        return jsonify({'results': results, 'count': len(results)})

    print(f"\n{'='*50}")
    print(f"CricketIQ API running on http://localhost:{port}")
    print(f"{'='*50}")
    print(f"  POST /score        — Score a single innings")
    print(f"  POST /score/batch  — Score multiple innings")
    print(f"  GET  /health       — Health check")
    print(f"{'='*50}\n")

    app.run(host='0.0.0.0', port=port, debug=False)


# ── Main ──────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description='CricketIQ Impact Score Inference')
    parser.add_argument('--mode', choices=['cli', 'api'], default='cli',
                        help='Run mode: cli (CSV batch) or api (REST server)')
    parser.add_argument('--input', default=None, help='Path to input CSV file (cli mode)')
    parser.add_argument('--output', default=None, help='Path to output CSV (cli mode)')
    parser.add_argument('--type', choices=['batting', 'bowling', 'both'], default='both',
                        help='Innings type to process (cli mode)')
    parser.add_argument('--port', type=int, default=5000, help='API port (api mode)')
    args = parser.parse_args()

    if args.mode == 'api':
        run_api(args.port)
    else:
        if not args.input:
            parser.error("--input is required in cli mode")
        run_cli(args)


if __name__ == '__main__':
    main()
