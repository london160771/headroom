// "What this means for a NEAR holder": the investment reading, same numbers as THESIS.md (lib/thesis.js holderLines).
import { FEE_TRIGGER } from '../../../lib/metrics.js';
import { pace, pct, times, years } from '../lib/format.js';

export default function Holder({ d }) {
  const r = d.recent;
  const e = d.economics;
  const lt = d.long_term;
  const v = d.value_channels;
  if (!e || !lt) return null;
  const two = lt.rows.find((x) => x.pace === 2);
  const last = lt.rows.find((x) => x.id === 'last_year');
  const net = e.issuance.ratePerYear * (1 - e.coverageToday);
  const points = [
    ['Do not count on blockspace scarcity', <>Load must grow about <b>{times(r.feeMultiple)}</b> before the gas price moves, and about <b>{times(e.loadNeeded)}</b> before gas burn matches issuance. Gas per day is {pace(last.pace)} a year earlier; even doubling every year, fees move in {years(two?.years.fees_move ?? null)}.</>],
    ['Dilution is the cost of waiting', <>Net of burn, supply grows about <b>{pct(net)}</b> a year.{e.hsp029 && <> Governance's HSP-029 would cap issuance at {pct(e.hsp029.maxInflation)}.</>}</>],
    v && ['The value case rests on NEAR Intents', <>Usage offsets about <b>{pct(v.combinedShare)}</b> of issuance: {pct(v.intentsBuybackShare)} from Intents buybacks (external figure) and {pct(v.gasBurnShare)} from gas burn. Holding NEAR is a bet on Intents-style revenue, not on L1 fees rising.</>],
    ['What would flip this', <>Whole-block use above {pct(FEE_TRIGGER)}, gas growing faster than {pace(two?.pace ?? null)} a year for a full year{v && <>, or gas burn overtaking Intents buybacks</>}. Headroom tracks the first two every day.</>],
  ].filter(Boolean);
  return (
    <div className="hr-panel mb-3">
      <h3 className="h5 mb-3">What this means for a NEAR holder</h3>
      <div className="hr-holder">
        {points.map(([title, body]) => (
          <div key={title}>
            <div className="fw-medium mb-1">{title}</div>
            <p className="small hr-ink-2 mb-0">{body}</p>
          </div>
        ))}
      </div>
      <p className="small hr-muted mt-3 mb-0">A reading of public data, not investment advice. The full version, generated from the same data, opens THESIS.md.</p>
    </div>
  );
}
