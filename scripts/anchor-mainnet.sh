#!/usr/bin/env bash
# Put Headroom's evidence hash on NEAR mainnet. Adesope runs this; agents never deploy or sign.
#
#   bash scripts/anchor-mainnet.sh key      # 1. make a fresh key (an implicit account) to pay with
#   (send 2 NEAR to the account it prints, from any wallet or exchange)
#   bash scripts/anchor-mainnet.sh create   # 2. create headroom-anchor.near and deploy the contract
#   bash scripts/anchor-mainnet.sh anchor   # 3. store the hashes; prints the transaction IDs
#   bash scripts/anchor-mainnet.sh <step> --dry-run   # print the commands, send nothing
#
# Needs near-cli-rs. Keys stay on this computer: the payer key in ~/.near-credentials/implicit/,
# the anchor account key in the legacy keychain (~/.near-credentials/mainnet/). Nothing goes in git.
# Cost: the contract is about 116 KB, which locks about 1.2 NEAR of storage on the account.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NET=mainnet
ACCOUNT="${HEADROOM_ANCHOR_ACCOUNT:-headroom-anchor.near}"
FUND='1.5 NEAR'
WASM="$ROOT/contract/res/headroom_anchor.wasm"
KEYDIR="$HOME/.near-credentials/implicit"
STEP="${1:-}"
DRY=0
[[ "${2:-}" == "--dry-run" || "${1:-}" == "--dry-run" ]] && DRY=1

run() {
  if [[ $DRY -eq 1 ]]; then printf '[dry-run] '; printf '%q ' "$@"; echo; else "$@"; fi
}

payer_file() { ls "$KEYDIR"/*.json 2>/dev/null | head -1 || true; }

case "$STEP" in
  key)
    if [[ -n "$(payer_file)" ]]; then
      echo "A payer key already exists: $(payer_file)"
    else
      mkdir -p "$KEYDIR"
      run near account create-account fund-later use-auto-generation save-to-folder "$KEYDIR"
    fi
    F="$(payer_file || true)"
    [[ -n "$F" ]] && echo && echo "Send 2 NEAR to this account (it is the file name):" && basename "$F" .json
    ;;
  create)
    F="$(payer_file)"
    [[ -z "$F" && $DRY -eq 0 ]] && { echo "Run: bash scripts/anchor-mainnet.sh key   first."; exit 1; }
    PAYER="$(basename "${F:-PAYER.json}" .json)"
    if [[ $DRY -eq 0 ]] && near account view-account-summary "$ACCOUNT" network-config $NET now >/dev/null 2>&1; then
      echo "== $ACCOUNT already exists, skipping create =="
    else
      echo "== 1. Create $ACCOUNT, funded with $FUND by $PAYER =="
      run near account create-account fund-myself "$ACCOUNT" "$FUND" \
        autogenerate-new-keypair save-to-legacy-keychain \
        sign-as "$PAYER" network-config $NET sign-with-access-key-file "${F:-PAYER.json}" send
    fi
    echo "== 2. Deploy the anchor contract (no init call needed) =="
    run near contract deploy "$ACCOUNT" use-file "$WASM" without-init-call \
      network-config $NET sign-with-legacy-keychain send
    echo "== 3. Check: count() should print 0 =="
    run near contract call-function as-read-only "$ACCOUNT" count json-args '{}' network-config $NET now
    ;;
  anchor)
    COMMIT="$(git -C "$ROOT" rev-parse --short HEAD)"
    # Recompute the manifest from the files on disk, so the hash matches what is in git now.
    node "$ROOT/scripts/manifest.js" >/dev/null
    if [[ $DRY -eq 0 && -n "$(git -C "$ROOT" status --porcelain evidence/MANIFEST.sha256)" ]]; then
      echo "evidence/MANIFEST.sha256 differs from git. Run: git pull   then try again."; exit 1
    fi
    M="$(sha256sum "$ROOT/evidence/MANIFEST.sha256" | cut -d' ' -f1)"
    P="$(sha256sum "$ROOT/predictions/predictions.json" | cut -d' ' -f1)"
    for pair in "$P|predictions/predictions.json (tag predictions-v1)" "$M|evidence/MANIFEST.sha256 @ $COMMIT"; do
      HASH="${pair%%|*}"; LABEL="${pair#*|}"
      echo "== anchor $HASH  ($LABEL) =="
      run near contract call-function as-transaction "$ACCOUNT" anchor \
        json-args "{\"sha256\":\"$HASH\",\"label\":\"$LABEL\"}" \
        prepaid-gas '30 Tgas' attached-deposit '0 NEAR' \
        sign-as "$ACCOUNT" network-config $NET sign-with-legacy-keychain send
    done
    echo "Done. Copy the two 'Transaction ID' lines above and send them to Claude."
    ;;
  *)
    sed -n '2,12p' "$0"; exit 1 ;;
esac
