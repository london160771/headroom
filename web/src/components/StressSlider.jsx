// The ×N model: scale each shard's recent 95th-percentile load by N. A model, not a forecast:
// real growth would not land evenly on every shard.
import { useState } from 'react';
import { stress } from '../../../lib/metrics.js';
import { pct, times } from '../lib/format.js';
import Gauges from './Gauges.jsx';

const MAX_LOG = 3; // slider goes from ×1 to ×1000

export default function StressSlider({ recent }) {
  const [pos, setPos] = useState(0);
  const n = Math.round(10 ** ((pos / 100) * MAX_LOG));
  const s = stress(recent.perShard, recent.use, n);
  const busiest = Math.max(...s.shards.map((x) => x.load));

  return (
    <div className="hr-panel">
      <div className="d-flex flex-wrap justify-content-between align-items-baseline gap-2">
        <h2 className="h4 mb-0">Stress it: today's load × <span className="hr-mono">{n.toLocaleString('en-US')}</span></h2>
        <span className="small hr-muted">Model: each shard's busy-hour load (p95, last {recent.days} days) times N</span>
      </div>
      <input type="range" className="form-range my-3" min="0" max="100" value={pos} onChange={(e) => setPos(Number(e.target.value))} aria-label="Growth multiple" />
      <Gauges shards={s.shards.map((x) => ({ shard: x.shard, use: Math.min(x.load, 1) }))} />
      <div className="row g-3 mt-3 pt-3 border-top small">
        <div className="col-sm-4">
          <div className="hr-stat-label">Busiest shard</div>
          <div className="hr-stat hr-mono">{pct(Math.min(busiest, 1))}</div>
          <div className="hr-muted">full from about {times(recent.shardMultiple)}</div>
        </div>
        <div className="col-sm-4">
          <div className="hr-stat-label">Whole block (average)</div>
          <div className="hr-stat hr-mono">{pct(Math.min(s.blockUse, 1))}</div>
          <div className="hr-muted">fee rule moves past 50%, about {times(recent.feeMultiple)}</div>
        </div>
        <div className="col-sm-4">
          <div className="hr-stat-label">What happens</div>
          <div className="fw-medium mt-1">
            {s.feeMoves ? 'The gas price starts to rise.' : s.fullShards ? `${s.fullShards} shard${s.fullShards > 1 ? 's' : ''} full. Price still at the floor.` : 'Nothing. Price stays at the floor.'}
          </div>
          <div className="hr-muted">{s.fullShards > 0 && !s.feeMoves ? 'A full shard delays work (congestion control) but does not move the price.' : ''}</div>
        </div>
      </div>
    </div>
  );
}
