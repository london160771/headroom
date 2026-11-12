# Headroom

**How much room does NEAR have left?**

Headroom is a re-runnable census of NEAR's blockspace. Shard by shard, it shows how full NEAR is and how much growth fits before fees move. Every number comes from public mainnet block data, and one command rebuilds it.

Built for NEAR HACKATHON, **Investment Thesis** track. Sister project by the same builder: **[AgentGate](https://github.com/london160771/agentgate)**, spending limits for AI agents on NEAR (Function Call Keys + a vault contract).

[Live page](#) · [Demo video](#) · [X post](#) · ![Tests](https://img.shields.io/badge/tests-15%20passing-10b981)

```
SAMPLE THE CHAIN → MEASURE EACH SHARD → FIND THE HEADROOM → STRESS IT (×N) → RE-RUN IT YOURSELF
```

## What we found

Numbers from `web/public/data/headroom.json`, built 2026-11-12 from 5,647 mainnet blocks (one every 6 hours, 1 Jan 2023 to 12 Nov 2026).

| | |
|---|---|
| Capacity used, last 30 days | **0.59%** (10 shards × 1,000 Tgas per chunk) |
| Peak month since 2023 | 20.8% (Mar 2024) |
| Gas price at the floor, last 30 days | 100% of sampled blocks |
| Growth before NEAR's fee rule raises the price | **about 84×** (50% ÷ 0.59%) |
| Growth before the busiest shard is full at its busy hours | **about 28×** (100% ÷ shard 8's 95th percentile, 3.58%) |
| Sampled blocks with one shard more than half full | 417, of which 403 stayed at the floor price |
| Sampled blocks priced above the floor | 14, all from 29 Nov to 29 Dec 2023 (the `inscription.near` rush), up to 20× the floor |

**Why one full shard doesn't move the price:** nearcore sets the next gas price from gas used **summed over all chunks** against the summed limit. It rises only when the whole block is more than half full ([`compute_next_gas_price`](https://github.com/near/nearcore/blob/master/core/primitives/src/block.rs)). In Dec 2023 NEAR had 4 shards, and 2 full ones raised the price. With 10 shards it would take about 5 full shards at once.

## The thesis, both ways

- **Bull:** the scaling is built and paid for. NEAR went from 4 shards to 10 and could take about 84× today's load before anyone pays more.
- **Bear:** blockspace is not scarce, so it can't carry the token's value. Fees can't rise from demand pressure for years; value has to come from volume or other sinks.
- **Dated statements (12 Nov 2026), checkable by re-running:**
  1. Through 31 Dec 2027, the gas price stays at the floor in at least 99% of sampled blocks.
  2. No month in 2027 averages more than 20.8% of capacity.
  3. In every month of 2027, the busiest shard in a block stays under 50% at the 95th percentile.

## Judge path, 60 seconds

1. Open the live page. The headline and the live shard gauges load with no wallet.
2. Look at the 3-year chart: the whole chain (green) and the busiest shard (orange) on a log scale.
3. Drag the ×N slider to see which shard fills first and when the fee rule would move.
4. Read the hot-shard table and "The only time the price moved".
5. Optional: run `npm run check` to re-read 20 random sampled blocks and compare them with `evidence/`.

## How it uses NEAR

| NEAR piece | What it does | File |
|---|---|---|
| Archival RPC `block` (chunk headers: `gas_used`, `gas_limit`, `shard_id`, `congestion_info`) | Per-shard gas use since 2023 | `scripts/sample.js`, `lib/block.js` |
| Mainnet RPC `block` (final) | Live gauges in the browser | `web/src/lib/live.js` |
| nearcore fee rule (sums all chunks, 50% trigger) | The fee multiple | `lib/metrics.js` |
| NearBlocks daily charts (third-party indexer) | Cross-check only | `scripts/nearblocks.js` |

## Is the sample good enough? (Gate 0)

Our sampled gas per block vs NearBlocks' daily totals, per month: **median ratio 0.96; 42 of 47 months within 0.8 to 1.2.** The furthest months are May 2023 (0.67), Jan 2023 (0.70), Nov 2026 (0.74, a partial month), Sep 2026 (0.78) and May 2026 (0.79). One block per 6 hours misses short spikes, so low months lean low.

## What's real

Everything. No mocked numbers, no demo mode. The ×N slider is a model on real data (it scales each shard's measured load evenly) and says so. See [REAL_VS_MOCKED.md](REAL_VS_MOCKED.md).

## Run it

```bash
git clone https://github.com/london160771/headroom && cd headroom
npm install
npm run check        # re-read 20 random sampled blocks, compare every field with evidence/
npm run sample       # add new 6-hour slots up to now (resumable)
npm run nearblocks   # refresh the NearBlocks series
npm run data         # rebuild web/public/data/headroom.json
npm test             # 11 metric tests (node:test) + 4 format tests (vitest)
npm run dev          # the page at http://localhost:5173
```

Node 20+. No keys, no wallet, no `.env`.

## Tested, not claimed

`npm test`: 15 passing (11 in `test/metrics.test.js` on hand-written fixture blocks: missing chunks, block and shard use, percentiles, monthly grouping, multiples, recent window, hot-shard events, price rises, cross-check, the ×N model, sample slots; 4 in `web/src/lib/format.test.js`). `npm run check` on 2026-11-12: 20 of 20 random blocks matched `evidence/` exactly.

## Known limits

- Gas is not NEAR's only limit. State size, chunk and witness size, and receipt bandwidth can bind first. Headroom measures gas only.
- One block per 6 hours, not every block. Short spikes between samples are missed.
- The ×N model scales load evenly; real growth lands on some shards more than others.
- The shard layout changed (4 → 6 → 8 → 9 → 10), so the page compares shares of capacity, not raw gas.

## Roadmap

1. Who fills the hottest shard (relayers and gas sponsors).
2. Daily auto-refresh of the evidence.
3. Other capacity limits (state, witness size, bandwidth).

More in [ROADMAP.md](ROADMAP.md).
