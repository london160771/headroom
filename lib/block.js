// Turn an RPC block into the compact record stored in evidence/samples.jsonl.
// Gas values are integers in Ggas (1 Tgas = 1,000 Ggas) so the file stays exact and small.
const GGAS = 1_000_000_000n;

export function toRecord(block) {
  const h = block.header.height;
  // A chunk belongs to this block only if it was included at this height.
  // Otherwise the block repeats an old header: that shard produced no chunk here.
  const included = block.chunks.filter((c) => c.height_included === h);
  return {
    height: h,
    ts: Number(BigInt(block.header.timestamp) / 1_000_000n),
    gas_price: block.header.gas_price,
    shards: block.chunks.length,
    shard_ids: included.map((c) => c.shard_id),
    used: included.map((c) => Number(BigInt(c.gas_used) / GGAS)),
    limit: included.map((c) => Number(BigInt(c.gas_limit) / GGAS)),
    delayed: included.map((c) => Number(BigInt(c.congestion_info?.delayed_receipts_gas ?? 0) / GGAS)),
  };
}
