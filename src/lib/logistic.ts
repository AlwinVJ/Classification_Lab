import { countsAt, type Counts, type Observation } from "./evaluation";

/** Numerically stable logistic function σ(z) = 1 / (1 + e^-z). */
export const sigmoid = (z: number) => (z >= 0 ? 1 / (1 + Math.exp(-z)) : Math.exp(z) / (1 + Math.exp(z)));
/** Odds p/(1-p); null when p = 1 (infinite). */
export const odds = (p: number): number | null => (p >= 1 ? null : p / (1 - p));
/** Logit log(p/(1-p)); null outside the open interval (0, 1). */
export const logit = (p: number): number | null => (p <= 0 || p >= 1 ? null : Math.log(p / (1 - p)));
/** Binary cross-entropy for one observation, clipped like most libraries to stay finite. */
export function logLoss(y: 0 | 1, p: number) {
  const q = Math.min(1 - 1e-15, Math.max(1e-15, p));
  return -(y * Math.log(q) + (1 - y) * Math.log(1 - q));
}
export const linearScore = (w: number[], x: number[], b: number) => w.reduce((s, wi, i) => s + wi * (x[i] ?? 0), b);

export type Point = { id: string; x1: number; x2: number; y: 0 | 1 };
/** Deterministic, slightly overlapping 2D dataset (not linearly separable). */
export const POINTS: Point[] = [
  [1.5, 1.2, 1], [2.4, 0.6, 1], [0.8, 2.1, 1], [2.8, 2.2, 1], [1.9, -0.4, 1], [0.4, 1.0, 1], [3.0, -1.0, 1], [1.2, 0.2, 1], [-0.6, 2.6, 1], [-0.4, 0.5, 1],
  [-1.5, -1.2, 0], [-2.4, -0.3, 0], [-0.8, -2.1, 0], [-2.6, 1.4, 0], [-1.0, 0.3, 0], [0.3, -1.6, 0], [-2.0, -2.4, 0], [1.6, -2.2, 0], [0.6, -0.4, 0], [1.0, 0.9, 0],
].map(([x1, x2, y], i) => ({ id: `P${i + 1}`, x1: x1!, x2: x2!, y: y as 0 | 1 }));

export type Params = { w1: number; w2: number; b: number };
export const prob = ({ w1, w2, b }: Params, x1: number, x2: number) => sigmoid(w1 * x1 + w2 * x2 + b);
export const toObservations = (params: Params, data: Point[] = POINTS): Observation[] => data.map((p) => ({ score: prob(params, p.x1, p.x2), positive: p.y === 1 }));
/** Reuses the Phase 2 counting logic so every view shares one definition of TP/TN/FP/FN. */
export const datasetCounts = (params: Params, threshold = 0.5, data: Point[] = POINTS): Counts => countsAt(threshold, toObservations(params, data));
export const meanLoss = (params: Params, data: Point[] = POINTS) => data.reduce((s, p) => s + logLoss(p.y, prob(params, p.x1, p.x2)), 0) / data.length;

/** Plain batch gradient descent on mean log loss, starting from all-zero parameters. */
export function gradientDescentPath(learningRate = 0.5, steps = 60, data: Point[] = POINTS) {
  let w = { w1: 0, w2: 0, b: 0 };
  const path = [{ ...w, loss: meanLoss(w, data) }];
  for (let s = 0; s < steps; s++) {
    let g1 = 0, g2 = 0, gb = 0;
    for (const p of data) { const e = prob(w, p.x1, p.x2) - p.y; g1 += e * p.x1; g2 += e * p.x2; gb += e; }
    const m = data.length;
    w = { w1: w.w1 - learningRate * g1 / m, w2: w.w2 - learningRate * g2 / m, b: w.b - learningRate * gb / m };
    path.push({ ...w, loss: meanLoss(w, data) });
  }
  return path;
}

/**
 * Educational L2-regularised fit using scikit-learn's objective form:
 * ½‖w‖² + C·Σ loss (bias not penalised). Solved with simple gradient descent,
 * so values approximate — but are not guaranteed identical to — scikit-learn.
 */
export function fitL2(C: number, data: Point[] = POINTS, steps = 4000): Params {
  const L = 1 + C * data.reduce((s, p) => s + p.x1 * p.x1 + p.x2 * p.x2 + 1, 0) / 4;
  const lr = 1 / L;
  let w = { w1: 0, w2: 0, b: 0 };
  for (let s = 0; s < steps; s++) {
    let g1 = w.w1, g2 = w.w2, gb = 0;
    for (const p of data) { const e = C * (prob(w, p.x1, p.x2) - p.y); g1 += e * p.x1; g2 += e * p.x2; gb += e; }
    w = { w1: w.w1 - lr * g1, w2: w.w2 - lr * g2, b: w.b - lr * gb };
  }
  return w;
}
export const C_VALUES = [0.01, 0.1, 1, 10, 100] as const;

/** Synthetic predicted probabilities with actual labels for the threshold explorer. */
export const LR_OBSERVATIONS: Observation[] = [
  { score: .12, positive: false }, { score: .21, positive: false }, { score: .34, positive: true }, { score: .48, positive: false },
  { score: .52, positive: true }, { score: .67, positive: false }, { score: .81, positive: true }, { score: .94, positive: true },
];

/** Illustrative churn model (synthetic weights, not fitted to real customers). */
export const CHURN = { tenure: -0.05, charges: 0.03, tickets: 0.4, bias: -1.5 };
export const churnScore = (tenure: number, charges: number, tickets: number) => CHURN.tenure * tenure + CHURN.charges * charges + CHURN.tickets * tickets + CHURN.bias;
