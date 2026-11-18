# CricketIQ Player Impact Metric Formulation

## Metric Definition
Player Match Impact (PMI) is an ML-derived weighted composite index:
`PMI = (w_bat * Batting_Contribution) + (w_bowl * Bowling_Contribution) + (w_field * Fielding_Impact)`

Normalized dynamically based on match run-rate and wicket context.
