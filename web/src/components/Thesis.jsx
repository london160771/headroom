// The thesis: what it means for a holder, then the same numbers read both ways.
import Holder from './Holder.jsx';
import { month, pct, times } from '../lib/format.js';

export default function Thesis({ d }) {
  const r = d.recent;
  const first = d.monthly[0];
  const pk = d.peak_month;
  return (
    <section id="thesis" className="hr-section">
      <h2 className="h4">The thesis</h2>
      <p className="hr-dek">
        NEAR sells blockspace. For three years it has had far more than it sells, and the gap is now very wide. That fact cuts both ways.
      </p>
      <Holder d={d} />
      <div className="row g-3">
        <div className="col-md-6">
          <div className="hr-panel hr-card-bull h-100">
            <div className="small hr-ink-2"><span className="hr-reading-dot" />Bull reading</div>
            <h3 className="h5 mt-2 mb-3">The scaling is already built and paid for</h3>
            <p className="small mb-0">
              NEAR went from {first.shards} shards ({month(first.month)}) to {r.shards} today. Demand could grow about <b>{times(r.feeMultiple)}</b> before
              anyone pays a higher gas price, and about <b>{times(r.shardMultiple)}</b> before even the busiest shard is full at its busy hours. In the{' '}
              {month(new Date(d.price_rises[0]?.ts ?? 0).toISOString().slice(0, 7))} inscription rush NEAR had {d.price_rises[0]?.shards} shards, and 2 full ones
              were enough to raise the price. With {r.shards} shards it would take about {Math.ceil(r.shards / 2)} full shards at once.
              {d.economics && <> At every block full, burn would be {pct(d.economics.coverageFull)} of issuance at the floor price, more once the price rises.</>}
            </p>
          </div>
        </div>
        <div className="col-md-6">
          <div className="hr-panel hr-card-bear h-100">
            <div className="small hr-ink-2"><span className="hr-reading-dot" />Bear reading</div>
            <h3 className="h5 mt-2 mb-3">Blockspace is not scarce, so it cannot carry the token's value</h3>
            <p className="small mb-0">
              In the last {r.days} days NEAR used <b>{pct(r.use)}</b> of its capacity, down from {pct(pk.use)} in {month(pk.month)}. The gas price was at the
              floor in {pct(r.atFloor)} of sampled blocks, and gas burn offset {d.economics ? pct(d.economics.coverageToday) : '–'} of new NEAR. With this much room,
              fees cannot rise from demand pressure for years. Value has to come from volume (many more transactions at the floor price) or from other sinks,
              not from scarce blockspace.
            </p>
          </div>
        </div>
      </div>

      <p className="small mt-3 mb-0">
        The full thesis (claim, evidence for, evidence against, what would change my mind) is in{' '}
        <a href="https://github.com/london160771/headroom/blob/main/THESIS.md" target="_blank" rel="noreferrer">THESIS.md</a>, generated from the same data as this page. The
        statements that would prove it wrong are the frozen predictions above.
      </p>
    </section>
  );
}
