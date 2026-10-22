import { useId, useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { countsAt, percent, rocAuc, type Observation } from "@/lib/evaluation";
import {
  accuracyOn, decision, fitSvm, fullMargin, IMBALANCED, IMBALANCED_VALID, kernelOf, kernelValue, linearScore, LINEAR, norm, OUTLIER, OVERLAP, OVERLAP_VALID,
  predictSvm, RINGS, RINGS_VALID, SEPARABLE, SEPARABLE_OUTLIER, standardize, supportVectors, TINY, trainErrors, violations, weights,
  type Kernel, type KernelName, type Label, type SPoint, type SvmModel,
} from "@/lib/svm";
import { Panel, Stat, Choice } from "./KnnViz";
import { Slider } from "./LogisticViz";
import { ConfusionMatrix, MetricCards } from "./EvaluationViz";

const f = (v: number, d = 2) => (Number.isFinite(v) ? v.toFixed(d) : "—");
const cls = (y: Label) => (y === 1 ? "▲ Class +1" : "● Class −1");
const C_CHOICES = [0.01, 0.1, 1, 10, 100] as const;
const G_CHOICES = [0.01, 0.1, 1, 10] as const;
const KNAME: Record<KernelName, string> = { linear: "Linear", poly: "Polynomial", rbf: "RBF" };

/* ---------- SVG plot over [lo,hi]² ---------- */
const S = 340, P = 26, IN = S - 2 * P;
type Line = { w: readonly number[]; b: number };
type PlotProps = {
  points: SPoint[]; label: string; model?: SvmModel | undefined; line?: Line | undefined; sv?: ReadonlySet<string> | undefined;
  highlight?: string | undefined; onPoint?: ((id: string) => void) | undefined; range?: [number, number]; margins?: boolean; faded?: ReadonlySet<string> | undefined;
  region?: ((x: number, y: number) => number) | undefined; yScale?: number;
};
export function SvmPlot({ points, label, model, line, sv, highlight, onPoint, range = [0, 10], margins = true, faded, region, yScale = 1 }: PlotProps) {
  const [lo, hi] = range, span = hi - lo;
  const sx = (v: number) => P + ((v - lo) / span) * IN, sy = (v: number) => P + (1 - (v - lo) / span) * IN;
  const clip = useId().replace(/:/g, "");
  const N = 40, cell = span / N;
  const score = useMemo(() => (region ? region : model ? (x: number, y: number) => decision(model, [x, y]) : line ? (x: number, y: number) => linearScore(line.w, line.b, [x, y]) : null), [model, line, region]);
  const cells = useMemo(() => (score ? Array.from({ length: N * N }, (_, i) => { const cx = lo + ((i % N) + 0.5) * cell, cy = lo + (Math.floor(i / N) + 0.5) * cell; return { cx, cy, s: score(cx, cy) }; }) : []), [score, lo, cell]);
  // straight lines for linear boundaries: w0 x + w1 y + b = c
  const seg = (c: number) => {
    if (!line) return null;
    const [w0, w1] = [line.w[0]!, line.w[1]!];
    if (Math.abs(w0) < 1e-9 && Math.abs(w1) < 1e-9) return null;
    if (Math.abs(w1) > Math.abs(w0)) { const y = (x: number) => (c - line.b - w0 * x) / w1; return [sx(lo), sy(y(lo)), sx(hi), sy(y(hi))] as const; }
    const x = (y: number) => (c - line.b - w1 * y) / w0; return [sx(x(lo)), sy(lo), sx(x(hi)), sy(hi)] as const;
  };
  const ticks = [lo, lo + span / 2, hi];
  return (
    <svg viewBox={`0 0 ${S} ${S}`} className="w-full max-w-[420px] rounded-md border bg-card" role="img" aria-label={label}>
      <defs><clipPath id={clip}><rect x={P} y={P} width={IN} height={IN} /></clipPath></defs>
      <g clipPath={`url(#${clip})`}>
        {cells.map((c, i) => (
          <rect key={i} x={sx(c.cx - cell / 2)} y={sy(c.cy + cell / 2)} width={IN / N + 0.5} height={IN / N + 0.5}
            className={c.s >= 0 ? "fill-secondary-accent" : "fill-primary"} opacity={margins && !region && Math.abs(c.s) < 1 ? 0.07 : 0.17} />
        ))}
        {!line && !region && margins && cells.filter((c) => Math.abs(Math.abs(c.s) - 1) < 0.06).map((c, i) => <circle key={`m${i}`} cx={sx(c.cx)} cy={sy(c.cy)} r={0.9} className="fill-muted-foreground" />)}
        {!line && cells.filter((c) => Math.abs(c.s) < 0.07).map((c, i) => <circle key={`b${i}`} cx={sx(c.cx)} cy={sy(c.cy)} r={1.4} className="fill-foreground" />)}
        {line && margins && [-1, 1].map((c) => { const s = seg(c); return s && <line key={c} x1={s[0]} y1={s[1]} x2={s[2]} y2={s[3]} className="stroke-muted-foreground" strokeWidth={1.3} strokeDasharray="5 4" />; })}
        {line && (() => { const s = seg(0); return s && <line x1={s[0]} y1={s[1]} x2={s[2]} y2={s[3]} className="stroke-foreground" strokeWidth={2} />; })()}
      </g>
      <rect x={P} y={P} width={IN} height={IN} fill="none" className="stroke-border" />
      {ticks.map((t) => <g key={t}><text x={sx(t)} y={S - 8} textAnchor="middle" className="fill-muted-foreground text-[9px]">{+t.toFixed(1)}</text><text x={yScale > 1 ? 2 : 8} y={sy(t) + 3} className="fill-muted-foreground text-[9px]">{+(t * yScale).toFixed(1)}</text></g>)}
      {points.map((p) => {
        const x = sx(p.x[0]), y = sy(p.x[1]), r = 5.5, o = faded?.has(p.id) ? 0.3 : 1;
        const mark = p.y === 1
          ? <path d={`M${x},${y - r * 1.2} L${x + r * 1.1},${y + r * 0.8} L${x - r * 1.1},${y + r * 0.8} Z`} className="fill-secondary-accent stroke-background" strokeWidth={1.2} opacity={o} />
          : <circle cx={x} cy={y} r={r} className="fill-primary stroke-background" strokeWidth={1.2} opacity={o} />;
        return (
          <g key={p.id} onClick={onPoint ? () => onPoint(p.id) : undefined} className={onPoint ? "cursor-pointer" : undefined}>
            {mark}
            {sv?.has(p.id) && <circle cx={x} cy={y} r={9.5} fill="none" className="stroke-foreground" strokeWidth={1.6} />}
            {highlight === p.id && <circle cx={x} cy={y} r={12.5} fill="none" className="stroke-destructive" strokeWidth={1.6} strokeDasharray="3 2" />}
          </g>
        );
      })}
    </svg>
  );
}
export function SvmLegend({ kernel = false }: { kernel?: boolean }) {
  return (
    <p className="mt-1 text-xs text-muted-foreground">
      ● Class −1 · ▲ Class +1 · ringed = support vector · {kernel ? "black dots = decision boundary f(x)=0, grey dots = margin f(x)=±1, pale band = inside the margin" : "solid line = decision boundary, dashed = margin boundaries (score ±1)"}. Shaded side = predicted class.
    </p>
  );
}
const svSet = (m: SvmModel) => new Set(supportVectors(m).map((p) => p.id));
const lineOf = (m: SvmModel): Line => ({ w: weights(m), b: m.b });

/* ---------- 1. Hyperplane explorer ---------- */
export function HyperplaneExplorer() {
  const init = { w1: 1, w2: 1, b: -9 };
  const [s, set] = useState(init);
  const w = [s.w1, s.w2], line = { w, b: s.b };
  const rows = TINY.map((p) => { const z = linearScore(w, s.b, p.x); return { p, z, pred: (z >= 0 ? 1 : -1) as Label, dist: norm(w) ? (p.y * z) / norm(w) : NaN }; });
  const correct = rows.filter((r) => r.pred === r.p.y).length;
  const geo = Math.min(...rows.map((r) => r.dist));
  const best = () => { const m = lineOf(fitSvm(TINY, 1000)); set({ w1: +m.w[0]!.toFixed(2), w2: +m.w[1]!.toFixed(2), b: +m.b.toFixed(2) }); };
  return (
    <Panel title="Interactive hyperplane explorer · f(x) = w₁x₁ + w₂x₂ + b">
      <div className="grid gap-5 md:grid-cols-2">
        <div><SvmPlot points={TINY} line={line} label={`Line ${f(s.w1)}·x1 + ${f(s.w2)}·x2 + ${f(s.b)} = 0. ${correct} of 6 points classified correctly.`} /><SvmLegend /></div>
        <div className="space-y-3">
          <Slider label="w₁ (weight of Feature 1)" value={s.w1} min={-2} max={2} step={0.05} onChange={(v) => set({ ...s, w1: v })} />
          <Slider label="w₂ (weight of Feature 2)" value={s.w2} min={-2} max={2} step={0.05} onChange={(v) => set({ ...s, w2: v })} />
          <Slider label="b (bias)" value={s.b} min={-15} max={15} step={0.1} onChange={(v) => set({ ...s, b: v })} />
          <dl className="grid grid-cols-3 gap-2" aria-live="polite">
            <Stat label="Correct" value={`${correct}/6`} tone="primary" /><Stat label="‖w‖" value={f(norm(w))} /><Stat label="Min. signed distance" value={f(geo)} />
          </dl>
          <p className="text-sm" aria-live="polite">{correct < 6 ? "Some points are on the wrong side — the signed distance of at least one point is negative." : geo > 0 ? `All points are correctly separated. The closest point is ${f(geo)} units from the line — that is this line's geometric margin.` : ""}</p>
          <div className="flex flex-wrap gap-2"><Button size="sm" onClick={best}>Show the maximum-margin line</Button><Button size="sm" variant="outline" onClick={() => set(init)}><RotateCcw className="mr-1 h-3.5 w-3.5" />Reset</Button></div>
        </div>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm"><caption className="sr-only">Score for each point</caption>
          <thead><tr className="border-b text-left"><th className="p-1.5">Point</th><th className="p-1.5">(x₁, x₂)</th><th className="p-1.5">Actual</th><th className="p-1.5">f(x)</th><th className="p-1.5">Predicted</th><th className="p-1.5">y·f(x)/‖w‖</th></tr></thead>
          <tbody>{rows.map((r) => <tr key={r.p.id} className="border-b"><td className="p-1.5 font-mono">{r.p.id}</td><td className="p-1.5 font-mono">({r.p.x.join(", ")})</td><td className="p-1.5">{cls(r.p.y)}</td><td className="p-1.5 font-mono">{f(r.z)}</td><td className="p-1.5">{cls(r.pred)}{r.pred !== r.p.y && " ✗"}</td><td className="p-1.5 font-mono">{f(r.dist)}</td></tr>)}</tbody>
        </table>
      </div>
    </Panel>
  );
}

/* ---------- 2. Margin visualization (direction sweep) ---------- */
function marginForAngle(deg: number, data: SPoint[]) {
  const u = [Math.cos((deg * Math.PI) / 180), Math.sin((deg * Math.PI) / 180)];
  const proj = (p: SPoint) => u[0]! * p.x[0] + u[1]! * p.x[1];
  const lowPos = Math.min(...data.filter((p) => p.y === 1).map(proj)), highNeg = Math.max(...data.filter((p) => p.y === -1).map(proj));
  const gap = lowPos - highNeg, mid = (lowPos + highNeg) / 2;
  // scale so that the closest points have score ±1 → ‖w‖ = 2/gap
  const k = gap > 0 ? 2 / gap : 1;
  return { gap, line: { w: [u[0]! * k, u[1]! * k], b: -mid * k }, touching: data.filter((p) => Math.abs(proj(p) - (p.y === 1 ? lowPos : highNeg)) < 1e-6).map((p) => p.id) };
}
export function MarginViz({ data = SEPARABLE }: { data?: SPoint[] }) {
  const opt = useMemo(() => fitSvm(data, 1000), [data]);
  const ow = weights(opt);
  const optDeg = Math.round((Math.atan2(ow[1], ow[0]) * 180) / Math.PI);
  const [deg, setDeg] = useState(optDeg - 30);
  const m = marginForAngle(deg, data);
  const separable = m.gap > 0;
  return (
    <Panel title="Interactive margin visualization · rotate the boundary, watch the margin">
      <div className="grid gap-5 md:grid-cols-2">
        <div><SvmPlot points={data} line={separable ? m.line : undefined} sv={new Set(m.touching)} label={separable ? `Boundary direction ${deg} degrees; full margin width ${f(m.gap)}.` : `At ${deg} degrees no straight line in this direction separates the classes.`} /><SvmLegend /></div>
        <div className="space-y-3">
          <Slider label="Direction of w (degrees)" value={deg} min={-90} max={180} step={1} onChange={setDeg} format={(v) => `${v}°`} />
          <dl className="grid grid-cols-2 gap-2" aria-live="polite">
            <Stat label="Full margin 2/‖w‖" value={separable ? f(m.gap) : "no gap"} tone="primary" />
            <Stat label="Half margin 1/‖w‖" value={separable ? f(m.gap / 2) : "—"} />
            <Stat label="Maximum possible (full)" value={f(fullMargin(ow))} />
            <Stat label="Points on margin" value={separable ? m.touching.join(", ") : "—"} />
          </dl>
          <p className="text-sm" aria-live="polite">{!separable ? "In this direction the classes overlap, so no separating line exists." : Math.abs(m.gap - fullMargin(ow)) < 0.02 ? "This is the maximum-margin direction found by the SVM solver." : `This line separates the data, but its margin is ${f(fullMargin(ow) - m.gap)} narrower than the best possible one.`}</p>
          <Button size="sm" variant="outline" onClick={() => setDeg(optDeg)}>Jump to the SVM solution ({optDeg}°)</Button>
        </div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">For each direction, the boundary is placed midway between the closest points of the two classes and rescaled so those points score exactly ±1. The ringed points touch the margin boundaries.</p>
    </Panel>
  );
}

/* ---------- 3. Support vectors: remove points ---------- */
export function SupportVectorDemo() {
  const [removed, setRemoved] = useState<string[]>([]);
  const data = TINY.filter((p) => !removed.includes(p.id));
  const hasBoth = data.some((p) => p.y === 1) && data.some((p) => p.y === -1);
  const base = useMemo(() => fitSvm(TINY, 1000), []);
  const m = useMemo(() => (hasBoth ? fitSvm(data, 1000) : null), [removed.join(), hasBoth]); // eslint-disable-line react-hooks/exhaustive-deps
  const bl = lineOf(base), ml = m ? lineOf(m) : null;
  const same = ml && Math.abs(ml.w[0]! - bl.w[0]!) < 1e-3 && Math.abs(ml.w[1]! - bl.w[1]!) < 1e-3 && Math.abs(ml.b - bl.b) < 1e-3;
  return (
    <Panel title="Support vectors · click a point to remove it and re-fit">
      <div className="grid gap-5 md:grid-cols-2">
        <div><SvmPlot points={data} line={ml ?? undefined} sv={m ? svSet(m) : undefined} onPoint={(id) => setRemoved((r) => [...r, id])} label={`${data.length} points. Support vectors: ${m ? supportVectors(m).map((p) => p.id).join(", ") : "none"}.`} /><SvmLegend /></div>
        <div className="space-y-3">
          <div role="group" aria-label="Remove a point" className="flex flex-wrap gap-1.5">{data.map((p) => <Button key={p.id} size="sm" variant="outline" onClick={() => setRemoved((r) => [...r, p.id])}>Remove {p.id}{m && svSet(m).has(p.id) ? " (SV)" : ""}</Button>)}</div>
          <dl className="grid grid-cols-2 gap-2" aria-live="polite">
            <Stat label="Support vectors" value={m ? supportVectors(m).map((p) => p.id).join(", ") : "—"} tone="primary" />
            <Stat label="Full margin" value={ml ? f(fullMargin(ml.w)) : "—"} />
          </dl>
          <p className="text-sm" aria-live="polite">{!m ? "Both classes are needed to fit a classifier." : removed.length === 0 ? "Remove a non-ringed point first — the boundary will not move." : same ? "The boundary is unchanged: the removed points were not support vectors." : "The boundary moved: a support vector was removed, so the constraints changed."}</p>
          <Button size="sm" variant="outline" onClick={() => setRemoved([])}><RotateCcw className="mr-1 h-3.5 w-3.5" />Restore all points</Button>
        </div>
      </div>
    </Panel>
  );
}

/* ---------- 4. Hard vs soft ---------- */
export function HardSoftDemo() {
  const [noisy, setNoisy] = useState(true);
  const [softC, setSoftC] = useState<number>(0.1);
  const data = noisy ? SEPARABLE_OUTLIER : SEPARABLE;
  const hard = useMemo(() => fitSvm(data, 1000), [data]);
  const soft = useMemo(() => fitSvm(data, softC), [data, softC]);
  const card = (title: string, m: SvmModel) => (
    <div>
      <p className="mb-1 text-sm font-semibold">{title}</p>
      <SvmPlot points={data} line={lineOf(m)} sv={svSet(m)} highlight={noisy ? "noisy" : undefined} label={`${title}: full margin ${f(fullMargin(weights(m)))}, ${trainErrors(m)} training errors, ${violations(m).length} margin violations.`} />
      <dl className="mt-2 grid grid-cols-3 gap-2"><Stat label="Full margin" value={f(fullMargin(weights(m)))} /><Stat label="Train errors" value={trainErrors(m)} /><Stat label="Violations" value={violations(m).length} /></dl>
    </div>
  );
  return (
    <Panel title="Hard margin vs soft margin">
      <div className="mb-4 flex flex-wrap items-end gap-4">
        <Button size="sm" variant="outline" aria-pressed={noisy} onClick={() => setNoisy(!noisy)}>{noisy ? "Remove" : "Add"} the noisy ● point</Button>
        <Choice label="Soft-margin C" value={softC} options={[0.01, 0.1, 1] as const} onChange={setSoftC} format={(v) => `C = ${v}`} />
      </div>
      <div className="grid gap-5 md:grid-cols-2">{card("Hard-like margin (C = 1000)", hard)}{card(`Soft margin (C = ${softC})`, soft)}</div>
      <SvmLegend />
      <p className="mt-2 text-sm" aria-live="polite">{noisy ? "The noisy point (dashed red ring) sits inside the ▲ cluster. The hard-like model bends to classify it, shrinking the margin; the soft margin accepts a violation and keeps a wider, more plausible boundary." : "Without the noisy point the data is separable, and both models give similar boundaries."}</p>
      <p className="mt-1 text-xs text-muted-foreground">A true hard margin is infeasible whenever data are not separable; a very large C (1000) is used as an approximation.</p>
    </Panel>
  );
}

/* ---------- 5. C explorer ---------- */
export function CExplorer({ kernel = LINEAR }: { kernel?: Kernel }) {
  const [C, setC] = useState<number>(1);
  const [outlier, setOutlier] = useState(true);
  const data = outlier ? [...OVERLAP, OUTLIER] : OVERLAP;
  const m = useMemo(() => fitSvm(data, C, kernel), [data, C, kernel]);
  const lin = kernel.name === "linear";
  return (
    <Panel title={`Interactive C explorer · ${KNAME[kernel.name]} kernel`}>
      <div className="grid gap-5 md:grid-cols-2">
        <div><SvmPlot points={data} model={lin ? undefined : m} line={lin ? lineOf(m) : undefined} sv={svSet(m)} highlight={outlier ? "outlier" : undefined} label={`C ${C}: ${supportVectors(m).length} support vectors, ${violations(m).length} margin violations.`} /><SvmLegend kernel={!lin} /></div>
        <div className="space-y-3">
          <Choice label="C (penalty for margin violations)" value={C} options={[0.01, 0.03, 0.1, 0.3, 1, 10] as const} onChange={setC} format={(v) => `C = ${v}`} />
          <Button size="sm" variant="outline" aria-pressed={outlier} onClick={() => setOutlier(!outlier)}>{outlier ? "Remove" : "Add"} outlier</Button>
          <dl className="grid grid-cols-2 gap-2" aria-live="polite">
            {lin && <Stat label="Full margin 2/‖w‖" value={f(fullMargin(weights(m)))} tone="primary" />}
            <Stat label="Support vectors" value={supportVectors(m).length} />
            <Stat label="Margin violations" value={violations(m).length} />
            <Stat label="Training accuracy" value={percent(accuracyOn(m, data))} />
            <Stat label="Validation accuracy" value={percent(accuracyOn(m, OVERLAP_VALID))} />
          </dl>
          <p className="text-sm" aria-live="polite">{C <= 0.1 ? "Small C: violations are cheap, so the margin is wide and many points become support vectors. Risk: underfitting." : C >= 1 ? "Large C: violations are expensive, so the model tries harder to fit training points. Risk: overfitting to noise. On this dataset the solution stops changing above C ≈ 1, because no further violations can be removed by a straight line." : "Moderate C: a balance between margin width and training violations."}</p>
        </div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Each choice re-fits a real soft-margin SVM in your browser (simplified SMO solver). Values may differ slightly from scikit-learn.</p>
    </Panel>
  );
}

/* ---------- 6. Linear vs nonlinear ---------- */
export function LinearVsNonlinear() {
  const lin = useMemo(() => fitSvm(RINGS, 1), []);
  const rbf = useMemo(() => fitSvm(RINGS, 1, kernelOf("rbf", 0.5)), []);
  return (
    <Panel title="Ring-shaped data · linear vs RBF kernel">
      <div className="grid gap-5 md:grid-cols-2">
        <div><p className="mb-1 text-sm font-semibold">Linear SVM — training accuracy {percent(accuracyOn(lin, RINGS))}</p><SvmPlot points={RINGS} line={lineOf(lin)} margins={false} label="Linear SVM on ring data: a straight line cannot separate inner and outer classes." /></div>
        <div><p className="mb-1 text-sm font-semibold">RBF SVM (γ = 0.5) — training accuracy {percent(accuracyOn(rbf, RINGS))}</p><SvmPlot points={RINGS} model={rbf} sv={svSet(rbf)} label="RBF SVM on ring data: a closed curved boundary surrounds the inner class." /></div>
      </div>
      <SvmLegend kernel />
    </Panel>
  );
}

/* ---------- 7. Kernel calculator ---------- */
export function KernelCalculator() {
  const [a, setA] = useState<[number, number]>([1, 2]);
  const [b, setB] = useState<[number, number]>([2, 3]);
  const [gamma, setGamma] = useState(0.5);
  const [degree, setDegree] = useState(2);
  const dot = a[0] * b[0] + a[1] * b[1], d2 = (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
  return (
    <Panel title="Kernel calculator · similarity of two points">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-3">
          <Slider label="x · Feature 1" value={a[0]} min={-3} max={5} step={0.5} onChange={(v) => setA([v, a[1]])} format={(v) => f(v, 1)} />
          <Slider label="x · Feature 2" value={a[1]} min={-3} max={5} step={0.5} onChange={(v) => setA([a[0], v])} format={(v) => f(v, 1)} />
          <Slider label="z · Feature 1" value={b[0]} min={-3} max={5} step={0.5} onChange={(v) => setB([v, b[1]])} format={(v) => f(v, 1)} />
          <Slider label="z · Feature 2" value={b[1]} min={-3} max={5} step={0.5} onChange={(v) => setB([b[0], v])} format={(v) => f(v, 1)} />
          <Slider label="γ (gamma)" value={gamma} min={0.05} max={3} step={0.05} onChange={setGamma} />
          <Choice label="Polynomial degree d (coef0 r = 1)" value={degree} options={[2, 3, 4] as const} onChange={setDegree} />
        </div>
        <div className="space-y-2 text-sm" aria-live="polite">
          <p className="font-mono">x = ({a.join(", ")}), z = ({b.join(", ")})</p>
          <div className="rounded-md border p-3"><p className="font-semibold">Linear</p><p className="font-mono">xᵀz = {a[0]}·{b[0]} + {a[1]}·{b[1]} = {f(dot)}</p></div>
          <div className="rounded-md border p-3"><p className="font-semibold">Polynomial</p><p className="font-mono">(γ·xᵀz + 1)^{degree} = ({f(gamma)}·{f(dot)} + 1)^{degree} = {f(kernelValue(kernelOf("poly", gamma, degree, 1), a, b), 3)}</p></div>
          <div className="rounded-md border p-3"><p className="font-semibold">RBF</p><p className="font-mono">‖x − z‖² = {f(d2)}</p><p className="font-mono">exp(−γ·‖x − z‖²) = exp(−{f(gamma)}·{f(d2)}) = {f(kernelValue(kernelOf("rbf", gamma), a, b), 4)}</p></div>
          <p className="text-muted-foreground">RBF similarity is 1 for identical points and approaches 0 as points move apart. Larger γ makes it fall off faster.</p>
        </div>
      </div>
    </Panel>
  );
}

/* ---------- 8. Kernel lab / comparison ---------- */
type DataName = "rings" | "overlap";
const DATA: Record<DataName, { train: SPoint[]; valid: SPoint[]; label: string }> = {
  rings: { train: RINGS, valid: RINGS_VALID, label: "Rings (nonlinear)" },
  overlap: { train: OVERLAP, valid: OVERLAP_VALID, label: "Overlapping blobs (roughly linear)" },
};
export function KernelComparison() {
  const [ds, setDs] = useState<DataName>("rings");
  const [C, setC] = useState<number>(1);
  const { train, valid } = DATA[ds];
  const models = useMemo(() => (["linear", "poly", "rbf"] as const).map((k) => ({ k, m: fitSvm(train, C, k === "linear" ? LINEAR : k === "poly" ? kernelOf("poly", 0.1, 2, 1) : kernelOf("rbf", 0.5)) })), [train, C]);
  return (
    <Panel title="Interactive kernel comparison · same data, three kernels">
      <div className="mb-4 flex flex-wrap gap-4">
        <Choice label="Dataset" value={ds} options={["rings", "overlap"] as const} onChange={setDs} format={(d) => DATA[d].label} />
        <Choice label="C" value={C} options={[0.1, 1, 10] as const} onChange={setC} format={(v) => `C = ${v}`} />
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        {models.map(({ k, m }) => (
          <div key={k}>
            <p className="mb-1 text-sm font-semibold">{KNAME[k]}{k === "poly" ? " (d = 2, γ = 0.1, r = 1)" : k === "rbf" ? " (γ = 0.5)" : ""}</p>
            <SvmPlot points={train} model={k === "linear" ? undefined : m} line={k === "linear" ? lineOf(m) : undefined} sv={svSet(m)} label={`${KNAME[k]} kernel: training accuracy ${percent(accuracyOn(m, train))}, validation ${percent(accuracyOn(m, valid))}.`} />
            <dl className="mt-2 grid grid-cols-3 gap-2" aria-live="polite"><Stat label="Train" value={percent(accuracyOn(m, train))} /><Stat label="Validation" value={percent(accuracyOn(m, valid))} /><Stat label="SVs" value={supportVectors(m).length} /></dl>
          </div>
        ))}
      </div>
      <SvmLegend kernel />
      <p className="mt-2 text-sm">No kernel is always best. On the rings, curved kernels succeed where the linear one cannot; on roughly linear blobs, the simpler linear kernel performs about as well. Judge on validation data.</p>
    </Panel>
  );
}

/* ---------- 9. gamma explorer ---------- */
export function GammaExplorer() {
  const [g, setG] = useState<number>(0.1);
  const [C, setC] = useState<number>(1);
  const m = useMemo(() => fitSvm(RINGS, C, kernelOf("rbf", g)), [g, C]);
  return (
    <Panel title="Interactive gamma explorer · RBF kernel">
      <div className="grid gap-5 md:grid-cols-2">
        <div><SvmPlot points={RINGS} model={m} sv={svSet(m)} label={`RBF gamma ${g}, C ${C}: ${supportVectors(m).length} support vectors, validation accuracy ${percent(accuracyOn(m, RINGS_VALID))}.`} /><SvmLegend kernel /></div>
        <div className="space-y-3">
          <Choice label="γ (gamma)" value={g} options={G_CHOICES} onChange={setG} format={(v) => `γ = ${v}`} />
          <Choice label="C" value={C} options={[0.1, 1, 10] as const} onChange={setC} format={(v) => `C = ${v}`} />
          <dl className="grid grid-cols-3 gap-2" aria-live="polite">
            <Stat label="Train acc." value={percent(accuracyOn(m, RINGS))} /><Stat label="Validation acc." value={percent(accuracyOn(m, RINGS_VALID))} tone="primary" /><Stat label="SVs" value={supportVectors(m).length} />
          </dl>
          <p className="text-sm" aria-live="polite">{g <= 0.01 ? "Very small γ: each point's influence reaches far, so the boundary is very smooth. With a small C it can be too smooth to wrap the inner ring (underfitting); a larger C lets it bend more." : g >= 10 ? "Large γ: influence is very local, so the boundary forms small islands around training points. Training accuracy stays high, but validation accuracy drops (overfitting)." : "Moderate γ: the boundary is flexible enough to follow the ring without chasing individual points."}</p>
          <p className="text-xs text-muted-foreground">γ acts on squared distances, so its sensible range depends on feature scale.</p>
        </div>
      </div>
    </Panel>
  );
}

/* ---------- 10. C × gamma grid ---------- */
export function CGammaGrid({ title = "Interactive C vs gamma explorer · validation accuracy" }: { title?: string }) {
  const Cs = [0.1, 1, 10, 100], Gs = G_CHOICES;
  const grid = useMemo(() => Cs.map((C) => Gs.map((g) => { const m = fitSvm(RINGS, C, kernelOf("rbf", g)); return { C, g, m, tr: accuracyOn(m, RINGS), va: accuracyOn(m, RINGS_VALID) }; })), []); // eslint-disable-line react-hooks/exhaustive-deps
  const flat = grid.flat();
  const best = flat.reduce((a, b) => (b.va > a.va ? b : a));
  const [sel, setSel] = useState(best);
  return (
    <Panel title={title}>
      <div className="grid gap-5 md:grid-cols-2">
        <div className="overflow-x-auto">
          <table className="w-full text-center text-sm"><caption className="mb-2 text-left text-xs text-muted-foreground">Rows: C. Columns: γ. Cell: validation accuracy (training accuracy). Select a cell to plot it.</caption>
            <thead><tr><th className="p-1.5">C \ γ</th>{Gs.map((g) => <th key={g} scope="col" className="p-1.5 font-mono">{g}</th>)}</tr></thead>
            <tbody>{grid.map((row, i) => <tr key={i}><th scope="row" className="p-1.5 font-mono">{Cs[i]}</th>{row.map((c) => (
              <td key={c.g} className="p-0.5"><button type="button" aria-pressed={sel === c} onClick={() => setSel(c)} className={cn("w-full rounded border px-1 py-1.5 font-mono text-xs focus-visible:outline-2 focus-visible:outline-ring", sel === c && "border-primary bg-primary/10", c === best && "font-bold")}>{percent(c.va)}<br /><span className="text-muted-foreground">({percent(c.tr)})</span>{c === best && " ★"}</button></td>
            ))}</tr>)}</tbody>
          </table>
        </div>
        <div><SvmPlot points={RINGS} model={sel.m} sv={svSet(sel.m)} label={`C ${sel.C}, gamma ${sel.g}: validation accuracy ${percent(sel.va)}.`} /><p className="mt-1 text-sm" aria-live="polite">C = {sel.C}, γ = {sel.g}: training {percent(sel.tr)}, validation {percent(sel.va)}, {supportVectors(sel.m).length} support vectors.</p></div>
      </div>
      <p className="mt-2 text-sm">★ marks the best validation score on this small dataset. C and γ interact: a large γ with a large C is the most flexible combination; small values of both give the smoothest boundaries. Ties and small differences on 40 validation points are not meaningful.</p>
    </Panel>
  );
}

/* ---------- 11. Feature scaling ---------- */
export function SvmScalingViz() {
  const [mode, setMode] = useState<"none" | "standard">("none");
  const scaled = mode === "standard";
  const res = useMemo(() => {
    const raw = OVERLAP.map((p) => ({ ...p, x: [p.x[0], p.x[1] * 1000] as [number, number] }));
    const rawV = OVERLAP_VALID.map((p) => ({ ...p, x: [p.x[0], p.x[1] * 1000] as [number, number] }));
    const sc = standardize(raw);
    const train = scaled ? sc.apply(raw) : raw, valid = scaled ? sc.apply(rawV) : rawV;
    const m = fitSvm(train, 1, kernelOf("rbf", 0.5));
    const region = (x: number, y: number) => { const pt: [number, number] = [x, y * 1000]; return decision(m, scaled ? sc.t(pt) : pt); };
    return { region, va: accuracyOn(m, valid), tr: accuracyOn(m, train), sv: supportVectors(m).length };
  }, [scaled]);
  return (
    <Panel title="Feature scaling · RBF SVM (γ = 0.5) with Feature 2 recorded in units 1000× larger">
      <div className="grid gap-5 md:grid-cols-2">
        <div><SvmPlot points={OVERLAP} region={res.region} yScale={1000} label={`${scaled ? "Standardized" : "Unscaled"} features: validation accuracy ${percent(res.va)}.`} /><p className="mt-1 text-xs text-muted-foreground">Feature 2 axis shown in raw units (0–10 000). ● Class −1 · ▲ Class +1.</p></div>
        <div className="space-y-3">
          <Choice label="Preprocessing" value={mode} options={["none", "standard"] as const} onChange={setMode} format={(v) => (v === "standard" ? "StandardScaler" : "No scaling")} />
          <dl className="grid grid-cols-3 gap-2" aria-live="polite"><Stat label="Train acc." value={percent(res.tr)} /><Stat label="Validation acc." value={percent(res.va)} tone="primary" /><Stat label="SVs" value={res.sv} /></dl>
          <p className="text-sm" aria-live="polite">{scaled ? "After standardization both features contribute to distances, and the boundary uses both." : "Unscaled, Feature 2 differences are in the thousands, so ‖x − z‖² is huge and exp(−γ‖x − z‖²) ≈ 0 for almost every pair: every point looks unrelated to every other, the model memorizes training points and generalizes poorly."}</p>
        </div>
      </div>
    </Panel>
  );
}

/* ---------- 12. Decision scores ---------- */
export function DecisionScoreTable() {
  const m = useMemo(() => fitSvm(TINY, 1000), []);
  const w = weights(m);
  const extra: SPoint[] = [{ id: "Q1", x: [5, 5], y: 1 }, { id: "Q2", x: [4, 4], y: -1 }, { id: "Q3", x: [9, 9], y: 1 }];
  return (
    <Panel title="Decision scores from the fitted linear SVM (TINY dataset)">
      <p className="mb-2 font-mono text-sm">f(x) = {f(w[0])}·x₁ + {f(w[1])}·x₂ {m.b < 0 ? "−" : "+"} {f(Math.abs(m.b))} · ‖w‖ = {f(norm(w))}</p>
      <div className="overflow-x-auto"><table className="w-full text-sm"><caption className="sr-only">Decision scores</caption>
        <thead><tr className="border-b text-left"><th className="p-1.5">Point</th><th className="p-1.5">x</th><th className="p-1.5">decision_function f(x)</th><th className="p-1.5">Predicted</th><th className="p-1.5">Distance to boundary |f|/‖w‖</th><th className="p-1.5">Position</th></tr></thead>
        <tbody>{[...TINY, ...extra].map((p) => { const z = decision(m, p.x); return <tr key={p.id} className="border-b"><td className="p-1.5 font-mono">{p.id}</td><td className="p-1.5 font-mono">({p.x.join(", ")})</td><td className="p-1.5 font-mono">{f(z)}</td><td className="p-1.5">{cls(predictSvm(m, p.x))}</td><td className="p-1.5 font-mono">{f(Math.abs(z) / norm(w))}</td><td className="p-1.5 text-xs">{Math.abs(z) < 1 - 1e-6 ? "inside the margin" : Math.abs(Math.abs(z) - 1) < 1e-3 ? "on a margin boundary" : "beyond the margin"}</td></tr>; })}</tbody>
      </table></div>
      <p className="mt-2 text-xs text-muted-foreground">Q1–Q3 are new observations (their “actual” class is not used). Larger |f(x)| means farther from the boundary — not a probability.</p>
    </Panel>
  );
}

/* ---------- 13. Evaluation ---------- */
export function SvmEvaluation() {
  const m = useMemo(() => fitSvm(RINGS, 1, kernelOf("rbf", 1)), []);
  const obs: Observation[] = useMemo(() => RINGS_VALID.map((p) => ({ score: decision(m, p.x), positive: p.y === 1 })), [m]);
  const [t, setT] = useState(0);
  const counts = countsAt(t, obs);
  return (
    <Panel title="Evaluating an RBF SVM (C = 1, γ = 1) on 40 validation points · Positive = ▲ Class +1">
      <Slider label="Threshold on decision score (default 0)" value={t} min={-1.5} max={1.5} step={0.1} onChange={setT} />
      <p className="mt-1 text-sm" aria-live="polite">Predict ▲ when f(x) ≥ {f(t, 1)}. ROC-AUC from decision scores (threshold-independent): <strong>{percent(rocAuc(obs))}</strong>.</p>
      <ConfusionMatrix counts={counts} details={false} positiveLabel="▲ Class +1" />
      <MetricCards counts={counts} />
    </Panel>
  );
}

/* ---------- 14. Class imbalance ---------- */
export function SvmImbalanceViz() {
  const [bal, setBal] = useState(false);
  const w = useMemo(() => { const n = IMBALANCED.length, pos = IMBALANCED.filter((p) => p.y === 1).length; return { [-1]: n / (2 * (n - pos)), [1]: n / (2 * pos) } as Record<Label, number>; }, []);
  const m = useMemo(() => fitSvm(IMBALANCED, 1, LINEAR, bal ? { classWeight: w } : {}), [bal, w]);
  const counts = countsAt(0, IMBALANCED_VALID.map((p) => ({ score: decision(m, p.x), positive: p.y === 1 })));
  return (
    <Panel title="Class imbalance · 36 majority ● vs 6 minority ▲ · Positive = ▲">
      <div className="grid gap-5 md:grid-cols-2">
        <div><SvmPlot points={IMBALANCED} line={lineOf(m)} sv={svSet(m)} label={`${bal ? "Balanced" : "No"} class weights.`} /><SvmLegend /></div>
        <div className="space-y-3">
          <Choice label="class_weight" value={bal ? "balanced" : "None"} options={["None", "balanced"] as const} onChange={(v) => setBal(v === "balanced")} />
          <p className="text-sm">balanced weights: ● {f(w[-1])}, ▲ {f(w[1])} — each class's C is multiplied by its weight, so minority violations cost more.</p>
          <ConfusionMatrix counts={counts} details={false} positiveLabel="▲ minority" />
          <MetricCards counts={counts} rates={false} />
        </div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Validation set: {IMBALANCED_VALID.length} points. With so few minority points, one prediction changes recall a lot.</p>
    </Panel>
  );
}

/* ---------- 15. Compact lab for experiments ---------- */
export function SvmLab() {
  const [k, setK] = useState<KernelName>("rbf");
  const [C, setC] = useState<number>(1);
  const [g, setG] = useState<number>(0.1);
  const [ds, setDs] = useState<DataName>("rings");
  const [outlier, setOutlier] = useState(false);
  const { train, valid } = DATA[ds];
  const data = outlier ? [...train, OUTLIER] : train;
  const kernel = k === "linear" ? LINEAR : k === "poly" ? kernelOf("poly", g, 2, 1) : kernelOf("rbf", g);
  const m = useMemo(() => fitSvm(data, C, kernel), [data, C, k, g]); // eslint-disable-line react-hooks/exhaustive-deps
  const lin = k === "linear";
  return (
    <Panel title="SVM lab · change one thing at a time">
      <div className="grid gap-5 md:grid-cols-2">
        <div><SvmPlot points={data} model={lin ? undefined : m} line={lin ? lineOf(m) : undefined} sv={svSet(m)} highlight={outlier ? "outlier" : undefined} label={`${KNAME[k]} kernel, C ${C}${lin ? "" : `, gamma ${g}`}: validation accuracy ${percent(accuracyOn(m, valid))}.`} /><SvmLegend kernel={!lin} /></div>
        <div className="space-y-3">
          <Choice label="Dataset" value={ds} options={["rings", "overlap"] as const} onChange={setDs} format={(d) => DATA[d].label} />
          <Choice label="Kernel" value={k} options={["linear", "poly", "rbf"] as const} onChange={setK} format={(v) => KNAME[v]} />
          <Choice label="C" value={C} options={C_CHOICES} onChange={setC} format={(v) => `C = ${v}`} />
          {!lin && <Choice label="γ (gamma)" value={g} options={G_CHOICES} onChange={setG} format={(v) => `γ = ${v}`} />}
          <Button size="sm" variant="outline" aria-pressed={outlier} onClick={() => setOutlier(!outlier)}>{outlier ? "Remove" : "Introduce"} outlier</Button>
          <dl className="grid grid-cols-3 gap-2" aria-live="polite"><Stat label="Train acc." value={percent(accuracyOn(m, data))} /><Stat label="Validation acc." value={percent(accuracyOn(m, valid))} tone="primary" /><Stat label="SVs" value={supportVectors(m).length} /></dl>
        </div>
      </div>
    </Panel>
  );
}

