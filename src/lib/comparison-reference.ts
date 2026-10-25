export const comparisonPython = `import numpy as np
from sklearn.datasets import make_classification
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_validate, GridSearchCV
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.neighbors import KNeighborsClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.svm import SVC
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score, average_precision_score

# All features are numerical; class 1 is the positive class.
X, y = make_classification(n_samples=1000, n_features=10,
    n_informative=6, n_redundant=2, weights=[0.8, 0.2],
    class_sep=1.0, random_state=42)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, stratify=y, random_state=42)
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

# Scaler is fitted only on each fold's training rows.
models = {
    "Logistic Regression": Pipeline([("scale", StandardScaler()),
        ("model", LogisticRegression(C=1.0, solver="lbfgs", max_iter=2000))]),
    "KNN": Pipeline([("scale", StandardScaler()),
        ("model", KNeighborsClassifier(n_neighbors=5))]),
    "Decision Tree": Pipeline([("model", DecisionTreeClassifier(
        max_depth=4, min_samples_leaf=2, random_state=42))]),
    "SVM": Pipeline([("scale", StandardScaler()),
        ("model", SVC(kernel="rbf", C=1.0, gamma="scale"))]),
}
scoring = {"accuracy": "accuracy", "precision": "precision",
    "recall": "recall", "f1": "f1", "roc_auc": "roc_auc",
    "ap": "average_precision"}
summary = {}
for name, candidate in models.items():
    scores = cross_validate(candidate, X_train, y_train, cv=cv,
        scoring=scoring, return_train_score=True, error_score="raise")
    summary[name] = scores
    print(name)
    for metric in scoring:
        values = scores["test_" + metric]  # CV validation, NOT final test data
        print(f"  {metric}: {np.mean(values):.3f} +/- {np.std(values):.3f}")
    print(f"  mean fit time: {np.mean(scores['fit_time']):.4f} s")

# Example objective: F1. Choose by validation, never by final test score.
selected_name = max(summary, key=lambda name:
    np.mean(summary[name]["test_f1"]))
selected = models[selected_name]
print("Selected using training-data CV:", selected_name)

# Optional tuning: use GridSearchCV on training data BEFORE final evaluation.
# This manual example omits tuning; to try it, replace selected with:
# selected = GridSearchCV(models["Decision Tree"],
#     {"model__max_depth": [2, 4, 6], "model__min_samples_leaf": [1, 2, 5]},
#     scoring="f1", cv=cv, refit=True)
# Compare tuned candidates under the same protocol; use nested CV for
# less optimistic estimates of an extensive tuning-and-selection process.

selected.fit(X_train, y_train)
predictions = selected.predict(X_test)
# SVM margin scores work for ranking metrics; probability=True is unnecessary.
if hasattr(selected, "decision_function"):
    ranking_scores = selected.decision_function(X_test)
else:
    ranking_scores = selected.predict_proba(X_test)[:, 1]
print("Final test confusion matrix:")
print(confusion_matrix(y_test, predictions, labels=[0, 1]))
print(classification_report(y_test, predictions, zero_division=0))
print("Final test ROC-AUC:", roc_auc_score(y_test, ranking_scores))
print("Final test average precision:", average_precision_score(y_test, ranking_scores))
`;
export const classifierRows = [
  { label: 'Basic idea', cells: ['Linear decision function with a logistic link', 'Neighbor-based voting', 'Recursive feature-based splitting', 'Maximum-margin decision boundary'] },
  { label: 'Decision boundary', cells: ['Linear by default', 'Potentially nonlinear', 'Piecewise, axis-aligned rules', 'Linear or nonlinear with kernels'] },
  { label: 'Feature scaling', cells: ['Often important, especially with regularization', 'Usually essential', 'Generally unnecessary', 'Usually important'] },
  { label: 'Interpretability', cells: ['Coefficients interpreted with care', 'Low to moderate; inspect neighbors', 'Often relatively high for small trees', 'Usually lower for nonlinear kernels'] },
  { label: 'Training cost', cells: ['Generally low', 'Low data preparation; lazy learning', 'Generally low to moderate', 'Kernel SVM can be expensive on large datasets'] },
  { label: 'Prediction cost', cells: ['Generally low', 'Can be high with large training sets', 'Generally low; depends on depth', 'Depends on support vectors and implementation'] },
  { label: 'Main hyperparameters', cells: ['C, penalty, solver', 'n_neighbors, weights, metric', 'max_depth, min_samples_split, min_samples_leaf, ccp_alpha', 'C, kernel, gamma, degree'] },
  { label: 'Common risk', cells: ['Underfitting nonlinear patterns', 'Scaling, irrelevant features, noisy neighbors', 'Overfitting deep trees', 'Scaling and hyperparameter sensitivity'] },
];
export const metricReference = [
  { label: 'Accuracy', cells: ['(TP + TN) / N', 'Overall correct fraction', 'Balanced classes, comparable error costs', 'Can hide minority-class failure', '95 correct / 100 = 95%'] },
  { label: 'Precision', cells: ['TP / (TP + FP)', 'How trustworthy are positive flags?', 'False positives are costly', 'Ignores missed positives', '80 true / 100 flags = 80%'] },
  { label: 'Recall', cells: ['TP / (TP + FN)', 'How many positives did we find?', 'False negatives are costly', 'Ignores false alarms', '90 found / 100 real = 90%'] },
  { label: 'F1', cells: ['2TP / (2TP + FP + FN)', 'Balance precision and recall', 'Both positive-class errors matter', 'Excludes true negatives; not an error-cost model', 'P=80%, R=50% → F1≈61.5%'] },
  { label: 'ROC-AUC', cells: ['P(score+ > score−) + ½ P(tie)', 'Ranking across thresholds', 'Assess discrimination', 'Not one threshold; can obscure rare-positive burden', '3 of 4 ordered pairs → 0.75'] },
  { label: 'Average precision (PR)', cells: ['Σ ΔRecall × Precision', 'Precision across positive retrieval', 'Rare positives, class imbalance', 'Depends on prevalence; not trapezoidal PR-AUC', 'One positive ranked first → AP=1'] },
  { label: 'Confusion matrix', cells: ['TN FP / FN TP', 'Which mistakes occur?', 'Class-specific errors and costs', 'Depends on threshold and label convention', 'TP=40, TN=45, FP=5, FN=10'] },
];
export const mistakes = [
  ['Choosing only by accuracy', 'A majority-class predictor can look strong while missing every rare positive.', 'Inspect class counts, recall, precision, AP and the confusion matrix; define error costs.'],
  ['Different train-test splits', 'One model may get easier observations, so the score gap need not reflect its quality.', 'Use identical split IDs and identical CV folds for every candidate.'],
  ['Scaling before splitting', 'Even an unsupervised scaler can learn feature distributions from held-out data.', 'Split first; place scaling inside a Pipeline.'],
  ['Fitting preprocessing on all rows', 'Imputation or feature selection leaks held-out information and inflates validation.', 'Fit every learned preprocessing step on each training fold only.'],
  ['Tuning on the final test set', 'Repeated choices adapt to test noise; the final estimate becomes optimistic.', 'Tune with training-data CV; reserve a separate test set.'],
  ['Ignoring class imbalance', 'Aggregate scores conceal which class receives errors.', 'Report prevalence, per-class metrics and relevant error counts.'],
  ['Ignoring train-validation gaps', 'High training scores can be memorization rather than generalization.', 'Compare training and validation under the same metric and investigate large gaps.'],
  ['Overinterpreting tiny differences', 'Sampling variability can reverse a small ranking.', 'Inspect fold variability, more representative data and repeated/nested validation when warranted.'],
  ['Ignoring computation', 'A model may exceed deployment memory or latency limits despite a good score.', 'Measure training, prediction and memory on representative hardware and workloads.'],
  ['Assuming complexity is better', 'Flexibility can fit noise, making unseen results worse.', 'Compare a simple baseline, regularize and validate complexity.'],
  ['Assuming a universal best model', 'Data geometry, noise and business objectives differ.', 'Treat algorithm strengths as hypotheses to validate.'],
  ['Mismatched thresholds or protocols', 'A precision difference may just reflect different operating points or data.', 'Document thresholds, positive class, splits, averaging and selection rules. Native defaults differ across models.'],
  ['Ignoring probability calibration', 'Good ranking does not imply reliable 0.8 probabilities.', 'Assess calibration on held-out development data; calibrate within leakage-safe validation when decisions need probabilities.'],
  ['Ignoring operational error costs', 'F1 or accuracy may not represent harm from false alarms or missed cases.', 'Discuss FP/FN consequences with stakeholders and validate an operating threshold.'],
  ['Reporting illustrations as experiments', 'Conceptual numbers create false evidence of model quality.', 'Label illustrations; calculate experiment metrics from actual held-out predictions.'],
];
