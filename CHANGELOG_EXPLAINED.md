# CricketIQ — Architecture Decisions & Interview Cheatsheet

This document provides a concise architectural guide and interview cheatsheet for **CricketIQ**, explaining key technical choices in simple, direct language.

---

## 1. Project Overview & Hackathon Track

| Property | Details |
|---|---|
| **Core Concept** | Context-aware cricket impact metric evaluating player match influence (0 to 100) using machine learning rather than raw aggregate scores. |
| **Hackathon** | CricHeroes Hackathon 2025 — Impact Metric Track |
| **Frontend Stack** | Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS 4 |
| **ML Models** | XGBoost regression with SHAP (SHapley Additive exPlanations) for transparent feature attribution |
| **Data Features** | Performance (runs/wickets), Phase Context (Powerplay vs Death overs), Required Run Rate pressure, and Tournament Knockout multipliers |

---

## 2. Key Architectural Decisions

### 1. Why Traditional Cricket Stats Are Misleading
- A batsman scoring 40 runs off 38 balls while chasing 220 in a knockout semi-final actually harms their team's probability of winning, yet traditional batting averages treat it as a positive innings.
- CricketIQ models **Win Probability Added (WPA)** across four multiplying vectors:
  $$\text{Impact} = \text{Performance} \times \text{Context} \times \text{Pressure} \times \text{Knockout Multiplier}$$

### 2. Explainable AI with SHAP
- Rather than providing a black-box impact score, the dashboard renders interactive SHAP waterfall plots explaining exactly how much each boundary, dot ball, or phase shift boosted or lowered the player's rating.

---

## 3. Technical Interview Cheatsheet

### Q: Why did you choose XGBoost and SHAP for CricketIQ?
> **Answer:** "Cricket ball-by-ball dynamics involve non-linear feature interactions (e.g. dot balls during death overs carry exponentially higher penalty than dot balls in early consolidation overs). Gradient-boosted decision trees (XGBoost) capture these non-linear thresholds effectively, while SHAP provides mathematically consistent game-theoretic attribution so coaches and players understand why a score was awarded."
