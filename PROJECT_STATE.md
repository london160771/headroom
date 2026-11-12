# PROJECT_STATE: Headroom

> Where the project stands. Requirements live in PRD.md. Only verified facts here.

**Last updated:** 2026-11-12 20:10 UTC · **By:** Claude Code

## ⛔ MANUAL STOP (Phase 3): what Adesope must do

1. Deploy on Vercel: New Project → import `london160771/headroom` → keep the defaults (vercel.json sets build `npm run build` and output `web/dist`). No env vars.
2. Send the live URL; Claude fills it into README.
3. Record the video (script: /mnt/project-files/headroom/VIDEO-SCRIPT.md) and post on X (draft: /mnt/project-files/headroom/X-POST.md).
4. Submit (track `thesis`) once README links are filled.

## 1. Right now

- **Active phase:** 3, ship (manual stop above).
- **Done:** Phases 0–2 and the README.

## 2. Phase tracker

| Phase | Status | Verified on | Commit |
|---|---|---|---|
| 0, docs + Gate 0 | Done | 2026-11-12 | `0e9ae99` + evidence commit |
| 1, metrics + data + check | Done | 2026-11-12 | see build log |
| 2, page | Done | 2026-11-12 | see build log |
| 3, ship | Waiting on manual stop | | |

## 3. Last verification (2026-11-12)

| Check | Command | Result |
|---|---|---|
| Metric tests | `node --test test/*.test.js` | 11 of 11 pass |
| Web tests | `vitest run` | 4 of 4 pass |
| Build | `npm run build` | pass |
| Re-check | `npm run check` | 20 of 20 random blocks match evidence/ |
| Gate 0 | `npm run data` (cross_check) | median 0.96; 42 of 47 months within 0.8–1.2 |
| UI at 1280 px and 390 px | Playwright screenshot | no horizontal scroll, no console errors |

## 4. What works (verified)

- Sampler: 5,648 slots, 5,648 blocks, 2023-01-01 to 2026-11-12. 5,647 count in the numbers: 1 block had no included chunk and is skipped (INV-2).
- Page: headline, live gauges (mainnet RPC from the browser), 3-year log chart, ×N slider, hot-shard table, price-rise note, thesis, method, limits.

## 5. Real vs mocked

All real. Slider is a labelled model. See REAL_VS_MOCKED.md.

## 6. Live proof

| Item | Value |
|---|---|
| Live URL | [pending Vercel deploy] |
| Network | NEAR mainnet (read only) |
| Contracts | none |

## 8. Known issues

- archival-rpc.mainnet.near.org rate-limits (HTTP 429); FastNEAR archival is primary.
- 1 of 5,648 sampled blocks had no included chunk; it is skipped, never counted as 0%.

## 9. Handoff notes

- Sandbox Node needs `NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt`.
- Dependencies: react, react-dom, bootstrap, vite, @vitejs/plugin-react, vitest. Nothing else.

## 10. Build log

- **2026-11-12** evidence + phases 1–2: full sample, data, page fixes, README, REAL_VS_MOCKED.
- **2026-11-12** `0e9ae99` phase-0: docs, sampler, metrics, page skeleton.
