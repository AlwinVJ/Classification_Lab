/** Phase 7: genuine, deterministic educational fits; no Python runtime or saved state. */
import { z } from 'zod';
import { countsAt, metrics, rocAuc, type Observation } from './evaluation';
import { fitL2, prob, type Point } from './logistic';
import { knnPredict } from './knn';
import { buildTree, predict, predictProba } from './tree';
import { fitSvm, kernelOf, decision, standardize, type SPoint } from './svm';

export const modelNames = { logistic: 'Logistic Regression', knn: 'KNN', tree: 'Decision Tree', svm: 'SVM' } as const;
export type ModelId = keyof typeof modelNames;
export const datasetNames = { linear: 'Linearly separable', overlap: 'Overlapping classes', moons: 'Two moons', circles: 'Circular classes', imbalanced: 'Imbalanced classes' } as const;
export const metricNames = { accuracy: 'Accuracy', precision: 'Precision', recall: 'Recall', f1: 'F1-score', auc: 'ROC-AUC', ap: 'Average precision (PR)' } as const;
export type PrimaryMetric = keyof typeof metricNames;
export const experimentSchema = z.object({
  dataset: z.enum(['linear', 'overlap', 'moons', 'circles', 'imbalanced']),
  seed: z.number().int().min(0).max(999999),
  testSize: z.number().min(.15).max(.3),
  primary: z.enum(['accuracy', 'precision', 'recall', 'f1', 'auc', 'ap']),
  models: z.array(z.enum(['logistic', 'knn', 'tree', 'svm'])).min(1, 'Select at least one model.').max(4).refine(v => new Set(v).size === v.length, 'Models must be unique.'),
  logisticC: z.number().min(.01).max(10), iterations: z.number().int().min(100).max(2000),
  k: z.number().int().min(1).max(15), voting: z.enum(['uniform', 'distance']), distance: z.enum(['euclidean', 'manhattan']),
  depth: z.number().int().min(1).max(10), minLeaf: z.number().int().min(1).max(10), criterion: z.enum(['gini', 'entropy']),
  kernel: z.enum(['linear', 'rbf']), svmC: z.number().min(.01).max(10), gamma: z.number().min(.05).max(5),
});
export type ExperimentConfig = z.infer<typeof experimentSchema>;
export const DEFAULT_EXPERIMENT: ExperimentConfig = { dataset: 'moons', seed: 42, testSize: .2, primary: 'f1', models: ['logistic', 'knn', 'tree', 'svm'], logisticC: 1, iterations: 1000, k: 5, voting: 'uniform', distance: 'euclidean', depth: 4, minLeaf: 2, criterion: 'gini', kernel: 'rbf', svmC: 1, gamma: .5 };
export function seededRandom(seed: number) { let s = seed >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 2 ** 32; }; }
function shuffle<T>(rows: T[], random: () => number): T[] { const a = [...rows]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); const x = a[i], y = a[j]; if (x !== undefined && y !== undefined) { a[i] = y; a[j] = x; } } return a; }
export function makeComparisonData(kind: ExperimentConfig['dataset'], seed: number): Point[] {
  const r = seededRandom(seed);
  const normal = () => Math.sqrt(-2 * Math.log(Math.max(r(), 1e-9))) * Math.cos(2 * Math.PI * r());
  return Array.from({ length: 120 }, (_, i): Point => {
    const y: 0 | 1 = kind === 'imbalanced' ? (i < 12 ? 1 : 0) : i % 2 === 0 ? 0 : 1;
    let x1: number, x2: number;
    if (kind === 'moons') { const a = r() * Math.PI; x1 = y ? 1 - Math.cos(a) : Math.cos(a); x2 = y ? .5 - Math.sin(a) : Math.sin(a); x1 += normal() * .12; x2 += normal() * .12; }
    else if (kind === 'circles') { const a = r() * 2 * Math.PI, rad = (y ? .8 : 1.8) + normal() * .12; x1 = rad * Math.cos(a); x2 = rad * Math.sin(a); }
    else if (kind === 'linear') { x1 = (y ? 1 : -1) * (.4 + r() * 1.6); x2 = normal() * .7; }
    else { const c = y ? .7 : -.7; x1 = c + normal() * .9; x2 = c + normal() * .9; }
    return { id: `p${i}`, x1, x2, y };
  });
}
function assertData(rows: Point[], minimumPerClass = 1) {
  if (new Set(rows.map(p => p.id)).size !== rows.length || rows.some(p => !Number.isFinite(p.x1) || !Number.isFinite(p.x2) || (p.y !== 0 && p.y !== 1))) throw new Error('Use finite two-feature points with unique IDs and binary labels.');
  if ([0, 1].some(y => rows.filter(p => p.y === y).length < minimumPerClass)) throw new Error(`Each class needs at least ${minimumPerClass} observations.`);
}
/** Stratification preserves approximate label proportions; no claim about feature distributions. */
export function stratifiedSplit(rows: Point[], fraction: number, seed: number) {
  assertData(rows, 2);
  if (!Number.isFinite(fraction) || fraction <= 0 || fraction >= 1) throw new Error('Split fraction must be between zero and one.');
  const r = seededRandom(seed), train: Point[] = [], test: Point[] = [];
  for (const label of [0, 1]) { const group = shuffle(rows.filter(p => p.y === label), r), n = Math.min(group.length - 1, Math.max(1, Math.round(group.length * fraction))); test.push(...group.slice(0, n)); train.push(...group.slice(n)); }
  return { train: shuffle(train, r), test: shuffle(test, r) };
}
export function stratifiedFolds(rows: Point[], seed: number, k = 5) {
  if (!Number.isInteger(k) || k < 2) throw new Error('Use at least two integer folds.');
  assertData(rows, k);
  const r = seededRandom(seed), folds: Point[][] = Array.from({ length: k }, () => []);
  for (const label of [0, 1]) shuffle(rows.filter(p => p.y === label), r).forEach((p, i) => folds[i % k]?.push(p));
  return folds;
}
/** Non-interpolated AP = Σ (recall increment × precision), grouped by tied scores. Not trapezoidal PR-AUC. */
export function averagePrecision(obs: Observation[]): number | null {
  if (obs.some(o => !Number.isFinite(o.score))) throw new Error('Ranking scores must be finite.');
  const positives = obs.filter(o => o.positive).length;
  if (!positives) return null;
  let tp = 0, seen = 0, area = 0;
  const sorted = [...obs].sort((a, b) => b.score - a.score);
  for (let i = 0; i < sorted.length;) { const score = sorted[i]?.score; let added = 0; while (i < sorted.length && sorted[i]?.score === score) { if (sorted[i]?.positive) { tp++; added++; } seen++; i++; } area += added / positives * tp / seen; }
  return area;
}
export type Fitted = { score: (x1: number, x2: number) => number; classify: (x1: number, x2: number) => 0 | 1; note: string };
export function fitComparisonModel(id: ModelId, rows: Point[], config: ExperimentConfig): Fitted {
  const c = experimentSchema.parse(config); assertData(rows);
  const sp: SPoint[] = rows.map(p => ({ id: p.id, x: [p.x1, p.x2], y: p.y ? 1 : -1 }));
  const scaler = standardize(sp); // fitted on this training fold only
  const transformed: Point[] = rows.map(p => { const [x1, x2] = scaler.t([p.x1, p.x2]); return { ...p, x1, x2 }; });
  if (id === 'logistic') { const w = fitL2(c.logisticC, transformed, c.iterations); const score = (a: number, b: number) => { const [x, y] = scaler.t([a, b]); return prob(w, x, y); }; return { score, classify: (a, b) => score(a, b) >= .5 ? 1 : 0, note: `L2 batch gradient descent, ${c.iterations} iterations; convergence not guaranteed. Probabilities are uncalibrated.` }; }
  if (id === 'knn') { if (c.k > rows.length) throw new Error('k exceeds the training-fold size.'); const run = (a: number, b: number) => knnPredict(scaler.t([a, b]), transformed, { k: c.k, metric: c.distance, voting: c.voting }); return { score: (a, b) => run(a, b).proba, classify: (a, b) => run(a, b).predicted, note: 'Exact brute-force neighbors; tied votes select Class 0. Vote shares are not calibrated probabilities.' }; }
  if (id === 'tree') { const tree = buildTree(rows.map(p => ({ id: p.id, x: [p.x1, p.x2], y: p.y })), { maxDepth: c.depth, minSamplesLeaf: c.minLeaf, criterion: c.criterion }); return { score: (a, b) => predictProba(tree, [a, b]), classify: (a, b) => predict(tree, [a, b]), note: 'Greedy CART-style tree on raw features; rounded split candidates. Leaf shares are not calibrated probabilities.' }; }
  const svm = fitSvm(scaler.apply(sp), c.svmC, kernelOf(c.kernel, c.gamma), { maxPasses: 1200 });
  const score = (a: number, b: number) => decision(svm, scaler.t([a, b]));
  return { score, classify: (a, b) => score(a, b) >= 0 ? 1 : 0, note: `Simplified SMO, ${svm.iterations}/1200 steps; optimality is not guaranteed. Scores are margins, not probabilities.` };
}
export function evaluateFitted(model: Fitted, data: Point[]) {
  const ranking = data.map(p => ({ score: model.score(p.x1, p.x2), positive: p.y === 1 }));
  const labels = data.map(p => ({ score: model.classify(p.x1, p.x2), positive: p.y === 1 }));
  const counts = countsAt(.5, labels);
  return { counts, ...metrics(counts), auc: rocAuc(ranking), ap: averagePrecision(ranking) };
}
export type Performance = ReturnType<typeof evaluateFitted>;
export type ModelResult = { id: ModelId; fitted: Fitted; training: Performance; validation: Performance; foldScores: (number | null)[]; mean: number | null; sd: number | null; trainingMs: number };
export type Experiment = { config: ExperimentConfig; data: Point[]; train: Point[]; test: Point[]; results: ModelResult[] };
export function runComparison(input: unknown): Experiment {
  const config = experimentSchema.parse(input), data = makeComparisonData(config.dataset, config.seed);
  const { train, test } = stratifiedSplit(data, config.testSize, config.seed + 1);
  const folds = stratifiedFolds(train, config.seed + 2);
  const results = config.models.map((id): ModelResult => {
    const foldScores: (number | null)[] = [], foldMetrics: Performance[] = [], labels: Observation[] = [];
    folds.forEach((valid, i) => {
      const fitted = fitComparisonModel(id, folds.flatMap((f, j) => i === j ? [] : f), config);
      const evaluation = evaluateFitted(fitted, valid);
      foldMetrics.push(evaluation); foldScores.push(evaluation[config.primary]);
      valid.forEach(p => { labels.push({ score: fitted.classify(p.x1, p.x2), positive: p.y === 1 }); });
    });
    const counts = countsAt(.5, labels);
    // AP/AUC shown as fold means: margin scales from different fits are not pooled.
    const avg = (v: (number | null)[]) => v.some(x => x === null) ? null : v.reduce<number>((s, x) => s + (x ?? 0), 0) / v.length;
    const mean = avg(foldScores), sd = mean === null ? null : Math.sqrt(foldScores.reduce<number>((s, x) => s + ((x ?? 0) - mean) ** 2, 0) / foldScores.length);
    const start = performance.now(), fitted = fitComparisonModel(id, train, config), trainingMs = performance.now() - start;
    return { id, fitted, training: evaluateFitted(fitted, train), validation: { counts, ...metrics(counts), auc: avg(foldMetrics.map(f => f.auc)), ap: avg(foldMetrics.map(f => f.ap)) }, foldScores, mean, sd, trainingMs };
  });
  return { config, data, train, test, results };
}
