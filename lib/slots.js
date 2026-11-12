// Fixed UTC sample slots, so every run reads the same moments in time.
export const START_MS = Date.UTC(2023, 0, 1);
export const STEP_MS = 6 * 3600 * 1000; // every 6 hours
export const BLOCKS_PER_SLOT = 1; // one block per slot: more independent moments for the same RPC budget

export function slots(endMs, start = START_MS, step = STEP_MS) {
  const out = [];
  for (let t = start; t < endMs; t += step) out.push(t);
  return out;
}

/** Estimate the height at a time by linear interpolation between [height, ms] anchors. */
export function heightAt(anchors, ms) {
  for (let i = 1; i < anchors.length; i++) {
    const [h0, t0] = anchors[i - 1];
    const [h1, t1] = anchors[i];
    if (ms <= t1) return Math.round(h0 + ((ms - t0) / (t1 - t0)) * (h1 - h0));
  }
  return anchors.at(-1)[0];
}
