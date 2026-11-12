// Who fills the hot shard, and how often NEAR's congestion control was holding back work.
import { pct } from '../lib/format.js';
import Source from './Source.jsx';

export default function Culprits({ culprits, congestion }) {
  return (
    <div className="mt-4">
      {culprits && (
        <>
          <h3 className="h6">Who fills the hot shard</h3>
          <p className="small mb-2">
            For each of the {culprits.ranking.events} hot-shard blocks, we read that shard's chunk and counted the accounts receiving its receipts and transactions.
            The account with the most leads the chunk.
          </p>
          <div className="row g-2 mb-2">
            {culprits.ranking.byYear.map((y) => (
              <div key={y.year} className="col-sm-6 col-lg-3">
                <div className="border rounded p-2 h-100 small">
                  <div className="fw-semibold">{y.year} <span className="hr-muted fw-normal">· {y.events} hot blocks</span></div>
                  <ol className="ps-3 mb-0">
                    {y.top.slice(0, 3).map((a) => (
                      <li key={a.account}><span className="hr-mono text-break">{a.account}</span> <span className="hr-muted">led {a.led}</span></li>
                    ))}
                  </ol>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      <h3 className="h6 mt-3">Congestion control</h3>
      <p className="small mb-0">
        When a shard is overloaded, NEAR queues work as delayed receipts instead of raising the price. <b>{congestion.congestedBlocks.toLocaleString('en-US')}</b> of{' '}
        {congestion.blocks.toLocaleString('en-US')} sampled blocks ({pct(congestion.congestedBlocks / congestion.blocks)}) had any delayed receipts in a shard. That is
        the capacity limit the gas price does not show.
      </p>
      <Source
        rpc={'chunk {block_id, shard_id} → receipts[].receiver_id, transactions[].receiver_id; block → chunks[].congestion_info.delayed_receipts_gas'}
        code={['scripts/culprits.js', 'lib/culprits.js', 'lib/metrics.js']}
        plain="Counts are receipts and transactions, not gas: a chunk does not list gas per receipt. They show who is busy on the hot shard, not exact gas shares."
      />
    </div>
  );
}
