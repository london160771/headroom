# Real vs. mocked: Headroom

Nothing on the page is mocked. There is no demo mode.

| Part | Real or mocked | Proof |
|---|---|---|
| Sampled blocks (per-shard gas used and limit, gas price) | Real, NEAR mainnet archival RPC | `evidence/samples.jsonl`; `npm run check` re-reads random blocks and compares every field |
| Monthly numbers, multiples, hot-shard events | Real, computed from the samples | `lib/metrics.js` (tested in `test/metrics.test.js`), output `web/public/data/headroom.json` |
| NearBlocks daily series | Real, third-party indexer | `evidence/nearblocks-daily.json`; used only for the cross-check |
| Live gauges | Real, read in your browser from mainnet RPC on page load | The panel shows the block height and RPC host; compare with any explorer |
| ×N slider | A model on real data | Scales each shard's measured busy-hour (p95) load evenly by N. Labelled as a model on the page |
| Burn, issuance, blocks per day | Real, from block headers (`balance_burnt`, `total_supply`, `block_ordinal`) | `lib/economics.js`; method on the page under "Show the source" |
| 90% intervals | Computed: day-clustered bootstrap with a fixed seed | `lib/stats.js`; same seed, same result on every machine |
| Sampling check | Real, a second, 12× denser mainnet read | `evidence/dense-30d.jsonl` |
| Hot-shard culprits | Real, RPC `chunk` for each hot-shard block | `evidence/culprits.json` (counts receipts, not gas; stated on the page) |
| Predictions | Our forecasts, frozen before their windows open | `predictions/predictions.json`, its SHA-256, git tag, OpenTimestamps proof; scored from real blocks |
| THESIS.md and README findings table | Generated from the page data | `lib/thesis.js`; a test fails if they disagree with the data |
| Test fixtures and mock `fetch` | Hand-written | Only in `test/`, named as fixtures or mocks |

**Fallbacks:** if the live RPC read fails, the live panel says "Live read unavailable" with the error. The sampled history still loads. No number is ever guessed.

**Not built yet:** see ROADMAP.md (other capacity limits, per-account gas, every-block indexing).
