// From capacity to value: does gas burn offset the NEAR the protocol mints?
// Burn per Tgas and issuance are read from block headers (lib/economics.js).
import { FEE_TRIGGER } from '../../../lib/metrics.js';
import { day, pct, times } from '../lib/format.js';
import Source from './Source.jsx';

const near = (x) => `${Math.round(x).toLocaleString('en-US')} NEAR`;

export default function Bridge({ e, recent }) {
  if (!e) return null;
  const rows = [
    { label: `Today (${pct(recent.use)} used)`, v: e.coverageToday, band: e.coverageTodayBand },
    { label: `At the fee trigger (${pct(FEE_TRIGGER)} used)`, v: e.coverageAtTrigger },
    { label: 'Every block full, floor price', v: e.coverageFull },
  ];
  const max = Math.max(1.05, ...rows.map((r) => r.v));
  const w = (v) => `${(Math.min(v, max) / max) * 100}%`;
  return (
    <div>
      <p className="mb-3">
        NEAR mints about <b>{near(e.issuance.mintedPerYear)}</b> a year ({pct(e.issuance.ratePerYear)} of supply). Gas burn takes some back.
        In the last 30 days it burned at a rate of about <b>{near(e.burnPerYearToday)}</b> a year: <b>{pct(e.coverageToday)}</b> of issuance.
      </p>
      <div className="hr-bars mb-2">
        {rows.map((r) => (
          <div key={r.label} className="hr-bar-row">
            <div className="small">{r.label}</div>
            <div className="hr-bar-track">
              <div className="hr-bar-fill" style={{ width: w(r.v) }} />
              {r.band && <div className="hr-bar-band" style={{ left: w(r.band[0]), width: `calc(${w(r.band[1])} - ${w(r.band[0])})` }} />}
              <div className="hr-bar-line" style={{ left: w(1) }} title="Burn = issuance" />
            </div>
            <div className="small hr-mono text-end">{pct(r.v)}</div>
          </div>
        ))}
      </div>
      <p className="small hr-muted">Bar: gas burn as a share of NEAR minted. Dashed line: burn equals issuance.</p>
      <p className="mb-0">
        For burn to match issuance, gas use would have to grow about <b>{times(e.loadNeeded)}</b> (90%: {times(e.loadNeededBand[0])} to {times(e.loadNeededBand[1])}).
        NEAR's fee rule starts raising the price at about <b>{times(recent.feeMultiple)}</b>.{' '}
        {e.fitsBeforeFeesMove
          ? 'So filling the spare room at today’s floor price would be enough on its own.'
          : `So the spare room alone, at today's floor price, can't do it: even at the fee trigger, burn covers ${pct(e.coverageAtTrigger)} of issuance. Past the trigger the gas price rises, and so does the burn per Tgas. That is where blockspace starts to pay for NEAR.`}
      </p>
      {e.burnRule && (
        <p className="small mt-3 mb-0">
          <b>The rules just moved.</b> Since protocol {e.burnRule.protocolVersion} ({day(e.burnRule.since)}), NEAR burns {pct(e.burnRule.burnShare)} of gas fees instead of
          paying part to contracts. We found the exact block by bisecting archival protocol configs, and measure burn on the {e.burnRule.blocks.toLocaleString('en-US')} sampled
          blocks since then. {e.hsp029 && <>If HSP-029's {pct(e.hsp029.maxInflation)} issuance cap lands (approved by governance, not yet in effect), the growth needed falls to about{' '}
          <b>{times(e.hsp029.loadNeeded)}</b> ({times(e.hsp029.loadNeededBand[0])} to {times(e.hsp029.loadNeededBand[1])}), {e.hsp029.fitsBeforeFeesMove ? 'around where the fee rule starts to bite' : 'still past the fee trigger'}.</>}
        </p>
      )}
      <Source
        rpc={'block → header.total_supply, header.block_ordinal, chunks[].balance_burnt, chunks[].gas_used; EXPERIMENTAL_protocol_config → burnt_gas_reward, max_inflation_rate'}
        code={['lib/economics.js', 'lib/report.js', 'scripts/protocol.js', 'evidence/scenarios.json']}
        plain={`Minted per year = change in total supply + NEAR burned, over the last year (${e.issuance.from.slice(0, 10)} to ${e.issuance.to.slice(0, 10)}). Burned per Tgas = balance_burnt ÷ gas used, over sampled and dense blocks under the current burn rule. Capacity = ${Math.round(e.blocksPerDay).toLocaleString('en-US')} blocks a day × ${recent.shards} shards × 1,000 Tgas.`}
      />
    </div>
  );
}
