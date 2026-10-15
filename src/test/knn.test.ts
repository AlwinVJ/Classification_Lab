import { describe, expect, it } from "vitest";
import { euclidean, manhattan, minkowski, knnPredict, KNN_TRAIN, NOISY_POINT, WORKED, WORKED_QUERY, evaluateKnn, distanceContrast } from "@/lib/knn";

describe("knn math", () => {
  it("distances match the lesson examples", () => {
    expect(euclidean([1, 2], [4, 6])).toBe(5);
    expect(manhattan([1, 2], [4, 6])).toBe(7);
    expect(minkowski([1, 2], [4, 6], 3)).toBeCloseTo(Math.cbrt(91), 10);
    expect(minkowski([1, 2], [4, 6], 2)).toBeCloseTo(5, 10);
    expect(minkowski([1, 2], [4, 6], 1)).toBeCloseTo(7, 10);
  });
  it("worked example votes Blue/Red/Blue for k=1/3/5", () => {
    const run = (k: number) => knnPredict(WORKED_QUERY, WORKED, { k, metric: "euclidean", voting: "uniform" });
    expect(run(1).predicted).toBe(1); expect(run(3).predicted).toBe(0); expect(run(5).predicted).toBe(1);
    expect(run(3).neighbors.map((n) => n.id)).toEqual(["C", "B", "A"]);
  });
  it("uniform and distance voting disagree at the lesson default", () => {
    expect(knnPredict([4, 4], KNN_TRAIN, { k: 5, metric: "euclidean", voting: "uniform" }).predicted).toBe(0);
    expect(knnPredict([4, 4], KNN_TRAIN, { k: 5, metric: "euclidean", voting: "distance" }).predicted).toBe(1);
  });
  it("noisy point flips small-k predictions only", () => {
    const d = [...KNN_TRAIN, NOISY_POINT];
    expect(knnPredict([3.2, 3], d, { k: 1, metric: "euclidean", voting: "uniform" }).predicted).toBe(1);
    expect(knnPredict([3.2, 3], d, { k: 5, metric: "euclidean", voting: "uniform" }).predicted).toBe(0);
  });
  it("zero distance is handled in weighted voting", () => {
    const p = KNN_TRAIN[0]!;
    const r = knnPredict([p.x1, p.x2], KNN_TRAIN, { k: 5, metric: "euclidean", voting: "distance" });
    expect(Number.isFinite(r.scores[0] + r.scores[1])).toBe(true);
    expect(r.predicted).toBe(p.y);
  });
  it("k=1 on training data is perfect; validation is not", () => {
    expect(evaluateKnn({ k: 1, metric: "euclidean", voting: "uniform" }, KNN_TRAIN, KNN_TRAIN).metrics.accuracy).toBe(1);
    expect(evaluateKnn({ k: 1, metric: "euclidean", voting: "uniform" }).metrics.accuracy!).toBeLessThan(1);
  });
  it("distance contrast rises with dimension", () => {
    expect(distanceContrast(500)).toBeGreaterThan(distanceContrast(2));
  });
});
