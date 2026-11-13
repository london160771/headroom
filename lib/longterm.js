// The long-term view: how fast NEAR's gas demand has actually grown, and how many years each
// headroom bar would take at a given yearly growth pace. A MODEL: it assumes today's capacity
// stays fixed (NEAR adding shards would push every bar further out) and growth is steady.
const DAY = 86_400_000;

/** Absolute gas used per day (Tgas) over (from, to]: average gas per sampled block x blocks per day. */
export function gasPerDay(blocks, from, to) {
  const w = blocks.filter((b) => b.ts > from && b.ts <= to && b.ordinal != null);
  if (w.length < 2) return null;
  const a = w[0];
  const z = w.at(-1);
  const perDay = (z.ordinal - a.ordinal) / ((z.ts - a.ts) / DAY);
  return (w.reduce((s, b) => s + b.used, 0) / w.length / 1000) * perDay;
}

/** Gas per day over the 30 days to `to`, divided by the same 30 days one year earlier. */
export function yearOverYear(blocks, to) {
  const now = gasPerDay(blocks, to - 30 * DAY, to);
  const ago = gasPerDay(blocks, to - 395 * DAY, to - 365 * DAY);
  return now && ago ? now / ago : null;
}

/**
 * The fastest year-over-year growth in the sample: 30-day windows stepped back from the end,
 * every 30 days, as far as a full year of history allows.
 */
export function fastestYear(blocks, endMs) {
  let best = null;
  for (let to = endMs; to - 395 * DAY >= blocks[0].ts; to -= 30 * DAY) {
    const ratio = yearOverYear(blocks, to);
    if (ratio != null && (!best || ratio > best.ratio)) best = { ratio, to: new Date(to).toISOString() };
  }
  return best;
}

/** Years for load to grow by `multiple` at `pace` times per year. Never, if the pace is not growth. */
export function yearsTo(multiple, pace) {
  return pace > 1 && multiple > 1 ? Math.log(multiple) / Math.log(pace) : null;
}

/**
 * bars: [{ id, label, multiple }]. paces: reference yearly growth paces from evidence/scenarios.json.
 * Two paces come from the data itself: the last 12 months and the fastest 12 months seen.
 */
export function longTerm(blocks, endMs, bars, paces = []) {
  const last = yearOverYear(blocks, endMs);
  const fastest = fastestYear(blocks, endMs);
  const rows = [
    { id: 'last_year', label: 'Last 12 months (measured)', pace: last, measured: true },
    ...paces.map((p) => ({ id: `pace_${p}`, label: 'Reference pace (model input)', pace: p, measured: false })),
    { id: 'fastest_year', label: 'Fastest 12 months since 2023 (measured)', pace: fastest?.ratio ?? null, measured: true, to: fastest?.to ?? null },
  ];
  return {
    model: 'years = ln(multiple) / ln(yearly pace); capacity held at today\'s level; steady growth',
    gasPerDayTgas: gasPerDay(blocks, endMs - 30 * DAY, endMs),
    bars,
    rows: rows.map((r) => ({ ...r, years: Object.fromEntries(bars.map((b) => [b.id, yearsTo(b.multiple, r.pace)])) })),
  };
}
