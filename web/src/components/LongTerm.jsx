// How long does the room last? Years to each headroom bar at measured and reference growth paces
// (lib/longterm.js, a model), and gas burn next to NEAR Intents buybacks (external figure).
import { day, pace, pct, times, years } from '../lib/format.js';
import Source from './Source.jsx';

export default function LongTerm({ lt, v }) {
  if (!lt) return null;
  const last = lt.rows.find((r) => r.id === 'last_year');
  const fast = lt.rows.find((r) => r.id === 'fastest_year');
  return (
    <div>
      <p>
        It depends on how fast gas demand grows. Gas used per day in the last 30 days was <b>{pace(last.pace)}</b> the level of a year earlier
        {last.pace < 1 ? ', so on the current trend the room never runs out.' : '.'} The fastest year in the sample (to {day(fast.to)}) grew{' '}
        <b>{pace(fast.pace)}</b>.
      </p>
      <div className="table-responsive d-none d-md-block">
        <table className="table table-sm small mb-2">
          <thead>
            <tr>
              <th>Yearly growth</th>
              {lt.bars.map((b) => <th key={b.id}>{b.label} <span className="hr-mono">({times(b.multiple)})</span></th>)}
            </tr>
          </thead>
          <tbody>
            {lt.rows.map((r) => (
              <tr key={r.id}>
                <td>{r.label}: <span className="hr-mono">{pace(r.pace)}</span></td>
                {lt.bars.map((b) => <td key={b.id} className="hr-mono">{years(r.years[b.id])}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="d-md-none mb-2">
        {lt.rows.map((r) => (
          <div key={r.id} className="border-bottom py-2 small">
            <div className="fw-semibold">{r.label}: <span className="hr-mono">{pace(r.pace)}</span></div>
            {lt.bars.map((b) => (
              <div key={b.id} className="d-flex justify-content-between gap-2">
                <span>{b.label} <span className="hr-mono">({times(b.multiple)})</span></span>
                <span className="hr-mono text-nowrap">{years(r.years[b.id])}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
      <p className="small hr-muted">A model: capacity held at today's level and steady growth. Adding shards would push every bar further out.</p>
      {v && (
        <p className="mb-0">
          <b>Gas is one of two value channels.</b> Gas burn covers <b>{pct(v.gasBurnShare)}</b> of issuance. NEAR Intents fees fund NEAR buybacks, and those fees are
          mostly never paid as gas, so block data cannot see them. An external figure puts the buybacks at about <b>{pct(v.intentsBuybackShare)}</b> of new NEAR ({v.intents.window};{' '}
          <a href={v.intents.sources[0]} target="_blank" rel="noreferrer">source</a>, not recomputed here). Together: about {pct(v.combinedShare)}. Intents is the larger channel
          today; gas burn is the one that grows on its own as blocks fill.
        </p>
      )}
      <Source
        rpc="block → header.block_ordinal, chunks[].gas_used"
        code={['lib/longterm.js', 'lib/report.js', 'evidence/scenarios.json']}
        plain={`Gas per day = average gas per sampled block × blocks per day (from block_ordinal). ${lt.model}.`}
      />
    </div>
  );
}
