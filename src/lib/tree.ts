/** Decision-tree math for Phase 5: impurity, greedy CART-style growth, prediction, pruning and importance. Browser-only, deterministic. */
import type { Counts } from "./evaluation";

export type Criterion = "gini" | "entropy";
export type TPoint = { id: string; x: number[]; y: 0 | 1 };
export type TreeNode = {
  id: string; depth: number; n: number; counts: number[]; weighted: number[]; impurity: number; prediction: 0 | 1;
  split?: { feature: number; threshold: number; gain: number } | undefined; left?: TreeNode | undefined; right?: TreeNode | undefined;
};
export type TreeOptions = { criterion?: Criterion | undefined; maxDepth?: number | null | undefined; minSamplesSplit?: number | undefined; minSamplesLeaf?: number | undefined; classWeight?: [number, number] | undefined };

const total = (c: number[]) => c.reduce((a, b) => a + b, 0);
/** Proportions, or null for an empty node (never divides by zero). */
export const proportions = (c: number[]): number[] | null => { const n = total(c); return n > 0 ? c.map((v) => v / n) : null; };
/** Gini = 1 − Σ pᵢ². Returns null for an empty node. */
export function gini(c: number[]): number | null { const p = proportions(c); return p ? 1 - p.reduce((s, v) => s + v * v, 0) : null; }
/** Entropy = −Σ pᵢ log₂ pᵢ, with the convention 0·log₂0 = 0. Returns null for an empty node. */
export function entropy(c: number[]): number | null {
  const p = proportions(c); if (!p) return null;
  const h = -p.reduce((s, v) => s + (v > 0 ? v * Math.log2(v) : 0), 0);
  return Math.abs(h) < 1e-12 ? 0 : h;
}
export const impurity = (c: number[], crit: Criterion) => (crit === "gini" ? gini(c) : entropy(c)) ?? 0;

export type SplitEval = { parent: number; left: number; right: number; weighted: number; reduction: number; nL: number; nR: number; nP: number };
/** Weighted child impurity uses nLeft/nParent and nRight/nParent — never a plain average. */
export function evaluateSplit(left: number[], right: number[], crit: Criterion): SplitEval | null {
  const nL = total(left), nR = total(right), nP = nL + nR;
  if (nP === 0) return null;
  const parentCounts = left.map((v, i) => v + (right[i] ?? 0));
  const parent = impurity(parentCounts, crit), l = impurity(left, crit), r = impurity(right, crit);
  const weighted = (nL / nP) * l + (nR / nP) * r;
  return { parent, left: l, right: r, weighted, reduction: parent - weighted, nL, nR, nP };
}

const countsOf = (pts: TPoint[], w: [number, number] = [1, 1]) => {
  const c = [0, 0], cw = [0, 0];
  for (const p of pts) { c[p.y]! += 1; cw[p.y]! += w[p.y]; }
  return { c, cw };
};
const majority = (cw: number[]): 0 | 1 => ((cw[1] ?? 0) > (cw[0] ?? 0) ? 1 : 0); // ties → Class A

export type Candidate = { feature: number; threshold: number; leftCounts: number[]; rightCounts: number[]; eval: SplitEval };
/** All midpoint thresholds for every feature, respecting min_samples_leaf. */
export function candidates(pts: TPoint[], crit: Criterion, minLeaf = 1, w: [number, number] = [1, 1]): Candidate[] {
  const out: Candidate[] = [];
  const nf = pts[0]?.x.length ?? 0;
  for (let f = 0; f < nf; f++) {
    const vals = [...new Set(pts.map((p) => p.x[f]!))].sort((a, b) => a - b);
    for (let i = 0; i < vals.length - 1; i++) {
      const t = Math.round(((vals[i]! + vals[i + 1]!) / 2) * 1000) / 1000;
      const L = pts.filter((p) => p.x[f]! <= t), R = pts.filter((p) => p.x[f]! > t);
      if (L.length < minLeaf || R.length < minLeaf) continue;
      const lc = countsOf(L, w), rc = countsOf(R, w);
      const e = evaluateSplit(lc.cw, rc.cw, crit);
      if (e) out.push({ feature: f, threshold: t, leftCounts: lc.c, rightCounts: rc.c, eval: e });
    }
  }
  return out;
}
/** Highest reduction wins; ties broken by lower feature index then lower threshold (deterministic). */
export const bestCandidate = (c: Candidate[]) => c.reduce<Candidate | undefined>((b, x) => (!b || x.eval.reduction > b.eval.reduction + 1e-12 ? x : b), undefined);

export type BuildStep = { node: TreeNode; candidates: Candidate[]; chosen?: Candidate | undefined; reason?: string | undefined };
/** Greedy, depth-first, recursive growth (CART-style). Optionally records each step for the tree-building demo. */
export function buildTree(pts: TPoint[], o: TreeOptions = {}, steps?: BuildStep[]): TreeNode {
  const crit = o.criterion ?? "gini", minSplit = o.minSamplesSplit ?? 2, minLeaf = o.minSamplesLeaf ?? 1, maxD = o.maxDepth ?? Infinity, w = o.classWeight ?? [1, 1];
  const grow = (p: TPoint[], depth: number, id: string): TreeNode => {
    const { c, cw } = countsOf(p, w);
    const node: TreeNode = { id, depth, n: p.length, counts: c, weighted: cw, impurity: impurity(cw, crit), prediction: majority(cw) };
    let reason: string | undefined;
    if (node.impurity === 0) reason = "node is pure";
    else if (depth >= maxD) reason = "max_depth reached";
    else if (p.length < minSplit) reason = "fewer than min_samples_split samples";
    const cand = reason ? [] : candidates(p, crit, minLeaf, w);
    const best = bestCandidate(cand);
    if (!reason && (!best || best.eval.reduction <= 1e-12)) reason = best ? "no split reduces impurity" : "no split satisfies min_samples_leaf";
    steps?.push({ node, candidates: cand, chosen: reason ? undefined : best, reason });
    if (reason || !best) return node;
    node.split = { feature: best.feature, threshold: best.threshold, gain: best.eval.reduction };
    node.left = grow(p.filter((q) => q.x[best.feature]! <= best.threshold), depth + 1, id + "L");
    node.right = grow(p.filter((q) => q.x[best.feature]! > best.threshold), depth + 1, id + "R");
    return node;
  };
  return grow(pts, 0, "root");
}

export function predict(t: TreeNode, x: number[]): 0 | 1 {
  let n = t;
  while (n.split && n.left && n.right) n = x[n.split.feature]! <= n.split.threshold ? n.left : n.right;
  return n.prediction;
}
/** Leaf class share of Class B — the same idea as predict_proba for a tree. */
export function predictProba(t: TreeNode, x: number[]): number {
  let n = t;
  while (n.split && n.left && n.right) n = x[n.split.feature]! <= n.split.threshold ? n.left : n.right;
  return n.n ? (n.counts[1] ?? 0) / n.n : 0;
}
export const leaves = (t: TreeNode): TreeNode[] => (t.left && t.right ? [...leaves(t.left), ...leaves(t.right)] : [t]);
export const depthOf = (t: TreeNode): number => (t.left && t.right ? 1 + Math.max(depthOf(t.left), depthOf(t.right)) : 0);
export const nodes = (t: TreeNode): TreeNode[] => (t.left && t.right ? [t, ...nodes(t.left), ...nodes(t.right)] : [t]);

export function countsFor(t: TreeNode, data: TPoint[]): Counts {
  const c: Counts = { tp: 0, tn: 0, fp: 0, fn: 0 };
  for (const p of data) { const y = predict(t, p.x); c[p.y ? (y ? "tp" : "fn") : (y ? "fp" : "tn")] += 1; }
  return c;
}
export const accuracy = (t: TreeNode, data: TPoint[]) => (data.length ? data.filter((p) => predict(t, p.x) === p.y).length / data.length : 0);

/** Impurity-based importance: Σ over splits of (n_t/N)·reduction, normalised to sum to 1. */
export function featureImportance(t: TreeNode, nf: number): number[] {
  const imp = Array<number>(nf).fill(0);
  for (const n of nodes(t)) if (n.split && n.left && n.right) {
    const r = n.impurity - (n.left.n / n.n) * n.left.impurity - (n.right.n / n.n) * n.right.impurity;
    imp[n.split.feature]! += (n.n / t.n) * r;
  }
  const s = imp.reduce((a, b) => a + b, 0);
  return s > 0 ? imp.map((v) => v / s) : imp;
}

/**
 * Weakest-link cost-complexity pruning (simplified, educational): R(t) = (n_t/N)·impurity(t).
 * Repeatedly collapses the internal node with the smallest effective alpha while it is ≤ ccpAlpha.
 */
export function prune(t: TreeNode, ccpAlpha: number): TreeNode {
  const N = t.n;
  const clone = (n: TreeNode): TreeNode => ({ ...n, left: n.left && clone(n.left), right: n.right && clone(n.right) });
  const root = clone(t);
  const R = (n: TreeNode) => (n.n / N) * n.impurity;
  for (;;) {
    let weakest: TreeNode | undefined, best = Infinity;
    for (const n of nodes(root)) if (n.left && n.right) {
      const lv = leaves(n);
      const a = (R(n) - lv.reduce((s, l) => s + R(l), 0)) / (lv.length - 1);
      if (a < best - 1e-12) { best = a; weakest = n; }
    }
    if (!weakest || best > ccpAlpha) return root;
    delete weakest.split; delete weakest.left; delete weakest.right;
  }
}

/* ---------- deterministic synthetic datasets ---------- */
function rng(seed: number) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const r1 = (v: number) => Math.round(v * 10) / 10;
/** True pattern: Class B when (F1 > 5 and F2 > 3) or (F1 ≤ 5 and F2 > 7); ~10% of labels are flipped as noise. */
const truth = (a: number, b: number): 0 | 1 => ((a > 5 && b > 3) || (a <= 5 && b > 7) ? 1 : 0);
function makeSet(n: number, seed: number, prefix: string, extraNoiseFeature = false): TPoint[] {
  const r = rng(seed);
  return Array.from({ length: n }, (_, i) => {
    const a = r1(0.3 + r() * 9.4), b = r1(0.3 + r() * 9.4), z = r1(r() * 10);
    let y = truth(a, b); if (r() < 0.1) y = (1 - y) as 0 | 1;
    return { id: `${prefix}${i}`, x: extraNoiseFeature ? [a, b, z] : [a, b], y };
  });
}
export const TREE_TRAIN = makeSet(60, 21, "t");
export const TREE_VALID = makeSet(60, 121, "v");
/** Same points plus Feature 3: pure random noise with many unique values (for the importance experiment). */
export const TREE_TRAIN_3 = makeSet(60, 21, "t", true);
export const TREE_VALID_3 = makeSet(60, 121, "v", true);

/** 12-point dataset for the step-by-step tree-building demo. */
export const BUILD_DATA: TPoint[] = ([
  [1, 2, 0], [2, 1, 0], [2, 4, 0], [3, 3, 0], [1, 7, 0], [4, 8, 1], [3, 9, 1], [2, 6, 0],
  [6, 2, 0], [8, 1, 0], [7, 5, 1], [8, 6, 1], [6, 7, 1], [9, 8, 1], [7, 3, 1], [9, 4, 1],
] as const).map(([a, b, y], i) => ({ id: `b${i}`, x: [a, b], y: y as 0 | 1 }));

/** Imbalanced set: the minority class (B) is roughly 1 in 8. */
function makeImbalanced(n: number, seed: number, prefix: string): TPoint[] {
  const r = rng(seed);
  return Array.from({ length: n }, (_, i) => {
    const minority = i % 8 === 0;
    const a = minority ? r1(5.5 + r() * 4) : r1(0.3 + r() * 9.4), b = minority ? r1(5 + r() * 4.5) : r1(0.3 + r() * 9.4);
    const y: 0 | 1 = minority ? 1 : 0;
    return { id: `${prefix}${i}`, x: [a, b], y };
  });
}
export const IMB_TRAIN = makeImbalanced(64, 3, "i");
export const IMB_VALID = makeImbalanced(64, 31, "j");
export const balancedWeights = (pts: TPoint[]): [number, number] => {
  const n1 = pts.filter((p) => p.y).length, n0 = pts.length - n1;
  return [pts.length / (2 * Math.max(n0, 1)), pts.length / (2 * Math.max(n1, 1))];
};

/* ---------- hand-specified trees (explorer) and collapsing ---------- */
export type Spec = { feature: number; threshold: number; left?: Spec | null; right?: Spec | null } | null;
/** Builds a tree with a fixed structure; counts and impurity are recomputed from the data every time. */
export function fixedTree(pts: TPoint[], spec: Spec, crit: Criterion = "gini", id = "root", depth = 0): TreeNode {
  const { c } = countsOf(pts);
  const node: TreeNode = { id, depth, n: pts.length, counts: c, weighted: c, impurity: impurity(c, crit), prediction: majority(c) };
  if (!spec) return node;
  const L = pts.filter((p) => p.x[spec.feature]! <= spec.threshold), R = pts.filter((p) => p.x[spec.feature]! > spec.threshold);
  node.left = fixedTree(L, spec.left ?? null, crit, id + "L", depth + 1);
  node.right = fixedTree(R, spec.right ?? null, crit, id + "R", depth + 1);
  const e = evaluateSplit(node.left.counts, node.right.counts, crit);
  node.split = { feature: spec.feature, threshold: spec.threshold, gain: e?.reduction ?? 0 };
  return node;
}
/** Returns a copy where the listed nodes become leaves (their majority class is kept as the prediction). */
export function collapse(t: TreeNode, ids: ReadonlySet<string>): TreeNode {
  if (ids.has(t.id) || !t.left || !t.right) { const { split: _s, left: _l, right: _r, ...rest } = t; return rest; }
  return { ...t, left: collapse(t.left, ids), right: collapse(t.right, ids) };
}
