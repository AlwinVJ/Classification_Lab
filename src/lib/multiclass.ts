import { divide, metrics, type Counts } from './evaluation';
export type LabelMatrix = number[][];
export type ClassCounts = { tp: number; fp: number; fn: number; support: number };
export function classifierCounts(k: number) {
  if (!Number.isInteger(k) || k < 2 || k > 100) throw new Error('Choose an integer from 2 to 100.');
  return { ovr: k, ovo: k * (k - 1) / 2 };
}
export function argmax(scores: number[]) {
  if (!scores.length || scores.some(s => !Number.isFinite(s))) throw new Error('Enter finite class scores.');
  return scores.indexOf(Math.max(...scores));
}
export function softmax(scores: number[]) {
  const winner = argmax(scores), shift = scores[winner] ?? 0;
  const exponentials = scores.map(s => Math.exp(s - shift));
  const sum = exponentials.reduce((a, b) => a + b, 0);
  return { probabilities: exponentials.map(e => e / sum), exponentials, sum, shift, winner };
}
// Undefined per-class values remain null; an average with any undefined term is undefined.
// Weighted averages omit only zero-support terms. Python references use zero_division=np.nan.
const mean = (values: (number | null)[]) => values.length && values.every(v => v !== null) ? values.reduce<number>((a, b) => a + (b ?? 0), 0) / values.length : null;
export function averageMetrics(rows: ClassCounts[]) {
  if (!rows.length || rows.some(r => Object.values(r).some(v => !Number.isInteger(v) || v < 0) || r.support !== r.tp + r.fn)) throw new Error('Counts must be non-negative integers; support equals TP + FN.');
  const perClass = rows.map(r => ({ ...r, ...metrics({ ...r, tn: 0 }) }));
  const totals = rows.reduce((a, r) => ({ tp: a.tp + r.tp, fp: a.fp + r.fp, fn: a.fn + r.fn, tn: 0 }), { tp: 0, fp: 0, fn: 0, tn: 0 });
  const support = rows.reduce((a, r) => a + r.support, 0);
  const weighted = (key: 'precision' | 'recall' | 'f1') => {
    const active = perClass.filter(r => r.support > 0);
    return !support || active.some(r => r[key] === null) ? null : active.reduce((a, r) => a + (r[key] ?? 0) * r.support, 0) / support;
  };
  return { perClass, micro: metrics(totals), macro: { precision: mean(perClass.map(r => r.precision)), recall: mean(perClass.map(r => r.recall)), f1: mean(perClass.map(r => r.f1)) }, weighted: { precision: weighted('precision'), recall: weighted('recall'), f1: weighted('f1') }, support };
}
export function confusionMetrics(matrix: number[][]) {
  if (matrix.length < 2 || matrix.some(r => r.length !== matrix.length || r.some(v => !Number.isInteger(v) || v < 0))) throw new Error('Use a square matrix of non-negative integer counts.');
  const total = matrix.flat().reduce((a, b) => a + b, 0);
  const correct = matrix.reduce((a, r, i) => a + (r[i] ?? 0), 0);
  const rows = matrix.map((r, i) => { const tp = r[i] ?? 0, support = r.reduce((a, b) => a + b, 0); return { tp, fn: support - tp, fp: matrix.reduce((a, row) => a + (row[i] ?? 0), 0) - tp, support }; });
  return { ...averageMetrics(rows), total, correct, accuracy: divide(correct, total) };
}
export function thresholdLabels(probabilities: number[], thresholds: number | number[]) {
  const ts = typeof thresholds === 'number' ? probabilities.map(() => thresholds) : thresholds;
  if (!probabilities.length || ts.length !== probabilities.length || [...probabilities, ...ts].some(v => !Number.isFinite(v) || v < 0 || v > 1)) throw new Error('Probabilities and thresholds must be between 0 and 1.');
  return probabilities.map((p, i) => Number(p >= (ts[i] ?? 1)));
}
export function multilabelMetrics(actual: LabelMatrix, predicted: LabelMatrix) {
  const l = actual[0]?.length ?? 0;
  if (!actual.length || !l || predicted.length !== actual.length || [...actual, ...predicted].some(r => r.length !== l || r.some(v => v !== 0 && v !== 1))) throw new Error('Use matching non-empty binary label matrices.');
  const counts: Counts[] = Array.from({ length: l }, () => ({ tp: 0, fp: 0, fn: 0, tn: 0 }));
  let errors = 0, exact = 0;
  actual.forEach((row, i) => { let match = true; row.forEach((v, j) => { const p = predicted[i]?.[j], c = counts[j]; if (!c) return; c[v ? (p ? 'tp' : 'fn') : (p ? 'fp' : 'tn')]++; if (p !== v) { errors++; match = false; } }); if (match) exact++; });
  return { ...averageMetrics(counts.map(c => ({ ...c, support: c.tp + c.fn }))), counts, errors, hamming: errors / (actual.length * l), subset: exact / actual.length };
}
export const PET_MATRIX = [[18, 2, 0], [3, 12, 1], [1, 2, 5]];
export const LABEL_ACTUAL = [[1, 1, 0, 0], [1, 0, 0, 1], [0, 0, 1, 0], [0, 1, 0, 1]];
export const LABEL_PREDICTED = [[1, 1, 0, 0], [1, 1, 0, 0], [0, 0, 0, 0], [0, 1, 0, 1]];
