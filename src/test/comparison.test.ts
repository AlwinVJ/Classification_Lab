import { describe, expect, it } from 'vitest';
import { averagePrecision, DEFAULT_EXPERIMENT, evaluateFitted, experimentSchema, fitComparisonModel, makeComparisonData, runComparison, stratifiedFolds, stratifiedSplit, type ModelId } from '@/lib/comparison';
import { countsAt, metrics } from '@/lib/evaluation';

describe('Phase 7 reproducible and fair comparison', () => {
  it('generates five supported binary datasets reproducibly without hardcoded predictions', () => {
    for (const kind of ['linear', 'overlap', 'moons', 'circles', 'imbalanced'] as const) {
      const data = makeComparisonData(kind, 42);
      expect(data).toEqual(makeComparisonData(kind, 42));
      expect(data).not.toEqual(makeComparisonData(kind, 43));
      expect(data.length).toBe(120);
      expect(data.every(p => Number.isFinite(p.x1) && Number.isFinite(p.x2))).toBe(true);
    }
    expect(makeComparisonData('imbalanced', 42).filter(p => p.y === 1).length).toBe(12);
  });
  it('uses a disjoint stratified 80/20 split and five development-only folds', () => {
    const data = makeComparisonData('linear', 42);
    const split = stratifiedSplit(data, .2, 43);
    expect(split.train.length).toBe(96); expect(split.test.length).toBe(24);
    expect(split.test.filter(p => p.y === 1).length).toBe(12);
    const trainIds = new Set(split.train.map(p => p.id));
    expect(split.test.every(p => !trainIds.has(p.id))).toBe(true);
    expect(stratifiedSplit(data, .2, 43)).toEqual(split);
    const folds = stratifiedFolds(split.train, 44);
    expect(folds.length).toBe(5);
    expect(folds.flat().map(p => p.id).sort()).toEqual(split.train.map(p => p.id).sort());
    expect(folds.every(f => f.some(p => p.y === 0) && f.some(p => p.y === 1))).toBe(true);
  });
  it('computes confusion matrices and metrics from each model’s actual held-out predictions', () => {
    const c = { ...DEFAULT_EXPERIMENT, dataset: 'linear' as const };
    const { train, test } = stratifiedSplit(makeComparisonData('linear', 42), .2, 43);
    for (const id of ['logistic', 'knn', 'tree', 'svm'] as ModelId[]) {
      const fitted = fitComparisonModel(id, train, c);
      const observed = evaluateFitted(fitted, test);
      const counts = countsAt(.5, test.map(p => ({ score: fitted.classify(p.x1, p.x2), positive: p.y === 1 })));
      expect(observed.counts).toEqual(counts);
      expect(observed.accuracy).toBe(metrics(counts).accuracy);
      expect(observed.accuracy).toBeGreaterThan(.8);
      const repeat = fitComparisonModel(id, train, c);
      expect(test.map(p => fitted.score(p.x1, p.x2))).toEqual(test.map(p => repeat.score(p.x1, p.x2)));
    }
  });
  it('does not fit preprocessing on evaluation observations', () => {
    const { train } = stratifiedSplit(makeComparisonData('overlap', 42), .2, 43);
    const a = fitComparisonModel('logistic', train, DEFAULT_EXPERIMENT);
    const score = a.score(.2, .3);
    evaluateFitted(a, [{ id: 'heldout', x1: 1e6, x2: -1e6, y: 1 }]);
    expect(a.score(.2, .3)).toBe(score);
  });
  it('changing k, depth, regularization and RBF gamma changes genuine fitted scores', () => {
    const train = makeComparisonData('overlap', 42);
    const settings = [
      ['knn', { k: 1 }, { k: 15 }], ['tree', { depth: 1 }, { depth: 8 }],
      ['logistic', { logisticC: .01 }, { logisticC: 10 }], ['svm', { gamma: .05 }, { gamma: 5 }],
    ] as const;
    for (const [id, ca, cb] of settings) {
      const a = fitComparisonModel(id, train, { ...DEFAULT_EXPERIMENT, ...ca });
      const b = fitComparisonModel(id, train, { ...DEFAULT_EXPERIMENT, ...cb });
      expect(train.some(p => Math.abs(a.score(p.x1, p.x2) - b.score(p.x1, p.x2)) > 1e-6)).toBe(true);
    }
  });
  it('reports five-fold metrics and excludes the final test from validation counts', () => {
    const run = runComparison({ ...DEFAULT_EXPERIMENT, models: ['logistic', 'tree'] });
    for (const result of run.results) {
      expect(result.foldScores.length).toBe(5);
      const c = result.validation.counts;
      expect(c.tp + c.tn + c.fp + c.fn).toBe(run.train.length);
      expect(result.mean).toBeCloseTo(result.foldScores.reduce<number>((s, v) => s + (v ?? 0), 0) / 5);
    }
  });
  it('defines AP with tied scores and handles missing positive labels', () => {
    expect(averagePrecision([{ score: .9, positive: true }, { score: .8, positive: false }])).toBe(1);
    expect(averagePrecision([{ score: .9, positive: false }, { score: .8, positive: true }])).toBe(.5);
    expect(averagePrecision([{ score: .5, positive: false }, { score: .5, positive: true }])).toBe(.5);
    expect(averagePrecision([{ score: .5, positive: false }])).toBeNull();
    expect(averagePrecision([])).toBeNull();
    expect(() => averagePrecision([{ score: NaN, positive: true }])).toThrow();
  });
  it('rejects invalid or unsupported input before fitting', () => {
    for (const patch of [{ models: [] }, { k: 0 }, { depth: -1 }, { seed: NaN }, { kernel: 'poly' }, { dataset: 'multiclass' }, { models: ['tree', 'tree'] }]) expect(experimentSchema.safeParse({ ...DEFAULT_EXPERIMENT, ...patch }).success).toBe(false);
    expect(() => fitComparisonModel('tree', [], DEFAULT_EXPERIMENT)).toThrow();
    expect(() => stratifiedFolds([{ id: 'a', x1: 0, x2: 0, y: 0 }], 42)).toThrow();
  });
});