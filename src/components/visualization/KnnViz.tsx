import { useId, useMemo, useRef, useState, type ReactNode } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { metrics, percent, rocAuc } from "@/lib/evaluation";
import { fitL2, prob } from "@/lib/logistic";
import {
  CLASS_NAMES, CUSTOMER_QUERY, CUSTOMERS, DIMENSIONS, distance, distanceContrast, evaluateKnn, K_CHOICES, KNN_TRAIN, KNN_VALID, knnPredict, minkowski, NOISY_POINT,
  scaler, WORKED, WORKED_QUERY, type KnnResult, type KPoint, type Metric, type Scaling, type Voting,
} from "@/lib/knn";
import { Slider } from "./LogisticViz";
import { ConfusionMatrix, MetricCards } from "./EvaluationViz";

const f = (v: number, d = 2) => v.toFixed(d);
const METRIC_LABEL: Record<Metric, string> = { euclidean: "Euclidean", manhattan: "Manhattan", minkowski: "Minkowski (p = 3)" };

function Panel({ title, children, className }: { title: string; children: ReactNode; className?: string | undefined }) {
  return (
    <figure className={cn("my-6 overflow-hidden rounded-lg border", className)}>
      <figcaption className="border-b bg-muted/40 px-4 py-2 font-mono text-xs text-muted-foreground">{title}</figcaption>
      <div className="p-4 sm:p-5">{children}</div>
    </figure>
  );
}
function Stat({ label, value, tone }: { label: string; value: ReactNode; tone?: "a" | "b" | "primary" | undefined }) {
  return (
    <div className={cn("rounded-md border p-2 text-center", tone === "a" && "bg-primary/10", tone === "b" && "bg-secondary-accent/15", tone === "primary" && "border-primary/50")}>
      <dt className="text-xs text-muted-foreground">{label}</dt><dd className="font-mono text-base sm:text-lg">{value}</dd>
    </div>
  );
}
function Choice<T extends string | number>({ label, value, options, onChange, format = String }: { label: string; value: T; options: readonly T[]; onChange: (v: T) => void; format?: (v: T) => string }) {
  return (
    <div role="group" aria-label={label}>
      <p className="mb-1 text-sm font-medium">{label}</p>
      <div className="flex flex-wrap gap-1.5">{options.map((o) => <Button key={String(o)} size="sm" variant={o === value ? "default" : "outline"} aria-pressed={o === value} onClick={() => onChange(o)}>{format(o)}</Button>)}</div>
    </div>
  );
}
/** Class A = circle, Class B = triangle — shape always carries the class, colour only reinforces it. */
export const ClassName = ({ y }: { y: 0 | 1 }) => <span className={cn("inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-xs", y ? "bg-secondary-accent/15" : "bg-primary/10")}>{y ? "▲" : "●"} {CLASS_NAMES[y]}</span>;
function Mark({ x, y, cls, r = 5.5, faded }: { x: number; y: number; cls: 0 | 1; r?: number; faded?: boolean }) {
  const o = faded ? 0.45 : 1;
  return cls ? <path d={`M${x},${y - r * 1.2} L${x + r * 1.1},${y + r * 0.8} L${x - r * 1.1},${y + r * 0.8} Z`} className="fill-secondary-accent stroke-background" strokeWidth={1.2} opacity={o} />
    : <circle cx={x} cy={y} r={r} className="fill-primary stroke-background" strokeWidth={1.2} opacity={o} />;
}

/* ---------- generic 2D plot over [0,10]² ---------- */
type PlotProps = { points: KPoint[]; query?: [number, number] | undefined; result?: KnnResult | undefined; metric?: Metric; region?: ((x: number, y: number) => 0 | 1) | undefined; onQuery?: ((q: [number, number]) => void) | undefined; label: string; extra?: string | undefined };
const S = 340, P = 26, IN = S - 2 * P;
const sx = (v: number) => P + (v / 10) * IN, sy = (v: number) => P + (1 - v / 10) * IN;
export function KnnPlot({ points, query, result, metric = "euclidean", region, onQuery, label, extra }: PlotProps) {
  const ref = useRef<SVGSVGElement>(null);
  const clip = useId().replace(/:/g, "");
  const N = 34, cell = 10 / N;
  const cells = useMemo(() => region ? Array.from({ length: N * N }, (_, i) => { const cx = (i % N + 0.5) * cell, cy = (Math.floor(i / N) + 0.5) * cell; return { cx, cy, c: region(cx, cy) }; }) : [], [region, cell]);
  const toData = (e: React.PointerEvent): [number, number] | null => {
    const r = ref.current?.getBoundingClientRect(); if (!r) return null;
    const px = ((e.clientX - r.left) / r.width) * S, py = ((e.clientY - r.top) / r.height) * S;
    const c = (v: number) => Math.round(Math.max(0, Math.min(10, v)) * 10) / 10;
    return [c(((px - P) / IN) * 10), c((1 - (py - P) / IN) * 10)];
  };
  const handle = (e: React.PointerEvent) => {
    if (!onQuery) return;
    if (e.type === "pointerdown") (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    else if (e.buttons !== 1) return;
    const q = toData(e); if (q) onQuery(q);
  };
  const ids = new Set(result?.neighbors.map((n) => n.id));
  const kth = result?.neighbors.at(-1)?.d ?? 0;
  return (
    <svg ref={ref} viewBox={`0 0 ${S} ${S}`} className={cn("w-full max-w-md select-none", onQuery && "cursor-crosshair touch-none")} role="img" aria-label={label} onPointerDown={handle} onPointerMove={handle}>
      <defs><clipPath id={clip}><rect x={P} y={P} width={IN} height={IN} /></clipPath></defs>
      <g clipPath={`url(#${clip})`}>
        {cells.map((c, i) => <rect key={i} x={sx(c.cx - cell / 2)} y={sy(c.cy + cell / 2)} width={IN / N + 0.4} height={IN / N + 0.4} className={c.c ? "fill-secondary-accent" : "fill-primary"} opacity={0.13} />)}
        {query && result && kth > 0 && (metric === "manhattan"
          ? <path d={`M${sx(query[0])},${sy(query[1] + kth)} L${sx(query[0] + kth)},${sy(query[1])} L${sx(query[0])},${sy(query[1] - kth)} L${sx(query[0] - kth)},${sy(query[1])} Z`} className="fill-none stroke-muted-foreground" strokeDasharray="4 3" />
          : metric === "euclidean" ? <circle cx={sx(query[0])} cy={sy(query[1])} r={(kth / 10) * IN} className="fill-none stroke-muted-foreground" strokeDasharray="4 3" /> : null)}
      </g>
      <rect x={P} y={P} width={IN} height={IN} className="fill-none stroke-border" />
      {[0, 2, 4, 6, 8, 10].map((v) => <g key={v}><text x={sx(v)} y={S - 8} textAnchor="middle" className="fill-muted-foreground font-mono text-[10px]">{v}</text><text x={P - 5} y={sy(v) + 3} textAnchor="end" className="fill-muted-foreground font-mono text-[10px]">{v}</text></g>)}
      <text x={S - P} y={P - 8} textAnchor="end" className="fill-muted-foreground text-[10px]">x-axis: Feature 1 · y-axis: Feature 2</text>
      {query && result?.neighbors.map((n) => <line key={n.id} x1={sx(query[0])} y1={sy(query[1])} x2={sx(n.x1)} y2={sy(n.x2)} className="stroke-foreground" strokeWidth={1.2} opacity={0.6} />)}
      {points.map((pt) => <g key={pt.id}>
        {ids.has(pt.id) && <circle cx={sx(pt.x1)} cy={sy(pt.x2)} r={10} className="fill-none stroke-foreground" strokeWidth={1.8} />}
        <Mark x={sx(pt.x1)} y={sy(pt.x2)} cls={pt.y} faded={!!result && !ids.has(pt.id)} />
        {pt.id === "N" && <text x={sx(pt.x1) + 9} y={sy(pt.x2) - 8} className="fill-foreground font-mono text-[10px] font-semibold">noisy</text>}
      </g>)}
      {query && <g><rect x={sx(query[0]) - 7} y={sy(query[1]) - 7} width={14} height={14} transform={`rotate(45 ${sx(query[0])} ${sy(query[1])})`} className="fill-warning stroke-foreground" strokeWidth={1.8} /></g>}
      {extra && <text x={P + 4} y={P + 12} className="fill-foreground text-[10px]">{extra}</text>}
    </svg>
  );
}
export const PlotLegend = ({ boundary, ring = true }: { boundary?: boolean; ring?: boolean }) => (
  <p className="mt-2 text-xs text-muted-foreground">● Class A · ▲ Class B · ◆ new observation{ring && " · ringed points with lines = the selected k neighbors · dashed shape = distance to the k-th neighbor"}{boundary && " · shaded regions = class KNN would predict at each location"}.</p>
);

/* ---------- 6 / 11 / 28. Main lab ---------- */
type LabDefaults = { q: [number, number]; k: number; metric: Metric; voting: Voting; boundary: boolean; noise: boolean };
const LAB: LabDefaults = { q: [5, 5.5], k: 5, metric: "euclidean", voting: "uniform", boundary: false, noise: false };
export function KnnLab({ defaults, controls = ["k", "metric", "voting", "boundary", "noise"], title = "Lab · Interactive KNN classifier", summary, prominent }: {
  defaults?: Partial<LabDefaults>; controls?: ("k" | "metric" | "voting" | "boundary" | "noise")[]; title?: string; summary?: (r: KnnResult, s: LabDefaults) => ReactNode; prominent?: boolean;
}) {
  const init = { ...LAB, ...defaults };
  const [s, setS] = useState<LabDefaults>(init);
  const up = <K extends keyof LabDefaults>(k: K) => (v: LabDefaults[K]) => setS((o) => ({ ...o, [k]: v }));
  const data = useMemo(() => (s.noise ? [...KNN_TRAIN, NOISY_POINT] : KNN_TRAIN), [s.noise]);
  const opts = { k: s.k, metric: s.metric, voting: s.voting };
  const result = knnPredict(s.q, data, opts);
  const region = useMemo(() => (s.boundary ? (x: number, y: number) => knnPredict([x, y], data, { k: s.k, metric: s.metric, voting: s.voting }).predicted : undefined), [s.boundary, data, s.k, s.metric, s.voting]);
  const has = (c: (typeof controls)[number]) => controls.includes(c);
  const fmtScore = (v: number) => (s.voting === "uniform" ? String(v) : f(v));
  return (
    <Panel title={title} className={prominent ? "border-primary/50" : undefined}>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <KnnPlot points={data} query={s.q} result={result} metric={s.metric} region={region} onQuery={up("q")} label={`${data.length} training points. New observation at (${f(s.q[0], 1)}, ${f(s.q[1], 1)}). With k = ${s.k}, ${s.metric} distance and ${s.voting} voting: ${result.counts[0]} Class A and ${result.counts[1]} Class B neighbors; predicted ${CLASS_NAMES[result.predicted]}.`} />
          <PlotLegend boundary={s.boundary} ring={s.metric !== "minkowski"} />
          <p className="mt-1 text-xs text-muted-foreground">Click or drag on the plot to move ◆, or use the sliders below (keyboard friendly).</p>
        </div>
        <div className="space-y-3">
          <Slider label="New observation · Feature 1" value={s.q[0]} min={0} max={10} step={0.1} onChange={(v) => up("q")([v, s.q[1]])} format={(v) => f(v, 1)} />
          <Slider label="New observation · Feature 2" value={s.q[1]} min={0} max={10} step={0.1} onChange={(v) => up("q")([s.q[0], v])} format={(v) => f(v, 1)} />
          {has("k") && <Choice label="k (number of neighbors)" value={s.k} options={K_CHOICES} onChange={up("k")} format={(v) => `k = ${v}`} />}
          {has("metric") && <Choice label="Distance metric" value={s.metric} options={["euclidean", "manhattan", "minkowski"] as const} onChange={up("metric")} format={(m) => METRIC_LABEL[m]} />}
          {has("voting") && <Choice label="Voting method" value={s.voting} options={["uniform", "distance"] as const} onChange={up("voting")} format={(v) => (v === "uniform" ? "Uniform" : "Distance-weighted")} />}
          <div className="flex flex-wrap gap-2 pt-1">
            {has("boundary") && <Button size="sm" variant="outline" aria-pressed={s.boundary} onClick={() => up("boundary")(!s.boundary)}>{s.boundary ? "Hide" : "Show"} decision regions</Button>}
            {has("noise") && <Button size="sm" variant="outline" aria-pressed={s.noise} onClick={() => up("noise")(!s.noise)}>{s.noise ? "Remove" : "Add"} noisy point</Button>}
            <Button size="sm" variant="outline" onClick={() => setS(init)}><RotateCcw /> Reset</Button>
          </div>
        </div>
      </div>
      <div aria-live="polite" className="mt-4">
        <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="k · metric" value={<span className="text-sm">{s.k} · {METRIC_LABEL[s.metric].split(" ")[0]}</span>} />
          <Stat label={`● Class A ${s.voting === "uniform" ? "votes" : "weight"}`} value={`${result.counts[0]}${s.voting === "distance" ? ` (${fmtScore(result.scores[0])})` : ""}`} tone="a" />
          <Stat label={`▲ Class B ${s.voting === "uniform" ? "votes" : "weight"}`} value={`${result.counts[1]}${s.voting === "distance" ? ` (${fmtScore(result.scores[1])})` : ""}`} tone="b" />
          <Stat label={`Prediction · ${s.voting}`} value={<span className="text-sm sm:text-base">{result.predicted ? "▲ Class B" : "● Class A"}</span>} tone="primary" />
        </dl>
        {result.tie && <p className="mt-2 text-sm">Tie: both classes have equal {s.voting === "uniform" ? "votes" : "weight"}. This implementation breaks ties toward Class A (the lower label), as argmax-style code commonly does.</p>}
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer font-medium">Show the {s.k} nearest neighbors</summary>
          <div className="mt-2 overflow-x-auto"><table className="w-full min-w-[360px] text-sm"><thead className="bg-muted/50"><tr>{["Rank", "Point", "Features", "Class", "Distance", "Vote weight"].map((h) => <th key={h} scope="col" className="px-2 py-1 text-left font-medium">{h}</th>)}</tr></thead>
            <tbody>{result.neighbors.map((n, i) => <tr key={n.id} className="border-t"><td className="px-2 py-1">{i + 1}</td><td className="px-2 py-1 font-mono">{n.id}</td><td className="px-2 py-1 font-mono">({n.x1}, {n.x2})</td><td className="px-2 py-1"><ClassName y={n.y} /></td><td className="px-2 py-1 font-mono">{f(n.d, 3)}</td><td className="px-2 py-1 font-mono">{s.voting === "uniform" ? "1" : f(n.weight, 3)}</td></tr>)}</tbody></table></div>
        </details>
        {has("k") && <p className="mt-2 text-sm text-muted-foreground">{s.k === 1 ? "k = 1: the single closest point decides alone — sensitive to any noisy label nearby." : s.k >= 9 ? `k = ${s.k}: many points vote, so the neighborhood reaches further and local detail is smoothed out.` : `k = ${s.k}: a moderate neighborhood — several nearby points must agree.`}</p>}
        {summary?.(result, s)}
      </div>
    </Panel>
  );
}

/* ---------- 9. Worked example ---------- */
export function WorkedExample() {
  const [k, setK] = useState(3);
  const rows = WORKED.map((p) => ({ ...p, dx: WORKED_QUERY[0] - p.x1, dy: WORKED_QUERY[1] - p.x2 })).map((p) => ({ ...p, d: Math.hypot(p.dx, p.dy) }));
  const sorted = [...rows].sort((a, b) => a.d - b.d);
  const chosen = sorted.slice(0, k);
  const red = chosen.filter((p) => p.label === "Red").length, blue = k - red;
  return (
    <Panel title="Worked example · new observation X = (3, 2), Euclidean distance">
      <Choice label="k" value={k} options={[1, 2, 3, 4, 5] as const} onChange={setK} format={(v) => `k = ${v}`} />
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <caption className="mb-1 text-left text-xs text-muted-foreground">Steps 1–3: distances, sorted, top k highlighted</caption>
          <thead className="bg-muted/50"><tr>{["Rank", "Obs.", "Features", "Class", "Distance to X = (3, 2)", "Selected?"].map((h) => <th key={h} scope="col" className="px-2 py-1.5 text-left font-medium">{h}</th>)}</tr></thead>
          <tbody>{sorted.map((p, i) => <tr key={p.id} className={cn("border-t", i < k && "bg-primary/5 font-medium")}><td className="px-2 py-1.5">{i + 1}</td><td className="px-2 py-1.5 font-mono">{p.id}</td><td className="px-2 py-1.5 font-mono">({p.x1}, {p.x2})</td><td className="px-2 py-1.5">{p.label === "Red" ? "■ Red" : "▲ Blue"}</td>
            <td className="px-2 py-1.5 font-mono">√[({p.x1}−3)² + ({p.x2}−2)²] = √{p.dx ** 2 + p.dy ** 2} = {f(p.d, 3)}</td><td className="px-2 py-1.5">{i < k ? "✓ yes" : "—"}</td></tr>)}</tbody>
        </table>
      </div>
      <ol className="mt-4 space-y-1 text-sm" aria-live="polite" start={4}>
        <li>4. Labels of the {k} nearest: {chosen.map((p) => `${p.id} (${p.label})`).join(", ")}.</li>
        <li>5. Count: Red = {red}, Blue = {blue}.</li>
        <li>6. Uniform majority vote: {red === blue ? "tie — a tie-breaking rule is needed (here: k = 2 is a poor choice)." : red > blue ? "Red has more votes." : "Blue has more votes."}</li>
        <li className="font-semibold">7. Prediction: {red === blue ? "undecided without a tie-break rule" : red > blue ? "■ Red" : "▲ Blue"}</li>
      </ol>
      <p className="mt-2 text-xs text-muted-foreground">Try k = 1 (Blue), k = 3 (Red) and k = 5 (Blue): the same data, different answers.</p>
    </Panel>
  );
}

/* ---------- 8. Distance calculator ---------- */
export function DistanceCalculator() {
  const init = { a1: 1, a2: 2, b1: 4, b2: 6, p: 3 };
  const [v, setV] = useState(init);
  const set = (k: keyof typeof init) => (n: number) => setV((s) => ({ ...s, [k]: n }));
  const dx = Math.abs(v.b1 - v.a1), dy = Math.abs(v.b2 - v.a2);
  const e = Math.hypot(dx, dy), m = dx + dy, mk = minkowski([v.a1, v.a2], [v.b1, v.b2], v.p);
  const sum = dx ** v.p + dy ** v.p;
  const r = (n: number) => +n.toFixed(4);
  const W = 260, sc = (n: number) => 20 + (n / 10) * 220, sv = (n: number) => 240 - (n / 10) * 220;
  return (
    <Panel title="Interactive · Distance calculator">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <p className="font-mono text-xs uppercase text-muted-foreground">Point A</p>
          <Slider label="A · x₁" value={v.a1} min={0} max={10} step={0.5} onChange={set("a1")} format={(n) => f(n, 1)} />
          <Slider label="A · x₂" value={v.a2} min={0} max={10} step={0.5} onChange={set("a2")} format={(n) => f(n, 1)} />
          <p className="font-mono text-xs uppercase text-muted-foreground">Point B</p>
          <Slider label="B · y₁" value={v.b1} min={0} max={10} step={0.5} onChange={set("b1")} format={(n) => f(n, 1)} />
          <Slider label="B · y₂" value={v.b2} min={0} max={10} step={0.5} onChange={set("b2")} format={(n) => f(n, 1)} />
          <Slider label="Minkowski p" value={v.p} min={1} max={6} step={0.5} onChange={set("p")} format={(n) => f(n, 1)} />
          <Button size="sm" variant="outline" onClick={() => setV(init)}><RotateCcw /> Reset to A = (1, 2), B = (4, 6)</Button>
        </div>
        <div>
          <svg viewBox={`0 0 ${W} ${W}`} className="mx-auto w-full max-w-xs" role="img" aria-label={`A (${v.a1}, ${v.a2}) and B (${v.b1}, ${v.b2}). Euclidean ${f(e, 3)}, Manhattan ${f(m, 3)}.`}>
            <rect x={20} y={20} width={220} height={220} className="fill-none stroke-border" />
            <path d={`M${sc(v.a1)},${sv(v.a2)} L${sc(v.b1)},${sv(v.a2)} L${sc(v.b1)},${sv(v.b2)}`} className="fill-none stroke-secondary-accent" strokeWidth={2.5} strokeDasharray="6 3" />
            <line x1={sc(v.a1)} y1={sv(v.a2)} x2={sc(v.b1)} y2={sv(v.b2)} className="stroke-primary" strokeWidth={2.5} />
            <circle cx={sc(v.a1)} cy={sv(v.a2)} r={6} className="fill-foreground" /><text x={sc(v.a1) - 8} y={sv(v.a2) + 16} className="fill-foreground font-mono text-[11px]">A</text>
            <circle cx={sc(v.b1)} cy={sv(v.b2)} r={6} className="fill-foreground" /><text x={sc(v.b1) + 8} y={sv(v.b2) - 8} className="fill-foreground font-mono text-[11px]">B</text>
          </svg>
          <p className="text-center text-xs text-muted-foreground">Solid line = Euclidean (straight line). Dashed path = Manhattan (horizontal + vertical moves).</p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3" aria-live="polite">
        <div className="rounded-md border p-3 text-sm"><p className="font-semibold">Euclidean</p><p className="mt-1 font-mono text-xs">√[({v.b1} − {v.a1})² + ({v.b2} − {v.a2})²]<br />= √({r(dx ** 2)} + {r(dy ** 2)})<br />= √{r(dx ** 2 + dy ** 2)}</p><p className="mt-1 font-mono text-lg">{f(e, 3)}</p></div>
        <div className="rounded-md border p-3 text-sm"><p className="font-semibold">Manhattan</p><p className="mt-1 font-mono text-xs">|{v.b1} − {v.a1}| + |{v.b2} − {v.a2}|<br />= {r(dx)} + {r(dy)}</p><p className="mt-1 font-mono text-lg">{f(m, 3)}</p></div>
        <div className="rounded-md border p-3 text-sm"><p className="font-semibold">Minkowski, p = {v.p}</p><p className="mt-1 font-mono text-xs">(|{r(dx)}|^{v.p} + |{r(dy)}|^{v.p})^(1/{v.p})<br />= {r(sum)}^(1/{v.p})</p><p className="mt-1 font-mono text-lg">{f(mk, 3)}</p></div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Shown to 3–4 decimals; calculated at full precision. At p = 1 Minkowski equals Manhattan; at p = 2 it equals Euclidean.</p>
    </Panel>
  );
}

/* ---------- 13. Voting comparison ---------- */
export function VotingCompare() {
  const [k, setK] = useState(5);
  const [q, setQ] = useState<[number, number]>([4, 4]);
  const uni = knnPredict(q, KNN_TRAIN, { k, metric: "euclidean", voting: "uniform" });
  const dist = knnPredict(q, KNN_TRAIN, { k, metric: "euclidean", voting: "distance" });
  const total = dist.scores[0] + dist.scores[1];
  return (
    <Panel title="Interactive · Uniform vs distance-weighted voting (same data, same query)">
      <div className="grid gap-6 md:grid-cols-2">
        <div><KnnPlot points={KNN_TRAIN} query={q} result={uni} onQuery={setQ} label={`Query at (${f(q[0], 1)}, ${f(q[1], 1)}) with its ${k} nearest neighbors.`} /><PlotLegend /></div>
        <div className="space-y-3">
          <Choice label="k" value={k} options={K_CHOICES} onChange={setK} format={(v) => `k = ${v}`} />
          <Slider label="Query · Feature 1" value={q[0]} min={0} max={10} step={0.1} onChange={(v) => setQ([v, q[1]])} format={(v) => f(v, 1)} />
          <Slider label="Query · Feature 2" value={q[1]} min={0} max={10} step={0.1} onChange={(v) => setQ([q[0], v])} format={(v) => f(v, 1)} />
          <dl className="grid grid-cols-2 gap-2" aria-live="polite">
            <Stat label="Uniform → prediction" value={<span className="text-sm">{uni.predicted ? "▲ Class B" : "● Class A"}</span>} tone={uni.predicted ? "b" : "a"} />
            <Stat label="Distance-weighted →" value={<span className="text-sm">{dist.predicted ? "▲ Class B" : "● Class A"}</span>} tone={dist.predicted ? "b" : "a"} />
          </dl>
          <p className="text-sm" aria-live="polite">{uni.predicted === dist.predicted ? "Both rules agree here. Move the query between the clusters to find disagreement." : "The rules disagree: the majority class is farther away, while the closer neighbors belong to the other class."}</p>
        </div>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[480px] text-sm">
          <caption className="mb-1 text-left text-xs text-muted-foreground">Contribution of each selected neighbor</caption>
          <thead className="bg-muted/50"><tr>{["Neighbor", "Class", "Distance d", "Uniform weight", "Weight 1/d", "Share of distance vote"].map((h) => <th key={h} scope="col" className="px-2 py-1.5 text-left font-medium">{h}</th>)}</tr></thead>
          <tbody>{dist.neighbors.map((n) => <tr key={n.id} className="border-t"><td className="px-2 py-1.5 font-mono">{n.id}</td><td className="px-2 py-1.5"><ClassName y={n.y} /></td><td className="px-2 py-1.5 font-mono">{f(n.d, 3)}</td><td className="px-2 py-1.5 font-mono">1</td><td className="px-2 py-1.5 font-mono">{f(n.weight, 3)}</td>
            <td className="px-2 py-1.5"><span className="flex items-center gap-2"><span className="h-2 w-16 rounded bg-muted" aria-hidden><span className="block h-2 rounded bg-primary" style={{ width: `${(n.weight / total) * 100}%` }} /></span><span className="font-mono">{percent(n.weight / total)}</span></span></td></tr>)}</tbody>
          <tfoot className="border-t font-medium"><tr><td className="px-2 py-1.5" colSpan={3}>Totals</td><td className="px-2 py-1.5 font-mono">A {uni.scores[0]} · B {uni.scores[1]}</td><td className="px-2 py-1.5 font-mono" colSpan={2}>A {f(dist.scores[0], 3)} · B {f(dist.scores[1], 3)}</td></tr></tfoot>
        </table>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">If a neighbor sits at distance 0, 1/d is undefined; this lab (like scikit-learn) then lets only the exact matches vote.</p>
    </Panel>
  );
}

/* ---------- 12. Linear vs KNN boundary ---------- */
export function BoundaryCompare() {
  const [k, setK] = useState(5);
  const lin = useMemo(() => fitL2(1, KNN_TRAIN.map((p) => ({ ...p, x1: p.x1 - 5, x2: p.x2 - 5 }))), []);
  const linRegion = useMemo(() => (x: number, y: number) => (prob(lin, x - 5, y - 5) >= 0.5 ? 1 : 0) as 0 | 1, [lin]);
  const knnRegion = useMemo(() => (x: number, y: number) => knnPredict([x, y], KNN_TRAIN, { k, metric: "euclidean", voting: "uniform" }).predicted, [k]);
  const acc = (fn: (x: number, y: number) => 0 | 1) => KNN_TRAIN.filter((p) => fn(p.x1, p.x2) === p.y).length;
  return (
    <Panel title="Comparison · decision-boundary shape on the same data">
      <Choice label="KNN k" value={k} options={K_CHOICES} onChange={setK} format={(v) => `k = ${v}`} />
      <div className="mt-4 grid gap-6 md:grid-cols-2">
        <div><p className="mb-1 text-sm font-semibold">A linear boundary (one straight line)</p><KnnPlot points={KNN_TRAIN} region={linRegion} label="Linear decision regions: one straight line cannot separate the four-cluster pattern." /><p className="text-xs text-muted-foreground">{acc(linRegion)} / {KNN_TRAIN.length} training points on the correct side.</p></div>
        <div><p className="mb-1 text-sm font-semibold">KNN boundary, k = {k}</p><KnnPlot points={KNN_TRAIN} region={knnRegion} label={`KNN decision regions with k ${k}: curved, piecewise boundaries following local neighborhoods.`} /><p className="text-xs text-muted-foreground">{acc(knnRegion)} / {KNN_TRAIN.length} training points in their own class region (k = 1 always scores perfectly here — that says nothing about new data).</p></div>
      </div>
      <PlotLegend boundary ring={false} />
      <p className="mt-2 text-xs text-muted-foreground">Regions are computed by actually running the classifier on a 34 × 34 grid. The linear panel is a Logistic Regression fit used only to show a straight boundary.</p>
    </Panel>
  );
}

/* ---------- 14. Feature scaling ---------- */
export function ScalingViz() {
  const [mode, setMode] = useState<Scaling>("none");
  const [k, setK] = useState(1);
  const tf = scaler(mode);
  const q = tf(CUSTOMER_QUERY.age, CUSTOMER_QUERY.income);
  const pts = CUSTOMERS.map((c) => { const [a, i] = tf(c.age, c.income); return { ...c, a, i, d: distance(q, [a, i], "euclidean") }; });
  const ranked = [...pts].sort((a, b) => a.d - b.d);
  const chosen = new Set(ranked.slice(0, k).map((p) => p.id));
  const b = ranked.slice(0, k).filter((p) => p.y).length, pred = b > k - b ? 1 : 0;
  // "Distance view": both axes drawn with the SAME units per pixel, so the picture shows what the distance formula sees.
  const xs = [...pts.map((p) => p.a), q[0]], ys = [...pts.map((p) => p.i), q[1]];
  const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
  const x0 = (Math.max(...xs) + Math.min(...xs)) / 2 - span / 2, y0 = (Math.max(...ys) + Math.min(...ys)) / 2 - span / 2;
  const W = 260, dx = (v: number) => 20 + ((v - x0) / span) * 220, dy = (v: number) => 240 - ((v - y0) / span) * 220;
  const ox = (age: number) => 20 + ((age - 15) / 70) * 220, oy = (inc: number) => 240 - ((inc - 0) / 200000) * 220;
  const plot = (title: string, X: (p: (typeof pts)[number]) => number, Y: (p: (typeof pts)[number]) => number, qx: number, qy: number, note: string) => (
    <div><p className="mb-1 text-sm font-semibold">{title}</p>
      <svg viewBox={`0 0 ${W} ${W + 10}`} className="w-full max-w-xs" role="img" aria-label={`${title}. ${note}`}>
        <rect x={20} y={20} width={220} height={220} className="fill-none stroke-border" />
        {pts.map((p) => <g key={p.id}>{chosen.has(p.id) && <circle cx={X(p)} cy={Y(p)} r={10} className="fill-none stroke-foreground" strokeWidth={1.8} />}<Mark x={X(p)} y={Y(p)} cls={p.y} faded={!chosen.has(p.id)} /></g>)}
        <rect x={qx - 6} y={qy - 6} width={12} height={12} transform={`rotate(45 ${qx} ${qy})`} className="fill-warning stroke-foreground" strokeWidth={1.5} />
      </svg><p className="text-xs text-muted-foreground">{note}</p></div>
  );
  return (
    <Panel title="Interactive · Feature scaling changes who the neighbors are">
      <div className="flex flex-wrap gap-6">
        <Choice label="Scaling" value={mode} options={["none", "standard", "minmax"] as const} onChange={setMode} format={(m) => (m === "none" ? "No scaling" : m === "standard" ? "Standardization" : "Min-max")} />
        <Choice label="k" value={k} options={[1, 3, 5] as const} onChange={setK} format={(v) => `k = ${v}`} />
      </div>
      <div className="mt-4 grid gap-6 md:grid-cols-2">
        {plot("1 · Original units (axes stretched for display)", (p) => ox(p.age), (p) => oy(p.income), ox(CUSTOMER_QUERY.age), oy(CUSTOMER_QUERY.income), "x: age 15–85, y: income $0–200k. Each axis is stretched to fit — the distance formula does not see this picture.")}
        {plot(`2 · What the distance sees (${mode === "none" ? "raw numbers" : mode === "standard" ? "standardized" : "min-max scaled"}, equal units on both axes)`, (p) => dx(p.a), (p) => dy(p.i), dx(q[0]), dy(q[1]), mode === "none" ? "Income spans ~150,000 units, age only ~56 — age collapses into a vertical line, so income alone decides distance." : "Both features now span similar ranges, so age differences count too.")}
      </div>
      <PlotLegend ring={false} />
      <div className="mt-3 overflow-x-auto" aria-live="polite">
        <table className="w-full min-w-[460px] text-sm"><caption className="mb-1 text-left text-xs text-muted-foreground">Query: age {CUSTOMER_QUERY.age}, income ${CUSTOMER_QUERY.income.toLocaleString("en-US")} · {k} nearest under {mode}</caption>
          <thead className="bg-muted/50"><tr>{["Rank", "Customer", "Age", "Income", "Class", "Distance"].map((h) => <th key={h} scope="col" className="px-2 py-1 text-left font-medium">{h}</th>)}</tr></thead>
          <tbody>{ranked.slice(0, Math.max(k, 3)).map((p, i) => <tr key={p.id} className={cn("border-t", i < k && "bg-primary/5 font-medium")}><td className="px-2 py-1">{i + 1}{i < k ? " ✓" : ""}</td><td className="px-2 py-1 font-mono">{p.id}</td><td className="px-2 py-1">{p.age}</td><td className="px-2 py-1">${p.income.toLocaleString("en-US")}</td><td className="px-2 py-1"><ClassName y={p.y} /></td><td className="px-2 py-1 font-mono">{p.d < 10 ? f(p.d, 3) : Math.round(p.d).toLocaleString("en-US")}</td></tr>)}</tbody>
        </table>
        <p className="mt-2 text-sm font-medium">Prediction: {pred ? "▲ Class B" : "● Class A"}.</p>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Educational synthetic data where the class mostly follows age. Scalers are fitted on these 12 training customers and applied to the query. Real outcomes depend on the dataset.</p>
    </Panel>
  );
}

/* ---------- 15. Dimensionality ---------- */
export function DimensionViz() {
  const values = useMemo(() => DIMENSIONS.map((d) => ({ d, r: distanceContrast(d) })), []);
  return (
    <Panel title="Computed illustration · nearest ÷ farthest distance as features increase">
      <div className="space-y-2" role="list">
        {values.map(({ d, r }) => <div key={d} role="listitem" className="grid grid-cols-[5.5rem_1fr_3.5rem] items-center gap-2 text-sm"><span className="font-mono">{d} feature{d > 1 ? "s" : ""}</span><span className="h-3 rounded bg-muted" aria-hidden><span className="block h-3 rounded bg-primary" style={{ width: `${r * 100}%` }} /></span><span className="text-right font-mono">{f(r, 3)}</span></div>)}
      </div>
      <p className="mt-3 text-sm">For 200 random points in a unit hypercube, we measure the closest and farthest point from a query. With 1–2 features the nearest point is much closer than the farthest (ratio near 0). With hundreds of features the ratio approaches 1: <strong>everything is roughly equally far away</strong>, so "nearest" carries less information.</p>
      <p className="mt-1 text-xs text-muted-foreground">Uniform random data computed in your browser — a conceptual illustration, not a statement about any particular real dataset.</p>
    </Panel>
  );
}

/* ---------- 21. Validation chart for k ---------- */
const KS = [1, 3, 5, 7, 9, 11, 13, 15] as const;
export function KValidationChart() {
  const [metric, setMetric] = useState<"accuracy" | "precision" | "recall" | "f1">("accuracy");
  const data = useMemo(() => KS.map((k) => ({ k, val: evaluateKnn({ k, metric: "euclidean", voting: "uniform" }).metrics, train: evaluateKnn({ k, metric: "euclidean", voting: "uniform" }, KNN_TRAIN, KNN_TRAIN).metrics })), []);
  const W = 560, H = 230, L = 46, x = (i: number) => L + (i / (KS.length - 1)) * (W - L - 20), y = (v: number) => 20 + (1 - (v - 0.5) / 0.5) * (H - 60);
  const best = data.reduce((b, d) => ((d.val[metric] ?? 0) > (b.val[metric] ?? 0) ? d : b));
  const line = (key: "val" | "train") => data.map((d, i) => `${i ? "L" : "M"}${x(i)},${y(d[key][metric] ?? 0)}`).join(" ");
  return (
    <Panel title="Computed in your browser · validation vs training score by k">
      <Choice label="Validation metric (positive = Class B)" value={metric} options={["accuracy", "precision", "recall", "f1"] as const} onChange={setMetric} format={(m) => (m === "f1" ? "F1" : m[0]!.toUpperCase() + m.slice(1))} />
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 w-full" role="img" aria-label={`Validation ${metric} by k: ${data.map((d) => `k ${d.k} ${percent(d.val[metric])}`).join(", ")}. Best k ${best.k}.`}>
        {[0.5, 0.75, 1].map((v) => <g key={v}><line x1={L} x2={W - 20} y1={y(v)} y2={y(v)} className="stroke-border" /><text x={L - 6} y={y(v) + 4} textAnchor="end" className="fill-muted-foreground font-mono text-[11px]">{v}</text></g>)}
        <path d={line("train")} className="fill-none stroke-muted-foreground" strokeWidth={1.5} strokeDasharray="5 4" />
        <path d={line("val")} className="fill-none stroke-primary" strokeWidth={2.5} />
        {data.map((d, i) => <g key={d.k}><circle cx={x(i)} cy={y(d.val[metric] ?? 0)} r={d.k === best.k ? 7 : 4.5} className={d.k === best.k ? "fill-warning stroke-foreground" : "fill-primary"} /><text x={x(i)} y={H - 18} textAnchor="middle" className="fill-muted-foreground font-mono text-[11px]">{d.k}</text></g>)}
        <text x={(W + L) / 2} y={H - 2} textAnchor="middle" className="fill-muted-foreground text-[11px]">k (number of neighbors)</text>
      </svg>
      <p className="text-xs text-muted-foreground">Solid line = validation score (40 held-out points). Dashed = score on the training points themselves; at k = 1 each point is its own nearest neighbor, so training accuracy is 100% — not evidence of generalization. ◆ = best validation k ({best.k}, {percent(best.val[metric])}); ties keep the smaller k.</p>
      <p className="mt-2 text-sm">Real KNN on this site's synthetic 36-point training set and 40-point validation set. With so few points, scores jump around — on real projects, use cross-validation to get steadier estimates.</p>
    </Panel>
  );
}

/* ---------- 20. Evaluation ---------- */
export function KnnEvaluation() {
  const [k, setK] = useState(5);
  const [voting, setVoting] = useState<Voting>("uniform");
  const r = evaluateKnn({ k, metric: "euclidean", voting });
  const auc = rocAuc(r.probaObs);
  return (
    <Panel title="Computed · KNN on the 40-point validation set (positive class = Class B)">
      <div className="flex flex-wrap gap-6">
        <Choice label="k" value={k} options={K_CHOICES} onChange={setK} format={(v) => `k = ${v}`} />
        <Choice label="Voting" value={voting} options={["uniform", "distance"] as const} onChange={setVoting} format={(v) => (v === "uniform" ? "Uniform" : "Distance")} />
      </div>
      <ConfusionMatrix counts={r.counts} details={false} positiveLabel="Class B" />
      <MetricCards counts={r.counts} />
      <dl className="mt-3 grid grid-cols-2 gap-2"><Stat label="ROC-AUC (from neighbor-vote probabilities)" value={auc === null ? "Undefined" : f(auc, 3)} tone="primary" /><Stat label="Accuracy (check)" value={percent(metrics(r.counts).accuracy)} /></dl>
      <p className="mt-2 text-xs text-muted-foreground">ROC-AUC uses P(Class B) = share of the {k} neighbors' {voting === "uniform" ? "votes" : "weight"} that are Class B — the same idea as scikit-learn's predict_proba. With k = 1 those probabilities are only 0 or 1, so the ROC curve has a single corner.</p>
    </Panel>
  );
}

export { KNN_VALID };
