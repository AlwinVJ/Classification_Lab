import { useId, useState } from "react";

// Static demo observations: model score for "fraud" (illustrative only).
const OBS = [0.05, 0.12, 0.2, 0.31, 0.38, 0.44, 0.52, 0.58, 0.66, 0.73, 0.82, 0.91];
const BASE = 0.5;

export function ThresholdViz() {
  const [t, setT] = useState(0.5);
  const id = useId();
  const pos = OBS.filter((p) => p >= t).length;
  const changed = OBS.filter((p) => (p >= t) !== (p >= BASE)).length;
  const W = 600, pad = 24, x = (p: number) => pad + p * (W - 2 * pad);

  return (
    <figure className="my-6 overflow-hidden rounded-lg border">
      <figcaption className="border-b bg-muted/40 px-4 py-2 font-mono text-xs text-muted-foreground">Interactive · Classification threshold</figcaption>
      <div className="p-4 sm:p-6">
        <svg viewBox={`0 0 ${W} 130`} className="w-full" role="img" aria-label={`Threshold ${t.toFixed(2)}: ${pos} of ${OBS.length} observations predicted Fraud.`}>
          <rect x={pad} y={20} width={x(t) - pad} height={70} className="fill-negative/10" />
          <rect x={x(t)} y={20} width={W - pad - x(t)} height={70} className="fill-positive/10" />
          <text x={pad + 4} y={34} className="fill-muted-foreground text-[11px]">Predicted: Not fraud</text>
          <text x={W - pad - 4} y={34} textAnchor="end" className="fill-muted-foreground text-[11px]">Predicted: Fraud</text>
          <line x1={pad} x2={W - pad} y1={90} y2={90} className="stroke-border" strokeWidth={1.5} />
          {[0, 0.25, 0.5, 0.75, 1].map((v) => (
            <g key={v}>
              <line x1={x(v)} x2={x(v)} y1={90} y2={95} className="stroke-muted-foreground" />
              <text x={x(v)} y={110} textAnchor="middle" className="fill-muted-foreground font-mono text-[11px]">{v}</text>
            </g>
          ))}
          {OBS.map((p, i) => {
            const isPos = p >= t, flip = isPos !== p >= BASE, cy = i % 2 ? 58 : 70;
            return (
              <g key={i} className="transition-all">
                {flip && <circle cx={x(p)} cy={cy} r={10} className="fill-none stroke-warning" strokeWidth={2} strokeDasharray="3 2" />}
                {isPos ? <circle cx={x(p)} cy={cy} r={6} className="fill-positive" /> : <rect x={x(p) - 5.5} y={cy - 5.5} width={11} height={11} className="fill-negative" />}
              </g>
            );
          })}
          <line x1={x(t)} x2={x(t)} y1={14} y2={96} className="stroke-primary" strokeWidth={2.5} />
          <text x={x(t)} y={10} textAnchor="middle" className="fill-primary font-mono text-[11px] font-semibold">t = {t.toFixed(2)}</text>
        </svg>
        <label htmlFor={id} className="mt-4 block text-sm font-medium">Move the threshold</label>
        <input id={id} type="range" min={0} max={1} step={0.01} value={t} onChange={(e) => setT(+e.target.value)} className="mt-2 h-6 w-full accent-[var(--color-primary)]" aria-valuetext={`Threshold ${t.toFixed(2)}`} />
        <dl className="mt-4 grid grid-cols-3 gap-2 text-center text-sm" aria-live="polite">
          <div className="rounded-md border p-2"><dt className="text-xs text-muted-foreground">● Fraud</dt><dd className="font-mono text-lg">{pos}</dd></div>
          <div className="rounded-md border p-2"><dt className="text-xs text-muted-foreground">■ Not fraud</dt><dd className="font-mono text-lg">{OBS.length - pos}</dd></div>
          <div className="rounded-md border p-2"><dt className="text-xs text-muted-foreground">Changed vs 0.50</dt><dd className="font-mono text-lg">{changed}</dd></div>
        </dl>
        <p className="mt-3 text-xs text-muted-foreground">Circles = predicted Fraud, squares = predicted Not fraud. A dashed ring marks observations whose prediction differs from the default threshold of 0.50.</p>
      </div>
    </figure>
  );
}
