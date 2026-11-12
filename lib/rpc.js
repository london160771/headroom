// Minimal NEAR JSON-RPC client with retries. The first provider is used normally;
// the others are only tried after a failure (archival-rpc.mainnet.near.org rate-limits hard).
export const ARCHIVAL_RPCS = (process.env.NEAR_ARCHIVAL_RPC || 'https://archival-rpc.mainnet.fastnear.com,https://archival-rpc.mainnet.near.org').split(',');

export const errors = {};

export async function rpc(method, params, { rpcs = ARCHIVAL_RPCS, tries = 7 } = {}) {
  let last;
  for (let i = 0; i < tries; i++) {
    const url = rpcs[i % rpcs.length];
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
      });
      const body = await res.json().catch(() => ({}));
      if (body.result) return body.result;
      // A skipped height has no block. That is normal on NEAR, not an error.
      if (body.error?.cause?.name === 'UNKNOWN_BLOCK') return null;
      last = body.error?.cause?.name || `HTTP ${res.status}`;
    } catch (e) {
      last = e.message;
    }
    errors[last] = (errors[last] || 0) + 1;
    await new Promise((r) => setTimeout(r, 1000 * 2 ** i));
  }
  throw new Error(`RPC ${method} failed after ${tries} tries: ${last} ${JSON.stringify(params)}`);
}

/** The first block at or after `height` (skips heights where no block was produced). */
export async function blockFrom(height, opts) {
  for (let h = height; h < height + 50; h++) {
    const b = await rpc('block', { block_id: h }, opts);
    if (b) return b;
  }
  throw new Error(`no block found in 50 heights from ${height}`);
}
