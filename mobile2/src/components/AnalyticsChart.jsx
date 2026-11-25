/**
 * График движения жилого фонда: вверх зелёным — пришло, вниз красным — ушло,
 * серая линия — разность. Используется и по группам (регионы/УК), и по корзинам времени.
 *
 * items: [{ key, label, in, out, delta }]
 */
export function DeltaChart({ items, unit, showDeltaLine = true, colWidth = 40 }) {
  const data = items || [];
  if (!data.length) return null;

  const max = Math.max(1, ...data.map((d) => Math.max(
    Math.abs(Number(d.in) || 0), Math.abs(Number(d.out) || 0), Math.abs(Number(d.delta) || 0),
  )));
  const upH = 70;
  const downH = 90;
  const width = Math.max(data.length * colWidth, 100);
  const height = upH + downH;
  const barW = 12;
  const cx = (i) => i * colWidth + colWidth / 2;
  const y = (v) => (v >= 0 ? upH - (v / max) * upH : upH + (Math.abs(v) / max) * downH);

  const line = data
    .map((d, i) => `${cx(i).toFixed(1)},${y(Number(d.delta) || 0).toFixed(1)}`)
    .join(' ');

  return (
    <div className="chart">
      <div className="chart-legend">
        <span><i className="dot green" />пришло</span>
        <span><i className="dot red" />ушло</span>
        {showDeltaLine ? <span><i className="dash" />разность</span> : null}
        <span className="chart-unit">{unit}</span>
      </div>

      <div className="chart-body">
        <div className="chart-axis">
          <span>{fmtAxis(max)}</span>
          <span className="zero">0</span>
          <span>−{fmtAxis(max)}</span>
        </div>

        <div className="chart-scroll">
          <svg width={width} height={height} role="img" aria-label={`Движение, ${unit}`}>
            <line x1="0" y1={upH} x2={width} y2={upH} stroke="var(--color-gray, #dde0e6)" strokeWidth="1" />
            {data.map((d, i) => {
              const inH = (Math.abs(Number(d.in) || 0) / max) * upH;
              const outH = (Math.abs(Number(d.out) || 0) / max) * downH;
              return (
                <g key={d.key ?? i}>
                  {inH > 0.5 ? <rect x={cx(i) - barW - 1} y={upH - inH} width={barW} height={inH} rx="2" fill="var(--color-green, #63b53c)" /> : null}
                  {outH > 0.5 ? <rect x={cx(i) + 1} y={upH} width={barW} height={outH} rx="2" fill="var(--color-red, #df4238)" /> : null}
                </g>
              );
            })}
            {showDeltaLine && data.length > 1
              ? <polyline points={line} fill="none" stroke="var(--color-text-secondary)" strokeWidth="1.5" />
              : null}
            {showDeltaLine && data.length === 1
              ? <circle cx={cx(0)} cy={y(Number(data[0].delta) || 0)} r="3" fill="var(--color-text-secondary)" />
              : null}
          </svg>
          <div className="chart-labels" style={{ width }}>
            {data.map((d, i) => (
              <div key={d.key ?? i} className="chart-label" style={{ width: colWidth }}>{d.label}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function fmtAxis(v) {
  const n = Number(v) || 0;
  return n >= 1000 ? `${Math.round(n / 1000)}k` : String(Math.round(n));
}

/** Полоса баланса: доля пришедшего и ушедшего в общем объёме движения. */
export function BalanceBar({ inValue, outValue }) {
  const a = Math.abs(Number(inValue) || 0);
  const b = Math.abs(Number(outValue) || 0);
  const sum = a + b;
  return (
    <div className="balance">
      {sum > 0 ? <i className="green" style={{ flex: a }} /> : null}
      {sum > 0 ? <i className="red" style={{ flex: b }} /> : null}
    </div>
  );
}

/** Горизонтальная мини-полоса «пришло/ушло» в карточке группы. */
export function MiniBar({ label, value, share, tone }) {
  return (
    <div className="minibar">
      <span className="minibar-label">{label}</span>
      <span className="minibar-track"><i className={tone} style={{ width: `${Math.min(100, share * 100)}%` }} /></span>
      <span className={`minibar-value ${tone}`}>{value}</span>
    </div>
  );
}
