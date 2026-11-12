// The frozen predictions, scored on every build. A backtest shows how the same statements
// scored over the most recent past window of the same length.
import { day, pct } from '../lib/format.js';
import Source from './Source.jsx';

const BADGE = { waiting: 'secondary', holding: 'success', 'not holding': 'warning', passed: 'success', failed: 'danger' };
const fmt = (p, v) => (v == null ? '–' : p.metric === 'at_floor_share' || p.metric.includes('use') || p.metric.includes('p95') || p.metric === 'burn_to_issuance' ? pct(v) : String(v));

export default function Predictions({ p }) {
  if (!p) return null;
  return (
    <div>
      <p className="small mb-2">
        Made {day(p.made_at)} and frozen: the file's SHA-256 is <span className="hr-mono text-break">{p.sha256}</span>, also stamped in Bitcoin with OpenTimestamps.
        The page re-scores them every time the data is rebuilt.
      </p>
      <div className="table-responsive">
        <table className="table table-sm small align-middle mb-0">
          <thead><tr><th>#</th><th>Prediction</th><th>Window</th><th>Now</th><th>Backtest*</th></tr></thead>
          <tbody>
            {p.scored.map((s, i) => {
              const b = p.backtest[i];
              return (
                <tr key={s.id}>
                  <td className="hr-mono">{s.id}</td>
                  <td>{s.text}<div className="hr-muted">If wrong: {s.if_wrong}</div></td>
                  <td className="text-nowrap">{day(s.from)} to {day(s.to)}</td>
                  <td><span className={`badge text-bg-${BADGE[s.status]}`}>{s.status}</span>{s.value_so_far != null && <div className="hr-mono">{fmt(s, s.value_so_far)}</div>}</td>
                  <td><span className={`badge text-bg-${BADGE[b.status]}`}>{b.status}</span><div className="hr-mono">{fmt(b, b.value_so_far)}</div></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="small hr-muted mt-1 mb-0">*Backtest: the same statement over the window of the same length that ends on the last full day of data. It shows how the thesis would have scored in the recent past, including where it would have been wrong.</p>
      <Source code={['predictions/predictions.json', 'lib/predictions.js']} plain="Each prediction names a metric, a window, an operator and a value. The build recomputes the metric from sampled blocks inside the window. A running maximum that breaks its bound fails at once; anything else is final when its window closes." />
    </div>
  );
}
