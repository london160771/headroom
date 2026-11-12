// Sampled blocks where one shard used more than half its gas limit. The whole-block average shows
// why the gas price did not move.
import { day, pct } from '../lib/format.js';

export default function HotEvents({ events, floor }) {
  if (!events.length) return <p className="small hr-muted">No sampled block had a shard above 50%.</p>;
  const top = [...events].sort((a, b) => b.use - a.use).slice(0, 6);
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
      {events.length > top.length && <p className="small hr-muted mt-1 mb-0">Showing the {top.length} highest. All {events.length} are in data/headroom.json.</p>}
    </div>
  );
}
