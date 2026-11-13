# PRD: Headroom

**How much room does NEAR have left?**

| | |
|---|---|
| **Status** | Final, build against this |
| **Version** | 1.0 |
| **Date** | 2026-11-12 |
| **Owner** | Adesope (Ayyoweb3) |
| **Hackathon / track** | NEAR HACKATHON, Investment Thesis (`thesis`): "Build a long-term investment thesis for NEAR and back it with data: onchain analytics, live dashboards and models anyone can re-run. Judged on the evidence, not the conviction." |
| **Official deadline** | 2026-11-14 23:59 UTC |
| **Internal cutoff** | 2026-11-14 16:00 UTC |
| **Links** | Repo: https://github.com/london160771/headroom · Live: [ ] · Video: [ ] · X post: [ ] |
| **Sister project** | AgentGate (https://github.com/london160771/agentgate). Hackathon rule: a person may submit 2 independent projects, and each README must name the other. |

> **This file is the only source of truth for requirements.** Cite sections (e.g. "PRD §10"). When reality disagrees, fix this file and log it in §16.

---

## 1. One-line definition

Headroom is a re-runnable census of NEAR's blockspace that lets investors and builders see, shard by shard, how full NEAR is and how much growth fits before fees move, instead of guessing from transaction counts and price charts.

**Memorable flow:**

```
SAMPLE THE CHAIN → MEASURE EACH SHARD → FIND THE HEADROOM → STRESS IT (×N) → RE-RUN IT YOURSELF
```

---

## 2. The story (the video's spine)

- **Act 1, the usual chart.** Every NEAR thesis shows transactions or fees vs issuance. Nobody asks how much of the product NEAR actually sells: blockspace.
- **Act 2, the measurement.** Headroom reads real block headers since Jan 2023. Each chunk header says how much gas it used out of its 1,000 Tgas limit.
- **Act 3, the result.** NEAR used about 0.6% of its gas capacity in Nov 2026 (first sample; final number comes from `evidence/`). The gas price sat at the floor in every sampled block.
- **Act 4, stress it.** Drag the slider: "today's load ×N". Watch which shard fills first and at what N the fee rule would start raising prices.
- **Act 5, re-run it.** One command re-samples the chain and checks the published numbers. The page also reads the newest block live.
- **Close.** "The thesis track measures fees, price and activity. What it lacked was the supply side: how much blockspace NEAR has, and how much is used. Headroom is that measurement."

---

## 3. Problem

**Tiny scenario with numbers (first sample, 2026-11-12):** NEAR can process about 1.49B Tgas a day (blocks per day × 10 shards × 1,000 Tgas). It used about 9.1M Tgas a day in Nov 2026. In Mar 2024 it used about 20% of a smaller chain (5 shards, half the block rate).

**Why it matters:** an investment case for a blockspace token depends on whether blockspace is scarce. NEAR's gas price only rises when the whole block (all chunks summed) is more than half full (nearcore `compute_next_gas_price`). So fee revenue cannot rise from scarcity until demand grows many times over. And one busy shard can fill up without the price moving at all.

**Who feels it:** NEAR holders and analysts sizing the upside; ecosystem teams planning a large launch; core devs and validators deciding where capacity is needed.

---

## 4. Insight and core guarantee

**Insight:** You cannot predict NEAR's demand. But you can measure exactly how much room is left, and what it would take for fees to move.

**Core guarantee:** **Every number on the page is rebuilt from public block data by one command, from fixed sample times, and the page says how each one was made.**

---

## 5. The gap

**Thesis track today (51 entries read 2026-11-12):** about 20 model Intents fees vs issuance or price; 5 test whether activity is real; 4 are claim scorecards; 6 are monitoring tools (routes, bridges, refunds, validators, fee cost). None measures capacity use. Search of all 750 project posts for capacity/utilisation/shard terms: 0 matches.

| Existing entry | What it owns | How we differ |
|---|---|---|
| near-thesis (soldanoandrea) | Share of organic transactions | We measure the supply side, not who the users are |
| NEAR Agent Census | Software-like accounts, fee burn vs issuance | We don't redo fees vs issuance; we size the room left |
| FeeLens | Gas vs storage cost for users | Cost per action, not capacity |
| NearScope | Validator data | Validators, not blockspace |
| Faultline | Intents route dependency | Intents only |

**We must not be:** another fees-vs-issuance model, a price forecast, a TPS benchmark, a validator dashboard, or an app.

---

## 6. Users and jobs to be done

| User | Needs | Success looks like |
|---|---|---|
| NEAR holder / analyst | Know if blockspace is scarce, and when it could be | Reads the headline and the two multiples in 30 s |
| Ecosystem team planning a big launch | Know if their load would fill a shard | Uses the ×N slider to see the first shard to fill |
| Core dev / validator | See which shard runs hottest and how often | Reads the hottest-shard chart and the hot-shard events |
| **Judge** | No wallet, no key, re-runnable, honest limits | Opens the page, sees live data, copies one command |

**Primary user story:** As a NEAR holder, I want to know how much of NEAR's capacity is used and how much growth fits before fees move, so I can judge whether value can come from scarcity or must come from volume.

---

## 7. Goals and non-goals

**Goals**
- **G1 (Real):** every number comes from NEAR mainnet data: archival RPC block headers and the NearBlocks daily series. No mocked numbers.
- **G2 (Re-runnable):** one command rebuilds `evidence/` and the page data. A second command re-checks the published numbers against fresh reads.
- **G3 (Both sides):** the thesis states the bull and bear readings of the same numbers, with dated, testable statements.

**Non-goals:**
- Price forecasts or token valuation models.
- Fees vs issuance (20 entries already do it; we link, not repeat).
- Measuring limits other than gas (state size, bandwidth, witness size). We name them as limits.
- Any wallet, contract, deploy or transaction.

---

## 8. Product principles

1. **Fail closed.** A block we could not read is counted as missing, never as zero use.
2. **Real over mocked.** No mocked numbers anywhere outside test files.
3. **Evidence before spectacle.** Every number comes from `evidence/` or the live read, with its denominator.
4. **Both sides.** The same numbers are read as bull and bear.
5. **Show the method.** Every chart says what was sampled and how.

---

## 9. Core flow

1. `scripts/sample.js` reads one block in every 6-hour UTC slot from 2023-01-01 to now, at a seeded random moment inside each slot (`lib/slots.js` `targetTime`), from the archival RPC. Resumable.
2. `scripts/nearblocks.js` saves the NearBlocks daily chart series (gas used, blocks, txns).
3. `scripts/build.js` turns both into `web/public/data/headroom.json`: monthly capacity use, hottest-shard use, gas price, events, multiples, and the Gate 0 cross-check.
4. `scripts/check.js` re-samples K random published sample times and checks they match `evidence/` exactly (same heights, same gas).
5. The page loads `headroom.json` and also reads the newest final block live from mainnet RPC.

**Journey A (judge):** open page → headline number + live gauges → history chart → slider → thesis → "re-run it" commands.
**Journey B (failure):** live RPC down → live panel shows "live read unavailable" with the error; the evidence sections still load.

---

## 10. Functional requirements

| ID | Pri | Requirement | Acceptance |
|---|---|---|---|
| FR-SMP-001 | P0 | Sampler reads one block per 6-hour UTC slot since 2023-01-01, stores per-chunk gas used, gas limit, shard id, delayed-receipts gas, gas price, height, time | `evidence/samples.jsonl` has one line per slot; re-running skips done slots |
| FR-SMP-002 | P0 | Only chunks included at that block height count; missing chunks are recorded as missing | Unit test with a fixture block with one missing chunk |
| FR-NBK-001 | P0 | Save the NearBlocks daily series | `evidence/nearblocks-daily.json` with date, gas_used, blocks, txns |
| FR-BLD-001 | P0 | Monthly: average capacity use (sum used / sum limit), hottest shard median and p95, share of blocks at floor gas price, shard count | Unit tests on fixture samples |
| FR-BLD-002 | P0 | Headroom multiples: (a) fee multiple = 0.5 / recent average use; (b) shard multiple = 1 / the busiest shard's own p95 use. "Recent" = last 30 days | Unit tests; values shown with their formula |
| FR-BLD-003 | P0 | Hot-shard events: sampled blocks where any one shard used more than 50% | List with date, shard, use, gas price |
| FR-BLD-004 | P0 | Gate 0 cross-check: our monthly gas per day vs NearBlocks, as a ratio | Shown on the page and in PROJECT_STATE |
| FR-CHK-001 | P0 | `check.js` re-reads K random sample slots and compares with `evidence/` | Exit 0 on match; prints each mismatch |
| FR-WEB-001 | P0 | Headline: recent capacity use, both multiples, gas price state | Numbers equal `headroom.json` |
| FR-WEB-002 | P0 | Live panel: newest final block, a gauge per shard, gas price, read time | Reads `rpc.mainnet.fastnear.com`; shows error state if it fails |
| FR-WEB-003 | P0 | History chart: monthly average use and hottest-shard p95 since Jan 2023 | Drawn from `headroom.json` |
| FR-WEB-004 | P0 | ×N slider: scales the recent per-shard p95 loads; shows first shard to fill and when the fee rule would move | Pure function, unit tested |
| FR-WEB-005 | P0 | Thesis section: bull, bear, dated testable statements, limits | Every number in it is read from `headroom.json` |
| FR-WEB-006 | P0 | Method section: sources, sampling, formulas, re-run commands | Commands match README |
| FR-ECO-001 | P0 | Bridge from capacity to value: NEAR minted per year (Δ total_supply + burn, last 365 days), burn per Tgas (Σ balance_burnt ÷ Σ gas used), burn as a share of issuance today / at the 50% trigger / at 100%, load needed for burn = issuance | `lib/economics.js` unit tests; shown with its formula |
| FR-STA-001 | P0 | 90% intervals for the headline numbers and each month, by a day-clustered bootstrap with a fixed seed | Deterministic (same seed, same result); unit tested |
| FR-DEN-001 | P0 | Sampling check: read one block every 30 min over the last 30 days; compare with the 6-hour sample over the same window | `evidence/dense-30d.jsonl`; result on the page |
| FR-PRD-001 | P0 | Frozen predictions: `predictions/predictions.json` with metric, window, operator, value; SHA-256 in `predictions/SHA256` and git tag `predictions-v1`; OpenTimestamps proof; scored on every build, plus a backtest over the most recent window | `lib/predictions.js` unit tests; scoreboard on the page |
| FR-THS-001 | P0 | `THESIS.md` (claim, evidence for, evidence against, what would change my mind) generated from `headroom.json` | Test fails if THESIS.md and the data disagree |
| FR-CUL-001 | P0 | Hot-shard culprits: for each hot-shard block, read that chunk and rank receiving accounts | `evidence/culprits.json`; ranking unit tested |
| FR-CON-001 | P0 | Congestion: count sampled blocks with delayed receipts in any shard, per month | Unit test |
| FR-CI-001 | P0 | GitHub Actions: CI on push (tests + build); daily refresh at 00:30 UTC (sample, check 10, culprits, data, thesis, test, evidence manifest, commit) with only GITHUB_TOKEN | Workflows in `.github/workflows/` |
| FR-VER-001 | P0 | `npm run verify`: manifest hashes, predictions hash, byte-identical rebuild of page data + THESIS + README table, an independent recompute of the headline numbers (`lib/independent.js`, no imports from the pipeline), and the NEAR mainnet anchors; ends in `ALL OK` | Exit 0 only if every check passes; runs in CI and the daily workflow (offline) |
| FR-ANC-001 | P0 | Anchor contract on NEAR mainnet (`headroom-anchor.near`): only the account itself adds a SHA-256, first write wins, free views `get`/`list`/`count`. `scripts/anchor-mainnet.sh` (run by Adesope) stores the manifest hash and the predictions hash; transaction IDs go in `proof/near-mainnet.json` | Rust unit tests; `npm run verify` reads state and transactions back |
| FR-WEB-007 | P0 | Page: "Can blockspace pay for NEAR?", interval bands, predictions scoreboard, culprits + congestion, a "Show the source" note per chart, data-as-of date | Every number read from `headroom.json`; test rejects typed-in % or × in components |

---

## 11. Domain rules

- **INV-1:** capacity use = Σ gas_used / Σ gas_limit over included chunks only. Never divide by a hardcoded shard count.
- **INV-2:** a block that could not be read is excluded and counted in `missing`; it is never treated as 0% use.
- **INV-3:** sample times are fixed UTC slots, so two runs read the same heights (deterministic).
- **INV-4:** gas values are integers (Ggas) in evidence; percentages are derived at the edge.
- **INV-5:** every number on the page traces to `headroom.json` or the live read; nothing typed by hand.

---

## 12. Non-functional requirements

- **Honesty:** limits stated on the page (gas is not the only limit; sampling, not every block; load does not scale evenly).
- **Mobile:** works at 390 px.
- **Setup:** clean clone → `npm install` → `npm run build` in under 5 minutes (sampling itself takes ~15 minutes and is optional; evidence is committed).

---

## 13. Architecture

```
archival RPC + NearBlocks ──> scripts/sample.js, nearblocks.js ──> evidence/
evidence/ ──> scripts/build.js (pure lib/metrics.js) ──> web/public/data/headroom.json
web (React + Vite + Bootstrap) ──> headroom.json + live mainnet RPC read
```

- Pure core: `lib/metrics.js` (no network) holds every formula; scripts and page both use it.
- No server, no database, no keys. Static site.

---

## 15. NEAR integration and necessity

**Why NEAR:** the thesis is about NEAR's sharded design and its fee rule. Without NEAR there is no subject and no data.

| NEAR piece | Job | File |
|---|---|---|
| Archival RPC `block` (chunk headers: gas_used, gas_limit, shard_id, congestion_info) | Per-shard use since 2023 | `scripts/sample.js` |
| Mainnet RPC `block` (final) | Live gauges | `web/src/lib/live.js` |
| nearcore fee rule (`compute_next_gas_price`, sums all chunks) | The fee multiple formula | `lib/metrics.js`, cited on the page |
| NearBlocks daily charts | Cross-check (Gate 0) and transaction context | `scripts/nearblocks.js` |

---

## 16. Decisions log and Gate 0

**Gate 0, riskiest premise:** sampled blocks give the same picture as full daily totals.
- Option A: sample blocks every 6 h, compare monthly gas per block with NearBlocks.
- Option B: if they disagree by more than 20%, use NearBlocks for the average and keep samples only for per-shard shape, and say so.
- Acceptance: monthly ratio within 0.8–1.2 for most months; outliers explained.
- **Result:** PASSED 2026-11-12. v1 (fixed times): median 0.96, 42 of 47 months within 0.8–1.2. v3 (seeded random moment per slot): **median 0.99, 45 of 47 within** (outliers 2025-12 1.29, 2023-06 1.22). `npm run check`: 20 of 20 random blocks match.

| Date | Decision | Reason / evidence |
|---|---|---|
| 2026-11-12 | Idea chosen: Headroom (over Who Pays for NEAR? and KeyCensus) | Idea doc https://claude.ai/artifact/7VEN5LHEWnt89d2MC5pv5Q |
| 2026-11-12 | Static site, no backend, no DB | Nothing to store; judges need no setup |
| 2026-11-12 | Gas price rule sums all chunks | nearcore `core/primitives/src/block.rs` |
| 2026-11-12 | Chunk gas limit 1,000 Tgas | Read from live block headers |
| 2026-11-12 | One block per 6 h instead of 3 consecutive | Archival RPC rate limits; more independent moments for the same budget. archival-rpc.mainnet.near.org returns 429 under load, so FastNEAR is primary |
| 2026-11-12 | Shard multiple uses each shard's own p95 (not the per-block busiest shard) | Keeps the headline and the ×N slider consistent |
| 2026-11-12 | The price DID rise in 14 sampled blocks (29 Nov to 29 Dec 2023, inscription.near rush, up to 20×) | Shown on the page; confirms the fee rule |
| 2026-11-12 | Phase 3 "depth" scope added (FR-ECO/STA/DEN/PRD/THS/CUL/CON/CI, FR-WEB-007) | Adesope approved the plan to beat stronger rivals in the track ("give it all your best"); strict rival review found Headroom thin on investment link, rigor and freshness |
| 2026-11-12 | Re-sampled every slot with `block_ordinal`, `total_supply`, chunk `balance_burnt` | Needed for issuance and burn; v1 samples lacked them |
| 2026-11-12 | Issuance from headers, not from a stated inflation rate | Δ total_supply + burn is measured; a stated rate can be stale |
| 2026-11-12 | Bootstrap resamples whole UTC days | Blocks on one day are correlated; resampling blocks would understate the interval |
| 2026-11-12 | Sample at a seeded random moment inside each 6-hour slot, not at 00/06/12/18 UTC | Fixed clock times saw the same 4 hours every day: the 30-min dense read showed the fixed-time sample read low (Gate 0 median fell to 0.89 once slot times were exact). Random moments cover all 24 hours and stay reproducible |
| 2026-11-13 | Burn per Tgas measured only under the current burn rule (protocol 87, block 223,012,337: burnt_gas_reward 3/10 → 0); HSP-029 (1.6% cap) shown as a scenario | Rival review found both; verified by our own archival bisection (`scripts/protocol.js`). The old 365-day average understated burn by about 12% |
| 2026-11-13 | Page data built as of the last sampled block, not the wall clock (`generated_at` removed) | Same evidence, same bytes: `npm run data && git status` stays clean (rival near-thesis does this) |
| 2026-11-13 | Hashes anchored on NEAR mainnet by hand, not by the daily bot | Adesope chose mainnet ("our proof will be on mainnet"). Anchoring by hand keeps every key on Adesope's machine; a bot would need a key in GitHub secrets |
| 2026-11-12 | OpenTimestamps (Python `opentimestamps-client`, used once by hand) for the predictions hash | Keyless, free, anchors in Bitcoin; not a runtime dependency |

---

## 17. Real vs mocked

| Part | Real or mocked |
|---|---|
| Samples, monthly numbers, events, multiples | Real (mainnet archival RPC) |
| NearBlocks series | Real (third-party indexer; we label it) |
| Live gauges | Real (mainnet RPC, read on page load) |
| Slider | A model on real loads: scales today's measured load evenly by N; labelled as a model |

---

## 18. Re-check lab (replaces the break-it lab)

| # | Check | Expected |
|---|---|---|
| 1 | `npm run check` re-reads K random slots | Same heights and gas as `evidence/` |
| 2 | Edit one number in `evidence/` and run check | Mismatch printed, exit 1 |
| 3 | Live panel vs any explorer | Same block height and shard values |

---

## 19. Success measures

| Measure | Target |
|---|---|
| Time to the headline for a judge | ≤ 10 s |
| Gate 0 cross-check | most months within 0.8–1.2 |
| `npm run check` | pass |
| Tests | all pass (count recorded after they pass) |

---

## 20. Test plan

- `lib/metrics.js`: capacity use, missing chunks, hottest shard, p95, multiples, events, slider.
- `scripts`: dry-run of sampler against a fixture.
- Web: build passes; vitest on the slider and formatting.

---

## 21. Product surface: one page

1. Headline + live gauges.
2. History chart + hot-shard events.
3. ×N slider.
4. Thesis: bull, bear, dated statements.
5. Method, limits, re-run commands, sister-project link.

---

## 22. Demo script (90 s)

| Time | Act | On screen |
|---|---|---|
| 0:00–0:15 | Usual chart | Thesis-track style tx chart vs "nobody measured supply" |
| 0:15–0:40 | Measurement | Live gauges, block height, 10 shards |
| 0:40–1:00 | Result | Headline %, history chart, Dec 2023 hot shard |
| 1:00–1:15 | Stress it | Slider ×N |
| 1:15–1:30 | Re-run + close | Terminal `npm run check` passing; close line |

---

## 26. Scope control

**P0:** everything in §10.
**Never in this build (→ ROADMAP.md):** who fills the hottest shard (relayer/sponsor breakdown), KeyCensus, state-size and bandwidth limits, alerts.

---

## 27. Build order and phases

Commit `phase-N: <what>` and push to `main` after each phase. Don't stop between phases.

- **Phase 0, docs + Gate 0:** these docs; sampler + NearBlocks fetch; evidence committed; Gate 0 result in §16.
- **Phase 1, metrics:** `lib/metrics.js` + tests; `build.js` → `headroom.json`; `check.js`.
- **Phase 2, page:** React + Vite + Bootstrap page per §21; live panel; vitest.
- **Phase 3, depth:** re-sample with burn + supply; economics bridge; intervals; dense sampling check; frozen predictions; THESIS.md; culprits; congestion; CI + daily workflow; page sections; LICENSE.
- **Phase 4, ship:** README for machine readers (both projects named), REAL_VS_MOCKED, video script, X post draft. ⛔ MANUAL STOP: Adesope deploys to Vercel, records, posts, submits.

---

## 28. Deadline plan

| Day | Work | Gate |
|---|---|---|
| 12 Nov | Phase 0 | Evidence committed, Gate 0 decided |
| 13 Nov | Phases 1–2 | Page works with real data |
| 14 Nov by 16:00 UTC | Phase 3 + manual stop | Submitted |

---

## 29. Risks

| Risk | Mitigation |
|---|---|
| "99% empty" reads as a pure bear post | Show both readings of the same numbers |
| Gas is not the only limit | Say so on the page; name the other limits |
| Sampling misses spikes | 3 blocks × 4 slots a day; report p95; Gate 0 cross-check |
| Shard layout changed (4 → 10) | Compare shares of capacity, not raw gas |
| NearBlocks series changes sharply in Apr 2026 | Our own RPC samples are the primary source |
| Archival RPC rate limits | Resumable sampler, two providers |

---

## 30. Definition of finished

- [ ] Page live; headline, live gauges, chart, slider, thesis, method.
- [ ] `npm run check` passes against `evidence/`.
- [ ] Gate 0 result recorded.
- [ ] Every number on page, README and video comes from `headroom.json`.
- [ ] README names AgentGate; AgentGate README names Headroom.
- [ ] PROJECT_STATE current.

---

## 33. Open questions

| # | Question | Owner |
|---|---|---|
| 1 | Vercel project name / URL | Adesope |
