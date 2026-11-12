// Compare a block record re-read from the chain with the stored one, field by field.

/** Returns the names of fields that differ (empty when the stored record is exact). */
export function diffRecord(chain, stored) {
  const keys = new Set([...Object.keys(chain), ...Object.keys(stored)]);
  return [...keys].filter((k) => JSON.stringify(chain[k]) !== JSON.stringify(stored[k]));
}
