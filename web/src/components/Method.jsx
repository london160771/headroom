// How every number was made, its limits, and how to re-run it.
import { day, gasPrice, month, pct, times } from '../lib/format.js';

const REPO = 'https://github.com/london160771/headroom';

export default function Method({ d }) {
  const cc = d.cross_check.filter((c) => c.ratio != null);
  const within = cc.filter((c) => c.ratio >= 0.8 && c.ratio <= 1.2).length;
  const sorted = [...cc].map((c) => c.ratio).sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  return (
    <section id="method" className="hr-section">
      <h2 className="h4">How it was measured</h2>
      <div className="row g-3">
        <div className="col-lg-6">
          <div className="hr-panel h-100 small">
            <h3 className="h6">Method</h3>
            <ul className="ps-3 mb-2">
              <li><b>Sample:</b> {d.sampling.rule}. {d.sampling.blocks.toLocaleString('en-US')} blocks from {d.sampling.first.slice(0, 10)} to {d.sampling.last.slice(0, 10)}, read from NEAR mainnet archival RPC. Each block is found by its time (median gap from the slot time {Math.round(d.sampling.offsetSeconds.median)} s; {d.sampling.offsetSeconds.over60} of {d.sampling.slots.toLocaleString('en-US')} slots a minute or more off).</li>
              <li><b>Per shard:</b> each chunk header gives gas used and its gas limit ({d.chunk_gas_limit_tgas.toLocaleString('en-US')} Tgas). Only chunks included at that height count; a missing chunk is skipped, never counted as 0%.</li>
              <li><b>Whole chain:</b> gas used ÷ gas limit, summed over all chunks and blocks in the period.</li>
              <li><b>Fee multiple:</b> 50% ÷ whole-chain use (last {d.recent.days} days). NEAR raises the next gas price only when a block's summed gas passes half its summed limit (<a href="https://github.com/near/nearcore/blob/master/core/primitives/src/block.rs" target="_blank" rel="noreferrer">nearcore compute_next_gas_price</a>).</li>
              <li><b>Shard multiple:</b> 100% ÷ the busiest shard's own 95th percentile use (last {d.recent.days} days: shard {d.recent.busiest.shard}, {pct(d.recent.busiest.p95)}).</li>
              <li><b>Floor price:</b> {gasPrice(d.floor_gas_price)}, the lowest price in the sample.</li>
              <li><b>{pct(d.intervals.level)} intervals:</b> {d.intervals.method}. Blocks on the same day are not independent, so whole days are resampled.</li>
            </ul>
            <h3 className="h6 mt-3">Cross-check (Gate 0)</h3>
            <p className="mb-0">
              Our sampled gas per block vs <a href="https://api.nearblocks.io/v1/charts" target="_blank" rel="noreferrer">NearBlocks daily totals</a>, per month:
              median ratio <b className="hr-mono">{median?.toFixed(2)}</b>; {within} of {cc.length} months within 0.8 to 1.2.
              {cc.length > within && ` Furthest: ${[...cc].sort((a, b) => Math.abs(1 - b.ratio) - Math.abs(1 - a.ratio)).slice(0, 2).map((c) => `${month(c.month)} (${c.ratio.toFixed(2)})`).join(', ')}.`}
            </p>
            {d.dense_check && <Dense c={d.dense_check} />}
          </div>
        </div>
        <div className="col-lg-6">
          <div className="hr-panel h-100 small">
            <h3 className="h6">Limits, stated plainly</h3>
            <ul className="ps-3 mb-3">
              <li>Gas is not NEAR's only limit. State size, chunk and witness size, and receipt bandwidth can bind first. Headroom measures gas only.</li>
              <li>It samples one block per 6-hour slot, not every block. Short spikes between samples are missed.</li>
              <li>A 95th percentile from 120 blocks is a noisy tail number. Where the sampling check disagrees with it, trust the denser read.</li>
              <li>A chunk header's gas used describes the shard's previous execution step, so a sampled block's numbers are one block behind its timestamp. Over months this does not matter.</li>
              <li>Burn and issuance assume the sampled burn per block is typical of the blocks in between.</li>
              <li>The ×N slider scales today's load evenly. Real growth lands on some shards more than others.</li>
              <li>The shard layout changed over time, so the page compares shares of capacity, not raw gas.</li>
              <li>NearBlocks is a third-party indexer, used only to cross-check.</li>
            </ul>
            <h3 className="h6">Re-run it</h3>
            <div className="hr-code mb-2">{`git clone ${REPO}
cd headroom && npm install
npm run verify    # every check in one command; ends in ALL OK
npm run check     # re-read 20 random sampled blocks, compare with evidence/
npm run sample    # add new 6-hour slots up to now
npm run data      # rebuild the numbers on this page
npm test          # unit tests, and a test that this page's data rebuilds exactly`}</div>
            <p className="mb-0">Code and evidence: <a href={REPO} target="_blank" rel="noreferrer">{REPO.replace('https://', '')}</a></p>
          </div>
        </div>
      </div>
    </section>
  );
}

// The sampling check: every 30 minutes over the headline's 30 days, against the 6-hour sample.
function Dense({ c }) {
  return (
    <>
      <h3 className="h6 mt-3">Sampling check ({times(c.blocks / c.sampledBlocks)} denser)</h3>
      <p className="mb-0">
        We re-read one block every 30 minutes from {day(c.from)} to {day(c.to)} ({c.blocks.toLocaleString('en-US')} blocks). Whole-chain use: <b className="hr-mono">{pct(c.use)}</b> dense vs{' '}
        <b className="hr-mono">{pct(c.sampledUse)}</b> sampled ({c.useInInterval ? 'inside' : 'outside'} the sampled interval). Busiest shard p95:{' '}
        <b className="hr-mono">{pct(c.busiestP95)}</b> dense vs <b className="hr-mono">{pct(c.sampledBusiestP95)}</b> sampled ({c.busiestP95InInterval ? 'inside' : 'outside'} the interval).
      </p>
    </>
  );
}
