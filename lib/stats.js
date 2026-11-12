// Seeded random numbers and a day-clustered bootstrap, so every interval is reproducible.

/** mulberry32: a small, fast, seeded PRNG. Same seed, same sequence, on every machine. */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Group items by UTC day of item.ts. Blocks on the same day are not independent, so we resample days. */
export function byDay(items) {
  const m = new Map();
  for (const it of items) {
    const d = Math.floor(it.ts / 86_400_000);
    if (!m.has(d)) m.set(d, []);
    m.get(d).push(it);
  }
  return [...m.values()];
}

/**
 * Cluster bootstrap interval for stat(items). Resamples whole groups with replacement.
 * Returns { lo, hi, draws, level, seed }. Draws where stat is null or not finite are dropped.
 */
export function bootstrap(groups, stat, { draws = 2000, seed = 42, level = 0.9 } = {}) {
  const rand = rng(seed);
  const out = [];
  for (let i = 0; i < draws; i++) {
    const pick = [];
    for (let j = 0; j < groups.length; j++) pick.push(...groups[Math.floor(rand() * groups.length)]);
    const v = stat(pick);
    if (v != null && Number.isFinite(v)) out.push(v);
  }
  out.sort((a, b) => a - b);
  const q = (p) => out[Math.min(out.length - 1, Math.max(0, Math.floor(p * out.length)))];
  const tail = (1 - level) / 2;
  return { lo: q(tail), hi: q(1 - tail), draws: out.length, level, seed };
}
