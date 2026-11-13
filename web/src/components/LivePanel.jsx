import { useEffect, useState } from 'react';
import { FEE_TRIGGER } from '../../../lib/metrics.js';
import { gasPrice, pct } from '../lib/format.js';
import { readLatest } from '../lib/live.js';
import Gauges from './Gauges.jsx';

export default function LivePanel({ floor }) {
  const [state, setState] = useState({ loading: true });
  const load = () => {
    setState((s) => ({ ...s, loading: true }));
    readLatest()
      .then((r) => setState({ loading: false, data: r, at: new Date() }))
      .catch((e) => setState({ loading: false, error: e.message }));
  };
  useEffect(load, []);

  const d = state.data;
  return (
    <div className="hr-panel">
      <div className="hr-live-head">
        <div>
          <div className="fw-medium"><span className="hr-live-dot" />Live: newest final block</div>
          {d && <div className="small hr-mono hr-muted">#{d.record.height.toLocaleString('en-US')} · {d.stats.shards} shards</div>}
        </div>
        <button className="hr-btn hr-btn-sm" onClick={load} disabled={state.loading}>
          {state.loading ? 'Reading…' : 'Read again'}
        </button>
      </div>
      {state.error && <p className="text-danger small mb-0">Live read unavailable: {state.error}. The sampled history below still loads from evidence/.</p>}
      {d && (
        <>
          <Gauges shards={[...d.stats.shardUse].sort((a, b) => a.shard - b.shard)} />
          <div className="hr-live-foot">
            <span>Whole block: <b className="hr-mono">{pct(d.stats.use)}</b></span>
            <span>Gas price: <b className="hr-mono">{gasPrice(d.record.gas_price)}</b>{floor && d.record.gas_price === floor ? ' (the floor)' : ''}</span>
            {d.stats.missing > 0 && <span>{d.stats.missing} shard(s) produced no chunk in this block</span>}
          </div>
          <div className="small hr-muted mt-2">
            Read {state.at.toISOString().slice(11, 19)} UTC from {new URL(d.rpc).host}. <span className="hr-feeline" />{pct(FEE_TRIGGER)}, where NEAR's fee rule starts raising the price (if the whole block is that full).
          </div>
        </>
      )}
    </div>
  );
}
