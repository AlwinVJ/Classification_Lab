import { describe, expect, it } from "vitest";
import { accuracy, balancedWeights, BUILD_DATA, buildTree, countsFor, depthOf, entropy, evaluateSplit, featureImportance, gini, IMB_TRAIN, IMB_VALID, leaves, predict, prune, TREE_TRAIN, TREE_VALID } from "@/lib/tree";

describe("decision tree math", () => {
  it("gini and entropy match the lesson examples", () => {
    expect(gini([10, 0])).toBe(0);
    expect(gini([5, 5])).toBeCloseTo(0.5, 12);
    expect(gini([30, 70])).toBeCloseTo(0.42, 12);
    expect(entropy([10, 0])).toBe(0);
    expect(entropy([5, 5])).toBeCloseTo(1, 12);
    expect(gini([0, 0])).toBeNull();
    expect(entropy([0, 0, 0])).toBeNull();
    expect(entropy([1, 1, 1])).toBeCloseTo(Math.log2(3), 12);
  });
  it("information gain worked example is weighted by child size", () => {
    const e = evaluateSplit([36, 4], [14, 46], "entropy")!;
    expect(e.parent).toBeCloseTo(1, 12);
    expect(e.left).toBeCloseTo(0.469, 3);
    expect(e.right).toBeCloseTo(0.7838, 3);
    expect(e.weighted).toBeCloseTo(0.4 * e.left + 0.6 * e.right, 12);
    expect(e.reduction).toBeCloseTo(0.342, 3);
  });
  it("tree growth, depth, pruning and importance behave", () => {
    const full = buildTree(TREE_TRAIN);
    expect(accuracy(full, TREE_TRAIN)).toBe(1);
    const d1 = buildTree(TREE_TRAIN, { maxDepth: 1 });
    expect(depthOf(d1)).toBe(1);
    expect(leaves(prune(full, 1)).length).toBe(1);
    expect(leaves(prune(full, 0)).length).toBe(leaves(full).length);
    const imp = featureImportance(full, 2);
    expect(imp[0]! + imp[1]!).toBeCloseTo(1, 12);
    const b = buildTree(BUILD_DATA, { maxDepth: 2 });
    for (const p of BUILD_DATA) expect([0, 1]).toContain(predict(b, p.x));
    const c = countsFor(full, TREE_VALID);
    expect(c.tp + c.tn + c.fp + c.fn).toBe(TREE_VALID.length);
  });
  it("class weights are computed from class frequencies", () => {
    const w = balancedWeights(IMB_TRAIN);
    expect(w[1]).toBeGreaterThan(w[0]);
    expect(countsFor(buildTree(IMB_TRAIN, { maxDepth: 2, classWeight: w }), IMB_VALID).tp).toBeGreaterThanOrEqual(0);
  });
});
