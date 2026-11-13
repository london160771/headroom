// Display helpers. Numbers are computed elsewhere (lib/metrics.js); this only formats them.

/** A share (0..1) as a percent with sensible precision: 0.0061 -> "0.61%", 0.196 -> "19.6%". */
export function pct(x) {
  if (x == null || Number.isNaN(x)) return '–';
  const p = x * 100;
  if (p === 0) return '0%';
  if (p < 0.1) return `${p.toFixed(3)}%`;
  if (p < 10) return `${p.toFixed(2)}%`;
  return `${p.toFixed(1)}%`;
}

/** A growth multiple: 82.4 -> "82×", 4.26 -> "4.3×". */
export function times(x) {
  if (x == null || !Number.isFinite(x)) return '–';
  return x >= 10 ? `${Math.round(x).toLocaleString('en-US')}×` : `${x.toFixed(1)}×`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2024-03" -> "Mar 2024" */
export function month(ym) {
  const [y, m] = ym.split('-');
  return `${MONTHS[Number(m) - 1]} ${y}`;
}

/** Date (ms or ISO) -> "5 Dec 2023" */
export function day(d) {
  const x = new Date(d);
  return `${x.getUTCDate()} ${MONTHS[x.getUTCMonth()]} ${x.getUTCFullYear()}`;
}

/** Gas in Ggas -> "9.1M Tgas" style. */
export function tgas(ggas) {
  const t = ggas / 1000;
  if (t >= 1e9) return `${(t / 1e9).toFixed(2)}B Tgas`;
  if (t >= 1e6) return `${(t / 1e6).toFixed(1)}M Tgas`;
  if (t >= 1e3) return `${(t / 1e3).toFixed(1)}K Tgas`;
  return `${t.toFixed(1)} Tgas`;
}

/** yoctoNEAR per gas (string) -> NEAR per Tgas, e.g. "100000000" -> "0.0001 NEAR per Tgas". */
export function gasPrice(yoctoPerGas) {
  const nearPerTgas = (Number(yoctoPerGas) * 1e12) / 1e24;
  return `${nearPerTgas} NEAR per Tgas`;
}

/** A yearly growth pace: 0.28 -> "0.28×", 10.3 -> "10.3×". */
export function pace(x) {
  if (x == null || !Number.isFinite(x)) return '–';
  return x < 10 ? `${x.toFixed(2).replace(/\.?0+$/, '')}×` : `${x.toFixed(1)}×`;
}

/** Years to a bar: null means the pace is not growth, so the bar is never reached. */
export function years(x) {
  if (x == null) return 'never';
  return `${x.toFixed(1)} years`;
}
