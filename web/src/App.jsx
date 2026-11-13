import { useEffect, useState } from 'react';
import Bridge from './components/Bridge.jsx';
import Culprits from './components/Culprits.jsx';
import HistoryChart from './components/HistoryChart.jsx';
import HotEvents from './components/HotEvents.jsx';
import LivePanel from './components/LivePanel.jsx';
import LongTerm from './components/LongTerm.jsx';
import Method from './components/Method.jsx';
import Predictions from './components/Predictions.jsx';
import Source from './components/Source.jsx';
import StressSlider from './components/StressSlider.jsx';
import Thesis from './components/Thesis.jsx';
import { day, gasPrice, month, pace, pct, times } from './lib/format.js';

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
    <>
      <TopBar />
      <main className="container hr-wrap">
        {err && <p className="text-danger mt-4">Could not load data/headroom.json: {err}</p>}
        {d && <Hero d={d} />}

        {d && (
          <>
            <section id="findings" className="hr-section">
              <h2 className="h4">Three years of capacity use</h2>
              <div className="hr-panel">
                <HistoryChart monthly={d.monthly} level={d.intervals.level} />
                <Source
                  rpc="block {block_id} → chunks[].gas_used, chunks[].gas_limit, chunks[].height_included"
                  code={['scripts/sample.js', 'lib/block.js', 'lib/metrics.js', 'lib/report.js']}
                  plain={`One block in every 6-hour slot since 1 Jan 2023, at a seeded random moment inside the slot (${d.sampling.blocks.toLocaleString('en-US')} blocks). Each month: gas used ÷ gas limit over all included chunks. The band resamples whole days 500 times.`}
                />
              </div>
            </section>

            <section className="hr-section">
              <h2 className="h4">Can blockspace pay for NEAR?</h2>
              <div className="hr-panel"><Bridge e={d.economics} recent={d.recent} /></div>
            </section>

            <section id="long-term" className="hr-section">
              <h2 className="h4">How long does the room last?</h2>
              <div className="hr-panel"><LongTerm lt={d.long_term} v={d.value_channels} /></div>
            </section>

            <section className="hr-section"><StressSlider recent={d.recent} /></section>

            <section className="hr-section">
              <h2 className="h4">One full shard, no fee change</h2>
              <div className="hr-panel">
                <HotEvents events={d.hot_shard_events} floor={d.floor_gas_price} rises={d.price_rises} />
                <Culprits culprits={d.culprits} congestion={d.congestion} />
              </div>
            </section>

            <section id="predictions" className="hr-section">
              <h2 className="h4">Predictions, frozen and scored</h2>
              <div className="hr-panel"><Predictions p={d.predictions} /></div>
            </section>

            <Thesis d={d} />
            <Method d={d} />
          </>
        )}
      </main>
      <footer className="container hr-wrap hr-foot">
        Built for NEAR HACKATHON (Investment Thesis track) by Ayyoweb3. Sister project:{' '}
        <a href="https://github.com/london160771/agentgate" target="_blank" rel="noreferrer">AgentGate</a>, spending limits for AI agents on NEAR.
        {d && ` Data as of ${d.data_as_of.slice(0, 16).replace('T', ' ')} UTC.`}
      </footer>
    </>
  );
}

function TopBar() {
  return (
    <header className="hr-top">
      <div className="container hr-wrap hr-top-inner">
        <a className="hr-logo" href="#top"><img src="/favicon.svg" width="24" height="24" alt="" />Headroom</a>
        <nav className="hr-nav" aria-label="Sections">
          <a href="#findings">Findings</a>
          <a href="#long-term">Long term</a>
          <a href="#predictions">Predictions</a>
          <a href="#thesis">Thesis</a>
          <a href="#method">Method</a>
        </nav>
        <a className="hr-btn hr-btn-sm" href="https://github.com/london160771/headroom" target="_blank" rel="noreferrer">Source on GitHub</a>
      </div>
    </header>
  );
}

// The hero: the one sentence and four numbers, next to the live block.
function Hero({ d }) {
  const r = d.recent;
  const iv = d.intervals;
  const e = d.economics;
  return (
    <section id="top" className="hr-hero row g-4 g-lg-5 align-items-center">
      <div className="col-lg-6">
        <p className="hr-kicker hr-mono">Last {r.days} days to {day(d.data_as_of)} · {r.blocks} sampled blocks · {r.shards} shards</p>
        <h1 className="hr-big">NEAR used <span className="hr-figure">{pct(r.use)}</span> of its blockspace</h1>
        <p className="hr-sub">
          Its peak month since 2023 was {month(d.peak_month.month)} at {pct(d.peak_month.use)}. The gas price sat at the floor ({gasPrice(d.floor_gas_price)}) in{' '}
          {pct(r.atFloor)} of recent sampled blocks.
        </p>
        <div className="hr-stats">
          <Stat value={times(r.feeMultiple)} label="growth before NEAR's fee rule raises the price" meta={`90%: ${times(iv.feeMultiple[0])} to ${times(iv.feeMultiple[1])}`} />
          <Stat value={times(r.shardMultiple)} label="growth before the busiest shard is full at busy hours" meta={`90%: ${times(iv.shardMultiple[0])} to ${times(iv.shardMultiple[1])}`} />
          {e && <Stat value={pct(e.coverageToday)} label="of newly minted NEAR offset by gas burn today" />}
          {d.long_term && <Stat value={pace(d.long_term.rows[0].pace)} label="gas per day vs a year earlier, the measured pace" />}
        </div>
      </div>
      <div className="col-lg-6"><LivePanel floor={d.floor_gas_price} /></div>
    </section>
  );
}

function Stat({ value, label, meta }) {
  return (
    <div className="hr-statcard">
      <div className="hr-stat">{value}</div>
      <div className="hr-stat-label">{label}</div>
      {meta && <div className="hr-stat-meta hr-mono">{meta}</div>}
    </div>
  );
}
