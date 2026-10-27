// Each exported string is a complete, standalone Python reference workflow.
const setup = `import numpy as np
from sklearn.datasets import make_classification
from sklearn.model_selection import train_test_split, StratifiedKFold, GridSearchCV
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (confusion_matrix, precision_score, recall_score,
    f1_score, balanced_accuracy_score, roc_auc_score, average_precision_score)

X, y = make_classification(n_samples=1000, n_features=8, n_informative=5,
    n_redundant=1, weights=[0.9, 0.1], random_state=42)
# Class 1 is the rare positive event. Reserve test data first.
X_dev, X_test, y_dev, y_test = train_test_split(
    X, y, test_size=0.2, stratify=y, random_state=42)
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

def report(y_true, p, threshold=0.5):
    predicted = (p >= threshold).astype(int)
    print("Confusion matrix [TN FP; FN TP]:", confusion_matrix(y_true, predicted))
    print("Precision:", precision_score(y_true, predicted, zero_division=0))
    print("Recall:", recall_score(y_true, predicted, zero_division=0))
    print("F1:", f1_score(y_true, predicted, zero_division=0))
    print("Balanced accuracy:", balanced_accuracy_score(y_true, predicted))
    print("ROC-AUC:", roc_auc_score(y_true, p))
    print("Average precision:", average_precision_score(y_true, p))
    # zero_division=0 is an explicit reporting convention, not mathematical certainty.
`;

export const thresholdPython = setup + `
X_fit, X_valid, y_fit, y_valid = train_test_split(
    X_dev, y_dev, test_size=0.25, stratify=y_dev, random_state=7)
model = Pipeline([("scale", StandardScaler()),
                  ("model", LogisticRegression(max_iter=2000))])
model.fit(X_fit, y_fit)
p_valid = model.predict_proba(X_valid)[:, 1]
thresholds = np.linspace(0, 1, 101)
fp_cost, fn_cost = 1, 5  # illustrative relative cost units
def cost(t):
    tn, fp, fn, tp = confusion_matrix(y_valid, (p_valid >= t).astype(int), labels=[0, 1]).ravel()
    return fp_cost * fp + fn_cost * fn
threshold = min(thresholds, key=cost)
print("Validation-selected threshold:", threshold)
# Freeze both the fitted model and threshold; test is used only now.
report(y_test, model.predict_proba(X_test)[:, 1], threshold)
`;

export const calibrationPython = setup + `
from sklearn.calibration import CalibratedClassifierCV, calibration_curve
from sklearn.metrics import brier_score_loss
import matplotlib.pyplot as plt

base = Pipeline([("scale", StandardScaler()),
                 ("model", LogisticRegression(max_iter=2000))])
# Internal folds fit base learners and calibration without touching final test data.
model = CalibratedClassifierCV(estimator=base, method="sigmoid", cv=cv)
model.fit(X_dev, y_dev)
p = model.predict_proba(X_test)[:, 1]
observed, mean_predicted = calibration_curve(y_test, p, n_bins=5, strategy="uniform")
print("Brier score:", brier_score_loss(y_test, p))
print("Mean predicted:", mean_predicted, "Observed:", observed)
plt.plot(mean_predicted, observed, "o-", label="Sigmoid calibrated")
plt.plot([0, 1], [0, 1], "--", label="Ideal")
plt.xlabel("Mean predicted probability")
plt.ylabel("Observed positive frequency")
plt.legend(); plt.show()
# Isotonic is an alternative, not selected by comparing these final test results.
# Select calibration methods using an additional development-data validation loop.
`;

export const imbalancePython = setup + `
weighted = Pipeline([("scale", StandardScaler()),
    ("model", LogisticRegression(class_weight="balanced", max_iter=2000))])
search = GridSearchCV(weighted, {"model__C": [0.1, 1, 10]},
    scoring="average_precision", cv=cv, n_jobs=-1)
search.fit(X_dev, y_dev)
print("Development CV average precision:", search.best_score_)
print("Chosen settings:", search.best_params_)
report(y_test, search.predict_proba(X_test)[:, 1])
# No resampling of validation or test distributions.
`;

export const oversamplingPython = setup + `
# Optional Python package: pip install imbalanced-learn
# This is separate from the frontend application.
from imblearn.pipeline import Pipeline as ImbPipeline
from imblearn.over_sampling import RandomOverSampler

model = ImbPipeline([("scale", StandardScaler()),
    ("resample", RandomOverSampler(random_state=42)),
    ("model", LogisticRegression(max_iter=2000))])
search = GridSearchCV(model, {"model__C": [0.1, 1, 10]},
    scoring="average_precision", cv=cv, n_jobs=-1)
search.fit(X_dev, y_dev)
report(y_test, search.predict_proba(X_test)[:, 1])
# Resampling runs on each training fold during fit, not during prediction.
# For appropriate continuous features, SMOTE can replace RandomOverSampler;
# it requires sufficient minority neighbors in EVERY training fold.
`;

export const forestPython = setup + `
from sklearn.ensemble import RandomForestClassifier

model = RandomForestClassifier(n_estimators=100, bootstrap=True,
    oob_score=True, random_state=42, n_jobs=1)
search = GridSearchCV(model, {"max_depth": [3, None],
    "max_features": ["sqrt", 0.8], "min_samples_leaf": [1, 4]},
    scoring="average_precision", cv=cv, n_jobs=-1)
search.fit(X_dev, y_dev)
selected = search.best_estimator_
print("Selected parameters:", search.best_params_)
print("OOB accuracy (development only):", selected.oob_score_)
print("Impurity-based importance:", selected.feature_importances_)
report(y_test, selected.predict_proba(X_test)[:, 1])
# Trees need no scaling here; data are numeric and contain no missing values.
`;

export const boostingPython = setup + `
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import AdaBoostClassifier, GradientBoostingClassifier

candidates = {
    "AdaBoost": (AdaBoostClassifier(
        estimator=DecisionTreeClassifier(max_depth=1, min_samples_leaf=4),
        random_state=42), {"n_estimators": [30, 60], "learning_rate": [0.1, 0.5]}),
    "Gradient boosting": (GradientBoostingClassifier(random_state=42),
        {"n_estimators": [30, 60], "learning_rate": [0.1, 0.3],
         "max_depth": [1, 2], "min_samples_leaf": [4], "subsample": [0.8, 1.0]})
}
fitted = []
for name, (estimator, grid) in candidates.items():
    search = GridSearchCV(estimator, grid, scoring="average_precision", cv=cv, n_jobs=-1)
    search.fit(X_dev, y_dev)
    print(name, "Development CV score:", search.best_score_, search.best_params_)
    fitted.append((search.best_score_, name, search.best_estimator_))
_, name, selected = max(fitted, key=lambda item: item[0])
print("Selected using development CV:", name)
report(y_test, selected.predict_proba(X_test)[:, 1])
`;

export const votingPython = setup + `
from sklearn.ensemble import VotingClassifier, RandomForestClassifier, StackingClassifier
from sklearn.neighbors import KNeighborsClassifier
from sklearn.model_selection import cross_val_score

estimators = [
    ("lr", Pipeline([("scale", StandardScaler()),
        ("model", LogisticRegression(max_iter=2000))])),
    ("knn", Pipeline([("scale", StandardScaler()),
        ("model", KNeighborsClassifier(n_neighbors=7))])),
    ("forest", RandomForestClassifier(n_estimators=60, max_depth=4, random_state=42))
]
hard = VotingClassifier(estimators=estimators, voting="hard")
# Hard voting supplies labels, not probability estimates; evaluate an appropriate label metric.
print("Hard voting development F1:", cross_val_score(
    hard, X_dev, y_dev, scoring="f1", cv=cv).mean())
soft = VotingClassifier(estimators=estimators, voting="soft")
search = GridSearchCV(soft, {"weights": [(1, 1, 1), (2, 1, 1)]},
    scoring="average_precision", cv=cv, n_jobs=-1)
stack = StackingClassifier(estimators=estimators,
    final_estimator=LogisticRegression(max_iter=2000),
    stack_method="predict_proba", cv=5, passthrough=False)
search.fit(X_dev, y_dev)
# Outer CV evaluates the stack; inner cv=5 generates out-of-fold meta-features.
stack_score = cross_val_score(stack, X_dev, y_dev,
    scoring="average_precision", cv=cv).mean()
if stack_score > search.best_score_:
    selected = stack.fit(X_dev, y_dev)
else:
    selected = search.best_estimator_
report(y_test, selected.predict_proba(X_test)[:, 1])
# Calibration and ensemble-weight choices also belong inside development validation.
# The CV scores used to select candidates are selection-biased, not an unbiased
# estimate of the selected model. The untouched test evaluates the frozen choice.
`;

export const interpretationPython = setup + `
from sklearn.ensemble import RandomForestClassifier
from sklearn.inspection import permutation_importance

X_fit, X_valid, y_fit, y_valid = train_test_split(
    X_dev, y_dev, test_size=0.25, stratify=y_dev, random_state=7)
model = RandomForestClassifier(n_estimators=100, max_depth=4, random_state=42)
model.fit(X_fit, y_fit)
result = permutation_importance(model, X_valid, y_valid,
    scoring="average_precision", n_repeats=10, random_state=42)
print("Training impurity importance:", model.feature_importances_)
print("Validation AP drops:", result.importances_mean)
print("Shuffle standard deviations:", result.importances_std)
# Interpret on validation data; reserve final test data for a frozen final model.
# Correlated features complicate interpretation. Importance is not causation.
report(y_test, model.predict_proba(X_test)[:, 1])
`;

export const advancedMistakes: { label: string; cells: string[] }[] = [
  { label: 'Scores are probabilities', cells: ['A margin can lie outside [0, 1]; misleading risk estimates lead to poor decisions.', 'Use genuine probability outputs and check calibration.'] },
  { label: '0.5 is always optimal', cells: ['The convention ignores error costs and capacity.', 'Choose on validation data with an explicit objective.'] },
  { label: 'Change threshold without checking errors', cells: ['Label changes alter TP, TN, FP and FN.', 'Recompute the confusion matrix and operational consequences.'] },
  { label: 'Optimize only precision or recall', cells: ['The other error type may become unacceptable.', 'Inspect both and include relevant costs.'] },
  { label: 'Calibration equals discrimination', cells: ['Good ranking can coexist with inaccurate probabilities.', 'Inspect reliability as well as ranking metrics.'] },
  { label: 'Brier is pure calibration', cells: ['It also reflects discrimination and outcome uncertainty.', 'Use it alongside reliability diagrams and other evidence.'] },
  { label: 'Accuracy alone on rare events', cells: ['A majority baseline can miss every rare positive.', 'Inspect recall, precision, balanced accuracy and PR analysis.'] },
  { label: 'Oversample before splitting', cells: ['Duplicate or related cases may cross the split.', 'Split first; resample training data only.'] },
  { label: 'Resample outside CV', cells: ['Fold validation then contains information from training.', 'Place resampling inside a fold-local pipeline.'] },
  { label: 'Weights always help', cells: ['Increased minority emphasis may worsen precision or generalization.', 'Validate weighted and unweighted candidates.'] },
  { label: 'Forests always beat trees', cells: ['Data, correlations and constraints may limit gains.', 'Compare fairly with a simple baseline.'] },
  { label: 'Boosting always generalizes better', cells: ['Later learners can fit noise.', 'Select stages and learning rate using validation.'] },
  { label: 'More complex learners are always better', cells: ['Excess complexity may overfit and increase latency.', 'Tune depth, leaf size, stages and regularization together.'] },
  { label: 'Stack on in-sample predictions', cells: ['Base learners leak training labels into meta-features.', 'Train the meta-model on out-of-fold predictions.'] },
  { label: 'Importance proves causation', cells: ['Association and confounding do not establish interventions.', 'Describe model reliance; causal claims need other evidence.'] },
  { label: 'Tune on final test', cells: ['Thresholds, calibrators or weights adapt to test noise.', 'Freeze all decisions before the final evaluation.'] },
  { label: 'Simulation is actual training', cells: ['Invented performance gives unjustified confidence.', 'Label synthetic and simplified demonstrations explicitly.'] },
];