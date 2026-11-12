// Live read of the newest final block from NEAR mainnet, straight from the browser.
import { toRecord } from '../../../lib/block.js';
import { blockStats } from '../../../lib/metrics.js';

export const LIVE_RPCS = ['https://rpc.mainnet.fastnear.com', 'https://rpc.mainnet.near.org'];

export async function readLatest(rpcs = LIVE_RPCS) {
  let last;
  for (const url of rpcs) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 'headroom', method: 'block', params: { finality: 'final' } }),
      });
      const body = await res.json();
      if (body.result) return { rpc: url, record: toRecord(body.result), stats: blockStats(toRecord(body.result)) };
      last = body.error?.cause?.name || `HTTP ${res.status}`;
    } catch (e) {
      last = e.message;
    }
  }
  throw new Error(`Live read failed: ${last}`);
}
