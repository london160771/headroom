# THESIS: NEAR is a volume bet, not a scarcity bet

Generated from `web/public/data/headroom.json` by `npm run thesis`. Data as of 13 Nov 2026 (5,649 sampled mainnet blocks since 1 Jan 2023). Do not edit by hand: `npm test` fails if this file and the data disagree.

## Claim

NEAR has built far more blockspace than it sells. Over the 30 days to 13 Nov 2026 it used **0.66%** of its gas capacity (90% interval 0.53% to 0.83%), so load can grow about **76×** (60× to 94×) before NEAR's fee rule raises the gas price.

So for the next one to two years, the token's value cannot come from scarce blockspace. NEAR mints about 32,257,468 NEAR a year (2.52% of supply), and gas burn offsets **0.85%** of it. For burn alone to match issuance, load would have to grow about **118×**, past the point where fees start to rise (76×). Even at that trigger, burn covers 64.3% of issuance.

**Investment reading.** Holding NEAR is a bet on transaction volume at the floor price, plus the option that whole blocks fill and the price (and burn) rise. The signal to watch is whole-block use crossing 50%, not any single busy shard or app.

## Evidence for

1. **Capacity is mostly empty.** 0.66% used in the last 30 days, across 10 shards of 1,000 Tgas per chunk. The gas price was at the floor (0.0001 NEAR per Tgas) in 100.0% of recent sampled blocks. Source: `evidence/samples.jsonl`, `lib/metrics.js`.
2. **The scaling is built.** NEAR went from 4 shards (Jan 2023) to 10. Even the busiest shard (shard 8, 95th percentile 7.03%) could take about 14× more before it is full at its busy hours (90%: 12× to 17×).
3. **One hot shard cannot move the price.** nearcore's `compute_next_gas_price` sums gas over all chunks. 493 sampled blocks had a shard more than half full; 478 of them stayed at the floor price. With 10 shards, about 5 full shards at once are needed.
4. **Burn grows faster than use once fees move.** At every block full and the floor price, burn would be 128.6% of issuance. Past the 50% trigger the price rises each block, and burn per Tgas with it. Burn per Tgas today: 0.0000773 NEAR, measured from `balance_burnt`.

## Evidence against

1. **Demand can arrive fast.** Use peaked at 20.6% in Mar 2024. From 29 Nov 2023 to 29 Dec 2023 (the `inscription.near` rush), 15 sampled blocks were priced above the floor, up to 20× it, with 2 of 4 shards full. The 76× headroom is large, not infinite.
2. **Local scarcity is real.** 151 of 5,649 sampled blocks (2.67%) had delayed receipts in some shard: congestion control was holding back work the price never showed. In 2026, the account leading the most hot-shard chunks was `earn.kaiching`. Apps on a hot shard can feel full while the chain is empty.
3. **Gas is not the only limit.** State size, chunk and state-witness size, and receipt bandwidth can bind before gas. If one of them binds first, real headroom is smaller than these multiples.
4. **It is a sample.** One block per 6-hour slot, at a seeded random moment so every hour of the day is covered. Against NearBlocks' every-block daily totals the monthly median ratio is 0.99 (45 of 47 months within 0.8 to 1.2). A 12× denser read of the last 30 days gave 0.58% use (sampled: 0.68%) and a busiest-shard p95 of 4.77% (sampled: 7.54%).
5. **Issuance is not fixed.** Governance can change the inflation rate, which moves the burn-to-issuance bar without any change in use.

## What would change my mind

Six predictions, frozen on 12 Nov 2026 (SHA-256 `8229c89e7f27f92f8e59b2c6aa6d2e8747a8d5917839579f793df4f5a4b2c933`, git tag `predictions-v1`, OpenTimestamps proof `predictions/predictions.json.ots`). Scored on every build; the page shows the live status.

| # | Prediction | Window | Status now | If wrong |
|---|---|---|---|---|
| P1 | NEAR's gas price stays at the floor in at least 99% of sampled blocks. | 13 Nov 2026 to 31 Dec 2027 | holding | Blockspace is getting scarce. The bear reading (fees can't rise from demand) is wrong. |
| P2 | No calendar month averages more than 20% of NEAR's gas capacity. | 13 Nov 2026 to 31 Dec 2027 | holding | Demand has returned to the March 2024 peak or beyond, with 10 shards instead of 4. |
| P3 | In every month, the hottest shard in a block stays under 50% of its limit at the 95th percentile. | 13 Nov 2026 to 31 Dec 2027 | holding | If P1 still holds, NEAR has a hot-shard problem its fee rule can't see, and congestion control is doing the work. |
| P4 | No sampled block crosses NEAR's 50% fee trigger (gas used summed over all chunks vs the summed limit). | 13 Nov 2026 to 31 Dec 2027 | holding | Whole blocks are filling. The fee multiple is not a far-off number any more. |
| P5 | Gas burn offsets less than 5% of the new NEAR minted over the window. | 13 Nov 2026 to 31 Dec 2027 | not holding | Usage is starting to pay for security. Burn is becoming a real sink, which is bullish for the token. |
| P6 | In June 2027, NEAR uses less than 5% of its gas capacity. | 1 Jun 2027 to 30 Jun 2027 | waiting | Load grew about 9x or more in seven months. The headroom is being used up faster than the thesis says. |

Backtest over the most recent window of the same length: 5 of 6 would have held (P3 would have failed, so these are not safe bets).

## Re-run it

```bash
npm install
npm run check    # re-read 20 random sampled blocks from mainnet, compare every field
npm run sample   # add new 6-hour slots up to now
npm run data     # rebuild web/public/data/headroom.json
npm run thesis   # rebuild this file
```
