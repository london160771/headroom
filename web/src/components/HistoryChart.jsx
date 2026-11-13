// Monthly capacity use since Jan 2023 on a log scale (values span 0.1% to 100%).
// Green: the whole chain (sum of gas used / sum of limits), with its 90% band.
// Orange: the busiest shard in a block, 95th percentile.
import { FEE_TRIGGER } from '../../../lib/metrics.js';
import { month, pct } from '../lib/format.js';

const W = 960;
const H = 320;
const PAD = { l: 52, r: 16, t: 16, b: 44 };
const TICKS = [0.001, 0.01, 0.1, FEE_TRIGGER, 1];
const LO = Math.log10(0.001);
const HI = Math.log10(1);

export default function HistoryChart({ monthly, level }) {
  const n = monthly.length;
  const x = (i) => PAD.l + (i / Math.max(1, n - 1)) * (W - PAD.l - PAD.r);
  const y = (v) => {
    const c = Math.min(HI, Math.max(LO, Math.log10(Math.max(v, 1e-6))));
    return PAD.t + (1 - (c - LO) / (HI - LO)) * (H - PAD.t - PAD.b);
  };
  const pt = (i, v) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`;
  const line = (key) => monthly.map((m, i) => `${i ? 'L' : 'M'}${pt(i, m[key])}`).join('');
  const band = monthly.some((m) => m.useBand)
    ? `M${monthly.map((m, i) => pt(i, m.useBand[1])).join('L')}L${[...monthly].reverse().map((m, j) => pt(n - 1 - j, m.useBand[0])).join('L')}Z`
    : null;
  const shardSteps = monthly.filter((m, i) => i === 0 || m.shards !== monthly[i - 1].shards).map((m) => ({ i: monthly.indexOf(m), shards: m.shards }));

  return (
    <figure className="mb-0">
      <div className="hr-chart-scroll">
      <svg viewBox={`0 0 ${W} ${H}`} className="hr-chart w-100" role="img" aria-label="Monthly capacity use, whole chain and busiest shard">
        {TICKS.map((t) => (
          <g key={t}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} stroke={t === FEE_TRIGGER ? 'var(--hr-trigger)' : 'var(--hr-line)'} strokeDasharray={t === FEE_TRIGGER ? '5 4' : undefined} strokeWidth={t === FEE_TRIGGER ? 1.5 : 1} />
            <text x={PAD.l - 8} y={y(t) + 4} textAnchor="end">{pct(t)}</text>
          </g>
        ))}
        <text x={W - PAD.r} y={y(FEE_TRIGGER) - 6} textAnchor="end" style={{ fill: 'var(--hr-trigger)' }}>{pct(FEE_TRIGGER)}: fee rule trigger (whole block)</text>
        {monthly.map((m, i) => (m.month.endsWith('-01') ? <text key={m.month} x={x(i)} y={H - PAD.b + 16} textAnchor="middle">{m.month.slice(0, 4)}</text> : null))}
        {shardSteps.map((s) => (
          <g key={s.i}>
            <line x1={x(s.i)} x2={x(s.i)} y1={H - PAD.b} y2={H - PAD.b + 4} stroke="var(--hr-muted)" />
            <text x={x(s.i)} y={H - 6} textAnchor="middle">{s.shards} shards</text>
          </g>
        ))}
        {band && <path d={band} fill="var(--hr-used)" opacity="0.18" />}
        <path d={line('hottestP95')} fill="none" stroke="var(--hr-hot)" strokeWidth="2" />
        <path d={line('use')} fill="none" stroke="var(--hr-used)" strokeWidth="2.5" />
        {monthly.map((m, i) => (
          <circle key={m.month} cx={x(i)} cy={y(m.use)} r="7" fill="transparent">
            <title>{`${month(m.month)}: whole chain ${pct(m.use)}${m.useBand ? ` (90%: ${pct(m.useBand[0])} to ${pct(m.useBand[1])})` : ''}, busiest shard p95 ${pct(m.hottestP95)}, ${m.blocks} sampled blocks, ${m.shards} shards`}</title>
          </circle>
        ))}
      </svg>
      </div>
      <figcaption className="d-flex flex-wrap gap-3 mt-1">
        <span className="hr-legend"><span className="hr-swatch" style={{ background: 'var(--hr-used)' }} /> Whole chain: gas used ÷ gas limit, all shards (shaded: {pct(level)} band)</span>
        <span className="hr-legend"><span className="hr-swatch" style={{ background: 'var(--hr-hot)' }} /> Busiest shard in a block, 95th percentile</span>
        <span className="small hr-muted">Log scale. Hover a month for its numbers.</span>
      </figcaption>
    </figure>
  );
}
