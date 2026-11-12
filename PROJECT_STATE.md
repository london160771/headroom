# PROJECT_STATE: Headroom

> Where the project stands. Requirements live in PRD.md. Only verified facts here.

**Last updated:** 2026-11-12 · **By:** Claude Code

## ⛔ MANUAL STOP (Phase 4): what Adesope must do

1. **Let the daily workflow push:** GitHub → `london160771/headroom` → Settings → Actions → General → Workflow permissions → **Read and write permissions** → Save. (The workflow also asks for `contents: write` itself; this setting makes sure it is allowed.) Then Actions → `daily` → **Run workflow** once to confirm it commits.
2. **Deploy on Vercel:** New Project → import `london160771/headroom` → keep the defaults (`vercel.json` sets build `npm run build`, output `web/dist`). No env vars. Every daily commit redeploys the page with fresh data.
3. Send the live URL; Claude fills it into README.
4. Record the video (script: /mnt/project-files/headroom/VIDEO-SCRIPT.md) and post on X (draft: /mnt/project-files/headroom/X-POST.md).
5. Submit (track `thesis`) once README links are filled.
6. **Push the predictions tag** (the cloud session could not push tags): `git clone https://github.com/london160771/headroom ~/headroom; cd ~/headroom && git pull && git tag -a predictions-v1 d3c0f60 -m "Frozen Headroom predictions" && git push origin predictions-v1`

## 1. Right now

- **Active phase:** 4, ship (manual stop above).
- **Done:** Phases 0–3.

## 2. Phase tracker

| Phase | Status | Verified on | Commit |
|---|---|---|---|
| 0, docs + Gate 0 | Done | 2026-11-12 | `0e9ae99` |
| 1, metrics + data + check | Done | 2026-11-12 | `4cda730` |
| 2, page | Done | 2026-11-12 | `4cda730` |
| 3, depth (economics, intervals, sampling check, predictions, THESIS, culprits, congestion, CI) | Done | 2026-11-12 | see build log |
| 4, ship | Waiting on manual stop | | |

## 3. Last verification (2026-11-12)

| Check | Command | Result |
|---|---|---|
| Node tests | `node --test test/*.test.js` | 42 of 42 pass |
| Web tests | `vitest run` | 4 of 4 pass |
| Build | `npm run build` | pass |
| Re-check vs mainnet | `npm run check` | 20 of 20 random blocks match evidence/ field by field |
| Page data rebuilds exactly | test in `test/report.test.js` | pass |
| THESIS.md + README table match data | `test/thesis.test.js` | pass |
| Predictions hash | `sha256sum predictions/predictions.json` | `8229c89e7f27f92f8e59b2c6aa6d2e8747a8d5917839579f793df4f5a4b2c933` (= `predictions/SHA256`, tag `predictions-v1`) |
| OpenTimestamps | `ots stamp` | submitted to 4 calendars; the proof is pending until Bitcoin confirms; the daily workflow runs `ots upgrade` |
| Gate 0 | `npm run data` (cross_check) | median monthly ratio 0.99; 45 of 47 months within 0.8–1.2 |
| Sampling check | `npm run dense` + `npm run data` | use: dense 0.58% vs sampled 0.68%, inside the sampled 90% interval; busiest-shard p95: dense 4.77% vs sampled 7.54%, outside it (stated on the page as a limit) |
| UI at 1280 px and 390 px | Playwright screenshot | no horizontal scroll, no console errors |

## 4. What works (verified)

- Sampler v3: 5,648 slots with `block_ordinal`, `total_supply`, chunk `balance_burnt`, 2023-01-01 to 2026-11-12, one block at a seeded random moment in each 6-hour slot (all 24 hours covered). `--refix` re-reads any slot more than 60 s from its target.
- Economics: issuance from total_supply + burn; burn per Tgas; the burn-vs-issuance bridge with intervals.
- Dense check: 1,440 blocks (one per 30 min) over the last 30 days.
- Culprits: chunk reads for all 417 hot-shard blocks.
- Predictions: 6 frozen statements, scored per build with a backtest.
- THESIS.md and the README findings table are generated (`npm run thesis`).
- Workflows: `ci.yml` (tests + build on push), `daily.yml` (00:30 UTC refresh + commit).
- Page: headline with intervals, live gauges, chart with bands, "Can blockspace pay for NEAR?", ×N slider, hot shards + culprits + congestion, predictions scoreboard, thesis, method with sampling check, "Show the source" notes.

## 5. Real vs mocked

All real. Slider is a labelled model. Test fixtures and the mock `fetch` stay in `test/`. See REAL_VS_MOCKED.md.

## 6. Live proof

| Item | Value |
|---|---|
| Live URL | [pending Vercel deploy] |
| Network | NEAR mainnet (read only) |
| Contracts | none |

## 8. Known issues

- archival-rpc.mainnet.near.org rate-limits (HTTP 429); FastNEAR archival is primary.
- 1 of 5,648 sampled blocks had no included chunk; it is skipped, never counted as 0%.
- Prediction P3 would have failed its backtest (a month in the last year had a hottest-shard p95 above 50%). It is kept as a real forecast and the failure is shown.

## 9. Handoff notes

- Sandbox Node needs `NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt`.
- Dependencies: react, react-dom, bootstrap, vite, @vitejs/plugin-react, vitest. Nothing else in package.json.
- Tool used once by hand, not a dependency: Python `opentimestamps-client` (`ots`) to stamp the predictions hash. The daily workflow installs it to upgrade the proof.
- Never edit `predictions/predictions.json`: a test checks it against `predictions/SHA256`.

## 10. Build log

- **2026-11-12** phase-3b: seeded random moment per slot (Gate 0 median 0.96 → 0.99), full re-sample, mobile predictions cards.
- **2026-11-12** `d3c0f60` phase-3: depth (see PRD §10 FR-ECO … FR-WEB-007, §16 decisions).
- **2026-11-12** `4cda730` phases 1–2: full sample, data, page, README.
- **2026-11-12** `0e9ae99` phase-0: docs, sampler, metrics, page skeleton.
