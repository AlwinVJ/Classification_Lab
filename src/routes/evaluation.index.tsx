import { createFileRoute } from "@tanstack/react-router";
import { EvaluationOverview } from "@/content/evaluation";

const title = "Classification Evaluation — Classification Lab";
const description = "Learn how to measure whether a classification model is making the right predictions with interactive confusion matrices, metrics and threshold curves.";

export const Route = createFileRoute("/evaluation/")({
  head: () => ({ meta: [
    { title }, { name: "description", content: description },
    { property: "og:title", content: title }, { property: "og:description", content: description },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: EvaluationOverview,
});
