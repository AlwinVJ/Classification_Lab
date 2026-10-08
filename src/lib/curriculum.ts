export type Lesson = { slug: string; title: string; summary: string };
export type Section = { id: "classification" | "evaluation" | "algorithms"; title: string; blurb: string; lessons: Lesson[] };

export const sections: Section[] = [
  {
    id: "classification",
    title: "Classification",
    blurb: "What classification is, the kinds of problems it solves, and the workflow behind it.",
    lessons: [
      { slug: "introduction", title: "What Is Classification?", summary: "How a model learns from labeled examples to predict a category." },
      { slug: "vs-regression", title: "Classification vs Regression", summary: "Predicting a category versus predicting a number." },
      { slug: "features-labels", title: "Features, Labels & Classes", summary: "The inputs a model uses, and the categories it predicts." },
      { slug: "binary", title: "Binary Classification", summary: "Exactly two possible classes: spam or not spam." },
      { slug: "multiclass", title: "Multiclass Classification", summary: "Choosing one class out of three or more." },
      { slug: "multilabel", title: "Multilabel Classification", summary: "When one example can receive several labels at once." },
      { slug: "scores-probabilities", title: "Scores & Probabilities", summary: "What a model outputs before it commits to a class." },
      { slug: "threshold", title: "Classification Threshold", summary: "The cutoff that turns a score into a class prediction." },
      { slug: "decision-boundaries", title: "Decision Boundaries", summary: "Where in feature space the predicted class changes." },
      { slug: "workflow", title: "Classification Workflow", summary: "From problem definition to a monitored, deployed model." },
    ],
  },
  {
    id: "evaluation",
    title: "Evaluation",
    blurb: "How to measure whether a classifier is actually good — and good at what.",
    lessons: [
      { slug: "confusion-matrix", title: "Confusion Matrix", summary: "A table of correct and incorrect predictions." },
      { slug: "accuracy", title: "Accuracy", summary: "The share of predictions that were right." },
      { slug: "precision", title: "Precision", summary: "Of the positives we predicted, how many were real?" },
      { slug: "recall", title: "Recall", summary: "Of the real positives, how many did we find?" },
      { slug: "f1-score", title: "F1 Score", summary: "A single number balancing precision and recall." },
      { slug: "roc-auc", title: "ROC-AUC", summary: "Performance across every possible threshold." },
      { slug: "precision-recall", title: "Precision-Recall", summary: "The trade-off curve for imbalanced problems." },
    ],
  },
  {
    id: "algorithms",
    title: "Algorithms",
    blurb: "Four foundational classifiers, each with a different way of drawing boundaries.",
    lessons: [
      { slug: "logistic-regression", title: "Logistic Regression", summary: "A linear model that outputs probabilities." },
      { slug: "knn", title: "K-Nearest Neighbors", summary: "Classify by looking at the closest examples." },
      { slug: "decision-trees", title: "Decision Trees", summary: "A sequence of yes/no questions about features." },
      { slug: "svm", title: "Support Vector Machines", summary: "Find the boundary with the widest margin." },
    ],
  },
];

export function getSection(id: string) {
  return sections.find((s) => s.id === id);
}

export function getLesson(sectionId: string, slug: string) {
  const all = sections.flatMap((s) => s.lessons.map((l) => ({ ...l, section: s })));
  const i = all.findIndex((l) => l.section.id === sectionId && l.slug === slug);
  if (i < 0) return undefined;
  return { lesson: all[i]!, prev: all[i - 1], next: all[i + 1] };
}
