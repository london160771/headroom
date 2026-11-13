// Read Headroom's hashes back from NEAR mainnet: the anchor contract's state (`get`) and the
// original transaction (`tx`), whose arguments stay in NEAR's history for good.
import { rpc } from './rpc.js';

const MAINNET = (process.env.NEAR_RPC || 'https://rpc.mainnet.fastnear.com,https://archival-rpc.mainnet.fastnear.com').split(',');

export async function viewAnchor(contract, sha256, opts = { rpcs: MAINNET, tries: 4 }) {
  const args = Buffer.from(JSON.stringify({ sha256 })).toString('base64');
  const r = await rpc('query', { request_type: 'call_function', finality: 'final', account_id: contract, method_name: 'get', args_base64: args }, opts);
  return r ? JSON.parse(Buffer.from(r.result).toString('utf8')) : null;
}

/** The anchor transaction: did it succeed, and did it carry this hash? */
export async function anchorTx(contract, txHash, opts = { rpcs: MAINNET, tries: 4 }) {
  const r = await rpc('tx', { tx_hash: txHash, sender_account_id: contract, wait_until: 'NONE' }, opts);
  if (!r) return null;
  const call = r.transaction.actions.map((a) => a.FunctionCall).find(Boolean);
  const args = call ? JSON.parse(Buffer.from(call.args, 'base64').toString('utf8')) : {};
  return {
    receiver: r.transaction.receiver_id,
    method: call?.method_name,
    sha256: args.sha256,
    succeeded: 'SuccessValue' in (r.status ?? {}),
  };
}
