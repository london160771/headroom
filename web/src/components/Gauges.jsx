// One tube per shard. Fill = share of that shard's gas limit used. Dashed line = 50% (the fee rule's trigger for a whole block).
import { pct } from '../lib/format.js';

export default function Gauges({ shards, trigger = 0.5, scaleMax = 1 }) {
  return (
    <div className="hr-gauges" role="img" aria-label="Gas use per shard">
      {shards.map((s) => {
        const h = Math.min(1, s.use / scaleMax);
        const cls = s.use >= 1 ? 'is-full' : s.use > trigger ? 'is-hot' : '';
        return (
          <div className="hr-gauge" key={s.shard}>
            <span className="hr-gauge-value hr-mono">{pct(s.use)}</span>
            <div className="hr-gauge-tube" title={`Shard ${s.shard}: ${pct(s.use)}`}>
              <div className={`hr-gauge-fill ${cls}`} style={{ height: `${Math.max(h * 100, s.use > 0 ? 1 : 0)}%` }} />
              {trigger <= scaleMax && <div className="hr-gauge-mark" style={{ bottom: `${(trigger / scaleMax) * 100}%` }} />}
            </div>
            <span className="hr-gauge-label hr-mono">S{s.shard}</span>
          </div>
        );
      })}
    </div>
  );
}
