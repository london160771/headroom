// From capacity to value: how much NEAR the chain burns per unit of gas, how much new NEAR
// it issues per year, and whether filling the spare blockspace could ever offset issuance.
// Every input is read from block headers (total_supply, block_ordinal, chunk balance_burnt).
import { FEE_TRIGGER } from './metrics.js';

const YOCTO = 1e24;
const YEAR_MS = 365.25 * 86_400_000;

/** Blocks actually produced per day, from block_ordinal (heights skip, ordinals don't). */
export function blocksPerDay(blocks) {
  const bs = blocks.filter((b) => b.ordinal != null);
  if (bs.length < 2) return null;
  const a = bs[0];
  const z = bs.at(-1);
  return (z.ordinal - a.ordinal) / ((z.ts - a.ts) / 86_400_000);
}

/**
 * NEAR burned per Tgas of gas used. Measured, so it already reflects the share of gas fees
 * NEAR burns (the rest goes to contracts as a reward) and the gas price actually paid.
 */
export function burnPerTgas(blocks) {
  const burnt = blocks.reduce((s, b) => s + b.burnt, 0n);
  const ggas = blocks.reduce((s, b) => s + b.used, 0);
  return ggas ? Number(burnt) / YOCTO / (ggas / 1000) : null;
}

/** Average NEAR burned per block. */
export function burnPerBlock(blocks) {
  return blocks.length ? Number(blocks.reduce((s, b) => s + b.burnt, 0n)) / YOCTO / blocks.length : null;
}

/**
 * New NEAR issued per year, from total_supply over the window [endMs - days, endMs].
 * total_supply only falls by burn between epochs and jumps up by the minted reward at each epoch,
 * so minted = (supply change) + (burned over the window). Burn over the window is estimated as
 * average burn per sampled block x blocks produced (block_ordinal difference).
 */
export function issuance(blocks, endMs, days = 365) {
  const bs = blocks.filter((b) => b.supply != null && b.ts > endMs - days * 86_400_000 && b.ts <= endMs);
  if (bs.length < 2) return null;
  const a = bs[0];
  const z = bs.at(-1);
  const years = (z.ts - a.ts) / YEAR_MS;
  const supplyChange = Number(z.supply - a.supply) / YOCTO;
  const burned = (burnPerBlock(bs) ?? 0) * (z.ordinal - a.ordinal);
  const minted = supplyChange + burned;
  return {
    from: new Date(a.ts).toISOString(),
    to: new Date(z.ts).toISOString(),
    supplyStart: Number(a.supply) / YOCTO,
    supplyEnd: Number(z.supply) / YOCTO,
    burnedEstimate: burned,
    minted,
    mintedPerYear: minted / years,
    ratePerYear: minted / years / (Number(a.supply) / YOCTO),
  };
}

/**
 * The bridge from capacity to value. use = share of capacity used (0..1).
 * burnPerYear(u) = u x capacity (Tgas/day) x 365.25 x burnPerTgas.
 * coverage = burn per year / NEAR minted per year.
 */
export function bridge({ use, capacityTgasPerDay, burnPerTgasNear, mintedPerYear, feeMultiple }) {
  const burnPerYear = (u) => u * capacityTgasPerDay * 365.25 * burnPerTgasNear;
  const coverage = (u) => burnPerYear(u) / mintedPerYear;
  const today = coverage(use);
  return {
    burnPerYearToday: burnPerYear(use),
    coverageToday: today,
    coverageAtTrigger: coverage(FEE_TRIGGER),
    coverageFull: coverage(1),
    // How many times today's load would have to grow for gas burn alone to offset issuance.
    loadNeeded: today > 0 ? 1 / today : null,
    // Does that load fit before NEAR's fee rule starts raising the price?
    fitsBeforeFeesMove: today > 0 ? 1 / today <= feeMultiple : null,
    // At 100% full, the gas price (as a multiple of today's) that would make burn offset issuance.
    priceNeededAtFull: coverage(1) > 0 ? 1 / coverage(1) : null,
  };
}
