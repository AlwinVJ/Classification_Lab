import { useId, useState } from "react";

// Static 2D toy data in a 0–10 feature space. A = circles, B = squares.
const A = [[2, 7.5], [3, 8.5], [1.5, 6], [4, 9], [2.8, 6.8], [5, 8], [3.6, 7.4], [1.2, 8.8]];
const B = [[6, 2], [7.5, 3.5], [8.5, 1.5], [5.5, 3.2], [7, 5], [9, 4], [6.6, 1.2], [8.2, 6]];

export function BoundaryViz() {
  const [offset, setOffset] = useState(4);
  const [tilt, setTilt] = useState(0);
  const ids = [useId(), useId()];
  // Boundary: y = tilt * (x - 5) + offset. Points above → Class A.
  const f = (x: number) => tilt * (x - 5) + offset;
  const wrong = A.filter(([x, y]) => y! < f(x!)).length + B.filter(([x, y]) => y! >= f(x!)).length;
  const S = 30, P = 30, px = (x: number) => P + x * S, py = (y: number) => P + (10 - y) * S, size = 10 * S + 2 * P;
  const poly = (above: boolean) => {
    const yl = f(0), yr = f(10), edge = above ? 10 : 0;
    return `${px(0)},${py(yl)} ${px(10)},${py(yr)} ${px(10)},${py(edge)} ${px(0)},${py(edge)}`;
  };

  return (
    <figure className="my-6 overflow-hidden rounded-lg border">
      <figcaption className="border-b bg-muted/40 px-4 py-2 font-mono text-xs text-muted-foreground">Interactive · Decision boundary</figcaption>
      <div className="grid gap-6 p-4 sm:p-6 md:grid-cols-[1fr_200px]">
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-md" role="img" aria-label={`Decision boundary. ${wrong} points are on the wrong side.`}>
          <defs><clipPath id="plot"><rect x={P} y={P} width={10 * S} height={10 * S} /></clipPath></defs>
          <g clipPath="url(#plot)">
            <polygon points={poly(true)} className="fill-positive/10" />
            <polygon points={poly(false)} className="fill-negative/10" />
            <line x1={px(0)} y1={py(f(0))} x2={px(10)} y2={py(f(10))} className="stroke-primary" strokeWidth={2.5} />
          </g>
          <rect x={P} y={P} width={10 * S} height={10 * S} className="fill-none stroke-border" />
          <text x={P + 8} y={P + 16} className="fill-positive text-[12px] font-semibold">Region: Class A</text>
          <text x={P + 10 * S - 8} y={P + 10 * S - 8} textAnchor="end" className="fill-negative text-[12px] font-semibold">Region: Class B</text>
          {A.map(([x, y], i) => { const bad = y! < f(x!); return <circle key={i} cx={px(x!)} cy={py(y!)} r={6} className={bad ? "fill-none stroke-positive" : "fill-positive"} strokeWidth={2} />; })}
          {B.map(([x, y], i) => { const bad = y! >= f(x!); return <rect key={i} x={px(x!) - 5.5} y={py(y!) - 5.5} width={11} height={11} className={bad ? "fill-none stroke-negative" : "fill-negative"} strokeWidth={2} />; })}
          <text x={P + 5 * S} y={size - 6} textAnchor="middle" className="fill-muted-foreground text-[11px]">Feature 1 →</text>
          <text x={10} y={P + 5 * S} textAnchor="middle" transform={`rotate(-90 10 ${P + 5 * S})`} className="fill-muted-foreground text-[11px]">Feature 2 →</text>
        </svg>
        <div className="space-y-5 text-sm">
          <div>
            <label htmlFor={ids[0]} className="font-medium">Shift boundary</label>
            <input id={ids[0]} type="range" min={1} max={9} step={0.1} value={offset} onChange={(e) => setOffset(+e.target.value)} className="mt-2 h-6 w-full accent-[var(--color-primary)]" />
          </div>
          <div>
            <label htmlFor={ids[1]} className="font-medium">Tilt boundary</label>
            <input id={ids[1]} type="range" min={-2} max={3} step={0.05} value={tilt} onChange={(e) => setTilt(+e.target.value)} className="mt-2 h-6 w-full accent-[var(--color-primary)]" />
          </div>
          <div className="rounded-md border p-3" aria-live="polite">
            <p className="text-xs text-muted-foreground">Points on the wrong side</p>
            <p className="font-mono text-2xl">{wrong}</p>
          </div>
          <p className="text-xs text-muted-foreground">● Class A, ■ Class B. Hollow shapes sit on the wrong side of the line.</p>
        </div>
      </div>
    </figure>
  );
}
