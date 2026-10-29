const irisImports = `import numpy as np
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, confusion_matrix, classification_report, f1_score

X, y = load_iris(return_X_y=True)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.25, stratify=y, random_state=42
)
`;
const irisReport = `
model.fit(X_train, y_train)
y_pred = model.predict(X_test)
print("Accuracy:", accuracy_score(y_test, y_pred))
print("Confusion matrix (actual rows):\\n", confusion_matrix(y_test, y_pred))
print(classification_report(y_test, y_pred, zero_division=np.nan))
for average in ["macro", "micro", "weighted"]:
    print(average, f1_score(y_test, y_pred, average=average, zero_division=np.nan))
`;
const labelImports = `import numpy as np
from sklearn.datasets import make_multilabel_classification
from sklearn.model_selection import train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.multiclass import OneVsRestClassifier
from sklearn.metrics import hamming_loss, accuracy_score, f1_score, classification_report

X, Y = make_multilabel_classification(
    n_samples=600, n_features=20, n_classes=4, n_labels=2,
    allow_unlabeled=True, random_state=42
)
print("Binary label matrix:\\n", Y[:4])
X_train, X_test, Y_train, Y_test = train_test_split(
    X, Y, test_size=0.2, random_state=42
)
`;
const labelReport = `
print("Hamming loss:", hamming_loss(Y_test, Y_pred))
print("Subset accuracy:", accuracy_score(Y_test, Y_pred))
for average in ["micro", "macro", "weighted"]:
    print(average, f1_score(Y_test, Y_pred, average=average, zero_division=np.nan))
print(classification_report(Y_test, Y_pred, zero_division=np.nan))
`;
export const multiclassPython = [
{title:'Iris: native multinomial Logistic Regression', explanation:'The lbfgs solver optimizes multinomial loss for three or more classes. No removed multi_class parameter is used. Scaling learns only from training data. Probability columns follow model.classes_.', code:irisImports+`model = make_pipeline(StandardScaler(), LogisticRegression(solver="lbfgs", max_iter=1000))`+irisReport+`print("Class order:", model.classes_)
print("Probability predictions:\\n", model.predict_proba(X_test)[:5])
`},
{title:'Iris: one-vs-rest', explanation:'The wrapper trains one binary estimator per class and chooses the largest decision score. For a single-label problem its probability output is normalized; independent underlying binary estimates are not inherently a joint distribution.',code:irisImports+`from sklearn.multiclass import OneVsRestClassifier
model = make_pipeline(StandardScaler(), OneVsRestClassifier(LogisticRegression(max_iter=1000)))`+irisReport},
{title:'Iris: one-vs-one', explanation:'Three classes require 3×2/2 = 3 pairwise estimators. Voting, with score-based tie resolution, combines predictions. OneVsOneClassifier does not expose predict_proba.',code:irisImports+`from sklearn.multiclass import OneVsOneClassifier
model = make_pipeline(StandardScaler(), OneVsOneClassifier(LogisticRegression(max_iter=1000)))`+irisReport},
{title:'Multi-label: binary relevance', explanation:'A binary indicator matrix tells OneVsRestClassifier to fit one estimator per label. Output is an N×L binary matrix; simultaneous labels and empty sets are possible. This random split is not label-stratified: inspect rare-label coverage.',code:labelImports+`model = make_pipeline(StandardScaler(), OneVsRestClassifier(LogisticRegression(max_iter=1000)))
model.fit(X_train, Y_train)
Y_pred = model.predict(X_test)
print("Predicted vectors:\\n", Y_pred[:4])`+labelReport},
{title:'Multi-label: validation-selected per-label thresholds', explanation:'Choose each label’s threshold using development validation data only, freeze it, and evaluate once on the final test. This example keeps the training fit fixed after threshold selection; refitting can change probability calibration. Rare labels need enough validation positives.',code:labelImports+`X_fit, X_valid, Y_fit, Y_valid = train_test_split(
    X_train, Y_train, test_size=0.25, random_state=7
)
model = make_pipeline(StandardScaler(), OneVsRestClassifier(LogisticRegression(max_iter=1000)))
model.fit(X_fit, Y_fit)
valid_prob = model.predict_proba(X_valid)
candidates = np.linspace(0.1, 0.9, 17)
thresholds = np.full(Y_train.shape[1], 0.5)
for j in range(Y_train.shape[1]):
    if len(np.unique(Y_valid[:, j])) < 2:
        continue  # insufficient validation evidence: retain baseline 0.5
    scores = [f1_score(Y_valid[:, j], (valid_prob[:, j] >= t).astype(int),
                       zero_division=0) for t in candidates]
    thresholds[j] = candidates[int(np.argmax(scores))]
print("Frozen thresholds:", thresholds)
Y_pred = (model.predict_proba(X_test) >= thresholds).astype(int)`+labelReport},
{title:'Multi-label: classifier chain', explanation:'Positional estimator syntax avoids the old base_estimator/new estimator keyword difference. cv=3 supplies out-of-fold earlier-label predictions during training. Chain order may matter; compare alternatives using development validation, not repeated final tests.',code:labelImports+`from sklearn.multioutput import ClassifierChain
chain = ClassifierChain(LogisticRegression(max_iter=1000),
                        order="random", cv=3, random_state=42)
model = make_pipeline(StandardScaler(), chain)
model.fit(X_train, Y_train)
Y_pred = model.predict(X_test)`+labelReport},
];
