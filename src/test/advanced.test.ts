import { describe, expect, it } from 'vitest';
import { countsAt, metrics, rocAuc } from '@/lib/evaluation';
import { CUSTOMER_PROBABILITIES, THRESHOLD_DATA, totalCost, thresholdSweep, brierScore, reliabilityBins, calibrationData, imbalanceData, balancedAccuracy, bootstrap, baggedTrees, boostBins, vote, importanceExperiment } from '@/lib/advanced';

describe('Phase 8 deterministic calculations', () => {
  it('uses the five supplied customer probabilities and inclusive threshold', () => {
    expect(CUSTOMER_PROBABILITIES).toEqual([.12, .34, .51, .76, .91]);
    expect(CUSTOMER_PROBABILITIES.filter(p => p >= .51)).toHaveLength(3);
  });
  it('computes actual labels, matrix and cost from seven supplied scores', () => {
    expect(THRESHOLD_DATA.map(d => d.score)).toEqual([.08, .21, .37, .48, .63, .74, .89]);
    const c = countsAt(.5, THRESHOLD_DATA);
    expect(c).toEqual({ tp: 2, tn: 3, fp: 1, fn: 1 });
    expect(totalCost(c, 1, 5)).toBe(6);
    expect(countsAt(.9, THRESHOLD_DATA).tp).toBe(0);
    expect(metrics(countsAt(.9, THRESHOLD_DATA)).precision).toBeNull();
    const curve = thresholdSweep(THRESHOLD_DATA, 1, 5);
    expect(Math.min(...curve.map(p => p.cost))).toBe(2);
  });
  it('computes the binary Brier score from displayed probabilities and outcomes', () => {
    expect(brierScore([{ score: .8, positive: true }, { score: .2, positive: false }])).toBeCloseTo(.04);
    expect(brierScore([])).toBeNull();
    expect(() => brierScore([{ score: 2, positive: true }])).toThrow();
  });
  it('handles empty reliability bins and includes probability one in the last bin', () => {
    const bins = reliabilityBins([{ score: 0, positive: false }, { score: 1, positive: true }], 5);
    expect(bins[0]?.mean).toBe(0); expect(bins[4]?.mean).toBe(1);
    expect(bins[1]?.count).toBe(0); expect(bins[1]?.observed).toBeNull();
    expect(() => reliabilityBins([], 0)).toThrow();
  });
  it('preserves ranking across synthetic monotone calibration transforms', () => {
    const reference = calibrationData('reference'), transformed = calibrationData('overconfident');
    expect(reference).toHaveLength(100);
    expect(rocAuc(reference)).toBe(rocAuc(transformed));
    expect(brierScore(reference)).toBeLessThan(brierScore(transformed) ?? 0);
  });
  it('shows 990 negatives and 10 positives at 1% prevalence with 99% baseline accuracy', () => {
    const data = imbalanceData(1);
    expect(data).toHaveLength(1000); expect(data.filter(d => d.positive)).toHaveLength(10);
    const c = countsAt(1, data);
    expect(c).toEqual({ tp: 0, tn: 990, fp: 0, fn: 10 });
    expect(metrics(c).accuracy).toBe(.99); expect(metrics(c).recall).toBe(0); expect(balancedAccuracy(c)).toBe(.5);
    expect(balancedAccuracy({ tp: 0, tn: 1, fp: 0, fn: 0 })).toBeNull();
  });
  it('calculates hard, soft and weighted voting from supplied inputs', () => {
    const v = vote([.51, .1, .52], [1, 1, 1]);
    expect(v.labels).toEqual([1, 0, 1]); expect(v.hard).toBe(1); expect(v.soft).toBeCloseTo(1.13 / 3);
    expect(v.weightedSoft).toBe(v.soft); expect(vote([.9, .2], [0, 2]).weightedSoft).toBe(.2);
    expect(() => vote([.5], [0])).toThrow();
  });
  it('bootstrap preserves sample size and keeps omitted indices out of the draw', () => {
    const draw = bootstrap(Array.from({ length: 60 }, (_, i) => i), 41);
    expect(draw.sample).toHaveLength(60); expect(new Set(draw.indices).size).toBeLessThan(60);
    expect(draw.omitted.every(i => !draw.indices.includes(i))).toBe(true);
    expect(draw).toEqual(bootstrap(Array.from({ length: 60 }, (_, i) => i), 41));
  });
  it('fits real trees and computes their average and OOB coverage', () => {
    const result = baggedTrees(7, 3, 2, [5, 5, 5]);
    expect(result.models).toHaveLength(7);
    expect(result.models.every(m => m.tree.n === 60 && m.selected.length === 2)).toBe(true);
    expect(result.probability).toBe(result.models.reduce((s, m) => s + m.probability, 0) / 7);
    expect(result.oob.total).toBe(result.oobCount); expect(result.validation.total).toBe(60);
    expect(result.oobCount).toBeGreaterThan(0);
  });
  it('boosting updates actual score by learning rate times fitted residual contribution', () => {
    const first = boostBins(1, .3, 4), zero = boostBins(0, .3, 4);
    expect(zero.rows.every(r => r.probability === .5)).toBe(true);
    first.rows.forEach(r => expect(r.score).toBeCloseTo(.3 * r.contribution));
    expect(first.history[1]?.loss).toBeLessThan(first.history[0]?.loss ?? 0);
    expect(boostBins(5, .3, 8).rows).not.toEqual(boostBins(5, .3, 2).rows);
  });
  it('permutation importance computes five actual validation drops', () => {
    const result = importanceExperiment(0);
    expect(result.drops).toHaveLength(5);
    expect(result.mean).toBe(result.drops.reduce((s, d) => s + d, 0) / 5);
    expect(result.impurity.reduce((s, d) => s + d, 0)).toBeCloseTo(1);
    expect(result).toEqual(importanceExperiment(0));
  });
});