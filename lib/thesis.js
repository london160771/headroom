// Render THESIS.md from the page data (web/public/data/headroom.json). Every number in the
// thesis comes from that file; test/thesis.test.js checks the committed THESIS.md matches.
import { day, gasPrice, month, pace, pct, times, years } from '../web/src/lib/format.js';
import { FEE_TRIGGER } from './metrics.js';

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
  L.push(...holderLines(d, '##'));
  L.push('## Claim');
  L.push('');
  L.push(`NEAR has built far more blockspace than it sells. Over the 30 days to ${day(d.data_as_of)} it used **${pct(r.use)}** of its gas capacity (90% interval ${pct(iv.use[0])} to ${pct(iv.use[1])}), so load can grow about **${times(r.feeMultiple)}** (${times(iv.feeMultiple[0])} to ${times(iv.feeMultiple[1])}) before NEAR's fee rule raises the gas price.`);
  L.push('');
  if (e) {
    L.push(`So for the next one to two years, the token's value cannot come from scarce blockspace. NEAR mints about ${near(e.issuance.mintedPerYear)} a year (${pct(e.issuance.ratePerYear)} of supply), and gas burn offsets **${pct(e.coverageToday)}** of it${e.burnRule ? ` (measured under the current burn rule: since protocol ${e.burnRule.protocolVersion} on ${day(e.burnRule.since)}, ${pct(e.burnRule.burnShare)} of gas fees are burned)` : ''}. For burn alone to match issuance, load would have to grow about **${times(e.loadNeeded)}**${e.fitsBeforeFeesMove ? ', which fits before fees move.' : `, past the point where fees start to rise (${times(r.feeMultiple)}). Even at that trigger, burn covers ${pct(e.coverageAtTrigger)} of issuance.`}`);
    if (e.hsp029) {
      L.push('');
      L.push(`If governance's ${pct(e.hsp029.maxInflation)} issuance cap (HSP-029, approved but not yet in effect) lands, that bar falls to about **${times(e.hsp029.loadNeeded)}** (90%: ${times(e.hsp029.loadNeededBand[0])} to ${times(e.hsp029.loadNeededBand[1])}), ${e.hsp029.fitsBeforeFeesMove ? 'roughly where the fee rule starts to bite' : 'still past the fee trigger'}. Either way burn needs tens of times today's load: a volume bet.`);
    }
  }
  L.push('');
  L.push('**Investment reading.** Holding NEAR is a bet on transaction volume at the floor price, plus the option that whole blocks fill and the price (and burn) rise. The signal to watch is whole-block use crossing 50%, not any single busy shard or app.');
  L.push('');
  L.push(...longTermSection(d));
  L.push(...channelsSection(d));
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
  L.push(`5. **The rules are moving.** ${e?.burnRule ? `NEAR began burning ${pct(e.burnRule.burnShare)} of gas fees on ${day(e.burnRule.since)} (governance proposal HSP-027; we found the exact block by bisecting archival protocol configs: \`evidence/protocol.json\`), so burn per Tgas rose from ${e.burnPerTgasLastYear.toPrecision(3)} to ${e.burnPerTgasNear.toPrecision(3)} NEAR and the burn estimate rests on ${e.burnRule.blocks} blocks since then. ` : ''}Governance can also change issuance${e?.hsp029 ? ` (HSP-029 would cap it at ${pct(e.hsp029.maxInflation)})` : ''}. Either moves the burn-to-issuance bar without any change in use.`);
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

/** "What this means for a NEAR holder": the investment reading in plain words, every number from the data. */
export function holderLines(d, h) {
  const r = d.recent;
  const e = d.economics;
  const lt = d.long_term;
  const v = d.value_channels;
  if (!e || !lt) return [];
  const last = lt.rows.find((x) => x.id === 'last_year');
  const two = lt.rows.find((x) => x.pace === 2);
  const fast = lt.rows.find((x) => x.id === 'fastest_year');
  const netDilution = e.issuance.ratePerYear * (1 - e.coverageToday);
  const L = [];
  L.push(`${h} What this means for a NEAR holder`);
  L.push('');
  L.push(`- **Do not count on blockspace scarcity.** NEAR used ${pct(r.use)} of its gas capacity in the last ${r.days} days. Load must grow about ${times(r.feeMultiple)} before the gas price moves, and about ${times(e.loadNeeded)} before gas burn (${pct(e.coverageToday)} of issuance today) matches the NEAR the protocol mints. On the last year's trend (gas per day ${pace(last.pace)} a year earlier) neither happens. If demand doubled every year, fees would start to move in ${years(two?.years.fees_move ?? null)} and burn would match issuance in ${years(two?.years.burn_matches ?? null)}; even at the fastest pace since 2023 (${pace(fast.pace)}), fees move in ${years(fast.years.fees_move)}.`);
  L.push(`- **Dilution is the cost of waiting.** Net of burn, supply grows about ${pct(netDilution)} a year (issuance ${pct(e.issuance.ratePerYear)}, burn offsets ${pct(e.coverageToday)} of it)${e.hsp029 ? `. Governance's HSP-029 would cap issuance at ${pct(e.hsp029.maxInflation)}, the biggest single change to that number` : ''}.`);
  if (v) L.push(`- **So the value case rests on other channels, mainly NEAR Intents.** Together, usage offset about ${pct(v.combinedShare)} of issuance: ${pct(v.intentsBuybackShare)} from Intents buybacks (external figure, not recomputed here) and ${pct(v.gasBurnShare)} from gas burn. Holding NEAR is a bet that Intents-style revenue keeps growing, not that L1 fees rise. Headroom's job is to rule out the gas channel for the next several years; other entries measure Intents.`);
  L.push(`- **What would flip this reading:** whole-block use crossing ${pct(FEE_TRIGGER)} (the fee rule starts raising the price); gas per day growing faster than ${pace(two?.pace ?? null)} a year for a full year; or gas burn overtaking the Intents buyback share${v ? ` (${pct(v.intentsBuybackShare)} of issuance)` : ''}, so gas becomes the larger value channel. Headroom tracks the first two every day. Until one of these happens, blockspace is a cost of running NEAR, not a source of its value.`);
  L.push('');
  L.push('This is a reading of public data, not investment advice.');
  L.push('');
  return L;
}

/** Long-term view: years to each headroom bar at measured and reference growth paces (a model). */
function longTermSection(d) {
  const lt = d.long_term;
  if (!lt) return [];
  const last = lt.rows.find((r) => r.id === 'last_year');
  const fast = lt.rows.find((r) => r.id === 'fastest_year');
  const fees = lt.bars.find((b) => b.id === 'fees_move');
  const L = [];
  L.push('## Long-term view (a model)');
  L.push('');
  L.push(`How long the headroom lasts depends on one thing: how fast gas demand grows. Measured from the sample, gas used per day over the last 30 days was **${pace(last.pace)}** the level of the same 30 days a year earlier${last.pace < 1 ? ', so on the current trend no bar below is ever reached' : ''}. The fastest 12 months since 2023 (to ${day(fast.to)}, from a low base) grew **${pace(fast.pace)}**; at that pace fees would start to move in ${years(fast.years.fees_move)}.`);
  L.push('');
  L.push(`| Yearly growth in gas demand | ${lt.bars.map((b) => `${b.label} (${times(b.multiple)})`).join(' | ')} |`);
  L.push(`|---|${lt.bars.map(() => '---').join('|')}|`);
  for (const r of lt.rows) L.push(`| ${r.label}: ${pace(r.pace)} | ${lt.bars.map((b) => years(r.years[b.id])).join(' | ')} |`);
  L.push('');
  L.push(`Model: ${lt.model}. NEAR adding shards would push every bar further out: good for users, but it delays the point where usage pays for issuance.`);
  L.push('');
  L.push(`**Long-term reading.** A five-year holder is betting that NEAR finds another demand wave like 2023-24 and keeps it: doubling every year reaches the fee trigger (${times(fees.multiple)}) in about ${years(lt.rows.find((r) => r.pace === 2)?.years.fees_move ?? null)}. On the last year's trend, blockspace never becomes scarce and the token's value rests on other channels.`);
  L.push('');
  return L;
}

/** Gas burn (measured here) next to NEAR Intents buybacks (external, with its source). */
function channelsSection(d) {
  const v = d.value_channels;
  if (!v) return [];
  return [
    '## Gas is one of two value channels',
    '',
    `Headroom measures one way usage pays for NEAR: gas burn, **${pct(v.gasBurnShare)}** of issuance today. The other is NEAR Intents: fees on cross-chain swaps fund NEAR buybacks. Those fees are mostly never paid as gas, so block headers cannot see them. An external figure puts the buybacks at about **${pct(v.intentsBuybackShare)}** of the new NEAR issued in the ${v.intents.window} (${v.intents.saidBy}; [source](${v.intents.sources[0]})). Not recomputed here.`,
    '',
    `Together, usage covered roughly **${pct(v.combinedShare)}** of issuance. The two channels behave differently. Intents buybacks depend on swap volume and fee policy, and they are already the larger channel. Gas burn is set by the protocol and grows on its own as blocks fill, but it needs the growth shown above. Signals to watch: whole-block use crossing 50% (here, daily) and the Intents buyback share of issuance (outside Headroom).`,
    '',
  ];
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
    [`Gas burn as a share of issuance${e.burnRule ? ` (burn rule since ${day(e.burnRule.since)})` : ''}`, `**${pct(e.coverageToday)}** today; ${pct(e.coverageAtTrigger)} at the 50% fee trigger; ${pct(e.coverageFull)} with every block full`],
    ['Growth needed for burn to match issuance', `about ${times(e.loadNeeded)} (90%: ${times(e.loadNeededBand[0])} to ${times(e.loadNeededBand[1])})${e.hsp029 ? `; about ${times(e.hsp029.loadNeeded)} if HSP-029's ${pct(e.hsp029.maxInflation)} cap lands` : ''}`],
  );
  const lt = d.long_term;
  if (lt) {
    const last = lt.rows.find((x) => x.id === 'last_year');
    const fast = lt.rows.find((x) => x.id === 'fastest_year');
    const two = lt.rows.find((x) => x.pace === 2);
    rows.push(
      ['Gas used per day, last 30 days vs the same 30 days a year earlier', `**${pace(last.pace)}** (fastest 12 months since 2023: ${pace(fast.pace)}, to ${day(fast.to)})`],
      ['Years until fees move if gas demand doubles every year (model)', `${years(two?.years.fees_move ?? null)}; at the fastest pace seen, ${years(fast.years.fees_move)}`],
    );
  }
  if (d.value_channels) rows.push(['NEAR Intents buybacks as a share of issuance (external, not recomputed)', `about ${pct(d.value_channels.intentsBuybackShare)} (${d.value_channels.intents.window}); with gas burn, about ${pct(d.value_channels.combinedShare)} together`]);
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

/** Replace the generated blocks in README text: the holder reading and the findings table. */
export function withFindings(readme, d) {
  const out = replaceBlock(readme, START, END, renderFindings(d));
  if (!out) throw new Error('README.md has no findings markers');
  const holder = holderLines(d, '##').slice(0, -1).join('\n');
  return replaceBlock(out, '<!-- holder:start -->', '<!-- holder:end -->', holder) ?? out;
}

function replaceBlock(text, start, end, body) {
  const a = text.indexOf(start);
  const b = text.indexOf(end);
  if (a < 0 || b < a) return null;
  return `${text.slice(0, a + start.length)}\n${body}\n${text.slice(b)}`;
}
