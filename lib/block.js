// Turn an RPC block into the compact record stored in evidence/samples.jsonl.
// Gas values are integers in Ggas (1 Tgas = 1,000 Ggas) so the file stays exact and small.
// NEAR amounts (burnt, total_supply) stay exact yoctoNEAR strings.
//
// NEAR detail: a chunk header's gas_used and balance_burnt describe that shard's PREVIOUS
// execution (the chunk applied one block earlier). Over many blocks this changes no average.
const GGAS = 1_000_000_000n;

export function toRecord(block) {
  const h = block.header.height;
  // A chunk belongs to this block only if it was included at this height.
  // Otherwise the block repeats an old header: that shard produced no chunk here.
  const included = block.chunks.filter((c) => c.height_included === h);
  return {
    height: h,
    ordinal: block.header.block_ordinal ?? null,
    ts: Number(BigInt(block.header.timestamp) / 1_000_000n),
    gas_price: block.header.gas_price,
    total_supply: block.header.total_supply,
    shards: block.chunks.length,
    shard_ids: included.map((c) => c.shard_id),
    used: included.map((c) => Number(BigInt(c.gas_used) / GGAS)),
    limit: included.map((c) => Number(BigInt(c.gas_limit) / GGAS)),
    delayed: included.map((c) => Number(BigInt(c.congestion_info?.delayed_receipts_gas ?? 0) / GGAS)),
    burnt: included.reduce((s, c) => s + BigInt(c.balance_burnt), 0n).toString(),
  };
}
