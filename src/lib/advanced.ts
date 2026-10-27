import { countsAt, divide, metrics, type Counts, type Observation } from './evaluation';
import { buildTree, predictProba, featureImportance, TREE_TRAIN_3, TREE_VALID_3, type TPoint } from './tree';

export const CUSTOMER_PROBABILITIES = [.12, .34, .51, .76, .91];
export const THRESHOLD_DATA: Observation[] = [.08, .21, .37, .48, .63, .74, .89].map((score, i) => ({ score, positive: [2, 4, 6].includes(i) }));
export function totalCost(c: Counts, fpCost: number, fnCost: number) {
  if (![fpCost, fnCost].every(v => Number.isFinite(v) && v >= 0)) throw new Error('Costs must be finite and non-negative.');
  return c.fp * fpCost + c.fn * fnCost;
}
export function thresholdSweep(data: Observation[], fpCost: number, fnCost: number) {
  return [...new Set([0, 1, ...data.map(d => d.score), ...data.map(d => Math.min(1, d.score + .000001))])].sort((a, b) => a - b).map(threshold => {
    const counts = countsAt(threshold, data); return { threshold, counts, ...metrics(counts), cost: totalCost(counts, fpCost, fnCost) };
  });
}
export const balancedAccuracy = (c: Counts) => { const recall = divide(c.tp, c.tp + c.fn), specificity = divide(c.tn, c.tn + c.fp); return recall === null || specificity === null ? null : (recall + specificity) / 2; };
export function brierScore(data: Observation[]) {
  if (data.some(d => !Number.isFinite(d.score) || d.score < 0 || d.score > 1 || (d.weight !== undefined && (!Number.isFinite(d.weight) || d.weight < 0)))) throw new Error('Probabilities must be between 0 and 1; weights must be non-negative.');
  return divide(data.reduce((sum, d) => sum + (d.score - Number(d.positive)) ** 2 * (d.weight ?? 1), 0), data.reduce((sum, d) => sum + (d.weight ?? 1), 0));
}
export function reliabilityBins(data: Observation[], bins: number) {
  brierScore(data);
  if (!Number.isInteger(bins) || bins < 2 || bins > 20) throw new Error('Use 2–20 probability bins.');
  return Array.from({ length: bins }, (_, i) => {
    const members = data.filter(d => Math.min(bins - 1, Math.floor(d.score * bins)) === i);
    const count = members.reduce((n, d) => n + (d.weight ?? 1), 0);
    return { low: i / bins, high: (i + 1) / bins, count, mean: divide(members.reduce((n, d) => n + d.score * (d.weight ?? 1), 0), count), observed: divide(members.reduce((n, d) => n + Number(d.positive) * (d.weight ?? 1), 0), count) };
  });
}
// Ten groups of ten illustrative observations. The observed frequencies match
// the reference probabilities by construction, not by fitting a calibrator.
export function calibrationData(mode: 'reference' | 'overconfident' | 'underconfident'): Observation[] {
  return Array.from({ length: 100 }, (_, i) => {
    const group = Math.floor(i / 10), p = group / 10;
    const score = mode === 'overconfident' ? p ** 2 / (p ** 2 + (1 - p) ** 2) : mode === 'underconfident' ? .25 + .5 * p : p;
    return { score, positive: i % 10 < group };
  });
}
export function imbalanceData(prevalence: number): Observation[] {
  if (!Number.isInteger(prevalence) || prevalence < 1 || prevalence > 50) throw new Error('Positive prevalence must be 1–50%.');
  const n = prevalence * 10;
  return Array.from({ length: 1000 }, (_, i) => ({ positive: i < n, score: i < n ? .25 + .7 * ((i * 37 % n) / n) : .05 + .65 * (((i - n) * 53 % (1000 - n)) / (1000 - n)) }));
}
export function vote(probabilities: number[], weights: number[]) {
  if (!probabilities.length || probabilities.length !== weights.length || probabilities.some(p => !Number.isFinite(p) || p < 0 || p > 1) || weights.some(w => !Number.isFinite(w) || w < 0) || weights.every(w => w === 0)) throw new Error('Use probabilities in [0, 1] and non-negative weights with a positive sum.');
  const labels = probabilities.map(p => p >= .5 ? 1 : 0);
  const soft = probabilities.reduce((s, p) => s + p, 0) / probabilities.length;
  const sum = weights.reduce((s, w) => s + w, 0);
  const weightedSoft = probabilities.reduce((s, p, i) => s + p * (weights[i] ?? 0), 0) / sum;
  const weightedPositive = labels.reduce<number>((s, y, i) => s + y * (weights[i] ?? 0), 0);
  return { labels, hard: labels.reduce<number>((s, y) => s + y, 0) > labels.length / 2 ? 1 : 0, soft, weightedSoft, weightedHard: weightedPositive > sum / 2 ? 1 : 0 };
}
export function seededRandom(seed: number) { let value = seed >>> 0; return () => { value = (Math.imul(value, 1664525) + 1013904223) >>> 0; return value / 4294967296; }; }
export function bootstrap<T>(data: T[], seed: number): { sample: T[]; indices: number[]; omitted: number[] } {
  if (!data.length) return { sample: [], indices: [], omitted: [] };
  const random = seededRandom(seed), indices = data.map(() => Math.floor(random() * data.length));
  return { sample: indices.map(i => data[i]).filter((p): p is T => p !== undefined), indices, omitted: data.map((_, i) => i).filter(i => !indices.includes(i)) };
}
// Genuine bagging, with a fixed random feature subset per tree (random subspaces).
// This is NOT a full Random Forest: candidate features are not re-drawn per split.
export function baggedTrees(n: number, depth: number, features: number, query: number[], seed = 41) {
  if (!Number.isInteger(n) || n < 1 || n > 30 || !Number.isInteger(depth) || depth < 1 || depth > 6 || ![1, 2, 3].includes(features)) throw new Error('Use 1–30 trees, depth 1–6 and 1–3 features.');
  const models = Array.from({ length: n }, (_, i) => {
    const draw = bootstrap(TREE_TRAIN_3, seed + i * 97), random = seededRandom(seed + i * 71);
    const selected = [0, 1, 2].map(f => ({ f, key: random() })).sort((a, b) => a.key - b.key).slice(0, features).map(v => v.f);
    const project = (p: TPoint): TPoint => ({ ...p, x: selected.map(f => p.x[f] ?? 0) });
    const tree = buildTree(draw.sample.map(project), { maxDepth: depth, minSamplesLeaf: 2 });
    return { tree, selected, draw, probability: predictProba(tree, selected.map(f => query[f] ?? 0)), predict: (p: TPoint) => predictProba(tree, project(p).x) };
  });
  const probability = models.reduce((s, m) => s + m.probability, 0) / n;
  const oob: Observation[] = [];
  TREE_TRAIN_3.forEach((point, i) => {
    const eligible = models.filter(m => m.draw.omitted.includes(i));
    if (eligible.length) oob.push({ score: eligible.reduce((s, m) => s + m.predict(point), 0) / eligible.length, positive: point.y === 1 });
  });
  const validation = TREE_VALID_3.map(p => ({ score: models.reduce((s, m) => s + m.predict(p), 0) / n, positive: p.y === 1 }));
  return { models, probability, oobCount: oob.length, oob: metrics(countsAt(.5, oob)), validation: metrics(countsAt(.5, validation)) };
}
// Simplified genuine binary gradient boosting: bin-constant learners fit mean
// negative log-loss gradients y - sigmoid(F), rather than regression trees.
export function boostBins(stages: number, rate: number, complexity: number) {
  if (!Number.isInteger(stages) || stages < 0 || stages > 30 || !Number.isFinite(rate) || rate <= 0 || rate > 1 || ![2, 4, 8].includes(complexity)) throw new Error('Use 0–30 stages, rate (0, 1] and 2, 4 or 8 bins.');
  const data = Array.from({ length: 16 }, (_, i) => ({ x: (i + .5) / 16, y: i >= 7 && i !== 12 || i === 2 ? 1 : 0 }));
  const score = Array<number>(16).fill(0), sigmoid = (z: number) => 1 / (1 + Math.exp(-z));
  const history = [{ stage: 0, loss: Math.log(2) }];
  let contributions = Array<number>(16).fill(0), residuals = data.map(d => d.y - .5), previous = [...score];
  for (let m = 0; m < stages; m++) {
    previous = [...score]; residuals = data.map((d, i) => d.y - sigmoid(score[i] ?? 0));
    const means = Array.from({ length: complexity }, (_, bin) => { const indices = data.map((d, i) => ({ d, i })).filter(({ d }) => Math.floor(d.x * complexity) === bin); return indices.reduce((s, v) => s + (residuals[v.i] ?? 0), 0) / indices.length; });
    contributions = data.map(d => means[Math.floor(d.x * complexity)] ?? 0);
    data.forEach((_, i) => { score[i] = (score[i] ?? 0) + rate * (contributions[i] ?? 0); });
    history.push({ stage: m + 1, loss: data.reduce((s, d, i) => { const p = sigmoid(score[i] ?? 0); return s - (d.y * Math.log(p) + (1 - d.y) * Math.log(1 - p)); }, 0) / data.length });
  }
  return { rows: data.map((d, i) => ({ ...d, previous: sigmoid(previous[i] ?? 0), residual: residuals[i] ?? 0, contribution: contributions[i] ?? 0, score: score[i] ?? 0, probability: sigmoid(score[i] ?? 0) })), history };
}
export function importanceExperiment(feature: number) {
  if (![0, 1, 2].includes(feature)) throw new Error('Select one of the three features.');
  const tree = buildTree(TREE_TRAIN_3, { maxDepth: 4, minSamplesLeaf: 2 });
  const accuracy = (data: TPoint[]) => data.filter(d => Number(predictProba(tree, d.x) > .5) === d.y).length / data.length;
  const baseline = accuracy(TREE_VALID_3);
  const drops = Array.from({ length: 5 }, (_, repeat) => {
    const random = seededRandom(72 + repeat), values = TREE_VALID_3.map(d => d.x[feature] ?? 0);
    for (let i = values.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); const a = values[i] ?? 0; values[i] = values[j] ?? 0; values[j] = a; }
    return baseline - accuracy(TREE_VALID_3.map((d, i) => ({ ...d, x: d.x.map((v, f) => f === feature ? values[i] ?? 0 : v) })));
  });
  const mean = drops.reduce((s, d) => s + d, 0) / drops.length;
  return { baseline, impurity: featureImportance(tree, 3), drops, mean, sd: Math.sqrt(drops.reduce((s, d) => s + (d - mean) ** 2, 0) / drops.length) };
}