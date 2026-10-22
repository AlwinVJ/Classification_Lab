/**
 * Small, deterministic SVM solver for teaching. Implements a simplified SMO
 * (Platt) with a deterministic pair choice, so every visualization re-fits a
 * real soft-margin SVM on tiny synthetic datasets. It is an educational
 * implementation, not scikit-learn/libsvm, so values can differ slightly.
 */
export type Label = -1 | 1;
export type SPoint = { id: string; x: [number, number]; y: Label };
export type KernelName = "linear" | "poly" | "rbf";
export type Kernel = { name: KernelName; gamma: number; degree: number; coef0: number };
export type SvmModel = { alpha: number[]; b: number; points: SPoint[]; kernel: Kernel; C: number; iterations: number };

export const LINEAR: Kernel = { name: "linear", gamma: 1, degree: 3, coef0: 1 };
export const kernelOf = (name: KernelName, gamma = 0.5, degree = 3, coef0 = 1): Kernel => ({ name, gamma, degree, coef0 });

export function kernelValue(k: Kernel, a: readonly number[], b: readonly number[]): number {
  const dot = a[0]! * b[0]! + a[1]! * b[1]!;
  if (k.name === "linear") return dot;
  if (k.name === "poly") return Math.pow(k.gamma * dot + k.coef0, k.degree);
  const d0 = a[0]! - b[0]!, d1 = a[1]! - b[1]!;
  return Math.exp(-k.gamma * (d0 * d0 + d1 * d1));
}

/** classWeight multiplies C per class, like scikit-learn's class_weight. */
export function fitSvm(points: SPoint[], C: number, kernel: Kernel = LINEAR, opts: { tol?: number; maxPasses?: number; classWeight?: Partial<Record<Label, number>> } = {}): SvmModel {
  const n = points.length, tol = opts.tol ?? 1e-4, maxIter = opts.maxPasses ?? 6000;
  const K = points.map((p) => points.map((q) => kernelValue(kernel, p.x, q.x)));
  const y = points.map((p) => p.y);
  const Cs = y.map((l) => C * (opts.classWeight?.[l] ?? 1));
  const alpha = new Array<number>(n).fill(0);
  let b = 0;
  const f = (i: number) => { let s = b; for (let j = 0; j < n; j++) if (alpha[j]) s += alpha[j]! * y[j]! * K[j]![i]!; return s; };
  let it = 0;
  for (; it < maxIter; it++) {
    const E = points.map((_, i) => f(i) - y[i]!);
    // candidates i ordered by KKT violation (deterministic); j maximizes |Ei − Ej|
    const viol = points.map((_, k) => { const r = E[k]! * y[k]!; return (r < -tol && alpha[k]! < Cs[k]!) ? -r : (r > tol && alpha[k]! > 0) ? r : 0; });
    const cands = viol.map((v, k) => [v, k] as const).filter(([v]) => v > 0).sort((a, c) => c[0] - a[0]).map(([, k]) => k);
    if (!cands.length) break;
    let moved = false;
    for (const i of cands) {
    const order = points.map((_, k) => k).filter((k) => k !== i).sort((a, c) => Math.abs(E[i]! - E[c]!) - Math.abs(E[i]! - E[a]!));
    for (const j of order) {
      const ai = alpha[i]!, aj = alpha[j]!;
      const Ci = Cs[i]!, Cj = Cs[j]!;
      const L = y[i] !== y[j] ? Math.max(0, aj - ai) : Math.max(0, ai + aj - Ci);
      const H = y[i] !== y[j] ? Math.min(Cj, Ci + aj - ai) : Math.min(Cj, ai + aj);
      if (H - L < 1e-12) continue;
      const eta = 2 * K[i]![j]! - K[i]![i]! - K[j]![j]!;
      if (eta >= -1e-12) continue;
      let nj = aj - (y[j]! * (E[i]! - E[j]!)) / eta;
      nj = Math.min(H, Math.max(L, nj));
      if (Math.abs(nj - aj) < 1e-9) continue;
      const ni = ai + y[i]! * y[j]! * (aj - nj);
      const b1 = b - E[i]! - y[i]! * (ni - ai) * K[i]![i]! - y[j]! * (nj - aj) * K[i]![j]!;
      const b2 = b - E[j]! - y[i]! * (ni - ai) * K[i]![j]! - y[j]! * (nj - aj) * K[j]![j]!;
      alpha[i] = ni; alpha[j] = nj;
      b = ni > 0 && ni < Ci ? b1 : nj > 0 && nj < Cj ? b2 : (b1 + b2) / 2;
      moved = true; break;
    }
    if (moved) break;
    }
    if (!moved) break;
  }
  return { alpha, b, points, kernel, C, iterations: it };
}

export function decision(m: SvmModel, x: readonly number[]): number {
  let s = m.b;
  for (let j = 0; j < m.points.length; j++) if (m.alpha[j]! > 1e-9) s += m.alpha[j]! * m.points[j]!.y * kernelValue(m.kernel, m.points[j]!.x, x);
  return s;
}
export const predictSvm = (m: SvmModel, x: readonly number[]): Label => (decision(m, x) >= 0 ? 1 : -1);
export const supportVectors = (m: SvmModel) => m.points.filter((_, i) => m.alpha[i]! > 1e-6 * Math.max(1, m.C));
/** Linear models only: w = Σ αᵢ yᵢ xᵢ. */
export function weights(m: SvmModel): [number, number] {
  let w0 = 0, w1 = 0;
  m.points.forEach((p, i) => { w0 += m.alpha[i]! * p.y * p.x[0]; w1 += m.alpha[i]! * p.y * p.x[1]; });
  return [w0, w1];
}
export const norm = (w: readonly number[]) => Math.hypot(w[0]!, w[1]!);
export const halfMargin = (w: readonly number[]) => 1 / norm(w);
export const fullMargin = (w: readonly number[]) => 2 / norm(w);
export const linearScore = (w: readonly number[], b: number, x: readonly number[]) => w[0]! * x[0]! + w[1]! * x[1]! + b;
/** Margin violations: points with yᵢ f(xᵢ) < 1 (inside the margin or misclassified). */
export const violations = (m: SvmModel) => m.points.filter((p) => p.y * decision(m, p.x) < 1 - 1e-3);
export const trainErrors = (m: SvmModel) => m.points.filter((p) => predictSvm(m, p.x) !== p.y).length;
export const accuracyOn = (m: SvmModel, data: SPoint[]) => data.filter((p) => predictSvm(m, p.x) === p.y).length / data.length;
export function hinge(y: Label, score: number) { return Math.max(0, 1 - y * score); }
export function primalObjective(w: readonly number[], b: number, C: number, data: SPoint[]) {
  return 0.5 * (w[0]! ** 2 + w[1]! ** 2) + C * data.reduce((s, p) => s + hinge(p.y, linearScore(w, b, p.x)), 0);
}

/* ---------- deterministic synthetic data ---------- */
function rng(seed: number) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32); }
function gauss(r: () => number) { const u = Math.max(r(), 1e-9), v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
const r1 = (v: number) => Math.round(Math.min(9.7, Math.max(0.3, v)) * 10) / 10;
function blobs(seed: number, n: number, ca: [number, number], cb: [number, number], sd: number, prefix: string): SPoint[] {
  const r = rng(seed), out: SPoint[] = [];
  for (let i = 0; i < n; i++) {
    const y: Label = i % 2 ? 1 : -1, c = y === 1 ? cb : ca;
    out.push({ id: `${prefix}${i}`, x: [r1(c[0] + gauss(r) * sd), r1(c[1] + gauss(r) * sd)], y });
  }
  return out;
}
function rings(seed: number, n: number, prefix: string, noise = 0.45): SPoint[] {
  const r = rng(seed), out: SPoint[] = [];
  for (let i = 0; i < n; i++) {
    const y: Label = i % 2 ? 1 : -1, a = r() * 2 * Math.PI, rad = (y === 1 ? 1.4 : 3.6) + gauss(r) * noise;
    out.push({ id: `${prefix}${i}`, x: [r1(5 + rad * Math.cos(a)), r1(5 + rad * Math.sin(a))], y });
  }
  return out;
}
/** Linearly separable: Class −1 (●) lower-left, Class +1 (▲) upper-right. */
export const SEPARABLE: SPoint[] = blobs(7, 24, [3, 3], [7, 7], 0.8, "s");
/** Overlapping classes plus one deliberately mislabeled outlier. */
export const OVERLAP: SPoint[] = blobs(11, 30, [3.6, 3.6], [6.4, 6.4], 1.15, "o");
export const OUTLIER: SPoint = { id: "outlier", x: [6.6, 6.9], y: -1 };
/** Concentric classes: no straight line separates them. */
export const RINGS: SPoint[] = rings(3, 40, "r");
export const RINGS_VALID: SPoint[] = rings(29, 40, "rv", 0.6);
export const OVERLAP_VALID: SPoint[] = blobs(41, 40, [3.6, 3.6], [6.4, 6.4], 1.15, "ov");
/** Tiny 6-point set for the hyperplane explorer and support-vector demo. */
export const TINY: SPoint[] = [
  { id: "A", x: [2, 2], y: -1 }, { id: "B", x: [3, 4], y: -1 }, { id: "C", x: [2, 5], y: -1 },
  { id: "D", x: [6, 5], y: 1 }, { id: "E", x: [7, 7], y: 1 }, { id: "F", x: [8, 4], y: 1 },
];
/** Scaling demo: feature 2 recorded in a unit 1000× larger (e.g. grams vs kilograms). */
export const toRawUnits = (p: SPoint): SPoint => ({ ...p, x: [p.x[0], p.x[1] * 1000] });
export function standardize(data: SPoint[]) {
  const mean = [0, 1].map((d) => data.reduce((s, p) => s + p.x[d]!, 0) / data.length);
  const sd = [0, 1].map((d) => Math.sqrt(data.reduce((s, p) => s + (p.x[d]! - mean[d]!) ** 2, 0) / data.length) || 1);
  const t = (x: readonly number[]): [number, number] => [(x[0]! - mean[0]!) / sd[0]!, (x[1]! - mean[1]!) / sd[1]!];
  return { mean, sd, t, apply: (pts: SPoint[]) => pts.map((p) => ({ ...p, x: t(p.x) })) };
}
/** Imbalanced: 36 majority (−1) vs 6 minority (+1), overlapping. */
export const IMBALANCED: SPoint[] = [
  ...blobs(53, 72, [4, 4], [4, 4], 1.3, "im").filter((p) => p.y === -1),
  ...blobs(59, 12, [0, 0], [6.3, 6.1], 0.9, "ip").filter((p) => p.y === 1),
];
export const IMBALANCED_VALID: SPoint[] = [
  ...blobs(61, 72, [4, 4], [4, 4], 1.3, "vm").filter((p) => p.y === -1),
  ...blobs(67, 12, [0, 0], [6.3, 6.1], 0.9, "vp").filter((p) => p.y === 1),
];
export const SEPARABLE_OUTLIER: SPoint[] = [...SEPARABLE, { id: "noisy", x: [6.2, 6.0], y: -1 }];
