// "Show the source" for one chart or number: the NEAR call it comes from, the code that
// computes it, and one plain sentence. Collapsed by default.
const REPO = 'https://github.com/london160771/headroom/blob/main/';

export default function Source({ rpc, code, plain }) {
  return (
    <details className="hr-source small mt-2">
      <summary>Show the source</summary>
      <dl className="mb-0 mt-2">
        {rpc && (<><dt>NEAR data</dt><dd className="hr-mono">{rpc}</dd></>)}
        <dt>Code</dt>
        <dd>{code.map((c, i) => (<span key={c}>{i ? ', ' : ''}<a href={REPO + c} target="_blank" rel="noreferrer" className="hr-mono">{c}</a></span>))}</dd>
        <dt>In plain words</dt>
        <dd className="mb-0">{plain}</dd>
      </dl>
    </details>
  );
}
