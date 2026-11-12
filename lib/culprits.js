// Rank the accounts behind hot-shard events, overall and by year.

/**
 * events: [{ ts, top: [[account, count], ...] }]. An account "leads" an event when it received
 * the most receipts in that chunk. Returns accounts by number of events led, with total counts.
 */
export function rankAccounts(events, n = 10) {
  const rank = (evs) => {
    const m = new Map();
    for (const e of evs) e.top.forEach(([acct, count], i) => {
      const r = m.get(acct) || { account: acct, led: 0, seen: 0, receipts: 0 };
      if (i === 0) r.led++;
      r.seen++;
      r.receipts += count;
      m.set(acct, r);
    });
    return [...m.values()].sort((a, b) => b.led - a.led || b.receipts - a.receipts).slice(0, n);
  };
  const years = [...new Set(events.map((e) => new Date(e.ts).getUTCFullYear()))].sort();
  return {
    events: events.length,
    overall: rank(events),
    byYear: years.map((y) => {
      const evs = events.filter((e) => new Date(e.ts).getUTCFullYear() === y);
      return { year: y, events: evs.length, top: rank(evs).slice(0, 5) };
    }),
  };
}
