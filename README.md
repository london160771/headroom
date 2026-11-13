# Headroom

<!-- story:start -->
**NEAR built a highway for 76× today's traffic. That's exactly why its fees can't pay for the token.**

| 0.66% | 76× | 0.95% |
|:---:|:---:|:---:|
| of NEAR's gas capacity used, last 30 days | growth before NEAR's fee rule raises the gas price | of newly minted NEAR offset by gas burn |

Headroom is a re-runnable census of NEAR's blockspace, read shard by shard from 5,649 mainnet blocks since 1 Jan 2023. It finds a chain built far ahead of its demand. That is good for users, but it means blockspace cannot become scarce, so gas fees cannot offset the NEAR the protocol mints: load must grow about 105× for burn to match issuance. On the last year's trend that never happens; even if demand doubled every year, fees would only start to rise in 6.2 years. **NEAR is a volume bet, not a scarcity bet.**

**Why it matters next to the other theses.** Most entries in this track measure NEAR Intents, and many take for granted that ordinary L1 fees cannot carry NEAR's value. Headroom measures that directly, from the protocol's own fee rule (nearcore `compute_next_gas_price`): the price rises only when a whole block is more than half full, so one busy shard never moves it. In the Nov 2023 inscription rush, 2 full shards out of 4 were enough to raise the price; with 10 shards it would take about 5 at once.

**Don't trust it, re-run it:** `npm install && npm run verify` rebuilds every number and ends in `ALL OK`, and the evidence hashes are stored on NEAR mainnet in [`headroom-anchor.near`](https://nearblocks.io/address/headroom-anchor.near).
<!-- story:end -->

Built for NEAR HACKATHON, **Investment Thesis** track. Sister project by the same builder: **[AgentGate](https://github.com/london160771/agentgate)**, spending limits for AI agents on NEAR (Function Call Keys + a vault contract).

[Live page](https://headroom-delta.vercel.app) · [Demo video (on X)](https://x.com/ayyoweb3/status/2121249227862901073) · [X post](https://x.com/ayyoweb3/status/2121249227862901073) · [THESIS.md](THESIS.md) · [![ci](https://github.com/london160771/headroom/actions/workflows/ci.yml/badge.svg)](https://github.com/london160771/headroom/actions/workflows/ci.yml) · MIT

```
SAMPLE THE CHAIN → MEASURE EACH SHARD → FIND THE HEADROOM → PRICE IT AGAINST ISSUANCE → FREEZE PREDICTIONS → RE-RUN IT YOURSELF
```

<!-- holder:start -->
## What this means for a NEAR holder

- **Do not count on blockspace scarcity.** NEAR used 0.66% of its gas capacity in the last 30 days. Load must grow about 76× before the gas price moves, and about 105× before gas burn (0.95% of issuance today) matches the NEAR the protocol mints. On the last year's trend (gas per day 0.28× a year earlier) neither happens. If demand doubled every year, fees would start to move in 6.2 years and burn would match issuance in 6.7 years; even at the fastest pace since 2023 (10.3×), fees move in 1.9 years.
- **Dilution is the cost of waiting.** Net of burn, supply grows about 2.50% a year (issuance 2.52%, burn offsets 0.95% of it). Governance's HSP-029 would cap issuance at 1.60%, the biggest single change to that number.
- **So the value case rests on other channels, mainly NEAR Intents.** Together, usage offset about 15.6% of issuance: 14.6% from Intents buybacks (external figure, not recomputed here) and 0.95% from gas burn. Holding NEAR is a bet that Intents-style revenue keeps growing, not that L1 fees rise. Headroom's job is to rule out the gas channel for the next several years; other entries measure Intents.
- **What would flip this reading:** whole-block use crossing 50.0% (the fee rule starts raising the price); gas per day growing faster than 2× a year for a full year; or gas burn overtaking the Intents buyback share (14.6% of issuance), so gas becomes the larger value channel. Headroom tracks the first two every day. Until one of these happens, blockspace is a cost of running NEAR, not a source of its value.

This is a reading of public data, not investment advice.
<!-- holder:end -->

## Proof at a glance

- **Thesis:** NEAR is a volume bet, not a scarcity bet. Its blockspace is mostly empty, gas burn covers a small share of the NEAR it mints, and the fee rule needs whole blocks half full before scarcity can pay. The full case, both sides and a long-term view: [THESIS.md](THESIS.md).
- **One command:** `npm install && npm run verify` prints one line per check and ends in `ALL OK`:
  1. every input and output file matches its SHA-256 in `evidence/MANIFEST.sha256`;
  2. the frozen predictions match their hash;
  3. the page data, THESIS.md and this README's findings table rebuild **byte for byte** from `evidence/`;
  4. **15 headline numbers are recomputed a second way** by `lib/independent.js`, which imports nothing from the main pipeline, and all agree;
  5. the hashes are read back from NEAR mainnet, contract [`headroom-anchor.near`](https://nearblocks.io/address/headroom-anchor.near), anchored 13 Nov 2026 (skipped with a clear note when there is no network).
- **70 tests, all passing:** 59 `node:test` + 5 vitest + 6 Rust for the anchor contract. Each checks one behaviour: missing chunks are never 0%, the fee rule, the bootstrap, the burn-rule bisection, the long-term model, that the committed data rebuilds exactly, and more ([list](#tested-not-claimed)).
- **Raw evidence, re-readable:** every sampled block is stored field by field; `npm run check` re-reads random ones from mainnet and diffs every field.
- **Pre-committed:** six predictions frozen before their windows, with a SHA-256, a git tag, a Bitcoin timestamp and a NEAR mainnet anchor; scored on every build, with a backtest that shows where they would have failed.
- **Live and maintained:** a GitHub Action adds new mainnet blocks every day and re-runs all of the above; CI runs tests, `verify` and the contract checks on every push.
- **Honest limits:** gas only (not state or witness size); sampled, not every block; NEAR Intents revenue is shown as an external, sourced figure, not measured. See [Known limits](#known-limits).

## For reviewers: check it in this order

| Do this | You should see | Where |
|---|---|---|
| Read the thesis | Claim, evidence for, evidence against, what would change my mind | [THESIS.md](THESIS.md) (generated from the data) |
| Open the [live page](https://headroom-delta.vercel.app) | Headline with 90% intervals, live shard gauges, 3-year chart | `web/` |
| `npm install && npm run verify` | One line per check, ending in `ALL OK`: every file matches `evidence/MANIFEST.sha256`, the page data and THESIS.md rebuild byte for byte, every headline number recomputed a second way agrees, and the hashes are found on NEAR mainnet | `scripts/verify.js` |
| `npm test` | All tests pass, including "the page data rebuilds byte for byte from `evidence/`" and "THESIS.md matches the data" | `test/`, `contract/src/tests.rs` |
| `npm run check` | 20 random sampled blocks re-read from mainnet match `evidence/` field by field | `scripts/check.js` |
| `sha256sum predictions/predictions.json` | The hash in `predictions/SHA256` and in the git tag `predictions-v1` | `predictions/` |
| `ots verify predictions/predictions.json.ots` | A Bitcoin timestamp for that hash (OpenTimestamps) | `predictions/` |
| Open the Actions tab | `ci` on every push; `daily` adds new mainnet slots each day at 00:30 UTC | `.github/workflows/` |

## Judging map: what the track asks for, and where it is

The track: *"Build a long-term investment thesis for NEAR and back it with data: onchain analytics, live dashboards and models anyone can re-run. Judged on the evidence, not the conviction."*

| The track asks for | Where it is | How to check it | Honest note |
|---|---|---|---|
| A long-term investment thesis | [THESIS.md](THESIS.md): claim, a long-term view (years to each bar at measured and reference growth paces), gas next to NEAR Intents as the two value channels, evidence for, evidence against, what would change my mind | `npm test` fails if THESIS.md differs from the data | Headroom measures the gas channel. The Intents buyback share is an external figure with its source, not recomputed (other entries measure it). |
| Onchain analytics | `evidence/samples.jsonl`: one mainnet block in every 6-hour slot since 1 Jan 2023, read from archival RPC, plus a 30-minute check over the last 30 days | `npm run check` re-reads random blocks from mainnet and diffs every field | Sampled, not every block. The 30-minute check measures what sampling misses. |
| Live dashboards | The [live page](https://headroom-delta.vercel.app): live shard gauges from mainnet RPC; the data refreshes every day at 00:30 UTC | Actions tab, `daily` workflow | Daily, not hourly: a census of months does not move by the hour. |
| Models anyone can re-run | Fee rule (`lib/metrics.js`), burn vs issuance (`lib/economics.js`), the ×N slider and the HSP-029 scenario, all labelled as models | `npm run data` rebuilds `headroom.json`; `git status` stays clean | The ×N model scales load evenly; real growth is lumpy. |
| Judged on the evidence | 90% intervals, the sampling check, the NearBlocks cross-check, and a second recompute in `lib/independent.js` that shares no code with the main pipeline | `npm run verify` ends in `ALL OK` | The busiest-shard number is the noisiest; its interval is wide and the page says so. |
| Not the conviction | Six predictions, frozen before their windows open: SHA-256, git tag `predictions-v1`, a Bitcoin timestamp and a NEAR mainnet anchor | `sha256sum`, `ots verify`, `npm run verify` | Frozen after we built the page, so a backtest is shown next to them. |
| NEAR used for a reason | Block headers, chunk headers and `EXPERIMENTAL_protocol_config` are the only data sources; hashes are stored in a NEAR mainnet contract | [How it uses NEAR](#how-it-uses-near) | Gas is one of NEAR's limits; state and witness size are not measured. |

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
| Gas used per day, last 30 days vs the same 30 days a year earlier | **0.28×** (fastest 12 months since 2023: 10.3×, to 27 Feb 2024) |
| Years until fees move if gas demand doubles every year (model) | 6.2 years; at the fastest pace seen, 1.9 years |
| NEAR Intents buybacks as a share of issuance (external, not recomputed) | about 14.6% (30 days before 6 Oct 2026); with gas burn, about 15.6% together |
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
| `lib/longterm.js` | Gas per day, year-over-year growth, years to each headroom bar at a given pace (a model) |
| `lib/protocol.js` | Bisects archival protocol configs for the block where a parameter changed |
| `lib/independent.js` | A second recompute of the headline numbers that imports nothing from the pipeline |

## How it uses NEAR

| NEAR piece | What it does | File |
|---|---|---|
| Archival RPC `block`: chunk `gas_used`, `gas_limit`, `shard_id`, `height_included`, `balance_burnt`, `congestion_info` | Per-shard gas use, burn and congestion since 2023 | `scripts/sample.js`, `lib/block.js` |
| Archival RPC `block`: header `total_supply`, `block_ordinal`, `gas_price` | Issuance, blocks per day, price state | `lib/economics.js` |
| RPC `chunk` | Which accounts fill the hot shard | `scripts/culprits.js` |
| RPC `EXPERIMENTAL_protocol_config` (live + archival, bisected) | Current burn rule and inflation cap; the exact block where NEAR switched to burning 100% of gas | `scripts/protocol.js` |
| Mainnet RPC `block` (final), from the browser | Live shard gauges | `web/src/lib/live.js` |
| Mainnet contract `headroom-anchor.near` (`anchor`, `get`, `list`) | Stores the SHA-256 of the evidence manifest and of the frozen predictions; first write wins | `contract/`, `scripts/anchor-mainnet.sh`, `lib/nearproof.js` |
| nearcore fee rule (sums all chunks, 50% trigger) | The fee multiple | `lib/metrics.js` |
| NearBlocks daily charts (third-party indexer) | Cross-check only | `scripts/nearblocks.js` |

## How we know the numbers hold

- **Gate 0 cross-check:** our sampled gas per block vs NearBlocks' every-block daily totals, per month (shown on the page and in THESIS.md).
- **Sampling check:** a 12× denser read of the last 30 days compared with the 6-hour sample over the same window.
- **90% intervals:** day-clustered bootstrap, fixed seed, so anyone gets the same interval.
- **Evidence check:** `npm run check` re-reads random stored blocks from mainnet and diffs every field.
- **Second recompute:** `lib/independent.js` recomputes every headline number straight from the raw rows, without importing the main pipeline. `npm run verify` and a test compare the two answers.
- **Byte-identical rebuild:** the page data is built as of the last sampled block, not the wall clock, so the same evidence always gives the same bytes.
- **Proof on NEAR mainnet:** `evidence/MANIFEST.sha256` lists a SHA-256 for every input and output file; its own hash and the predictions hash go into a small contract on NEAR mainnet (`contract/`, run by `scripts/anchor-mainnet.sh`). `npm run verify` reads them back, and reads the original transactions too. **Done 13 Nov 2026** ([`proof/near-mainnet.json`](proof/near-mainnet.json)): predictions hash in [CDZ8Eg3P…](https://nearblocks.io/txns/CDZ8Eg3PenPNdRsz2UMxsABn32378ai3cMc3icjdKCac) (block 224,338,687), evidence manifest @ `c2ecdbe` in [EXHoz5ay…](https://nearblocks.io/txns/EXHoz5ayd6whrnd95tBBCeAywHpaW6mrWREoNGho9CF4) (block 224,338,707). The deployed code hash `5tNACPaK…` is the SHA-256 of the committed `contract/res/headroom_anchor.wasm`. The daily refresh changes the manifest, so `verify` names the anchored commit to check out for that snapshot.
- **Frozen predictions:** six dated, numeric statements that would prove the thesis wrong, hashed, tagged and timestamped before their windows open; scored on every build, with a backtest that shows where they would have failed in the past.
- **Daily refresh:** a GitHub Action adds new mainnet slots, re-checks old ones, rebuilds everything and commits with a SHA-256 manifest (`evidence/MANIFEST.sha256`).

## What's real

Everything. No mocked numbers, no demo mode. The ×N slider is a model on real data (it scales each shard's measured load evenly) and says so. Test fixtures and the mock `fetch` in `test/rpc.test.js` stay in `test/` and are named as such. See [REAL_VS_MOCKED.md](REAL_VS_MOCKED.md).

## Run it

```bash
git clone https://github.com/london160771/headroom && cd headroom
npm install
npm run verify       # every check below in one command; ends in ALL OK
npm test             # unit tests + data-rebuild test + THESIS test, then vitest
npm run check        # re-read 20 random sampled blocks from mainnet, compare every field
npm run sample       # add new 6-hour slots up to now (resumable)
npm run dense        # the 30-minute sampling check (resumable)
npm run culprits     # read chunks for hot-shard blocks
npm run protocol     # burn rule + inflation cap, bisect the last burn-rule change
npm run nearblocks   # refresh the NearBlocks series
npm run data         # rebuild web/public/data/headroom.json
npm run thesis       # rebuild THESIS.md and the README findings table
npm run manifest     # rewrite evidence/MANIFEST.sha256
npm run dev          # the page at http://localhost:5173
```

Node 20+. No keys, no wallet, no `.env`. `ots` (Python `opentimestamps-client`) is only needed to verify the timestamp.

## Tested, not claimed

**70 tests, all passing** on 2026-11-13: `npm test` runs 64 (59 with `node:test`, 5 with vitest) and `cd contract && cargo test` runs 6 for the anchor contract. On top of the tests, `npm run verify` recomputes the 15 headline numbers with separate code and checks every file hash. The tests cover:

- Block records: missing chunks are skipped, never 0%; burn is not double-counted from repeated chunk headers.
- Metrics: block and shard use, percentiles, monthly grouping, multiples, recent window, hot-shard events, price rises, congestion, the ×N model, cross-check.
- Economics: blocks per day from `block_ordinal`, burn per Tgas, issuance with burn added back, the bridge.
- Statistics: seeded PRNG, day-clustered bootstrap is reproducible.
- Predictions: waiting / holding / failed / passed rules, backtest windows, unknown metrics rejected, the frozen file still matches its SHA-256.
- RPC and evidence check, against a mock `fetch`: skipped heights, retry after HTTP 429, block-at-time correction, a tampered stored row is caught field by field.
- Whole pipeline: the committed page data is rebuilt byte for byte from `evidence/`; THESIS.md and this README's findings table match the data; no typed-in % or × in page components.
- Long-term model: gas per day from ordinals, year-over-year growth, fastest year, years to each bar (never without growth); gas burn next to the Intents buyback share.
- Protocol bisection (`lib/protocol.js`): finds the exact first block of a parameter change, returns nothing when there is none, survives heights the node cannot serve.
- Verify: the independent recompute agrees with all 15 published headline numbers; the manifest matches every file; the NEAR proof readers decode a contract view and an anchor transaction (mock RPC).
- Anchor contract: only the account itself can add a hash, first write wins, bad hashes and long labels are rejected, listing pages in order.

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
