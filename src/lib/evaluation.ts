export type Counts = { tp: number; tn: number; fp: number; fn: number };
export const DEFAULT_COUNTS: Counts = { tp: 40, tn: 45, fp: 5, fn: 10 };
export const divide = (a: number, b: number): number | null => b === 0 ? null : a / b;
export function metrics({ tp, tn, fp, fn }: Counts) {
  const total = tp + tn + fp + fn;
  return {
    total, correct: tp + tn, incorrect: fp + fn,
    accuracy: divide(tp + tn, total), precision: divide(tp, tp + fp),
    recall: divide(tp, tp + fn), f1: divide(2 * tp, 2 * tp + fp + fn),
    fpr: divide(fp, fp + tn), fnr: divide(fn, fn + tp),
  };
}
export const percent = (v: number | null) => v === null ? "Undefined" : `${(v * 100).toFixed(1)}%`;
export type Observation = { score: number; positive: boolean; weight?: number };
export const OBSERVATIONS: Observation[] = [
  { score: .08, positive: false }, { score: .16, positive: false },
  { score: .25, positive: true }, { score: .32, positive: false },
  { score: .42, positive: true }, { score: .48, positive: false },
  { score: .56, positive: false }, { score: .63, positive: true },
  { score: .71, positive: true }, { score: .79, positive: false },
  { score: .87, positive: true }, { score: .94, positive: true },
];
// Weighted score groups represent exactly 20 fraudulent and 980 legitimate transactions.
export const FRAUD_OBSERVATIONS: Observation[] = [
  { score: .08, positive: false, weight: 900 }, { score: .3, positive: false, weight: 50 },
  { score: .6, positive: false, weight: 20 }, { score: .85, positive: false, weight: 10 },
  { score: .2, positive: true, weight: 2 }, { score: .4, positive: true, weight: 3 },
  { score: .65, positive: true, weight: 5 }, { score: .9, positive: true, weight: 10 },
];
export function countsAt(threshold: number, data: Observation[] = OBSERVATIONS): Counts {
  return data.reduce<Counts>((counts, row) => {
    const predicted = row.score >= threshold;
    const key = row.positive ? (predicted ? "tp" : "fn") : (predicted ? "fp" : "tn");
    counts[key] += row.weight ?? 1;
    return counts;
  }, { tp: 0, tn: 0, fp: 0, fn: 0 });
}
// Deterministic precomputed threshold sweep; no trained model or network required.
export const CURVE_POINTS = [1, .94, .87, .79, .71, .63, .56, .48, .42, .32, .25, .16, .08, 0].map(threshold => ({ threshold, ...metrics(countsAt(threshold)) }));
export function rocAuc(data: Observation[] = OBSERVATIONS) {
  const positives = data.filter(row => row.positive);
  const negatives = data.filter(row => !row.positive);
  let wins = 0;
  for (const p of positives) for (const n of negatives) {
    wins += (p.score > n.score ? 1 : p.score === n.score ? .5 : 0) * (p.weight ?? 1) * (n.weight ?? 1);
  }
  return divide(wins, positives.reduce((n, row) => n + (row.weight ?? 1), 0) * negatives.reduce((n, row) => n + (row.weight ?? 1), 0));
}