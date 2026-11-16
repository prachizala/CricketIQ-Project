# Changes Log - CricketIQ-Project

## Summary of Changes
- **Branch:** `review-fixes` (created from `main`)
- **Simulation Engine & Mathematical Formulations:**
  - Added `scripts/simulation_engine.py` containing pure Python reference implementations for:
    * Required Run Rate (RRR) with singularity handling (`overs_remaining <= 0`, `runs_needed <= 0`).
    * Win Probability calculation with mathematical bounds strictly in $[0.0, 1.0]$.
    * Win Probability Added (WPA) delta calculations strictly in $[-1.0, 1.0]$.
    * Batting and bowling performance scoring functions.
    * Sigmoid normalization function mapping raw impacts to $[0.0, 100.0]$.
- **Automated Test Suite:**
  - Added dedicated test suite `tests/test_simulation_math.py` with 12 unit tests validating:
    * Batting score calculations and zero-case division safety.
    * Bowling score calculations with economy bonuses and dot ball credits.
    * Sigmoid normalization bounds over extreme value domains.
    * Win probability bounds across diverse chasing scenarios.
    * WPA delta boundary enforcement.
    * Critical edge cases: 0 balls remaining (loss vs win), target reached (`runs_needed <= 0`), all out (`wickets_remaining <= 0`), impossible run requirements (`runs_needed > balls_left * 6`), RRR singularities, and extreme pressure final-over chases (Rinku Singh scenario).
  - Executed tests locally: 12 tests passed in 0.000s (`OK`).
- **CI / GitHub Actions Workflow:**
  - Added `.github/workflows/ci.yml` with dual verification pipelines:
    * `python-tests`: Python 3.10 and 3.11 matrix executing `python -m unittest tests/test_simulation_math.py`.
    * `typecheck`: Node.js 20 running `npx tsc --noEmit` to guarantee full TypeScript type safety across Next.js components.
- **Documentation:**
  - Updated `README.md` to add CI status badge.
  - Added automated test execution commands under "Quick Start".
  - Updated the architecture tree to document `tests/` and `scripts/simulation_engine.py`.

## Skipped Items
- None. All requested tasks for this repository have been completed and verified.

## Manual Steps Needed
- None for automated execution. If contributing via GitHub, ensure repository Actions permissions are enabled in repo settings to allow the workflow to run.
