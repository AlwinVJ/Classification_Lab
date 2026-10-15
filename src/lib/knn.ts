import { countsAt, metrics, type Counts, type Observation } from "./evaluation";

export type Metric = "euclidean" | "manhattan" | "minkowski";
export type Voting = "uniform" | "distance";
export type KPoint = { id: string; x1: number; x2: number; y: 0 | 1 };
export const CLASS_NAMES = ["Class A", "Class B"] as const;

/** Minkowski distance; p = 1 → Manhattan, p = 2 → Euclidean. */
export function minkowski(a: number[], b: number[], p: number) {
  return Math.pow(a.reduce((s, ai, i) => s + Math.pow(Math.abs(ai - (b[i] ?? 0)), p), 0), 1 / p);
}
export const euclidean = (a: number[], b: number[]) => Math.sqrt(a.reduce((s, ai, i) => s + (ai - (b[i] ?? 0)) ** 2, 0));
export const manhattan = (a: number[], b: number[]) => a.reduce((s, ai, i) => s + Math.abs(ai - (b[i] ?? 0)), 0);
export function distance(a: number[], b: number[], metric: Metric, p = 3) {
  return metric === "euclidean" ? euclidean(a, b) : metric === "manhattan" ? manhattan(a, b) : minkowski(a, b, p);
}

export type Neighbor = KPoint & { d: number; weight: number };
export type KnnOptions = { k: number; metric: Metric; voting: Voting; p?: number };
export type KnnResult = { neighbors: Neighbor[]; scores: [number, number]; counts: [number, number]; predicted: 0 | 1; tie: boolean; proba: number };

/**
 * Plain brute-force KNN. Ties in distance keep dataset order (stable sort).
 * Distance weighting uses 1/d; if any neighbor sits at distance 0, only those
 * exact matches vote (the convention scikit-learn uses). Vote ties go to the
 * lower label (Class A), mirroring argmax behaviour.
 */
export function knnPredict(q: [number, number], data: KPoint[], { k, metric, voting, p = 3 }: KnnOptions): KnnResult {
  const kk = Math.max(1, Math.min(k, data.length));
  const sorted = data.map((pt) => ({ ...pt, d: distance(q, [pt.x1, pt.x2], metric, p), weight: 1 })).sort((a, b) => a.d - b.d);
  const nb = sorted.slice(0, kk);
  const exact = nb.some((n) => n.d === 0);
  for (const n of nb) n.weight = voting === "uniform" ? 1 : exact ? (n.d === 0 ? 1 : 0) : 1 / n.d;
  const scores: [number, number] = [0, 0], counts: [number, number] = [0, 0];
  for (const n of nb) { scores[n.y] += n.weight; counts[n.y] += 1; }
  const tie = Math.abs(scores[0] - scores[1]) < 1e-12;
  const predicted: 0 | 1 = scores[1] > scores[0] && !tie ? 1 : 0;
  return { neighbors: nb, scores, counts, predicted, tie, proba: scores[1] / (scores[0] + scores[1]) };
}

/* ---------- deterministic synthetic data ---------- */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const r1 = (v: number) => Math.round(v * 10) / 10;
/** Four blobs in an XOR-like layout: a pattern no single straight line can separate. */
function blobs(seed: number, per: number, prefix: string): KPoint[] {
  const rand = rng(seed);
  const gauss = () => Math.sqrt(-2 * Math.log(1 - rand())) * Math.cos(2 * Math.PI * rand());
  const centres: [number, number, 0 | 1][] = [[2.8, 2.8, 0], [7.2, 7.2, 0], [2.8, 7.2, 1], [7.2, 2.8, 1]];
  const out: KPoint[] = [];
  for (let i = 0; i < per; i++) for (const [cx, cy, y] of centres) {
    out.push({ id: `${prefix}${out.length + 1}`, x1: r1(Math.min(9.6, Math.max(0.4, cx + gauss() * 1.25))), x2: r1(Math.min(9.6, Math.max(0.4, cy + gauss() * 1.25))), y });
  }
  return out;
}
export const KNN_TRAIN: KPoint[] = blobs(7, 9, "T");
export const KNN_VALID: KPoint[] = blobs(99, 10, "V");
/** A mislabeled point used in the noise experiment. */
export const NOISY_POINT: KPoint = { id: "N", x1: 3.0, x2: 3.2, y: 1 };
export const K_CHOICES = [1, 3, 5, 7, 9, 11] as const;

/** Evaluate a KNN configuration on labeled data with the shared Phase 2 counting (positive = Class B). */
export function evaluateKnn(opts: KnnOptions, train: KPoint[] = KNN_TRAIN, test: KPoint[] = KNN_VALID) {
  const obs: Observation[] = test.map((pt) => { const r = knnPredict([pt.x1, pt.x2], train, opts); return { score: r.predicted, positive: pt.y === 1, proba: r.proba } as Observation & { proba: number }; });
  const counts: Counts = countsAt(0.5, obs);
  const probaObs: Observation[] = obs.map((o) => ({ score: (o as Observation & { proba: number }).proba, positive: o.positive }));
  return { counts, metrics: metrics(counts), probaObs };
}

/* ---------- worked example (fixed small table) ---------- */
export const WORKED: (KPoint & { label: "Red" | "Blue" })[] = [
  { id: "A", x1: 1, x2: 2, y: 0, label: "Red" }, { id: "B", x1: 2, x2: 3, y: 0, label: "Red" }, { id: "C", x1: 3, x2: 3, y: 1, label: "Blue" },
  { id: "D", x1: 6, x2: 5, y: 1, label: "Blue" }, { id: "E", x1: 5, x2: 4, y: 1, label: "Blue" },
];
export const WORKED_QUERY: [number, number] = [3, 2];

/* ---------- feature scaling example ---------- */
export type Customer = { id: string; age: number; income: number; y: 0 | 1 };
/** Class depends mostly on age; income is large-scale noise. */
export const CUSTOMERS: Customer[] = [
  { id: "C1", age: 22, income: 52000, y: 0 }, { id: "C2", age: 25, income: 118000, y: 0 }, { id: "C3", age: 29, income: 64000, y: 0 },
  { id: "C4", age: 31, income: 150000, y: 0 }, { id: "C5", age: 34, income: 91000, y: 0 }, { id: "C6", age: 38, income: 30000, y: 0 },
  { id: "C7", age: 55, income: 61000, y: 1 }, { id: "C8", age: 59, income: 140000, y: 1 }, { id: "C9", age: 63, income: 88000, y: 1 },
  { id: "C10", age: 67, income: 45000, y: 1 }, { id: "C11", age: 72, income: 176000, y: 1 }, { id: "C12", age: 78, income: 99000, y: 1 },
];
export const CUSTOMER_QUERY = { age: 60, income: 92000 };
export type Scaling = "none" | "standard" | "minmax";
export function scaler(mode: Scaling, data: Customer[] = CUSTOMERS) {
  const cols = (["age", "income"] as const).map((k) => {
    const v = data.map((d) => d[k]);
    const mean = v.reduce((a, b) => a + b, 0) / v.length;
    const sd = Math.sqrt(v.reduce((a, b) => a + (b - mean) ** 2, 0) / v.length); // population SD, like StandardScaler
    return { mean, sd, min: Math.min(...v), max: Math.max(...v) };
  });
  return (age: number, income: number): [number, number] => [age, income].map((x, i) => {
    const c = cols[i]!;
    return mode === "none" ? x : mode === "standard" ? (x - c.mean) / c.sd : (x - c.min) / (c.max - c.min);
  }) as [number, number];
}

/* ---------- curse of dimensionality (real computation, illustrative data) ---------- */
/** Average nearest/farthest distance ratio from query points to uniform random points in [0,1]^d. */
export function distanceContrast(d: number, n = 200, queries = 10, seed = 3) {
  const rand = rng(seed + d);
  const pts = Array.from({ length: n }, () => Array.from({ length: d }, rand));
  let ratio = 0;
  for (let q = 0; q < queries; q++) {
    const query = Array.from({ length: d }, rand);
    let lo = Infinity, hi = 0;
    for (const p of pts) { const dist = euclidean(query, p); lo = Math.min(lo, dist); hi = Math.max(hi, dist); }
    ratio += lo / hi;
  }
  return ratio / queries;
}
export const DIMENSIONS = [1, 2, 5, 10, 50, 100, 500] as const;
