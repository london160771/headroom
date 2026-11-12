# Real vs. mocked: Headroom

Nothing on the page is mocked. There is no demo mode.

| Part | Real or mocked | Proof |
|---|---|---|
| Sampled blocks (per-shard gas used and limit, gas price) | Real, NEAR mainnet archival RPC | `evidence/samples.jsonl`; `npm run check` re-reads random blocks and compares every field |
| Monthly numbers, multiples, hot-shard events | Real, computed from the samples | `lib/metrics.js` (tested in `test/metrics.test.js`), output `web/public/data/headroom.json` |
| NearBlocks daily series | Real, third-party indexer | `evidence/nearblocks-daily.json`; used only for the cross-check |
| Live gauges | Real, read in your browser from mainnet RPC on page load | The panel shows the block height and RPC host; compare with any explorer |
| ×N slider | A model on real data | Scales each shard's measured busy-hour (p95) load evenly by N. Labelled as a model on the page |
| Test fixtures | Hand-written fixture blocks | Only in `test/metrics.test.js`, named as fixtures |

**Fallbacks:** if the live RPC read fails, the live panel says "Live read unavailable" with the error. The sampled history still loads. No number is ever guessed.

**Not built yet:** see ROADMAP.md (who fills the hottest shard, other capacity limits, every-block indexing).
