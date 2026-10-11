import { describe, expect, it } from "vitest";
import { countsAt, CURVE_POINTS, DEFAULT_COUNTS, FRAUD_OBSERVATIONS, metrics, OBSERVATIONS, rocAuc } from "@/lib/evaluation";

describe("Classification evaluation", () => {
  it("calculates the shared confusion matrix", () => {
    const result = metrics(DEFAULT_COUNTS);
    expect(result.total).toBe(100);
    expect(result.correct).toBe(85);
    expect(result.incorrect).toBe(15);
    expect(result.accuracy).toBe(.85);
    expect(result.precision).toBeCloseTo(40 / 45);
    expect(result.recall).toBe(.8);
    expect(result.f1).toBeCloseTo(80 / 95);
    expect(result.fpr).toBe(.1);
    expect(result.fnr).toBe(.2);
  });
  it("handles zero denominators honestly", () => {
    const empty = metrics({ tp: 0, tn: 0, fp: 0, fn: 0 });
    for (const key of ["accuracy", "precision", "recall", "f1", "fpr", "fnr"] as const) expect(empty[key]).toBeNull();
    const allNegative = metrics({ tp: 0, tn: 990, fp: 0, fn: 10 });
    expect(allNegative.accuracy).toBe(.99);
    expect(allNegative.recall).toBe(0);
    expect(allNegative.f1).toBe(0);
    expect(allNegative.precision).toBeNull();
  });
  it("keeps fraud data totals and threshold examples consistent", () => {
    expect(countsAt(.3, FRAUD_OBSERVATIONS)).toEqual({ tp: 18, tn: 900, fp: 80, fn: 2 });
    expect(countsAt(.5, FRAUD_OBSERVATIONS)).toEqual({ tp: 15, tn: 950, fp: 30, fn: 5 });
    expect(countsAt(.8, FRAUD_OBSERVATIONS)).toEqual({ tp: 10, tn: 970, fp: 10, fn: 10 });
    for (let t = 0; t <= 100; t++) expect(metrics(countsAt(t / 100, FRAUD_OBSERVATIONS)).total).toBe(1000);
  });
  it("uses score >= threshold and increasing detection as thresholds fall", () => {
    expect(countsAt(.94).tp).toBe(1);
    expect(countsAt(1)).toEqual({ tp: 0, tn: 6, fp: 0, fn: 6 });
    expect(countsAt(0)).toEqual({ tp: 6, tn: 0, fp: 6, fn: 0 });
    for (let i = 1; i < CURVE_POINTS.length; i++) {
      const current = CURVE_POINTS[i], previous = CURVE_POINTS[i - 1];
      if (!current || !previous) throw new Error("Missing curve point");
      expect(current.recall ?? 0).toBeGreaterThanOrEqual(previous.recall ?? 0);
      expect(current.fpr ?? 0).toBeGreaterThanOrEqual(previous.fpr ?? 0);
    }
  });
  it("computes AUC by rankings, including ties", () => {
    expect(rocAuc(OBSERVATIONS)).toBeCloseTo(27 / 36);
    expect(rocAuc([{ score: .5, positive: true }, { score: .5, positive: false }])).toBe(.5);
    expect(rocAuc([{ score: .9, positive: true }, { score: .1, positive: false }])).toBe(1);
    expect(rocAuc([{ score: .1, positive: true }, { score: .9, positive: false }])).toBe(0);
  });
});