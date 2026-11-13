// Find the block where a protocol parameter last changed, by walking back from the tip and then
// bisecting. `config(height)` returns that block's protocol config (or throws for a height the
// node cannot serve); it is passed in so the search can be tested without a network.
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

export async function findChange({ config, tipHeight, pick, step = 1_000_000, maxSteps = 40 }) {
  const now = pick(await config(tipHeight));
  // Walk back `step` heights at a time until the value differs.
  let hi = tipHeight;
  let lo = null;
  for (let k = 1; k <= maxSteps; k++) {
    const h = tipHeight - k * step;
    const c = await config(h).catch(() => null);
    if (c && !same(pick(c), now)) { lo = h; break; }
    hi = h;
  }
  if (lo == null) return null;
  const before = pick(await config(lo));
  // Invariant: value at lo differs from now, value at hi equals now.
  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2);
    const c = await config(mid).catch(() => null);
    if (c && same(pick(c), now)) hi = mid; else lo = mid;
  }
  return { from: before, to: now, firstHeight: hi };
}

/** Share of gas fees burned: burnt_gas_reward is the share paid to the called contract instead. */
export const burnShare = ([n, d]) => 1 - n / d;
