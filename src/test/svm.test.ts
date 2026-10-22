import { describe, expect, it } from "vitest";
import { fitSvm, weights, fullMargin, halfMargin, supportVectors, kernelOf, kernelValue, TINY, SEPARABLE_OUTLIER, RINGS, accuracyOn, OVERLAP, OUTLIER } from "@/lib/svm";

describe("svm", () => {
  it("finds the maximum-margin line on the tiny dataset", () => {
    const m = fitSvm(TINY, 1000), w = weights(m);
    expect(w[0]).toBeCloseTo(0.6, 3); expect(w[1]).toBeCloseTo(0.2, 3); expect(m.b).toBeCloseTo(-3.6, 3);
    expect(supportVectors(m).map((p) => p.id).sort()).toEqual(["B", "D"]);
    expect(halfMargin(w)).toBeCloseTo(1 / Math.sqrt(0.4), 3);
    expect(fullMargin(w)).toBeCloseTo(2 * halfMargin(w), 10);
  });
  it("kernels match lesson calculations", () => {
    expect(kernelValue(kernelOf("poly", 0.5, 2, 1), [1, 2], [2, 3])).toBe(25);
    expect(kernelValue(kernelOf("rbf", 0.5), [1, 2], [2, 3])).toBeCloseTo(Math.exp(-1), 10);
  });
  it("smaller C gives a wider margin", () => {
    const D = [...OVERLAP, OUTLIER];
    expect(fullMargin(weights(fitSvm(D, 0.01)))).toBeGreaterThan(fullMargin(weights(fitSvm(D, 1))));
    expect(fullMargin(weights(fitSvm(SEPARABLE_OUTLIER, 0.1)))).toBeGreaterThan(fullMargin(weights(fitSvm(SEPARABLE_OUTLIER, 1000))));
  });
  it("RBF separates rings, linear cannot", () => {
    expect(accuracyOn(fitSvm(RINGS, 1, kernelOf("rbf", 0.5)), RINGS)).toBeGreaterThan(0.95);
    expect(accuracyOn(fitSvm(RINGS, 1), RINGS)).toBeLessThan(0.85);
  });
});
