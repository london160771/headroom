# Headroom

**How much room does NEAR have left, and can that room ever pay for the chain?**

Headroom is a re-runnable census of NEAR's blockspace. Shard by shard, it measures how full NEAR is, how much growth fits before fees move, and whether gas burn could ever offset the NEAR the protocol mints. Every number comes from public mainnet block data, and one command rebuilds it.

Built for NEAR HACKATHON, **Investment Thesis** track. Sister project by the same builder: **[AgentGate](https://github.com/london160771/agentgate)**, spending limits for AI agents on NEAR (Function Call Keys + a vault contract).

[Live page](https://headroom-delta.vercel.app) · [Demo video](#) · [X post](#) · [THESIS.md](THESIS.md) · [![ci](https://github.com/london160771/headroom/actions/workflows/ci.yml/badge.svg)](https://github.com/london160771/headroom/actions/workflows/ci.yml) · MIT

```
SAMPLE THE CHAIN → MEASURE EACH SHARD → FIND THE HEADROOM → PRICE IT AGAINST ISSUANCE → FREEZE PREDICTIONS → RE-RUN IT YOURSELF
```

## For reviewers: check it in this order

| Do this | You should see | Where |
|---|---|---|
| Read the thesis | Claim, evidence for, evidence against, what would change my mind | [THESIS.md](THESIS.md) (generated from the data) |
| Open the [live page](https://headroom-delta.vercel.app) | Headline with 90% intervals, live shard gauges, 3-year chart | `web/` |
| `npm install && npm test` | All tests pass, including "the page data rebuilds exactly from `evidence/`" and "THESIS.md matches the data" | `test/` |
| `npm run check` | 20 random sampled blocks re-read from mainnet match `evidence/` field by field | `scripts/check.js` |
| `sha256sum predictions/predictions.json` | The hash in `predictions/SHA256` and in the git tag `predictions-v1` | `predictions/` |
| `ots verify predictions/predictions.json.ots` | A Bitcoin timestamp for that hash (OpenTimestamps) | `predictions/` |
| Open the Actions tab | `ci` on every push; `daily` adds new mainnet slots each day at 00:30 UTC | `.github/workflows/` |

## What we found

<!-- findings:start -->
Numbers from `web/public/data/headroom.json`, data as of 13 Nov 2026: 5,649 mainnet blocks, one in every 6-hour slot (at a seeded random moment) since 1 Jan 2023. This table is written by `npm run thesis`.

| | |
|---|---|
| Capacity used, last 30 days | **0.66%** (90%: 0.53% to 0.83%), 10 shards × 1,000 Tgas per chunk |
| Growth before NEAR's fee rule raises the price | **about 76×** (90%: 60× to 94×) |
| Growth before the busiest shard is full at its busy hours | about 14× (shard 8, p95 7.03%; 90%: 12× to 17×) |
| NEAR minted per year (from total_supply + burn) | 32,257,468 NEAR (2.52% of supply) |
| Gas burn as a share of issuance (burn rule since 4 Nov 2026) | **0.95%** today; 72.2% at the 50% fee trigger; 144.5% with every block full |
| Growth needed for burn to match issuance | about 105× (90%: 84× to 130×); about 67× if HSP-029's 1.60% cap lands |
| Peak month since 2023 | 20.6% (Mar 2024) |
| Sampled blocks with one shard more than half full | 493, of which 478 stayed at the floor price |
| Sampled blocks priced above the floor | 15, all from 29 Nov 2023 to 29 Dec 2023, up to 20× the floor |
| Sampled blocks with delayed receipts (congestion control at work) | 151 of 5,649 |
| Sampling check (one block per 30 min, 13 Oct 2026 to 12 Nov 2026) | use 0.58% dense vs 0.68% sampled; busiest-shard p95 4.77% vs 7.54% |
| Frozen predictions | 6, made 12 Nov 2026; backtest over the last window: 5 of 6 would have held |
<!-- findings:end -->

**Why one full shard doesn't move the price:** nearcore sets the next gas price from gas used **summed over all chunks** against the summed limit. It rises only when the whole block is more than half full ([`compute_next_gas_price`](https://github.com/near/nearcore/blob/master/core/primitives/src/block.rs)). In Dec 2023 NEAR had 4 shards, and 2 full ones raised the price. With 10 shards it would take about 5 full shards at once.

**Why it matters for an investor:** NEAR's token can't draw value from scarce blockspace any time soon. It is a bet on transaction volume at the floor price, plus the option that whole blocks fill and the price, and burn, rise. Full argument, both sides, in [THESIS.md](THESIS.md).

## How it is built

```
mainnet archival RPC ──► scripts/sample.js ──► evidence/samples.jsonl ──┐
  (one block / 6 h)        lib/block.js                                 │
mainnet archival RPC ──► scripts/dense.js ──► evidence/dense-30d.jsonl ─┤
  (one block / 30 min, 30 days)                                         │
mainnet RPC chunk ─────► scripts/culprits.js ► evidence/culprits.json ──┼─► lib/report.js ─► web/public/data/headroom.json ─► web/ (React page)
NearBlocks charts ─────► scripts/nearblocks.js ► evidence/nearblocks-daily.json (cross-check only) │                         └─► THESIS.md + README table
predictions/predictions.json (frozen, hashed, timestamped) ─────────────┘
```

| File | What it does |
|---|---|
| `lib/block.js` | One RPC block → one record (only chunks included at that height; a missing chunk is skipped, never 0%) |
| `lib/metrics.js` | Capacity use, per-shard p95, fee and shard multiples, hot-shard events, price rises, congestion, the ×N model |
| `lib/economics.js` | Blocks per day (from `block_ordinal`), burn per Tgas, issuance from `total_supply`, the burn-vs-issuance bridge |
| `lib/stats.js` | Seeded PRNG and day-clustered bootstrap (90% intervals) |
| `lib/predictions.js` | Scores frozen predictions and a backtest |
| `lib/report.js` | Builds the page data from evidence (pure, tested) |
| `lib/thesis.js` | Renders THESIS.md and the README findings table from the page data |

## How it uses NEAR

| NEAR piece | What it does | File |
|---|---|---|
| Archival RPC `block`: chunk `gas_used`, `gas_limit`, `shard_id`, `height_included`, `balance_burnt`, `congestion_info` | Per-shard gas use, burn and congestion since 2023 | `scripts/sample.js`, `lib/block.js` |
| Archival RPC `block`: header `total_supply`, `block_ordinal`, `gas_price` | Issuance, blocks per day, price state | `lib/economics.js` |
| RPC `chunk` | Which accounts fill the hot shard | `scripts/culprits.js` |
| RPC `EXPERIMENTAL_protocol_config` (live + archival, bisected) | Current burn rule and inflation cap; the exact block where NEAR switched to burning 100% of gas | `scripts/protocol.js` |
| Mainnet RPC `block` (final), from the browser | Live shard gauges | `web/src/lib/live.js` |
| nearcore fee rule (sums all chunks, 50% trigger) | The fee multiple | `lib/metrics.js` |
| NearBlocks daily charts (third-party indexer) | Cross-check only | `scripts/nearblocks.js` |

## How we know the numbers hold

- **Gate 0 cross-check:** our sampled gas per block vs NearBlocks' every-block daily totals, per month (shown on the page and in THESIS.md).
- **Sampling check:** a 12× denser read of the last 30 days compared with the 6-hour sample over the same window.
- **90% intervals:** day-clustered bootstrap, fixed seed, so anyone gets the same interval.
- **Evidence check:** `npm run check` re-reads random stored blocks from mainnet and diffs every field.
- **Frozen predictions:** six dated, numeric statements that would prove the thesis wrong, hashed, tagged and timestamped before their windows open; scored on every build, with a backtest that shows where they would have failed in the past.
- **Daily refresh:** a GitHub Action adds new mainnet slots, re-checks old ones, rebuilds everything and commits with a SHA-256 manifest (`evidence/MANIFEST.sha256`).

## What's real

Everything. No mocked numbers, no demo mode. The ×N slider is a model on real data (it scales each shard's measured load evenly) and says so. Test fixtures and the mock `fetch` in `test/rpc.test.js` stay in `test/` and are named as such. See [REAL_VS_MOCKED.md](REAL_VS_MOCKED.md).

## Run it

```bash
git clone https://github.com/london160771/headroom && cd headroom
npm install
npm test             # unit tests + data-rebuild test + THESIS test, then vitest
npm run check        # re-read 20 random sampled blocks from mainnet, compare every field
npm run sample       # add new 6-hour slots up to now (resumable)
npm run dense        # the 30-minute sampling check (resumable)
npm run culprits     # read chunks for hot-shard blocks
npm run protocol     # burn rule + inflation cap, bisect the last burn-rule change
npm run nearblocks   # refresh the NearBlocks series
npm run data         # rebuild web/public/data/headroom.json
npm run thesis       # rebuild THESIS.md and the README findings table
npm run dev          # the page at http://localhost:5173
```

Node 20+. No keys, no wallet, no `.env`. `ots` (Python `opentimestamps-client`) is only needed to verify the timestamp.

## Tested, not claimed

`npm test` on 2026-11-12: **48 passing** (44 with `node:test`, 4 with vitest). They cover:

- Block records: missing chunks are skipped, never 0%; burn is not double-counted from repeated chunk headers.
- Metrics: block and shard use, percentiles, monthly grouping, multiples, recent window, hot-shard events, price rises, congestion, the ×N model, cross-check.
- Economics: blocks per day from `block_ordinal`, burn per Tgas, issuance with burn added back, the bridge.
- Statistics: seeded PRNG, day-clustered bootstrap is reproducible.
- Predictions: waiting / holding / failed / passed rules, backtest windows, unknown metrics rejected, the frozen file still matches its SHA-256.
- RPC and evidence check, against a mock `fetch`: skipped heights, retry after HTTP 429, block-at-time correction, a tampered stored row is caught field by field.
- Whole pipeline: the committed page data is rebuilt exactly from `evidence/`; THESIS.md and this README's findings table match the data; no typed-in % or × in page components.

`npm run check` re-reads random stored blocks from mainnet and compares every field (result in PROJECT_STATE.md).

## Known limits

- Gas is not NEAR's only limit. State size, chunk and witness size, and receipt bandwidth can bind first. Headroom measures gas only.
- A 95th percentile from 120 blocks (the busiest-shard number) is noisy; the denser sampling check is the better estimate for it.
- One block per 6-hour slot, not every block. Short spikes between samples are missed (the sampling check measures how much that matters).
- A chunk header's `gas_used` describes the shard's previous execution step, so each sampled block is one step behind its timestamp. Over months this does not matter.
- Burn and issuance assume the sampled burn per block is typical of the blocks in between. Governance can change the inflation rate.
- Culprit counts are receipts and transactions, not gas: a chunk does not list gas per receipt.
- The ×N model scales load evenly; real growth lands on some shards more than others.
- The shard layout changed (4 → 6 → 8 → 9 → 10), so the page compares shares of capacity, not raw gas.

## Roadmap

1. Other capacity limits (state size, witness size, receipt bandwidth) next to gas.
2. Per-account gas from execution outcomes, not receipt counts.
3. Every-block reads for the hottest days.

More in [ROADMAP.md](ROADMAP.md).

## License

MIT, see [LICENSE](LICENSE).
