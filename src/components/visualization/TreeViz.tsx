import { useId, useMemo, useState, type KeyboardEvent, type ReactNode } from "react";
import { RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { metrics, percent, rocAuc } from "@/lib/evaluation";
import {
  accuracy, balancedWeights, BUILD_DATA, buildTree, collapse, countsFor, depthOf, entropy, evaluateSplit, featureImportance, fixedTree, gini, IMB_TRAIN, IMB_VALID,
  leaves, nodes, predict, predictProba, proportions, prune, TREE_TRAIN, TREE_TRAIN_3, TREE_VALID, TREE_VALID_3,
  type BuildStep, type Criterion, type Spec, type TPoint, type TreeNode, type TreeOptions,
} from "@/lib/tree";
import { KnnPlot, Panel, Stat, Choice } from "./KnnViz";
import { Slider } from "./LogisticViz";
import { ConfusionMatrix, MetricCards } from "./EvaluationViz";

const f = (v: number, d = 3) => (Number.isFinite(v) ? v.toFixed(d) : "—");
const FEATURES = ["Feature 1", "Feature 2", "Feature 3 (noise)"];
const short = (i: number) => `F${i + 1}`;
const CRIT_LABEL: Record<Criterion, string> = { gini: "Gini impurity", entropy: "Entropy / information gain" };
const cls = (y: 0 | 1) => (y ? "▲ Class B" : "● Class A");
const toK = (pts: TPoint[]) => pts.map((p) => ({ id: p.id, x1: p.x[0]!, x2: p.x[1]!, y: p.y }));
const dist = (n: TreeNode) => `${n.counts[0]} A / ${n.counts[1]} B`;
const cond = (n: TreeNode) => (n.split ? `${short(n.split.feature)} ≤ ${n.split.threshold}` : "");
const depthLabel = (d: number | null) => (d === null ? "None (unrestricted)" : String(d));

/* ---------- region plot of any 2-feature tree ---------- */
export function TreePlot({ tree, points, label, highlight }: { tree: TreeNode; points: TPoint[]; label: string; highlight?: ReadonlySet<string> | undefined }) {
  const region = useMemo(() => (x: number, y: number) => predict(tree, [x, y, 0]), [tree]);
  const pts = toK(highlight ? points.filter((p) => highlight.has(p.id)) : points);
  return (
    <div>
      <KnnPlot points={pts} region={region} label={label} />
      <p className="mt-1 text-xs text-muted-foreground">● Class A · ▲ Class B · shaded rectangles = class the tree predicts in each region (axis-aligned splits).</p>
    </div>
  );
}

/* ---------- SVG tree diagram with clickable nodes ---------- */
type Layout = { node: TreeNode; x: number; y: number };
function layout(t: TreeNode): { items: Layout[]; edges: [Layout, Layout, string][]; w: number; h: number } {
  let leafIdx = 0;
  const items: Layout[] = [], edges: [Layout, Layout, string][] = [];
  const place = (n: TreeNode): Layout => {
    if (!n.left || !n.right) { const l = { node: n, x: leafIdx++ * 78 + 39, y: n.depth * 78 + 26 }; items.push(l); return l; }
    const a = place(n.left), b = place(n.right);
    const me = { node: n, x: (a.x + b.x) / 2, y: n.depth * 78 + 26 };
    items.push(me); edges.push([me, a, "yes"], [me, b, "no"]);
    return me;
  };
  place(t);
  return { items, edges, w: Math.max(leafIdx * 78, 160), h: (depthOf(t) + 1) * 78 };
}
export function TreeDiagram({ tree, selected, onSelect, label }: { tree: TreeNode; selected?: string | undefined; onSelect?: ((id: string) => void) | undefined; label: string }) {
  const { items, edges, w, h } = layout(tree);
  const key = (id: string) => (e: KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect?.(id); } };
  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${w} ${h}`} style={{ maxWidth: Math.max(w, 300) }} className="w-full min-w-[280px]" role="group" aria-label={label}>
        {edges.map(([a, b, t]) => <g key={b.node.id}>
          <line x1={a.x} y1={a.y + 18} x2={b.x} y2={b.y - 18} className="stroke-border" strokeWidth={1.5} />
          <text x={(a.x + b.x) / 2 + (t === "yes" ? -6 : 6)} y={(a.y + b.y) / 2 + 2} textAnchor={t === "yes" ? "end" : "start"} className="fill-muted-foreground font-mono text-[8px]">{t === "yes" ? "≤ yes" : "> no"}</text>
        </g>)}
        {items.map(({ node: n, x, y }) => {
          const leaf = !n.split, sel = selected === n.id;
          return (
            <g key={n.id} role={onSelect ? "button" : undefined} tabIndex={onSelect ? 0 : undefined} aria-pressed={onSelect ? sel : undefined}
              aria-label={`${n.depth === 0 ? "Root" : leaf ? "Leaf" : "Internal"} node, ${leaf ? `predicts ${cls(n.prediction)}` : cond(n)}, ${n.n} samples, ${dist(n)}`}
              onClick={() => onSelect?.(n.id)} onKeyDown={key(n.id)} className={cn(onSelect && "cursor-pointer focus:outline-none [&:focus-visible>rect]:stroke-ring [&:focus-visible>rect]:stroke-[3]")}>
              <rect x={x - 36} y={y - 18} width={72} height={36} rx={leaf ? 10 : 4} className={cn(leaf ? (n.prediction ? "fill-secondary-accent/20" : "fill-primary/15") : "fill-card", sel ? "stroke-primary" : "stroke-border")} strokeWidth={sel ? 2.5 : 1.2} />
              <text x={x} y={y - 4} textAnchor="middle" className="fill-foreground font-mono text-[9px] font-semibold">{leaf ? (n.prediction ? "▲ B" : "● A") : cond(n)}</text>
              <text x={x} y={y + 9} textAnchor="middle" className="fill-muted-foreground font-mono text-[8px]">n={n.n} · {n.counts[0]}/{n.counts[1]}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
export function NodeDetails({ node, criterion = "gini" }: { node: TreeNode; criterion?: Criterion }) {
  const type = node.depth === 0 ? (node.split ? "Root node" : "Root (also a leaf)") : node.split ? "Internal node" : "Leaf node";
  const p = proportions(node.counts);
  return (
    <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3" aria-live="polite">
      <Stat label="Node type" value={<span className="text-sm">{type}</span>} />
      <Stat label="Condition" value={<span className="text-sm">{node.split ? cond(node) : "— (no split)"}</span>} />
      <Stat label="Samples · depth" value={`${node.n} · ${node.depth}`} />
      <Stat label="Class distribution" value={<span className="text-sm">{dist(node)}</span>} />
      <Stat label={criterion === "gini" ? "Gini impurity" : "Entropy (bits)"} value={f(criterion === "gini" ? gini(node.counts) ?? 0 : entropy(node.counts) ?? 0)} />
      <Stat label={node.split ? "Majority class" : "Prediction"} value={<span className="text-sm">{p ? cls(node.prediction) : "empty node"}</span>} tone="primary" />
    </dl>
  );
}

/* ---------- Tree structure (annotated, clickable) ---------- */
export function StructureDemo() {
  const tree = useMemo(() => buildTree(BUILD_DATA, { maxDepth: 3 }), []);
  const [sel, setSel] = useState("root");
  const node = nodes(tree).find((n) => n.id === sel) ?? tree;
  return (
    <Panel title="Computed · a small tree grown on 16 deterministic points (Gini, max_depth = 3) · click any node">
      <TreeDiagram tree={tree} selected={sel} onSelect={setSel} label="Decision tree diagram. Use Tab and Enter to select a node." />
      <p className="mb-3 mt-1 text-xs text-muted-foreground">Square boxes are decision nodes (left branch = condition true). Rounded boxes are leaves; ● A / ▲ B is the predicted class. "n=8 · 5/3" = 8 samples, 5 Class A and 3 Class B.</p>
      <NodeDetails node={node} />
    </Panel>
  );
}

/* ---------- Interactive Tree Explorer ---------- */
const EXP_INIT = { t1: 5, t2: 7, t3: 3 };
export function TreeExplorer() {
  const [t, setT] = useState(EXP_INIT);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [sel, setSel] = useState("root");
  const spec: Spec = { feature: 0, threshold: t.t1, left: { feature: 1, threshold: t.t2 }, right: { feature: 1, threshold: t.t3 } };
  const full = fixedTree(TREE_TRAIN, spec);
  const tree = collapse(full, collapsed);
  const node = nodes(tree).find((n) => n.id === sel) ?? tree;
  const fullNode = nodes(full).find((n) => n.id === sel);
  const canToggle = !!fullNode?.split;
  const toggle = () => setCollapsed((s) => { const n = new Set(s); if (n.has(sel)) n.delete(sel); else n.add(sel); return n; });
  const acc = accuracy(tree, TREE_TRAIN);
  return (
    <Panel title="Lab · Interactive tree explorer (fixed structure, adjustable thresholds) · 60 training points" className="border-primary/50">
      <div className="grid gap-6 md:grid-cols-2">
        <TreePlot tree={tree} points={TREE_TRAIN} label={`Feature space partitioned by the tree. Root: F1 ≤ ${t.t1}. Training accuracy ${percent(acc)}.`} />
        <div className="space-y-3">
          <Slider label="Root split · F1 ≤" value={t.t1} min={1} max={9} step={0.25} onChange={(v) => setT({ ...t, t1: v })} />
          <Slider label="Left child · F2 ≤" value={t.t2} min={1} max={9} step={0.25} onChange={(v) => setT({ ...t, t2: v })} />
          <Slider label="Right child · F2 ≤" value={t.t3} min={1} max={9} step={0.25} onChange={(v) => setT({ ...t, t3: v })} />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" disabled={!canToggle} onClick={toggle} aria-pressed={collapsed.has(sel)}>{collapsed.has(sel) ? "Expand" : "Collapse"} selected branch</Button>
            <Button size="sm" variant="outline" onClick={() => { setT(EXP_INIT); setCollapsed(new Set()); setSel("root"); }}><RotateCcw /> Reset</Button>
          </div>
          <p className="text-xs text-muted-foreground">Simplification: the structure (which feature each node uses) is fixed so you can focus on thresholds. Every count, impurity and region is recomputed from the 60 points on each change.</p>
          <dl className="grid grid-cols-2 gap-2"><Stat label="Leaves" value={leaves(tree).length} /><Stat label="Training accuracy" value={percent(acc)} tone="primary" /></dl>
        </div>
      </div>
      <div className="mt-4"><TreeDiagram tree={tree} selected={sel} onSelect={setSel} label="Explorer tree. Select a node to inspect it." /></div>
      <div className="mt-3"><NodeDetails node={node} /></div>
    </Panel>
  );
}

/* ---------- Impurity calculator (Gini or entropy) ---------- */
function CountInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const id = useId();
  return (
    <div><label htmlFor={id} className="text-sm font-medium">{label}</label>
      <input id={id} type="number" min={0} max={10000} step={1} value={value} onChange={(e) => onChange(Math.max(0, Math.min(10000, Math.floor(+e.target.value || 0))))} className="mt-1 w-full rounded-md border bg-background px-2 py-1.5 font-mono text-sm" /></div>
  );
}
export function ImpurityCalculator({ kind }: { kind: Criterion }) {
  const init = [30, 70, 0];
  const [c, setC] = useState(init);
  const [three, setThree] = useState(false);
  const counts = three ? c : c.slice(0, 2);
  const p = proportions(counts);
  const value = kind === "gini" ? gini(counts) : entropy(counts);
  const names = ["A", "B", "C"];
  const max = kind === "gini" ? 1 - 1 / counts.length : Math.log2(counts.length);
  const terms = p?.map((v, i) => kind === "gini" ? `${f(v, 2)}²` : v === 0 ? `0·log₂0` : `${f(v, 2)}·log₂(${f(v, 2)})`);
  const interp = value === null ? "" : value === 0 ? "Pure node: every observation belongs to one class." : value > max * 0.9 ? "Close to the maximum for this number of classes: the classes are almost evenly mixed." : value < max * 0.35 ? "Mostly one class, with a little mixing." : "A clear mixture of classes.";
  return (
    <Panel title={`Calculator · ${kind === "gini" ? "Gini impurity" : "Entropy"} (computed live)`}>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">{counts.map((v, i) => <CountInput key={i} label={`Class ${names[i]} count`} value={v} onChange={(x) => setC((o) => o.map((y, j) => (j === i ? x : y)))} />)}</div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" aria-pressed={three} onClick={() => setThree(!three)}>{three ? "Back to 2 classes" : "Add a third class (multiclass)"}</Button>
            <Button size="sm" variant="outline" onClick={() => setC([50, 50, 0])}>50 / 50</Button>
            <Button size="sm" variant="outline" onClick={() => setC([100, 0, 0])}>Pure</Button>
            <Button size="sm" variant="outline" onClick={() => { setC(init); setThree(false); }}><RotateCcw /> Reset</Button>
          </div>
        </div>
        <div aria-live="polite" className="space-y-2">
          {!p ? <p role="alert" className="rounded-md border border-warning p-3 text-sm">Empty node: there are no observations, so proportions (and impurity) are undefined. Enter at least one count.</p> : <>
            <dl className="grid grid-cols-3 gap-2"><Stat label="Total" value={counts.reduce((a, b) => a + b, 0)} />{p.map((v, i) => <Stat key={i} label={`p${names[i]}`} value={f(v, 2)} />)}</dl>
            <p className="overflow-x-auto rounded-md bg-muted/50 p-3 font-mono text-sm">{kind === "gini" ? `Gini = 1 − ${terms!.join(" − ")}` : `Entropy = −[${terms!.join(" + ")}]`}<br />{kind === "gini" ? "Gini" : "Entropy"} = <strong>{f(value!)}</strong>{kind === "entropy" && " bits"}</p>
            <p className="text-sm">{interp} <span className="text-muted-foreground">(Maximum for {counts.length} classes: {f(max)}{kind === "entropy" ? " bits" : ""}.)</span></p>
          </>}
        </div>
      </div>
    </Panel>
  );
}

/* ---------- Split comparison ---------- */
type SplitState = { parent: [number, number]; a: [number, number]; b: [number, number] };
const PRESETS: Record<string, SplitState> = {
  "Worked example": { parent: [50, 50], a: [36, 4], b: [45, 20] },
  "Criteria disagree": { parent: [20, 20], a: [18, 2], b: [15, 0] },
};
export function SplitComparison({ initial = "Worked example", fixedCriterion }: { initial?: keyof typeof PRESETS; fixedCriterion?: Criterion }) {
  const [s, setS] = useState<SplitState>(PRESETS[initial]!);
  const [crit, setCrit] = useState<Criterion>(fixedCriterion ?? "gini");
  const clampLeft = (l: [number, number]): [number, number] => [Math.min(l[0], s.parent[0]), Math.min(l[1], s.parent[1])];
  const right = (l: [number, number]): [number, number] => [s.parent[0] - l[0], s.parent[1] - l[1]];
  const ev = (l: [number, number]) => evaluateSplit(l, right(l), crit);
  const A = ev(s.a), B = ev(s.b);
  const diff = A && B ? A.reduction - B.reduction : 0;
  const verdict = !A || !B ? "Parent node is empty." : Math.abs(diff) < 1e-9 ? "Tie: both splits reduce impurity by the same amount." : `Split ${diff > 0 ? "A" : "B"} is preferred under ${CRIT_LABEL[crit]} (larger ${crit === "gini" ? "Gini reduction" : "information gain"}).`;
  const name = crit === "gini" ? "Gini" : "Entropy";
  const Row = ({ label, l, e, set }: { label: string; l: [number, number]; e: ReturnType<typeof ev>; set: (v: [number, number]) => void }) => (
    <div className="rounded-lg border p-3">
      <p className="font-medium">{label}</p>
      <div className="mt-2 grid grid-cols-2 gap-2"><CountInput label="Left child · A" value={l[0]} onChange={(v) => set(clampLeft([v, l[1]]))} /><CountInput label="Left child · B" value={l[1]} onChange={(v) => set(clampLeft([l[0], v]))} /></div>
      <p className="mt-2 text-xs text-muted-foreground">Right child = parent − left = {right(l)[0]} A / {right(l)[1]} B</p>
      {e && <table className="mt-2 w-full text-sm"><tbody className="font-mono">
        <tr><th className="text-left font-normal text-muted-foreground">Left {name} (n={e.nL})</th><td className="text-right">{f(e.left)}</td></tr>
        <tr><th className="text-left font-normal text-muted-foreground">Right {name} (n={e.nR})</th><td className="text-right">{f(e.right)}</td></tr>
        <tr><th className="text-left font-normal text-muted-foreground">Weighted = {e.nL}/{e.nP}·L + {e.nR}/{e.nP}·R</th><td className="text-right">{f(e.weighted)}</td></tr>
        <tr className="border-t"><th className="text-left font-semibold">{crit === "gini" ? "Gini reduction" : "Information gain"}</th><td className="text-right font-semibold">{f(e.reduction)}</td></tr>
      </tbody></table>}
    </div>
  );
  return (
    <Panel title="Tool · Compare two candidate splits (all values computed from the counts shown)">
      <div className="flex flex-wrap items-end gap-4">
        {!fixedCriterion && <Choice label="Splitting criterion" value={crit} options={["gini", "entropy"] as const} onChange={setCrit} format={(c) => CRIT_LABEL[c]} />}
        <div role="group" aria-label="Presets" className="flex flex-wrap gap-1.5">{Object.keys(PRESETS).map((k) => <Button key={k} size="sm" variant="outline" onClick={() => setS(PRESETS[k]!)}>{k}</Button>)}</div>
      </div>
      <div className="mt-3 grid max-w-xs grid-cols-2 gap-2">
        <CountInput label="Parent · Class A" value={s.parent[0]} onChange={(v) => setS((o) => ({ parent: [v, o.parent[1]], a: [Math.min(o.a[0], v), o.a[1]], b: [Math.min(o.b[0], v), o.b[1]] }))} />
        <CountInput label="Parent · Class B" value={s.parent[1]} onChange={(v) => setS((o) => ({ parent: [o.parent[0], v], a: [o.a[0], Math.min(o.a[1], v)], b: [o.b[0], Math.min(o.b[1], v)] }))} />
      </div>
      <p className="mt-2 font-mono text-sm">Parent {name.toLowerCase()} = {A ? f(A.parent) : "undefined"}</p>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <Row label="Candidate Split A" l={s.a} e={A} set={(v) => setS((o) => ({ ...o, a: v }))} />
        <Row label="Candidate Split B" l={s.b} e={B} set={(v) => setS((o) => ({ ...o, b: v }))} />
      </div>
      <p aria-live="polite" className="mt-3 rounded-md border border-primary/50 p-3 text-sm font-medium">{verdict}</p>
    </Panel>
  );
}

/* ---------- Step-by-step tree building ---------- */
export function TreeBuilder() {
  const [crit, setCrit] = useState<Criterion>("gini");
  const [i, setI] = useState(0);
  const { tree, steps } = useMemo(() => { const st: BuildStep[] = []; return { tree: buildTree(BUILD_DATA, { maxDepth: 3, criterion: crit }, st), steps: st }; }, [crit]);
  const step = steps[Math.min(i, steps.length - 1)]!;
  const order = steps.map((s) => s.node.id);
  const pending = new Set(order.filter((_, j) => j >= i));
  const partial = collapse(tree, pending);
  const inNode = useMemo(() => {
    const path = step.node.id.slice(4).split("");
    let pts = BUILD_DATA, n: TreeNode = tree;
    for (const d of path) { const sp = n.split!; pts = pts.filter((p) => (d === "L") === (p.x[sp.feature]! <= sp.threshold)); n = d === "L" ? n.left! : n.right!; }
    return new Set(pts.map((p) => p.id));
  }, [step, tree]);
  const top = [...step.candidates].sort((a, b) => b.eval.reduction - a.eval.reduction).slice(0, 4);
  const name = crit === "gini" ? "Gini" : "Entropy";
  return (
    <Panel title={`Demo · Growing a tree step by step (16 points, ${CRIT_LABEL[crit]}, max_depth = 3)`} className="border-primary/50">
      <div className="flex flex-wrap items-end gap-3">
        <Choice label="Criterion" value={crit} options={["gini", "entropy"] as const} onChange={(c) => { setCrit(c); setI(0); }} format={(c) => CRIT_LABEL[c]} />
        <div className="flex gap-2">
          <Button size="sm" variant="outline" disabled={i === 0} onClick={() => setI(i - 1)}><ChevronLeft /> Previous step</Button>
          <Button size="sm" disabled={i >= steps.length - 1} onClick={() => setI(i + 1)}>Next step <ChevronRight /></Button>
          <Button size="sm" variant="outline" onClick={() => setI(0)}><RotateCcw /> Reset</Button>
        </div>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">Step {i + 1} of {steps.length} (demo position only — nothing is saved).</p>
      <div className="mt-3 grid gap-6 md:grid-cols-2">
        <div>
          <TreePlot tree={partial} points={BUILD_DATA} highlight={inNode} label={`Points in the current node ${step.node.id}: ${dist(step.node)}.`} />
          <p className="text-xs text-muted-foreground">Only the points in the current node are drawn; shading shows the tree built so far.</p>
        </div>
        <div aria-live="polite" className="space-y-3 text-sm">
          <dl className="grid grid-cols-2 gap-2">
            <Stat label="Current node · depth" value={<span className="text-sm">{step.node.id === "root" ? "root" : step.node.id.slice(4)} · {step.node.depth}</span>} />
            <Stat label="Observations" value={<span className="text-sm">{step.node.n} ({dist(step.node)})</span>} />
            <Stat label={`${name} before split`} value={f(step.node.impurity)} />
            <Stat label={`Weighted ${name.toLowerCase()} after`} value={step.chosen ? f(step.chosen.eval.weighted) : "—"} />
          </dl>
          {step.chosen ? <p className="rounded-md border border-primary/50 p-2"><strong>Selected split:</strong> {FEATURES[step.chosen.feature]} ≤ {step.chosen.threshold} → reduction {f(step.chosen.eval.reduction)}</p>
            : <p className="rounded-md border border-warning p-2"><strong>Stop:</strong> {step.reason}. This node becomes a leaf predicting {cls(step.node.prediction)}.</p>}
          {top.length > 0 && <div className="overflow-x-auto"><table className="w-full text-xs"><caption className="mb-1 text-left text-muted-foreground">Best 4 of {step.candidates.length} candidate splits evaluated (midpoints between neighboring values of each feature)</caption>
            <thead><tr className="text-left"><th>Candidate</th><th>Left</th><th>Right</th><th className="text-right">Reduction</th></tr></thead>
            <tbody className="font-mono">{top.map((c) => <tr key={`${c.feature}-${c.threshold}`} className={cn("border-t", c === step.chosen && "bg-primary/10 font-semibold")}><td>{short(c.feature)} ≤ {c.threshold}</td><td>{c.leftCounts.join("/")}</td><td>{c.rightCounts.join("/")}</td><td className="text-right">{f(c.eval.reduction)}</td></tr>)}</tbody></table></div>}
        </div>
      </div>
      <div className="mt-4"><TreeDiagram tree={partial} selected={step.node.id} label="Tree built so far" /></div>
    </Panel>
  );
}

/* ---------- depth explorer, pre-pruning, boundary comparison ---------- */
const DEPTHS = [1, 2, 3, 5, null] as const;
export function DepthExplorer() {
  const [d, setD] = useState<number | null>(2);
  const tree = useMemo(() => buildTree(TREE_TRAIN, { maxDepth: d }), [d]);
  const table = useMemo(() => DEPTHS.map((x) => { const t = buildTree(TREE_TRAIN, { maxDepth: x }); return { d: x, leaves: leaves(t).length, tr: accuracy(t, TREE_TRAIN), va: accuracy(t, TREE_VALID) }; }), []);
  return (
    <Panel title="Lab · max_depth explorer (60 training + 60 validation points, Gini, computed live)" className="border-primary/50">
      <Choice label="max_depth" value={d} options={DEPTHS} onChange={setD} format={depthLabel} />
      <div className="mt-4 grid gap-6 md:grid-cols-2">
        <TreePlot tree={tree} points={TREE_TRAIN} label={`Decision regions for max_depth ${depthLabel(d)}.`} />
        <div className="space-y-3">
          <dl className="grid grid-cols-2 gap-2">
            <Stat label="Leaves" value={leaves(tree).length} /><Stat label="Actual depth" value={depthOf(tree)} />
            <Stat label="Training accuracy" value={percent(accuracy(tree, TREE_TRAIN))} /><Stat label="Validation accuracy" value={percent(accuracy(tree, TREE_VALID))} tone="primary" />
          </dl>
          <div className="overflow-x-auto"><table className="w-full text-sm"><caption className="mb-1 text-left text-xs text-muted-foreground">All depths on the same data</caption>
            <thead><tr className="text-left"><th>max_depth</th><th>Leaves</th><th>Train</th><th>Validation</th></tr></thead>
            <tbody className="font-mono">{table.map((r) => <tr key={String(r.d)} className={cn("border-t", r.d === d && "bg-primary/10")}><td>{depthLabel(r.d)}</td><td>{r.leaves}</td><td>{percent(r.tr)}</td><td>{percent(r.va)}</td></tr>)}</tbody></table></div>
          <p className="text-xs text-muted-foreground">Training accuracy keeps rising as depth grows; validation accuracy peaks and then dips on this dataset. That is a common pattern, not a guarantee.</p>
        </div>
      </div>
      <div className="mt-4"><TreeDiagram tree={tree} label={`Tree structure at max_depth ${depthLabel(d)}`} /></div>
    </Panel>
  );
}
export function BoundaryTriptych() {
  const cfg: [string, number | null][] = [["Very shallow · max_depth 1", 1], ["Moderate · max_depth 3", 3], ["Deep · unrestricted", null]];
  return (
    <Panel title="Computed · the same 60 training points, three tree complexities">
      <div className="grid gap-4 md:grid-cols-3">{cfg.map(([t, d]) => { const tree = buildTree(TREE_TRAIN, { maxDepth: d }); return (
        <div key={t}><p className="mb-1 text-sm font-medium">{t}</p><TreePlot tree={tree} points={TREE_TRAIN} label={`${t} decision regions`} />
          <p className="text-xs">Leaves {leaves(tree).length} · train {percent(accuracy(tree, TREE_TRAIN))} · validation {percent(accuracy(tree, TREE_VALID))}</p></div>); })}</div>
    </Panel>
  );
}
export function PrePruning({ only }: { only?: "leaf" }) {
  const init = { depth: 10, split: 2, leaf: 1 };
  const [s, setS] = useState(init);
  const opts: TreeOptions = { maxDepth: s.depth, minSamplesSplit: s.split, minSamplesLeaf: s.leaf };
  const tree = useMemo(() => buildTree(TREE_TRAIN, opts), [s.depth, s.split, s.leaf]); // eslint-disable-line react-hooks/exhaustive-deps
  const minLeafSeen = Math.min(...leaves(tree).map((l) => l.n));
  return (
    <Panel title={`Lab · Pre-pruning constraints (computed live on the 60 training points)`}>
      <div className="grid gap-6 md:grid-cols-2">
        <TreePlot tree={tree} points={TREE_TRAIN} label="Decision regions under the selected constraints" />
        <div className="space-y-3">
          {only !== "leaf" && <Slider label="max_depth" value={s.depth} min={1} max={10} step={1} onChange={(v) => setS({ ...s, depth: v })} format={String} />}
          {only !== "leaf" && <Slider label="min_samples_split" value={s.split} min={2} max={30} step={1} onChange={(v) => setS({ ...s, split: v })} format={String} />}
          <Slider label="min_samples_leaf" value={s.leaf} min={1} max={15} step={1} onChange={(v) => setS({ ...s, leaf: v })} format={String} />
          <Button size="sm" variant="outline" onClick={() => setS(init)}><RotateCcw /> Reset</Button>
          <dl className="grid grid-cols-2 gap-2">
            <Stat label="Leaves · depth" value={`${leaves(tree).length} · ${depthOf(tree)}`} /><Stat label="Smallest leaf" value={`${minLeafSeen} samples`} />
            <Stat label="Training accuracy" value={percent(accuracy(tree, TREE_TRAIN))} /><Stat label="Validation accuracy" value={percent(accuracy(tree, TREE_VALID))} tone="primary" />
          </dl>
        </div>
      </div>
    </Panel>
  );
}

/* ---------- post-pruning ---------- */
export function PruningExplorer() {
  const [a, setA] = useState(0);
  const full = useMemo(() => buildTree(TREE_TRAIN), []);
  const pruned = useMemo(() => prune(full, a), [full, a]);
  const S = ({ t, label }: { t: TreeNode; label: string }) => <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4"><Stat label={`${label} leaves`} value={leaves(t).length} /><Stat label="Depth" value={depthOf(t)} /><Stat label="Train" value={percent(accuracy(t, TREE_TRAIN))} /><Stat label="Validation" value={percent(accuracy(t, TREE_VALID))} tone="primary" /></dl>;
  return (
    <Panel title="Lab · Cost-complexity pruning (simplified educational implementation)" className="border-primary/50">
      <Slider label="Pruning strength (α, like ccp_alpha)" value={a} min={0} max={0.06} step={0.0025} onChange={setA} format={(v) => v.toFixed(4)} />
      <p className="mt-1 text-xs text-muted-foreground">Weakest-link pruning: repeatedly collapse the branch whose impurity reduction per extra leaf is smallest, while that value is ≤ α. Same idea as scikit-learn's ccp_alpha, but this small browser version is not guaranteed to match its exact trees or α values.</p>
      <div className="mt-4 grid gap-6 md:grid-cols-2">
        <div><p className="mb-1 text-sm font-medium">Before pruning (unrestricted)</p><TreePlot tree={full} points={TREE_TRAIN} label="Unpruned tree regions" /><S t={full} label="Before ·" /></div>
        <div aria-live="polite"><p className="mb-1 text-sm font-medium">After pruning (α = {a.toFixed(4)})</p><TreePlot tree={pruned} points={TREE_TRAIN} label="Pruned tree regions" /><S t={pruned} label="After ·" /></div>
      </div>
      <div className="mt-4"><TreeDiagram tree={pruned} label="Pruned tree structure" /></div>
    </Panel>
  );
}

/* ---------- feature importance ---------- */
export function ImportanceViz() {
  const [d, setD] = useState<number | null>(null);
  const tree = useMemo(() => buildTree(TREE_TRAIN_3, { maxDepth: d }), [d]);
  const imp = featureImportance(tree, 3);
  return (
    <Panel title="Computed · Impurity-based importance on 3 features (Feature 3 is pure random noise)">
      <Choice label="max_depth" value={d} options={[2, 3, null] as const} onChange={setD} format={depthLabel} />
      <ul className="mt-4 space-y-2">{imp.map((v, i) => <li key={i} className="grid grid-cols-[9rem_1fr_3.5rem] items-center gap-2 text-sm">
        <span>{FEATURES[i]}</span><span className="h-3 rounded bg-muted"><span className="block h-3 rounded bg-primary" style={{ width: `${v * 100}%` }} /></span><span className="text-right font-mono">{f(v, 2)}</span></li>)}</ul>
      <p className="mt-3 text-xs text-muted-foreground">Values sum to 1. Leaves {leaves(tree).length} · validation accuracy {percent(accuracy(tree, TREE_VALID_3))}. When the tree grows deep, it can split on the noise feature just to fit individual training points, so noise can receive non-zero importance.</p>
    </Panel>
  );
}

/* ---------- evaluation & imbalance ---------- */
export function TreeEvaluation() {
  const [d, setD] = useState<number | null>(3);
  const tree = useMemo(() => buildTree(TREE_TRAIN, { maxDepth: d }), [d]);
  const counts = countsFor(tree, TREE_VALID);
  const auc = rocAuc(TREE_VALID.map((p) => ({ score: predictProba(tree, p.x), positive: p.y === 1 })));
  return (
    <Panel title="Computed · Decision tree on the 60-point validation set (positive class = Class B)">
      <Choice label="max_depth" value={d} options={DEPTHS} onChange={setD} format={depthLabel} />
      <ConfusionMatrix counts={counts} details={false} positiveLabel="Class B" />
      <MetricCards counts={counts} />
      <dl className="mt-3 grid grid-cols-2 gap-2"><Stat label="ROC-AUC (from leaf probabilities)" value={auc === null ? "Undefined" : f(auc)} tone="primary" /><Stat label="Leaves" value={leaves(tree).length} /></dl>
      <p className="mt-2 text-xs text-muted-foreground">P(Class B) for an observation = share of Class B training points in the leaf it lands in, like predict_proba. A pure-leaf tree only outputs 0 or 1, so its ROC curve has few distinct points.</p>
    </Panel>
  );
}
export function ImbalanceViz() {
  const [weighted, setWeighted] = useState(false);
  const w = balancedWeights(IMB_TRAIN);
  const tree = useMemo(() => buildTree(IMB_TRAIN, { maxDepth: 2, classWeight: weighted ? w : undefined }), [weighted]); // eslint-disable-line react-hooks/exhaustive-deps
  const counts = countsFor(tree, IMB_VALID);
  const nB = IMB_TRAIN.filter((p) => p.y).length;
  return (
    <Panel title="Computed · Imbalanced data (max_depth = 2, positive class = Class B)">
      <p className="text-sm">Training set: {IMB_TRAIN.length - nB} × Class A, {nB} × Class B ({percent(nB / IMB_TRAIN.length)} minority).</p>
      <div className="my-2 flex h-3 overflow-hidden rounded" aria-hidden><span className="bg-primary/60" style={{ width: `${100 - (nB / IMB_TRAIN.length) * 100}%` }} /><span className="bg-secondary-accent" style={{ width: `${(nB / IMB_TRAIN.length) * 100}%` }} /></div>
      <Choice label="class_weight" value={weighted ? "balanced" : "None"} options={["None", "balanced"] as const} onChange={(v) => setWeighted(v === "balanced")} />
      {weighted && <p className="mt-1 text-xs text-muted-foreground">balanced weights = n / (2 · n_class): A = {f(w[0], 2)}, B = {f(w[1], 2)}.</p>}
      <div className="mt-3 grid gap-6 md:grid-cols-2">
        <TreePlot tree={tree} points={IMB_TRAIN} label="Decision regions on imbalanced data" />
        <div><ConfusionMatrix counts={counts} details={false} positiveLabel="Class B" /></div>
      </div>
      <MetricCards counts={counts} />
      <p className="mt-2 text-xs text-muted-foreground">Validation set: {IMB_VALID.length} points with the same imbalance. Accuracy {percent(metrics(counts).accuracy)}, recall {percent(metrics(counts).recall)} — compare both settings.</p>
    </Panel>
  );
}

export const TreeChip = ({ children }: { children: ReactNode }) => <code className="rounded bg-muted px-1 font-mono text-sm">{children}</code>;
