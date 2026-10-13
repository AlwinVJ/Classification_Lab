/** `group` nests a lesson under a topic in navigation; `navTitle` is its shorter sidebar label. */
export type Lesson = { slug: string; title: string; summary: string; group?: string; navTitle?: string };
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
      { slug: "choosing-metrics", title: "Choosing Metrics", summary: "Match metrics to error costs, class distribution and real-world decisions." },
    ],
  },
  {
    id: "algorithms",
    title: "Algorithms",
    blurb: "Four foundational classifiers, each with a different way of drawing boundaries.",
    lessons: [
      { slug: "logistic-regression", title: "Logistic Regression", navTitle: "Introduction", summary: "How a linear model estimates probabilities and makes classification decisions.", group: "Logistic Regression" },
      { slug: "logistic-regression-linear-score", title: "Linear Score", navTitle: "Linear Score", summary: "Weights, bias and features combine into a score z that can be any real number.", group: "Logistic Regression" },
      { slug: "logistic-regression-sigmoid", title: "Sigmoid Function", navTitle: "Sigmoid", summary: "The S-shaped function that maps any score into a probability between 0 and 1.", group: "Logistic Regression" },
      { slug: "logistic-regression-probability-threshold", title: "Probability & Threshold", navTitle: "Probability & Threshold", summary: "A probability estimate is not a class until a threshold decides.", group: "Logistic Regression" },
      { slug: "logistic-regression-log-odds", title: "Log-Odds & Coefficients", navTitle: "Log-Odds", summary: "Odds, the logit, and how coefficients change the odds.", group: "Logistic Regression" },
      { slug: "logistic-regression-decision-boundary", title: "Decision Boundary", navTitle: "Decision Boundary", summary: "Where wᵀx + b = 0: the line that separates predicted classes.", group: "Logistic Regression" },
      { slug: "logistic-regression-loss-function", title: "Loss Function", navTitle: "Loss Function", summary: "Binary cross-entropy: how wrong a probability is, and why confident mistakes cost most.", group: "Logistic Regression" },
      { slug: "logistic-regression-training", title: "Training & Gradient Descent", navTitle: "Training", summary: "How parameters are adjusted step by step to reduce loss.", group: "Logistic Regression" },
      { slug: "logistic-regression-regularization", title: "Regularization", navTitle: "Regularization", summary: "L1, L2 and scikit-learn's C: keeping coefficients under control.", group: "Logistic Regression" },
      { slug: "logistic-regression-multiclass", title: "Multiclass Logistic Regression", navTitle: "Multiclass", summary: "One-vs-Rest and multinomial ideas for more than two classes.", group: "Logistic Regression" },
      { slug: "logistic-regression-scikit-learn", title: "Logistic Regression in scikit-learn", navTitle: "Scikit-Learn", summary: "fit, predict, predict_proba, key parameters and Pipelines.", group: "Logistic Regression" },
      { slug: "logistic-regression-evaluation", title: "Evaluating Logistic Regression", navTitle: "Evaluation", summary: "From probabilities to a confusion matrix and Phase 2 metrics.", group: "Logistic Regression" },
      { slug: "logistic-regression-advantages-limitations", title: "Advantages & Limitations", navTitle: "Advantages & Limitations", summary: "Strengths, weaknesses, when to use it and common mistakes.", group: "Logistic Regression" },
      { slug: "logistic-regression-practical-example", title: "Practical Example: Customer Churn", navTitle: "Practical Example", summary: "A complete binary example plus the end-to-end workflow.", group: "Logistic Regression" },
      { slug: "logistic-regression-cheat-sheet", title: "Logistic Regression Cheat Sheet", navTitle: "Cheat Sheet", summary: "Formulas, Python reference and concept map on one page.", group: "Logistic Regression" },
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
  const lesson = all[i];
  if (!lesson) return undefined;
  return { lesson, prev: all[i - 1], next: all[i + 1] };
}
