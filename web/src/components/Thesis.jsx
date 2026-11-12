// The thesis: the same numbers read both ways, plus dated statements anyone can re-check later.
import { day, month, pct, times } from '../lib/format.js';

export default function Thesis({ d }) {
  const r = d.recent;
  const first = d.monthly[0];
  const pk = d.peak_month;
  return (
    <section className="mb-5">
      <h2 className="h4">The thesis</h2>
      <p className="hr-muted">
        NEAR sells blockspace. For three years it has had far more than it sells, and the gap is now very wide. That fact cuts both ways.
      </p>
      <div className="row g-3">
        <div className="col-md-6">
          <div className="hr-panel hr-card-bull h-100">
            <div className="hr-kicker">BULL READING</div>
            <h3 className="h6 mt-1">The scaling is already built and paid for.</h3>
            <p className="small mb-0">
              NEAR went from {first.shards} shards ({month(first.month)}) to {r.shards} today. Demand could grow about <b>{times(r.feeMultiple)}</b> before
              anyone pays a higher gas price, and about <b>{times(r.shardMultiple)}</b> before even the busiest shard is full at its busy hours. In the{' '}
              {month(new Date(d.price_rises[0]?.ts ?? 0).toISOString().slice(0, 7))} inscription rush NEAR had {d.price_rises[0]?.shards} shards, and 2 full ones
              were enough to raise the price. With {r.shards} shards it would take about {Math.ceil(r.shards / 2)} full shards at once.
            </p>
          </div>
        </div>
        <div className="col-md-6">
          <div className="hr-panel hr-card-bear h-100">
            <div className="hr-kicker">BEAR READING</div>
            <h3 className="h6 mt-1">Blockspace is not scarce, so it cannot carry the token's value.</h3>
            <p className="small mb-0">
              In the last {r.days} days NEAR used <b>{pct(r.use)}</b> of its capacity, down from {pct(pk.use)} in {month(pk.month)}. The gas price was at the
              floor in {pct(r.atFloor)} of sampled blocks. With this much room, fees cannot rise from demand pressure for years. Value has to come from volume
              (many more transactions at the floor price) or from other sinks, not from scarce blockspace.
            </p>
          </div>
        </div>
      </div>

      <h3 className="h6 mt-4">Dated statements (made {day(d.generated_at)}). Re-run the sampler later to check them.</h3>
      <ol className="small">
        <li>Through 31 Dec 2027, NEAR's gas price stays at the floor in at least 99% of sampled blocks. <span className="hr-muted">(So far: {d.above_floor_blocks} of {d.sampling.blocks.toLocaleString('en-US')} sampled blocks above the floor.)</span></li>
        <li>No calendar month in 2027 averages more than {pct(pk.use)} of capacity, the highest month since 2023 ({month(pk.month)}).</li>
        <li>In every month of 2027, the busiest shard in a block stays under 50% at the 95th percentile (the orange line in the chart).</li>
      </ol>
      <p className="small hr-muted mb-0">If statement 1 or 2 fails, the bear reading is wrong: blockspace is getting scarce. If 3 fails while 1 holds, NEAR has a hot shard problem that its fee rule cannot see.</p>
    </section>
  );
}
