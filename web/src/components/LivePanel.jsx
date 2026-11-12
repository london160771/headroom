import { useEffect, useState } from 'react';
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
    <div className="hr-panel h-100">
      <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
        <div>
          <div className="hr-kicker">LIVE · NEWEST FINAL BLOCK</div>
          {d && <div className="small hr-mono">#{d.record.height.toLocaleString('en-US')} · {d.stats.shards} shards</div>}
        </div>
        <button className="btn btn-sm btn-outline-secondary" onClick={load} disabled={state.loading}>
          {state.loading ? 'Reading…' : 'Read again'}
        </button>
      </div>
      {state.error && <p className="text-danger small mb-0">Live read unavailable: {state.error}. The sampled history below still loads from evidence/.</p>}
      {d && (
        <>
          <Gauges shards={[...d.stats.shardUse].sort((a, b) => a.shard - b.shard)} />
          <div className="d-flex flex-wrap gap-3 small mt-3">
            <span>Whole block: <b className="hr-mono">{pct(d.stats.use)}</b></span>
            <span>Gas price: <b className="hr-mono">{gasPrice(d.record.gas_price)}</b>{floor && d.record.gas_price === floor ? ' (the floor)' : ''}</span>
            {d.stats.missing > 0 && <span>{d.stats.missing} shard(s) produced no chunk in this block</span>}
          </div>
          <div className="small hr-muted mt-1">
            Read {state.at.toISOString().slice(11, 19)} UTC from {new URL(d.rpc).host}. Dashed line: 50%, where NEAR's fee rule starts raising the price (if the whole block is that full).
          </div>
        </>
      )}
    </div>
  );
}
