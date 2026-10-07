import { createFileRoute } from "@tanstack/react-router";
import { ComparisonTable, VisualizationContainer } from "@/components/learning/blocks";

const d = "How four classifiers differ in assumptions, speed, and interpretability.";
export const Route = createFileRoute("/compare")({
  head: () => ({
    meta: [
      { title: "Compare Algorithms — Classification Lab" },
      { name: "description", content: d },
      { property: "og:title", content: "Compare Algorithms — Classification Lab" },
      { property: "og:description", content: d },
    ],
  }),
  component: Compare,
});

function Compare() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Compare algorithms</h1>
      <p className="mt-3 text-lg text-muted-foreground">{d} A fuller comparison arrives in a later phase.</p>
      <ComparisonTable
        columns={["Logistic Regression", "KNN", "Decision Tree", "SVM"]}
        rows={[
          { label: "Boundary", cells: ["Linear", "Flexible", "Axis-aligned", "Linear / kernel"] },
          { label: "Interpretability", cells: ["High", "Medium", "High", "Low"] },
          { label: "Training speed", cells: ["Fast", "None (lazy)", "Fast", "Slow on large data"] },
          { label: "Needs scaling", cells: ["Yes", "Yes", "No", "Yes"] },
        ]}
        highlight={[[1, 0], [1, 2], [3, 2]]}
      />
      <VisualizationContainer title="Decision boundaries on the same dataset" />
    </div>
  );
}
