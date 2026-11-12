// Sample slots: every 6 hours (UTC) since 2023-01-01, one block at a fixed pseudo-random
// moment inside each slot. Fixed clock times (00:00, 06:00, ...) would see the same hours of
// the day every day and miss daily peaks; a seeded random moment covers every hour evenly
// and is still the same moment on every run and every machine.
import { rng } from './stats.js';

export const START_MS = Date.UTC(2023, 0, 1);
export const STEP_MS = 6 * 3600 * 1000; // every 6 hours
export const BLOCKS_PER_SLOT = 1; // one block per slot: more independent moments for the same RPC budget

/** The moment sampled in the slot that starts at t: t plus a seeded offset in [0, 6 h). */
export function targetTime(t, step = STEP_MS) {
  return t + Math.floor(rng(Math.floor(t / 60_000))() * step);
}

/** Slot start times whose sampled moment is before endMs. */
export function slots(endMs, start = START_MS, step = STEP_MS) {
  const out = [];
  for (let t = start; targetTime(t, step) < endMs; t += step) out.push(t);
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
