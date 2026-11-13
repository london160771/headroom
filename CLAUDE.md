# CLAUDE.md: rules for coding agents on Headroom

Read this file, then **PRD.md** (the source of truth), then **PROJECT_STATE.md** (where we are), before changing anything. Codex: start prompts with "Read CLAUDE.md and PRD.md first."

## 1. What this is

**Headroom**: a re-runnable census of NEAR's blockspace. Shard by shard, how full NEAR is and how much growth fits before fees move.
Hackathon: NEAR HACKATHON, Investment Thesis track. Deadline 2026-11-14 23:59 UTC. **Internal cutoff 2026-11-14 16:00 UTC.**
Flow: `SAMPLE THE CHAIN → MEASURE EACH SHARD → FIND THE HEADROOM → STRESS IT (×N) → RE-RUN IT YOURSELF`
Core guarantee: **every number on the page is rebuilt from public block data by one command.**
Sister project: AgentGate (github.com/london160771/agentgate). Both READMEs must name each other.

## 2. How to work

1. Find the current phase in PROJECT_STATE.md. Never rebuild a phase marked done. The repo is the truth.
2. Build only what PRD §10 and §27 say for that phase. New ideas go to ROADMAP.md.
3. Run the checks (§4). Fix failures inside the PRD's scope.
4. Update PROJECT_STATE.md: what was built, files, checks with real results, problems, next phase.
5. Commit `phase-N: <what>` and push to `main`. Go straight to the next phase; don't stop for approval.

Stop only when: a ⛔ MANUAL STOP is reached (write the checklist at the top of PROJECT_STATE, push, say exactly what Adesope must do), or a check fails and the only fix breaks the PRD.

## 3. Hard rules

- **Never deploy or sign.** Adesope deploys to Vercel and runs `scripts/anchor-mainnet.sh` himself (writing and dry-running it is fine).
- **No fake data.** No mocked or typed-in numbers in the page, README or video. Test fixtures stay in test files and are named as fixtures.
- **No claims without proof.** Test counts only after they pass.
- **One source for numbers:** `evidence/` → `web/public/data/headroom.json`. Never hardcode a percentage, multiple or count in UI text.
- **No secrets in this repo or in CI.** The only key is for `headroom-anchor.near` (mainnet) and it stays in Adesope's legacy keychain; only he runs `scripts/anchor-mainnet.sh`. No `.env`. Check `git diff --cached` before each commit.
- **Bootstrap 5, no Tailwind.**
- **Dependencies:** React, Vite, Bootstrap, vitest only (plus Node built-ins). Note any other in PROJECT_STATE.
- Keep code simple. Small files, clear names, comments where NEAR behaviour is surprising.

## 4. Commands

```bash
npm install
npm run sample        # archival RPC → evidence/samples.jsonl (resumable, ~15 min)
npm run nearblocks    # NearBlocks daily series → evidence/nearblocks-daily.json
npm run data          # evidence/ → web/public/data/headroom.json
npm run check         # re-read random sample slots and compare with evidence/
npm test              # node --test (metrics) + vitest (web)
npm run build         # web production build
```

## 5. NEAR facts and gotchas

- Each block lists one chunk header per shard. A chunk counts for a block only if `height_included == block height`; otherwise it is a missing chunk (old header repeated).
- Chunk `gas_limit` is 1,000 Tgas (read from headers, never hardcode it).
- The gas price for the next block is computed from **gas summed over all included chunks** vs the summed limit (nearcore `core/primitives/src/block.rs`, `compute_next_gas_price`). It rises only when the whole block is more than half full. One full shard cannot move it.
- A busy shard is handled by congestion control instead (delayed receipts, `congestion_info` in the chunk header).
- Floor gas price is 100,000,000 yoctoNEAR per gas (read it from headers).
- Shard count changed over time (4 → 10). Compare shares of capacity, not raw gas.
- Block time changed (about 1.1 s → 0.6 s in 2025). Sample by time, not by height.
- Sandbox: Node needs `NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt` to reach RPC.
- Archival RPCs: archival-rpc.mainnet.fastnear.com, archival-rpc.mainnet.near.org. Unknown heights return `UNKNOWN_BLOCK` (skipped height): move to the next height.

## 6. Honesty rules

- A block we could not read is missing, never 0%.
- The slider is a model (even scaling of today's measured load). Label it as a model.
- State the limits: gas is not the only capacity limit; sampled, not every block.
- Show both bull and bear readings of the same numbers.

## 7. Report format (end of every phase)

Files changed · checks run + results · commit hash · what's next (or the manual checklist).
