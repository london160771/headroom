# ROADMAP: Headroom

> The parking lot. Ideas outside PRD scope go here, never into the build.

## Parked ideas

| Date | Idea | Why it came up | Why parked | Value later |
|---|---|---|---|---|
| 2026-11-12 | Who fills the hottest shard: relayer and gas-sponsor breakdown | Idea hunt: one account signed 44% of sampled txs in Mar 2026, then stopped in Apr | Receipt-count version BUILT in phase 3 (`scripts/culprits.js`); per-account gas still parked | H |
| 2026-11-12 | Per-account gas from execution outcomes (EXPERIMENTAL_tx_status / receipt outcomes) | Culprit counts are receipts, not gas | Many more RPC calls per block | M |
| 2026-11-12 | KeyCensus: share of txs signed by function-call keys vs full-access keys | Idea hunt runner-up | Separate thesis | M |
| 2026-11-12 | Other capacity limits: state size, state witness size, receipt bandwidth | Gas is not the only limit | Needs more data sources | M |
| 2026-11-12 | Every block, not samples (an indexer) | Sampling may miss short spikes | Needs a full indexer | M |
| 2026-11-12 | Alert when any shard passes a threshold | Useful for app teams | Not a thesis | L |

## After the hackathon

1. Other capacity limits (state, witness size, bandwidth).
2. Per-account gas on the hot shard.
3. Every-block reads for the hottest days.
