import { describe, expect, it } from "vitest";
import { metrics } from "@/lib/evaluation";
import { C_VALUES, datasetCounts, fitL2, gradientDescentPath, logit, logLoss, odds, sigmoid, churnScore, LR_OBSERVATIONS } from "@/lib/logistic";
import { countsAt } from "@/lib/evaluation";

describe("logistic math", () => {
  it("sigmoid matches the lesson table", () => {
    expect(sigmoid(0)).toBe(0.5);
    expect(sigmoid(-5)).toBeCloseTo(0.0067, 3);
    expect(sigmoid(2)).toBeCloseTo(0.881, 3);
    expect(sigmoid(5)).toBeCloseTo(0.993, 3);
    expect(sigmoid(-1000)).toBeGreaterThanOrEqual(0);
  });
  it("logit inverts sigmoid and handles boundaries", () => {
    expect(logit(sigmoid(1.7))).toBeCloseTo(1.7, 9);
    expect(logit(0)).toBeNull(); expect(logit(1)).toBeNull(); expect(odds(1)).toBeNull();
    expect(odds(0.5)).toBe(1);
  });
  it("log loss punishes confident mistakes", () => {
    expect(logLoss(1, 0.5)).toBeCloseTo(0.693, 3);
    expect(logLoss(1, 0.01)).toBeCloseTo(4.605, 3);
    expect(logLoss(0, 0.01)).toBeLessThan(0.02);
    expect(Number.isFinite(logLoss(1, 0))).toBe(true);
  });
  it("threshold explorer reuses Phase 2 counts", () => {
    expect(countsAt(0.5, LR_OBSERVATIONS)).toEqual({ tp: 3, tn: 3, fp: 1, fn: 1 });
  });
  it("gradient descent lowers loss", () => {
    const p = gradientDescentPath(0.5, 60);
    expect(p[60]!.loss).toBeLessThan(p[0]!.loss);
  });
  it("smaller C gives smaller coefficients", () => {
    const norms = C_VALUES.map((C) => { const w = fitL2(C); return Math.hypot(w.w1, w.w2); });
    for (let i = 1; i < norms.length; i++) expect(norms[i]!).toBeGreaterThan(norms[i - 1]!);
    const m = metrics(datasetCounts(fitL2(1)));
    expect(m.accuracy!).toBeGreaterThan(0.75);
  });
  it("churn example yields ~0.79", () => {
    expect(sigmoid(churnScore(8, 80, 2))).toBeCloseTo(0.786, 2);
  });
});
