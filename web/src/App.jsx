import { useEffect, useState } from 'react';
import Bridge from './components/Bridge.jsx';
import Culprits from './components/Culprits.jsx';
import HistoryChart from './components/HistoryChart.jsx';
import HotEvents from './components/HotEvents.jsx';
import LivePanel from './components/LivePanel.jsx';
import Method from './components/Method.jsx';
import Predictions from './components/Predictions.jsx';
import Source from './components/Source.jsx';
import StressSlider from './components/StressSlider.jsx';
import Thesis from './components/Thesis.jsx';
import { day, gasPrice, month, pct, times } from './lib/format.js';

export default function App() {
  const [d, setD] = useState(null);
  const [err, setErr] = useState(null);
  useEffect(() => {
    fetch('/data/headroom.json')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then(setD)
      .catch((e) => setErr(e.message));
  }, []);

  return (
    <main className="container hr-wrap py-4 py-md-5">
      <header className="mb-4">
        <div className="d-flex align-items-center gap-2 mb-3">
          <img src="/favicon.svg" width="28" height="28" alt="" />
          <span className="fw-bold">Headroom</span>
          <span className="small hr-muted">· a NEAR investment thesis you can re-run</span>
        </div>
        {err && <p className="text-danger">Could not load data/headroom.json: {err}</p>}
        {d && <Headline d={d} />}
      </header>

      {d && (
        <>
          <section className="mb-4"><LivePanel floor={d.floor_gas_price} /></section>

          <section className="mb-5">
            <h2 className="h4">Three years of capacity use</h2>
            <div className="hr-panel">
              <HistoryChart monthly={d.monthly} level={d.intervals.level} />
              <Source
                rpc="block {block_id} → chunks[].gas_used, chunks[].gas_limit, chunks[].height_included"
                code={['scripts/sample.js', 'lib/block.js', 'lib/metrics.js', 'lib/report.js']}
                plain={`One block every 6 hours since 1 Jan 2023 (${d.sampling.blocks.toLocaleString('en-US')} blocks). Each month: gas used ÷ gas limit over all included chunks. The band resamples whole days 500 times.`}
              />
            </div>
          </section>

          <section className="mb-5">
            <h2 className="h4">Can blockspace pay for NEAR?</h2>
            <div className="hr-panel"><Bridge e={d.economics} recent={d.recent} /></div>
          </section>

          <section className="mb-5"><StressSlider recent={d.recent} /></section>

          <section className="mb-5">
            <h2 className="h4">One full shard, no fee change</h2>
            <div className="hr-panel">
              <HotEvents events={d.hot_shard_events} floor={d.floor_gas_price} rises={d.price_rises} />
              <Culprits culprits={d.culprits} congestion={d.congestion} />
            </div>
          </section>

          <section className="mb-5">
            <h2 className="h4">Predictions, frozen and scored</h2>
            <div className="hr-panel"><Predictions p={d.predictions} /></div>
          </section>

          <Thesis d={d} />
          <Method d={d} />
        </>
      )}

      <footer className="small hr-muted border-top pt-3">
        Built for NEAR HACKATHON (Investment Thesis track) by Ayyoweb3. Sister project:{' '}
        <a href="https://github.com/london160771/agentgate" target="_blank" rel="noreferrer">AgentGate</a>, spending limits for AI agents on NEAR.
        {d && ` Data as of ${d.data_as_of.slice(0, 16).replace('T', ' ')} UTC (built ${d.generated_at.slice(0, 16).replace('T', ' ')} UTC).`}
      </footer>
    </main>
  );
}

function Headline({ d }) {
  const r = d.recent;
  const iv = d.intervals;
  return (
    <>
      <p className="hr-kicker mb-1">LAST {r.days} DAYS TO {day(d.data_as_of).toUpperCase()} · {r.blocks} SAMPLED BLOCKS · {r.shards} SHARDS</p>
      <h1 className="hr-big mb-2">NEAR used {pct(r.use)} of its blockspace.</h1>
      <p className="lead mb-3" style={{ maxWidth: 760 }}>
        Its peak month since 2023 was {month(d.peak_month.month)} at {pct(d.peak_month.use)}. The gas price sat at the floor ({gasPrice(d.floor_gas_price)}) in{' '}
        {pct(r.atFloor)} of recent sampled blocks.{d.economics && <> Gas burn covers <b>{pct(d.economics.coverageToday)}</b> of the NEAR it mints.</>}
      </p>
      <div className="row g-3" style={{ maxWidth: 760 }}>
        <div className="col-6">
          <div className="hr-stat hr-mono">{times(r.feeMultiple)}</div>
          <div className="small hr-muted">growth before NEAR's fee rule raises the price <span className="text-nowrap">(90%: {times(iv.feeMultiple[0])} to {times(iv.feeMultiple[1])})</span></div>
        </div>
        <div className="col-6">
          <div className="hr-stat hr-mono">{times(r.shardMultiple)}</div>
          <div className="small hr-muted">growth before the busiest shard is full at busy hours <span className="text-nowrap">(90%: {times(iv.shardMultiple[0])} to {times(iv.shardMultiple[1])})</span></div>
        </div>
      </div>
    </>
  );
}
