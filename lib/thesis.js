// Render THESIS.md from the page data (web/public/data/headroom.json). Every number in the
// thesis comes from that file; test/thesis.test.js checks the committed THESIS.md matches.
import { day, gasPrice, month, pct, times } from '../web/src/lib/format.js';

const near = (x) => `${Math.round(x).toLocaleString('en-US')} NEAR`;

export function renderThesis(d) {
  const r = d.recent;
  const iv = d.intervals;
  const e = d.economics;
  const pk = d.peak_month;
  const first = d.monthly[0];
  const rises = d.price_rises;
  const hotAtFloor = d.hot_shard_events.filter((x) => x.gasPrice === d.floor_gas_price).length;
  const dc = d.dense_check;
  const cc = d.cross_check.filter((c) => c.ratio != null);
  const ccWithin = cc.filter((c) => c.ratio >= 0.8 && c.ratio <= 1.2).length;
  const ccMedian = [...cc].map((c) => c.ratio).sort((a, b) => a - b)[Math.floor(cc.length / 2)];
  const lead = d.culprits?.ranking.byYear.at(-1)?.top[0];
  const L = [];
  L.push('# THESIS: NEAR is a volume bet, not a scarcity bet');
  L.push('');
  L.push(`Generated from \`web/public/data/headroom.json\` by \`npm run thesis\`. Data as of ${day(d.data_as_of)} (${d.sampling.blocks.toLocaleString('en-US')} sampled mainnet blocks since ${day(d.sampling.first)}). Do not edit by hand: \`npm test\` fails if this file and the data disagree.`);
  L.push('');
  L.push('## Claim');
  L.push('');
  L.push(`NEAR has built far more blockspace than it sells. Over the 30 days to ${day(d.data_as_of)} it used **${pct(r.use)}** of its gas capacity (90% interval ${pct(iv.use[0])} to ${pct(iv.use[1])}), so load can grow about **${times(r.feeMultiple)}** (${times(iv.feeMultiple[0])} to ${times(iv.feeMultiple[1])}) before NEAR's fee rule raises the gas price.`);
  L.push('');
  if (e) L.push(`So for the next one to two years, the token's value cannot come from scarce blockspace. NEAR mints about ${near(e.issuance.mintedPerYear)} a year (${pct(e.issuance.ratePerYear)} of supply), and gas burn offsets **${pct(e.coverageToday)}** of it. For burn alone to match issuance, load would have to grow about **${times(e.loadNeeded)}**${e.fitsBeforeFeesMove ? ', which fits before fees move.' : `, past the point where fees start to rise (${times(r.feeMultiple)}). Even at that trigger, burn covers ${pct(e.coverageAtTrigger)} of issuance.`}`);
  L.push('');
  L.push('**Investment reading.** Holding NEAR is a bet on transaction volume at the floor price, plus the option that whole blocks fill and the price (and burn) rise. The signal to watch is whole-block use crossing 50%, not any single busy shard or app.');
  L.push('');
  L.push('## Evidence for');
  L.push('');
  L.push(`1. **Capacity is mostly empty.** ${pct(r.use)} used in the last ${r.days} days, across ${r.shards} shards of ${d.chunk_gas_limit_tgas.toLocaleString('en-US')} Tgas per chunk. The gas price was at the floor (${gasPrice(d.floor_gas_price)}) in ${pct(r.atFloor)} of recent sampled blocks. Source: \`evidence/samples.jsonl\`, \`lib/metrics.js\`.`);
  L.push(`2. **The scaling is built.** NEAR went from ${first.shards} shards (${month(first.month)}) to ${r.shards}. Even the busiest shard (shard ${r.busiest.shard}, 95th percentile ${pct(r.busiest.p95)}) could take about ${times(r.shardMultiple)} more before it is full at its busy hours (90%: ${times(iv.shardMultiple[0])} to ${times(iv.shardMultiple[1])}).`);
  L.push(`3. **One hot shard cannot move the price.** nearcore's \`compute_next_gas_price\` sums gas over all chunks. ${d.hot_shard_events.length} sampled blocks had a shard more than half full; ${hotAtFloor} of them stayed at the floor price. With ${r.shards} shards, about ${Math.ceil(r.shards / 2)} full shards at once are needed.`);
  if (e) L.push(`4. **Burn grows faster than use once fees move.** At every block full and the floor price, burn would be ${pct(e.coverageFull)} of issuance. Past the 50% trigger the price rises each block, and burn per Tgas with it. Burn per Tgas today: ${e.burnPerTgasNear.toPrecision(3)} NEAR, measured from \`balance_burnt\`.`);
  L.push('');
  L.push('## Evidence against');
  L.push('');
  L.push(`1. **Demand can arrive fast.** Use peaked at ${pct(pk.use)} in ${month(pk.month)}. ${rises.length ? `From ${day(rises[0].ts)} to ${day(rises.at(-1).ts)} (the \`inscription.near\` rush), ${rises.length} sampled blocks were priced above the floor, up to ${Math.max(...rises.map((x) => x.priceMultiple)).toFixed(0)}× it, with ${Math.max(...rises.map((x) => x.fullShards))} of ${rises[0].shards} shards full.` : ''} The ${times(r.feeMultiple)} headroom is large, not infinite.`);
  L.push(`2. **Local scarcity is real.** ${d.congestion.congestedBlocks.toLocaleString('en-US')} of ${d.congestion.blocks.toLocaleString('en-US')} sampled blocks (${pct(d.congestion.congestedBlocks / d.congestion.blocks)}) had delayed receipts in some shard: congestion control was holding back work the price never showed.${lead ? ` In ${d.culprits.ranking.byYear.at(-1).year}, the account leading the most hot-shard chunks was \`${lead.account}\`.` : ''} Apps on a hot shard can feel full while the chain is empty.`);
  L.push('3. **Gas is not the only limit.** State size, chunk and state-witness size, and receipt bandwidth can bind before gas. If one of them binds first, real headroom is smaller than these multiples.');
  L.push(`4. **It is a sample.** One block per 6-hour slot, at a seeded random moment so every hour of the day is covered. Against NearBlocks' every-block daily totals the monthly median ratio is ${ccMedian?.toFixed(2)} (${ccWithin} of ${cc.length} months within 0.8 to 1.2).${dc ? ` A 12× denser read of the last 30 days gave ${pct(dc.use)} use (sampled: ${pct(dc.sampledUse)}) and a busiest-shard p95 of ${pct(dc.busiestP95)} (sampled: ${pct(dc.sampledBusiestP95)}).` : ''}`);
  L.push('5. **Issuance is not fixed.** Governance can change the inflation rate, which moves the burn-to-issuance bar without any change in use.');
  L.push('');
  L.push('## What would change my mind');
  L.push('');
  if (d.predictions) {
    L.push(`Six predictions, frozen on ${day(d.predictions.made_at)} (SHA-256 \`${d.predictions.sha256}\`, git tag \`predictions-v1\`, OpenTimestamps proof \`predictions/predictions.json.ots\`). Scored on every build; the page shows the live status.`);
    L.push('');
    L.push('| # | Prediction | Window | Status now | If wrong |');
    L.push('|---|---|---|---|---|');
    for (const p of d.predictions.scored) L.push(`| ${p.id} | ${p.text} | ${day(p.from)} to ${day(p.to)} | ${p.status} | ${p.if_wrong} |`);
    L.push('');
    const failedBack = d.predictions.backtest.filter((b) => b.status === 'failed').map((b) => b.id);
    L.push(`Backtest over the most recent window of the same length: ${d.predictions.backtest.length - failedBack.length} of ${d.predictions.backtest.length} would have held${failedBack.length ? ` (${failedBack.join(', ')} would have failed, so these are not safe bets)` : ''}.`);
  }
  L.push('');
  L.push('## Re-run it');
  L.push('');
  L.push('```bash');
  L.push('npm install');
  L.push('npm run check    # re-read 20 random sampled blocks from mainnet, compare every field');
  L.push('npm run sample   # add new 6-hour slots up to now');
  L.push('npm run data     # rebuild web/public/data/headroom.json');
  L.push('npm run thesis   # rebuild this file');
  L.push('```');
  L.push('');
  return L.join('\n');
}

/** The findings table for README.md (between the findings:start and findings:end markers). */
export function renderFindings(d) {
  const r = d.recent;
  const iv = d.intervals;
  const e = d.economics;
  const rises = d.price_rises;
  const dc = d.dense_check;
  const p = d.predictions;
  const rows = [
    ['Capacity used, last 30 days', `**${pct(r.use)}** (90%: ${pct(iv.use[0])} to ${pct(iv.use[1])}), ${r.shards} shards × ${d.chunk_gas_limit_tgas.toLocaleString('en-US')} Tgas per chunk`],
    ["Growth before NEAR's fee rule raises the price", `**about ${times(r.feeMultiple)}** (90%: ${times(iv.feeMultiple[0])} to ${times(iv.feeMultiple[1])})`],
    ['Growth before the busiest shard is full at its busy hours', `about ${times(r.shardMultiple)} (shard ${r.busiest.shard}, p95 ${pct(r.busiest.p95)}; 90%: ${times(iv.shardMultiple[0])} to ${times(iv.shardMultiple[1])})`],
  ];
  if (e) rows.push(
    ['NEAR minted per year (from total_supply + burn)', `${Math.round(e.issuance.mintedPerYear).toLocaleString('en-US')} NEAR (${pct(e.issuance.ratePerYear)} of supply)`],
    ['Gas burn as a share of issuance', `**${pct(e.coverageToday)}** today; ${pct(e.coverageAtTrigger)} at the 50% fee trigger; ${pct(e.coverageFull)} with every block full`],
    ['Growth needed for burn to match issuance', `about ${times(e.loadNeeded)} (90%: ${times(e.loadNeededBand[0])} to ${times(e.loadNeededBand[1])})`],
  );
  rows.push(
    ['Peak month since 2023', `${pct(d.peak_month.use)} (${month(d.peak_month.month)})`],
    ['Sampled blocks with one shard more than half full', `${d.hot_shard_events.length}, of which ${d.hot_shard_events.filter((x) => x.gasPrice === d.floor_gas_price).length} stayed at the floor price`],
    ['Sampled blocks priced above the floor', rises.length ? `${rises.length}, all from ${day(rises[0].ts)} to ${day(rises.at(-1).ts)}, up to ${Math.max(...rises.map((x) => x.priceMultiple)).toFixed(0)}× the floor` : 'none'],
    ['Sampled blocks with delayed receipts (congestion control at work)', `${d.congestion.congestedBlocks.toLocaleString('en-US')} of ${d.congestion.blocks.toLocaleString('en-US')}`],
  );
  if (dc) rows.push([`Sampling check (one block per 30 min, ${day(dc.from)} to ${day(dc.to)})`, `use ${pct(dc.use)} dense vs ${pct(dc.sampledUse)} sampled; busiest-shard p95 ${pct(dc.busiestP95)} vs ${pct(dc.sampledBusiestP95)}`]);
  if (p) rows.push(['Frozen predictions', `${p.scored.length}, made ${day(p.made_at)}; backtest over the last window: ${p.backtest.filter((b) => b.status === 'passed').length} of ${p.backtest.length} would have held`]);
  return [
    `Numbers from \`web/public/data/headroom.json\`, data as of ${day(d.data_as_of)}: ${d.sampling.blocks.toLocaleString('en-US')} mainnet blocks, one in every 6-hour slot (at a seeded random moment) since ${day(d.sampling.first)}. This table is written by \`npm run thesis\`.`,
    '',
    '| | |',
    '|---|---|',
    ...rows.map(([k, v]) => `| ${k} | ${v} |`),
  ].join('\n');
}

const START = '<!-- findings:start -->';
const END = '<!-- findings:end -->';

/** Replace the findings block in README text. */
export function withFindings(readme, d) {
  const a = readme.indexOf(START);
  const b = readme.indexOf(END);
  if (a < 0 || b < a) throw new Error('README.md has no findings markers');
  return `${readme.slice(0, a + START.length)}\n${renderFindings(d)}\n${readme.slice(b)}`;
}
