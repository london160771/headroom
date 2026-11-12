// Sampled blocks where one shard used more than half its gas limit. The whole-block average shows
// why the gas price did not move.
import { day, pct } from '../lib/format.js';

export default function HotEvents({ events, floor, rises }) {
  if (!events.length) return <p className="small hr-muted">No sampled block had a shard more than half full.</p>;
  const quiet = events.filter((e) => e.gasPrice === floor);
  const top = [...quiet].sort((a, b) => b.use - a.use || b.ts - a.ts).slice(0, 6);
  const atFloor = events.filter((e) => e.gasPrice === floor).length;
  return (
    <div>
      <p className="small mb-2">
        <b>{events.length}</b> sampled block{events.length === 1 ? '' : 's'} had one shard more than half full. In {atFloor} of them the gas price stayed at the floor,
        because the fee rule looks at the whole block, not the busiest shard.
      </p>
      <div className="table-responsive">
        <table className="table table-sm small mb-0">
          <thead>
            <tr><th>Date (UTC)</th><th>Block</th><th>Shard</th><th>Shard use</th><th>Whole block</th></tr>
          </thead>
          <tbody>
            {top.map((e) => (
              <tr key={e.height}>
                <td>{day(e.ts)}</td>
                <td className="hr-mono">{e.height.toLocaleString('en-US')}</td>
                <td>{e.shard}</td>
                <td className="hr-mono">{pct(e.use)}</td>
                <td className="hr-mono">{pct(e.blockUse)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="small hr-muted mt-1 mb-0">The {top.length} busiest shards among blocks still priced at the floor. All {events.length} events are in data/headroom.json.</p>
      {rises.length > 0 && <PriceRises rises={rises} />}
    </div>
  );
}

// The only sampled blocks where the price left the floor: the whole block was near or past 50%.
function PriceRises({ rises }) {
  const max = Math.max(...rises.map((r) => r.priceMultiple));
  const first = rises[0];
  const last = rises.at(-1);
  return (
    <div className="mt-4">
      <h3 className="h6">The only time the price moved</h3>
      <p className="small mb-2">
        {rises.length} sampled blocks, all between {day(first.ts)} and {day(last.ts)}, were priced above the floor, up to <b>{max.toFixed(0)}×</b>. That was the
        inscription rush on <span className="hr-mono">inscription.near</span>. Up to {Math.max(...rises.map((r) => r.fullShards))} of {first.shards} shards were full, and the whole block was{' '}
        {pct(Math.min(...rises.map((r) => r.blockUse)))} to {pct(Math.max(...rises.map((r) => r.blockUse)))} full. The fee rule worked as written (the price follows the previous blocks, so it can stay up briefly after use drops). It just needs whole blocks, not one shard, to fill.
      </p>
    </div>
  );
}
