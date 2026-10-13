import { useId, useMemo, useRef, useState, type ReactNode } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { metrics, percent, countsAt, rocAuc } from "@/lib/evaluation";
import { C_VALUES, churnScore, CHURN, datasetCounts, fitL2, gradientDescentPath, LR_OBSERVATIONS, logit, logLoss, odds, POINTS, prob, sigmoid, toObservations, type Params } from "@/lib/logistic";
import { ConfusionMatrix, MetricCards } from "./EvaluationViz";

const f = (v: number, d = 2) => (Object.is(Math.round(v * 10 ** d), -0) ? 0 : v).toFixed(d);
const signed = (v: number) => (v < 0 ? `− ${f(-v)}` : `+ ${f(v)}`);

/* ---------- shared bits ---------- */
export function Slider({ label, value, min, max, step, onChange, format = (v) => f(v) }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; format?: (v: number) => string }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="flex justify-between text-sm font-medium"><span>{label}</span><output htmlFor={id} className="font-mono">{format(value)}</output></label>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} aria-valuetext={`${label} ${format(value)}`} className="mt-1 h-6 w-full accent-primary" />
    </div>
  );
}
function Panel({ title, children, className }: { title: string; children: ReactNode; className?: string | undefined }) {
  return (
    <figure className={cn("my-6 overflow-hidden rounded-lg border", className)}>
      <figcaption className="border-b bg-muted/40 px-4 py-2 font-mono text-xs text-muted-foreground">{title}</figcaption>
      <div className="p-4 sm:p-5">{children}</div>
    </figure>
  );
}
function Stat({ label, value, tone }: { label: string; value: ReactNode; tone?: "pos" | "neg" | "primary" | undefined }) {
  return (
    <div className={cn("rounded-md border p-2 text-center", tone === "pos" && "bg-positive/10", tone === "neg" && "bg-negative/10", tone === "primary" && "border-primary/50")}>
      <dt className="text-xs text-muted-foreground">{label}</dt><dd className="font-mono text-lg">{value}</dd>
    </div>
  );
}
const ClassBadge = ({ cls }: { cls: 0 | 1 }) => <span className={cn("inline-flex items-center gap-1 rounded px-2 py-0.5 font-mono text-xs", cls ? "bg-positive/15 text-positive" : "bg-negative/15 text-negative")}>{cls ? "● Class 1" : "■ Class 0"}</span>;

/* ---------- 5. Linear score explorer ---------- */
export function LinearScoreExplorer() {
  const init = { w1: 2, w2: -1, b: 0.5, x1: 3, x2: 1 };
  const [v, setV] = useState(init);
  const set = (k: keyof typeof init) => (n: number) => setV((s) => ({ ...s, [k]: n }));
  const z = v.w1 * v.x1 + v.w2 * v.x2 + v.b;
  const x = (n: number) => 20 + ((Math.max(-12, Math.min(12, n)) + 12) / 24) * 560;
  return (
    <Panel title="Interactive · Linear score explorer">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <p className="font-mono text-xs uppercase text-muted-foreground">Features</p>
          <Slider label="x₁" value={v.x1} min={-5} max={5} step={0.5} onChange={set("x1")} />
          <Slider label="x₂" value={v.x2} min={-5} max={5} step={0.5} onChange={set("x2")} />
          <p className="pt-2 font-mono text-xs uppercase text-muted-foreground">Parameters</p>
          <Slider label="w₁" value={v.w1} min={-3} max={3} step={0.5} onChange={set("w1")} />
          <Slider label="w₂" value={v.w2} min={-3} max={3} step={0.5} onChange={set("w2")} />
          <Slider label="b (bias)" value={v.b} min={-5} max={5} step={0.5} onChange={set("b")} />
          <Button variant="outline" size="sm" onClick={() => setV(init)}><RotateCcw /> Reset example</Button>
        </div>
        <div aria-live="polite">
          <p className="font-mono text-xs uppercase text-muted-foreground">Step by step</p>
          <ol className="mt-2 space-y-1 font-mono text-sm">
            <li>z = w₁x₁ + w₂x₂ + b</li>
            <li>z = ({f(v.w1, 1)})({f(v.x1, 1)}) + ({f(v.w2, 1)})({f(v.x2, 1)}) + ({f(v.b, 1)})</li>
            <li>z = {f(v.w1 * v.x1)} {signed(v.w2 * v.x2)} {signed(v.b)}</li>
            <li className="text-lg font-semibold text-primary">z = {f(z)}</li>
          </ol>
          <svg viewBox="0 0 600 70" className="mt-4 w-full" role="img" aria-label={`Linear score ${f(z)} on a number line from minus 12 to 12.`}>
            <line x1={20} x2={580} y1={35} y2={35} className="stroke-border" strokeWidth={2} />
            {[-12, -6, 0, 6, 12].map((t) => <g key={t}><line x1={x(t)} x2={x(t)} y1={30} y2={40} className="stroke-muted-foreground" /><text x={x(t)} y={58} textAnchor="middle" className="fill-muted-foreground font-mono text-[11px]">{t}</text></g>)}
            <circle cx={x(z)} cy={35} r={7} className="fill-primary" />
            <text x={x(z)} y={18} textAnchor="middle" className="fill-primary font-mono text-[12px]">z = {f(z, 1)}</text>
          </svg>
          <p className="mt-2 text-sm text-muted-foreground">The line continues past ±12 in both directions: z can be any real number, so it is <strong>not</strong> a probability yet. Positive w increases z as that feature grows; negative w decreases it.</p>
        </div>
      </div>
    </Panel>
  );
}

/* ---------- 7. Sigmoid graph with draggable point ---------- */
export function SigmoidViz() {
  const [z, setZ] = useState(2.3);
  const ref = useRef<SVGSVGElement>(null);
  const W = 600, H = 300, L = 50, R = 20, T = 20, B = 40;
  const x = (v: number) => L + ((v + 10) / 20) * (W - L - R), y = (p: number) => T + (1 - p) * (H - T - B);
  const path = Array.from({ length: 201 }, (_, i) => -10 + i * 0.1).map((v, i) => `${i ? "L" : "M"}${x(v).toFixed(1)},${y(sigmoid(v)).toFixed(1)}`).join(" ");
  const p = sigmoid(z);
  const drag = (e: React.PointerEvent) => {
    if (e.type !== "pointerdown" && e.buttons !== 1) return;
    const r = ref.current?.getBoundingClientRect(); if (!r) return;
    const sx = ((e.clientX - r.left) / r.width) * W;
    setZ(Math.round(Math.max(-10, Math.min(10, ((sx - L) / (W - L - R)) * 20 - 10)) * 10) / 10);
  };
  return (
    <Panel title="Interactive · Sigmoid function σ(z)">
      <svg ref={ref} viewBox={`0 0 ${W} ${H}`} className="w-full touch-none select-none" role="img" aria-label={`Sigmoid curve. At z = ${f(z, 1)}, sigmoid(z) = ${f(p, 3)}.`} onPointerDown={drag} onPointerMove={drag}>
        {[0, 0.25, 0.5, 0.75, 1].map((t) => <g key={t}><line x1={L} x2={W - R} y1={y(t)} y2={y(t)} className={t === 0.5 ? "stroke-warning" : "stroke-border"} strokeDasharray={t === 0.5 ? "5 4" : undefined} strokeWidth={t === 0.5 ? 1.5 : 1} /><text x={L - 8} y={y(t) + 4} textAnchor="end" className="fill-muted-foreground font-mono text-[11px]">{t}</text></g>)}
        {[-10, -5, 0, 5, 10].map((t) => <text key={t} x={x(t)} y={H - B + 18} textAnchor="middle" className="fill-muted-foreground font-mono text-[11px]">{t}</text>)}
        <line x1={x(0)} x2={x(0)} y1={T} y2={H - B} className="stroke-warning" strokeDasharray="5 4" strokeWidth={1.5} />
        <text x={W - R} y={y(0.5) - 6} textAnchor="end" className="fill-muted-foreground text-[11px]">probability 0.5</text>
        <text x={x(0) + 6} y={T + 12} className="fill-muted-foreground text-[11px]">z = 0</text>
        <path d={path} className="fill-none stroke-primary" strokeWidth={2.5} />
        <line x1={x(z)} x2={x(z)} y1={y(p)} y2={H - B} className="stroke-muted-foreground" strokeDasharray="2 3" />
        <line x1={L} x2={x(z)} y1={y(p)} y2={y(p)} className="stroke-muted-foreground" strokeDasharray="2 3" />
        <circle cx={x(z)} cy={y(p)} r={9} className="cursor-grab fill-primary stroke-background" strokeWidth={3} />
        <text x={(W + L) / 2} y={H - 4} textAnchor="middle" className="fill-muted-foreground text-[11px]">z (linear score)</text>
      </svg>
      <p className="text-xs text-muted-foreground">Drag along the chart or use the slider. Dashed lines mark z = 0 and probability = 0.5; they cross on the curve because σ(0) = 0.5.</p>
      <div className="mt-3"><Slider label="Linear score z" value={z} min={-10} max={10} step={0.1} onChange={setZ} format={(v) => f(v, 1)} /></div>
      <dl className="mt-3 grid grid-cols-3 gap-2" aria-live="polite">
        <Stat label="z" value={f(z, 1)} />
        <Stat label="σ(z) = probability" value={f(p, 3)} tone="primary" />
        <Stat label="At threshold 0.5" value={p >= 0.5 ? "● Class 1" : "■ Class 0"} tone={p >= 0.5 ? "pos" : "neg"} />
      </dl>
    </Panel>
  );
}

/* ---------- 9 / 32. Probability table with threshold ---------- */
const TABLE = [
  { id: "A", x1: -1.8, x2: -0.4, p: 0.12 }, { id: "B", x1: -0.6, x2: -0.2, p: 0.34 }, { id: "C", x1: 0.1, x2: -0.05, p: 0.51 },
  { id: "D", x1: 1.0, x2: 0.4, p: 0.78 }, { id: "E", x1: 2.1, x2: 0.9, p: 0.93 },
];
export function ProbabilityTable() {
  const [t, setT] = useState(0.5);
  return (
    <Panel title="Interactive · Probability vs predicted class">
      <Slider label="Threshold" value={t} min={0.05} max={0.95} step={0.01} onChange={setT} />
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[440px] text-sm">
          <caption className="sr-only">Observations with probability of class 1 and the predicted class at threshold {f(t)}</caption>
          <thead className="bg-muted/50"><tr>{["Observation", "x₁", "x₂", "P(y=1|x)", "Rule", "Predicted class"].map((h) => <th key={h} scope="col" className="px-3 py-2 text-left font-medium">{h}</th>)}</tr></thead>
          <tbody aria-live="polite">{TABLE.map((r) => { const c = r.p >= t ? 1 : 0; return (
            <tr key={r.id} className="border-t"><th scope="row" className="px-3 py-2 text-left">{r.id}</th><td className="px-3 py-2 font-mono">{r.x1}</td><td className="px-3 py-2 font-mono">{r.x2}</td>
              <td className="px-3 py-2"><span className="flex items-center gap-2 font-mono"><span className="relative h-2 w-16 rounded bg-muted" aria-hidden><span className="absolute inset-y-0 left-0 rounded bg-primary" style={{ width: `${r.p * 100}%` }} /></span>{r.p.toFixed(2)}</span></td>
              <td className="px-3 py-2 font-mono text-xs">{r.p.toFixed(2)} {c ? "≥" : "<"} {f(t)}</td><td className="px-3 py-2"><ClassBadge cls={c} /></td></tr>); })}</tbody>
        </table>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">The probability column never changes — the model is the same. Only the threshold, and therefore the final class, changes.</p>
    </Panel>
  );
}

/* ---------- 10. Threshold explorer reusing Phase 2 metrics ---------- */
export function LRThresholdExplorer() {
  const [t, setT] = useState(0.5);
  const counts = countsAt(t, LR_OBSERVATIONS);
  const x = (v: number) => 30 + v * 540;
  return (
    <Panel title="Interactive · Threshold → predictions → metrics">
      <svg viewBox="0 0 600 130" className="w-full" role="img" aria-label={`Threshold ${f(t)}: TP ${counts.tp}, TN ${counts.tn}, FP ${counts.fp}, FN ${counts.fn}.`}>
        <rect x={30} y={20} width={x(t) - 30} height={70} className="fill-muted" />
        <rect x={x(t)} y={20} width={570 - x(t)} height={70} className="fill-primary/10" />
        <text x={34} y={33} className="fill-muted-foreground text-[11px]">Predicted class 0</text>
        <text x={566} y={33} textAnchor="end" className="fill-muted-foreground text-[11px]">Predicted class 1</text>
        {LR_OBSERVATIONS.map((o, i) => { const ok = o.positive === o.score >= t; const cy = o.positive ? 52 : 74; return (
          <g key={i}>{o.positive ? <circle cx={x(o.score)} cy={cy} r={7} className={ok ? "fill-positive" : "fill-negative"} /> : <rect x={x(o.score) - 6} y={cy - 6} width={12} height={12} className={ok ? "fill-positive" : "fill-negative"} />}
            {!ok && <text x={x(o.score)} y={cy + 4} textAnchor="middle" className="fill-background text-[10px] font-bold">×</text>}</g>); })}
        <line x1={x(t)} x2={x(t)} y1={12} y2={96} className="stroke-primary" strokeWidth={2.5} />
        <line x1={30} x2={570} y1={96} y2={96} className="stroke-border" />
        {[0, 0.25, 0.5, 0.75, 1].map((v) => <text key={v} x={x(v)} y={114} textAnchor="middle" className="fill-muted-foreground font-mono text-[11px]">{v}</text>)}
      </svg>
      <p className="text-xs text-muted-foreground">● actual class 1 · ■ actual class 0. Green = correct prediction, red with × = incorrect. Probabilities: {LR_OBSERVATIONS.map((o) => o.score.toFixed(2)).join(", ")}.</p>
      <div className="mt-3"><Slider label="Threshold" value={t} min={0} max={1} step={0.01} onChange={setT} /></div>
      <ConfusionMatrix counts={counts} details={false} positiveLabel="class 1" />
      <MetricCards counts={counts} rates={false} />
    </Panel>
  );
}

/* ---------- 12. Probability ↔ log-odds ---------- */
export function LogOddsExplorer() {
  const [p, setP] = useState(0.8);
  const o = odds(p), lo = logit(p);
  const W = 600, H = 220, L = 46, R = 16, T = 14, B = 34;
  const x = (v: number) => L + v * (W - L - R), y = (v: number) => T + ((5 - Math.max(-5, Math.min(5, v))) / 10) * (H - T - B);
  const path = Array.from({ length: 97 }, (_, i) => 0.02 + i * 0.01).map((v, i) => `${i ? "L" : "M"}${x(v).toFixed(1)},${y(logit(v) ?? 0).toFixed(1)}`).join(" ");
  return (
    <Panel title="Interactive · Probability → odds → log-odds">
      <Slider label="Probability p" value={p} min={0.01} max={0.99} step={0.01} onChange={setP} />
      <dl className="mt-3 grid grid-cols-3 gap-2" aria-live="polite">
        <Stat label="p" value={f(p)} />
        <Stat label="odds = p/(1−p)" value={o === null ? "∞" : f(o)} />
        <Stat label="log-odds" value={lo === null ? "±∞" : f(lo)} tone={lo !== null && lo > 0.005 ? "pos" : lo !== null && lo < -0.005 ? "neg" : "primary"} />
      </dl>
      <p className="mt-2 text-sm" aria-live="polite">{Math.abs(p - 0.5) < 0.005 ? "p = 0.5 → odds = 1 → log-odds = 0: both classes equally likely." : p > 0.5 ? `p > 0.5 → odds above 1 (${f(o ?? 0)} to 1) → positive log-odds.` : `p < 0.5 → odds below 1 → negative log-odds.`}</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 w-full" role="img" aria-label={`Logit curve. At p ${f(p)}, log-odds ${lo === null ? "undefined" : f(lo)}.`}>
        {[-5, 0, 5].map((v) => <g key={v}><line x1={L} x2={W - R} y1={y(v)} y2={y(v)} className="stroke-border" strokeDasharray={v === 0 ? "4 3" : undefined} /><text x={L - 6} y={y(v) + 4} textAnchor="end" className="fill-muted-foreground font-mono text-[11px]">{v}</text></g>)}
        {[0, 0.5, 1].map((v) => <text key={v} x={x(v)} y={H - 12} textAnchor="middle" className="fill-muted-foreground font-mono text-[11px]">{v}</text>)}
        <path d={path} className="fill-none stroke-primary" strokeWidth={2.5} />
        <circle cx={x(p)} cy={y(lo ?? 0)} r={7} className="fill-primary stroke-background" strokeWidth={2} />
        <text x={(W + L) / 2} y={H} textAnchor="middle" className="fill-muted-foreground text-[11px]">probability p</text>
      </svg>
      <p className="text-xs text-muted-foreground">The slider stops at 0.01 and 0.99 on purpose. At p = 0 the log-odds head to −∞ and at p = 1 to +∞ (odds divide by zero), so the logit is defined only on the open interval (0, 1).</p>
    </Panel>
  );
}

/* ---------- 2D feature space plot ---------- */
const D = 4;
export function FeaturePlot({ params, threshold = 0.5, shade = true, query, label }: { params: Params; threshold?: number; shade?: boolean; query?: [number, number] | undefined; label?: string }) {
  const clip = useId().replace(/:/g, "");
  const S = 320, P = 28, inner = S - 2 * P;
  const sx = (v: number) => P + ((v + D) / (2 * D)) * inner, sy = (v: number) => P + ((D - v) / (2 * D)) * inner;
  const N = 20, cell = (2 * D) / N;
  const c = logit(threshold) ?? 0; // boundary: w·x + b = logit(t)
  const { w1, w2, b } = params;
  let line: [number, number, number, number] | null = null;
  if (Math.abs(w2) > 1e-6) line = [-D, (c - b - w1 * -D) / w2, D, (c - b - w1 * D) / w2];
  else if (Math.abs(w1) > 1e-6) { const v = (c - b) / w1; line = [v, -D, v, D]; }
  const counts = datasetCounts(params, threshold);
  const wrong = counts.fp + counts.fn;
  return (
    <svg viewBox={`0 0 ${S} ${S}`} className="w-full max-w-md" role="img" aria-label={label ?? `Feature space with ${POINTS.length} points. Boundary w1 ${f(w1)}, w2 ${f(w2)}, b ${f(b)}. ${wrong} points misclassified.`}>
      <defs><clipPath id={clip}><rect x={P} y={P} width={inner} height={inner} /></clipPath></defs>
      <g clipPath={`url(#${clip})`}>
        {shade && Array.from({ length: N * N }, (_, i) => { const cx = -D + (i % N + 0.5) * cell, cy = -D + (Math.floor(i / N) + 0.5) * cell; const pr = prob(params, cx, cy); const pos = pr >= threshold; return <rect key={i} x={sx(cx - cell / 2)} y={sy(cy + cell / 2)} width={inner / N + 0.5} height={inner / N + 0.5} className={pos ? "fill-positive" : "fill-negative"} opacity={0.05 + 0.3 * Math.abs(pr - 0.5) * 2} />; })}
        {line && <line x1={sx(line[0])} y1={sy(line[1])} x2={sx(line[2])} y2={sy(line[3])} className="stroke-primary" strokeWidth={2.5} />}
      </g>
      <rect x={P} y={P} width={inner} height={inner} className="fill-none stroke-border" />
      {[-4, -2, 0, 2, 4].map((v) => <g key={v}><text x={sx(v)} y={S - 10} textAnchor="middle" className="fill-muted-foreground font-mono text-[10px]">{v}</text><text x={P - 6} y={sy(v) + 3} textAnchor="end" className="fill-muted-foreground font-mono text-[10px]">{v}</text></g>)}
      <text x={S - P} y={S - 1} textAnchor="end" className="fill-muted-foreground text-[10px]">x₁</text>
      <text x={4} y={P - 8} className="fill-muted-foreground text-[10px]">x₂</text>
      {POINTS.map((pt) => { const ok = (prob(params, pt.x1, pt.x2) >= threshold) === (pt.y === 1); return (
        <g key={pt.id}>{!ok && <circle cx={sx(pt.x1)} cy={sy(pt.x2)} r={10} className="fill-none stroke-warning" strokeWidth={2} strokeDasharray="3 2" />}
          {pt.y ? <circle cx={sx(pt.x1)} cy={sy(pt.x2)} r={5.5} className="fill-positive stroke-background" strokeWidth={1.5} /> : <rect x={sx(pt.x1) - 5} y={sy(pt.x2) - 5} width={10} height={10} className="fill-negative stroke-background" strokeWidth={1.5} />}</g>); })}
      {query && <path d={`M${sx(query[0])},${sy(query[1]) - 9} l9,9 l-9,9 l-9,-9 z`} className="fill-primary stroke-foreground" strokeWidth={1.5} />}
    </svg>
  );
}
const PlotLegend = ({ query }: { query?: boolean }) => <p className="mt-2 text-xs text-muted-foreground">● actual class 1 · ■ actual class 0 · dashed ring = misclassified · solid line = decision boundary. Shading shows the predicted region; stronger shading = probability further from 0.5.{query && " ◆ = the observation you are classifying."}</p>;

/* ---------- 14 / 38. Boundary playground & Build-the-classifier lab ---------- */
export function LogisticPlayground({ lab = false }: { lab?: boolean }) {
  const init = { w1: 1, w2: 0.8, b: -0.3, x1: 1.5, x2: -0.5, t: 0.5 };
  const [v, setV] = useState(init);
  const [shade, setShade] = useState(true);
  const set = (k: keyof typeof init) => (n: number) => setV((s) => ({ ...s, [k]: n }));
  const params = { w1: v.w1, w2: v.w2, b: v.b };
  const t = lab ? v.t : 0.5;
  const z = v.w1 * v.x1 + v.w2 * v.x2 + v.b, p = sigmoid(z), cls = p >= t ? 1 : 0;
  const counts = datasetCounts(params, t);
  const m = metrics(counts);
  return (
    <Panel title={lab ? "Lab · Build the classifier" : "Interactive · 2D Logistic Regression decision boundary"} className={lab ? "border-primary/50" : undefined}>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          {lab && <><p className="font-mono text-xs uppercase text-muted-foreground">New observation</p>
            <Slider label="Feature 1 · x₁" value={v.x1} min={-4} max={4} step={0.1} onChange={set("x1")} format={(n) => f(n, 1)} />
            <Slider label="Feature 2 · x₂" value={v.x2} min={-4} max={4} step={0.1} onChange={set("x2")} format={(n) => f(n, 1)} /></>}
          <p className="font-mono text-xs uppercase text-muted-foreground">Model parameters</p>
          <Slider label="Weight 1 · w₁" value={v.w1} min={-3} max={3} step={0.1} onChange={set("w1")} format={(n) => f(n, 1)} />
          <Slider label="Weight 2 · w₂" value={v.w2} min={-3} max={3} step={0.1} onChange={set("w2")} format={(n) => f(n, 1)} />
          <Slider label="Bias · b" value={v.b} min={-4} max={4} step={0.1} onChange={set("b")} format={(n) => f(n, 1)} />
          {lab && <Slider label="Threshold" value={v.t} min={0.05} max={0.95} step={0.01} onChange={set("t")} />}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setV(init)}><RotateCcw /> Reset</Button>
            <Button variant="outline" size="sm" aria-pressed={shade} onClick={() => setShade((s) => !s)}>{shade ? "Hide" : "Show"} probability shading</Button>
          </div>
        </div>
        <div>
          <FeaturePlot params={params} threshold={t} shade={shade} query={lab ? [v.x1, v.x2] : undefined} />
          <PlotLegend query={lab} />
        </div>
      </div>
      <div aria-live="polite" className="mt-4">
        {lab ? (
          <dl className="grid gap-2 sm:grid-cols-3">
            <Stat label="1 · Linear score z" value={f(z)} />
            <Stat label="2 · Probability σ(z)" value={f(p, 3)} tone="primary" />
            <Stat label={`3 · Class (p ${cls ? "≥" : "<"} ${f(t)})`} value={cls ? "● Class 1" : "■ Class 0"} tone={cls ? "pos" : "neg"} />
          </dl>
        ) : null}
        <p className="mt-3 font-mono text-sm">z = {f(v.w1, 1)}·x₁ {signed(v.w2)}·x₂ {signed(v.b)}{lab && <> = {f(v.w1, 1)}·{f(v.x1, 1)} {signed(v.w2)}·{f(v.x2, 1)} {signed(v.b)} = {f(z)}</>}</p>
        <p className="font-mono text-sm">p = σ(z){lab && <> = 1 / (1 + e^({f(-z)})) = {f(p, 3)}</>}</p>
        <p className="mt-2 text-sm">On the 20 training points: <strong>{counts.tp + counts.tn}</strong> correct, <strong>{counts.fp + counts.fn}</strong> misclassified · accuracy {percent(m.accuracy)} · mean log loss {f(meanLossOf(params), 3)}.</p>
        <p className="mt-1 text-xs text-muted-foreground">{lab ? "The boundary is where p equals the threshold (z = logit(threshold)); at 0.50 that is z = 0." : "The boundary is the line w₁x₁ + w₂x₂ + b = 0, where p = 0.5."} Changing b shifts the line; changing the weights rotates it and changes how quickly probability changes across it. Set both weights to 0 and there is no boundary at all.</p>
      </div>
    </Panel>
  );
}
const meanLossOf = (params: Params) => POINTS.reduce((s, p) => s + logLoss(p.y, prob(params, p.x1, p.x2)), 0) / POINTS.length;

/* ---------- 16. Log loss ---------- */
export function LogLossViz() {
  const [y, setY] = useState<0 | 1>(1);
  const [p, setP] = useState(0.8);
  const W = 600, H = 260, L = 46, R = 16, T = 14, B = 36, MAX = 5;
  const x = (v: number) => L + v * (W - L - R), sy = (v: number) => T + (1 - Math.min(v, MAX) / MAX) * (H - T - B);
  const curve = (cls: 0 | 1) => Array.from({ length: 99 }, (_, i) => 0.01 + i * 0.01).map((v, i) => `${i ? "L" : "M"}${x(v).toFixed(1)},${sy(logLoss(cls, v)).toFixed(1)}`).join(" ");
  const loss = logLoss(y, p);
  return (
    <Panel title="Interactive · Binary cross-entropy (log loss)">
      <div role="group" aria-label="Actual class" className="flex gap-2">
        {([1, 0] as const).map((c) => <Button key={c} size="sm" variant={y === c ? "default" : "outline"} aria-pressed={y === c} onClick={() => setY(c)}>Actual class y = {c}</Button>)}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 w-full" role="img" aria-label={`Log loss for actual class ${y}. At predicted probability ${f(p)}, loss is ${f(loss, 3)}.`}>
        {[0, 1, 2, 3, 4, 5].map((v) => <g key={v}><line x1={L} x2={W - R} y1={sy(v)} y2={sy(v)} className="stroke-border" /><text x={L - 6} y={sy(v) + 4} textAnchor="end" className="fill-muted-foreground font-mono text-[11px]">{v}</text></g>)}
        {[0, 0.25, 0.5, 0.75, 1].map((v) => <text key={v} x={x(v)} y={H - 18} textAnchor="middle" className="fill-muted-foreground font-mono text-[11px]">{v}</text>)}
        <path d={curve(y === 1 ? 0 : 1)} className="fill-none stroke-muted-foreground" strokeWidth={1.5} strokeDasharray="4 4" />
        <path d={curve(y)} className="fill-none stroke-primary" strokeWidth={3} />
        <line x1={x(p)} x2={x(p)} y1={sy(loss)} y2={H - B} className="stroke-muted-foreground" strokeDasharray="2 3" />
        <circle cx={x(p)} cy={sy(loss)} r={8} className="fill-primary stroke-background" strokeWidth={2} />
        <text x={(W + L) / 2} y={H - 2} textAnchor="middle" className="fill-muted-foreground text-[11px]">predicted probability p = P(y=1)</text>
      </svg>
      <p className="text-xs text-muted-foreground">Solid line: loss for the selected actual class. Dashed line: the other class, for comparison. Values above 5 are cut off — the curve keeps rising toward infinity.</p>
      <div className="mt-3"><Slider label="Predicted probability p" value={p} min={0.01} max={0.99} step={0.01} onChange={setP} /></div>
      <dl className="mt-3 grid grid-cols-3 gap-2" aria-live="polite">
        <Stat label="Formula used" value={y === 1 ? "−log(p)" : "−log(1−p)"} />
        <Stat label="Loss" value={f(loss, 3)} tone="primary" />
        <Stat label="Verdict" value={loss < 0.3 ? "Low" : loss < 1 ? "Moderate" : "High"} tone={loss < 0.3 ? "pos" : loss >= 1 ? "neg" : undefined} />
      </dl>
      <p className="mt-2 text-sm" aria-live="polite">{(y === 1 ? p : 1 - p) >= 0.5 ? `The model leans toward the correct class (y = ${y}); the more confident it is, the smaller the loss.` : `The model leans toward the wrong class. A confident wrong answer — like p = ${y === 1 ? "0.01" : "0.99"} — costs ${f(logLoss(y, y === 1 ? 0.01 : 0.99))}.`}</p>
    </Panel>
  );
}

/* ---------- 18/19. Gradient descent stepper ---------- */
export function GradientDescentViz() {
  const path = useMemo(() => gradientDescentPath(0.5, 60), []);
  const [step, setStep] = useState(0);
  const cur = path[step]!;
  const maxLoss = path[0]!.loss;
  const x = (i: number) => 30 + (i / 60) * 250, y = (l: number) => 10 + (1 - l / maxLoss) * 120;
  return (
    <Panel title="Interactive · Gradient descent on the 20-point dataset">
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <Slider label="Iteration" value={step} min={0} max={60} step={1} onChange={setStep} format={(n) => String(n)} />
          <div className="mt-2 flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setStep((s) => Math.min(60, s + 1))} disabled={step === 60}>Take one step</Button>
            <Button size="sm" variant="outline" onClick={() => setStep(0)}><RotateCcw /> Restart</Button>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-2" aria-live="polite">
            <Stat label="w₁" value={f(cur.w1)} /><Stat label="w₂" value={f(cur.w2)} />
            <Stat label="b" value={f(cur.b)} /><Stat label="Mean log loss J" value={f(cur.loss, 3)} tone="primary" />
          </dl>
          <svg viewBox="0 0 300 150" className="mt-4 w-full" role="img" aria-label={`Loss curve: loss falls from ${f(maxLoss, 3)} to ${f(path[60]!.loss, 3)} over 60 iterations. Current iteration ${step}.`}>
            <line x1={30} x2={280} y1={130} y2={130} className="stroke-border" /><line x1={30} x2={30} y1={10} y2={130} className="stroke-border" />
            <path d={path.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.loss).toFixed(1)}`).join(" ")} className="fill-none stroke-primary" strokeWidth={2} />
            <circle cx={x(step)} cy={y(cur.loss)} r={5} className="fill-primary" />
            <text x={155} y={146} textAnchor="middle" className="fill-muted-foreground text-[10px]">iteration</text>
            <text x={26} y={16} textAnchor="end" className="fill-muted-foreground font-mono text-[9px]">{f(maxLoss, 2)}</text>
          </svg>
        </div>
        <div>
          <FeaturePlot params={cur} shade label={`Feature space at iteration ${step}.`} />
          <PlotLegend />
        </div>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">Starting from w₁ = w₂ = b = 0 every point gets p = 0.5 (loss ≈ 0.693, no boundary). Each step moves the parameters against the gradient with learning rate η = 0.5. The loss falls quickly at first and then flattens. Plain gradient descent in your browser — real libraries use faster solvers.</p>
    </Panel>
  );
}

/* ---------- 24. Regularization (C) ---------- */
export function RegularizationViz() {
  const fits = useMemo(() => C_VALUES.map((C) => ({ C, params: fitL2(C) })), []);
  const [i, setI] = useState(2);
  const fit = fits[i]!;
  const maxW = Math.max(...fits.map((x) => Math.max(Math.abs(x.params.w1), Math.abs(x.params.w2))));
  const counts = datasetCounts(fit.params);
  return (
    <Panel title="Conceptual visualization · L2 regularization strength via C">
      <div role="group" aria-label="Choose C" className="flex flex-wrap gap-2">
        {fits.map((x, k) => <Button key={x.C} size="sm" variant={k === i ? "default" : "outline"} aria-pressed={k === i} onClick={() => setI(k)}>C = {x.C}</Button>)}
      </div>
      <div className="mt-4 grid gap-6 md:grid-cols-2">
        <div>
          <FeaturePlot params={fit.params} label={`Fitted boundary for C = ${fit.C}.`} />
          <PlotLegend />
        </div>
        <div aria-live="polite">
          <p className="text-sm"><strong>C = {fit.C}</strong> → {fit.C < 1 ? "stronger regularization → smaller, more constrained coefficients" : fit.C > 1 ? "weaker regularization → larger, less constrained coefficients" : "scikit-learn's default strength"}.</p>
          <div className="mt-3 space-y-2">
            {(["w1", "w2"] as const).map((k) => <div key={k}><div className="flex justify-between text-xs"><span>{k === "w1" ? "w₁" : "w₂"}</span><span className="font-mono">{f(fit.params[k], 3)}</span></div><div className="h-3 rounded bg-muted"><div className="h-3 rounded bg-primary" style={{ width: `${(Math.abs(fit.params[k]) / maxW) * 100}%` }} /></div></div>)}
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-2">
            <Stat label="‖w‖ (size)" value={f(Math.hypot(fit.params.w1, fit.params.w2))} />
            <Stat label="Training misclassified" value={counts.fp + counts.fn} />
          </dl>
          <p className="mt-3 text-sm text-muted-foreground">Watch the shading: with small C the probabilities change slowly (soft, cautious model); with large C they change sharply near the line (confident model). Training accuracy alone is not the goal — the question is which setting generalizes to new data, which you check on validation data.</p>
        </div>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Educational approximation: minimizes ½‖w‖² + C·Σ log loss (scikit-learn's L2 form, bias unpenalized) with simple gradient descent in your browser. Numbers are close to, but not guaranteed identical to, scikit-learn's solver output.</p>
    </Panel>
  );
}

/* ---------- 25. Churn example ---------- */
export function ChurnExample() {
  const init = { tenure: 8, charges: 80, tickets: 2, t: 0.5 };
  const [v, setV] = useState(init);
  const set = (k: keyof typeof init) => (n: number) => setV((s) => ({ ...s, [k]: n }));
  const z = churnScore(v.tenure, v.charges, v.tickets), p = sigmoid(z), churn = p >= v.t;
  return (
    <Panel title="Interactive · Will this customer churn?">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <Slider label="Tenure (months)" value={v.tenure} min={0} max={72} step={1} onChange={set("tenure")} format={(n) => String(n)} />
          <Slider label="Monthly charges ($)" value={v.charges} min={20} max={120} step={1} onChange={set("charges")} format={(n) => String(n)} />
          <Slider label="Support tickets" value={v.tickets} min={0} max={10} step={1} onChange={set("tickets")} format={(n) => String(n)} />
          <Slider label="Threshold" value={v.t} min={0.05} max={0.95} step={0.01} onChange={set("t")} />
          <Button variant="outline" size="sm" onClick={() => setV(init)}><RotateCcw /> Reset</Button>
        </div>
        <ol className="space-y-2 text-sm" aria-live="polite">
          <li className="rounded-md border p-2"><span className="font-mono text-xs text-muted-foreground">FEATURES</span><br />tenure {v.tenure}, charges {v.charges}, tickets {v.tickets}</li>
          <li className="rounded-md border p-2"><span className="font-mono text-xs text-muted-foreground">LINEAR SCORE</span><br /><span className="font-mono">z = {CHURN.tenure}·{v.tenure} + {CHURN.charges}·{v.charges} + {CHURN.tickets}·{v.tickets} {signed(CHURN.bias)} = {f(z)}</span></li>
          <li className="rounded-md border p-2"><span className="font-mono text-xs text-muted-foreground">SIGMOID → PROBABILITY</span><br /><span className="font-mono">P(churn) = σ({f(z)}) = {f(p)}</span></li>
          <li className="rounded-md border p-2"><span className="font-mono text-xs text-muted-foreground">THRESHOLD</span><br /><span className="font-mono">{f(p)} {churn ? "≥" : "<"} {f(v.t)}</span></li>
          <li className={cn("rounded-md border p-2 font-medium", churn ? "bg-positive/10" : "bg-negative/10")}><span className="font-mono text-xs text-muted-foreground">PREDICTION</span><br />{churn ? "● Churn (1)" : "■ Stays (0)"}</li>
        </ol>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Synthetic weights for teaching: longer tenure lowers the score; higher charges and more tickets raise it. Not fitted to real customers.</p>
    </Panel>
  );
}

/* ---------- 31. Evaluation of a fitted model ---------- */
export function FittedEvaluation() {
  const params = useMemo(() => fitL2(1), []);
  const [t, setT] = useState(0.5);
  const counts = datasetCounts(params, t);
  const auc = rocAuc(toObservations(params));
  return (
    <Panel title="Interactive · Fitted model (C = 1) → threshold → confusion matrix → metrics">
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <FeaturePlot params={params} threshold={t} />
          <PlotLegend />
        </div>
        <div>
          <p className="font-mono text-sm">z = {f(params.w1)}·x₁ {signed(params.w2)}·x₂ {signed(params.b)}</p>
          <div className="mt-3"><Slider label="Threshold" value={t} min={0.05} max={0.95} step={0.01} onChange={setT} /></div>
          <dl className="mt-3 grid grid-cols-2 gap-2"><Stat label="ROC-AUC (threshold-free)" value={f(auc ?? 0, 3)} tone="primary" /><Stat label="Positives predicted" value={counts.tp + counts.fp} /></dl>
          <p className="mt-2 text-xs text-muted-foreground">ROC-AUC uses the probabilities themselves, so moving the threshold does not change it. The matrix and the metrics below do change.</p>
        </div>
      </div>
      <ConfusionMatrix counts={counts} details={false} positiveLabel="class 1" />
      <MetricCards counts={counts} />
      <p className="mt-2 text-xs text-muted-foreground">Evaluated on the same 20 points used for fitting, to keep the example small. In practice, always evaluate on held-out test data.</p>
    </Panel>
  );
}
