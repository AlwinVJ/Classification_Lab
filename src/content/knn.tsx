import type { ComponentType, ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { H2, H3, Prose } from "@/components/learning/LessonShell";
import { Callout, CodeBlock, ComparisonTable, ConceptCard, DefinitionBlock, ExampleBlock, FormulaBlock, InlineMath, TermBlock } from "@/components/learning/blocks";
import { Flow, Split } from "@/components/visualization/diagrams";
import { BoundaryCompare, DimensionViz, DistanceCalculator, KnnEvaluation, KnnLab, KValidationChart, ScalingViz, VotingCompare, WorkedExample } from "@/components/visualization/KnnViz";
import type { KnnResult } from "@/lib/knn";

const R = String.raw;
const Go = ({ slug, children }: { slug: string; children: ReactNode }) => <Link to="/algorithms/$slug" params={{ slug }} className="font-medium text-primary underline-offset-4 hover:underline">{children}</Link>;
const PhaseLink = ({ to, slug, children }: { to: "/classification/$slug" | "/evaluation/$slug"; slug: string; children: ReactNode }) => <Link to={to} params={{ slug }} className="text-primary underline-offset-4 hover:underline">{children}</Link>;
const WORKFLOW = ["Training Dataset", "New Observation", "Calculate Distances", "Find the k Nearest Neighbors", "Collect Neighbor Labels", "Vote for a Class", "Predicted Class", "Evaluate the Prediction"];
const cls = (r: KnnResult) => (r.predicted ? "▲ Class B" : "● Class A");

/* 1 · Introduction */
function Intro() {
  const cards: [string, string, string][] = [
    ["KNN Fundamentals", "knn-how-it-works", "Lazy learning and a worked example."], ["Distance Metrics", "knn-distance-metrics", "Euclidean, Manhattan, Minkowski."],
    ["Choosing k", "knn-choosing-k", "Bias, variance and validation."], ["Voting Mechanisms", "knn-voting", "Uniform vs distance-weighted."],
    ["Feature Scaling", "knn-feature-scaling", "Why units change neighbors."], ["Decision Boundaries", "knn-decision-boundaries", "Nonlinear regions from local votes."],
    ["Scikit-learn Implementation", "knn-scikit-learn", "KNeighborsClassifier in a Pipeline."], ["Hyperparameter Tuning", "knn-tuning", "GridSearchCV and cross-validation."],
    ["Advantages and Limitations", "knn-advantages-limitations", "Cost, strengths and pitfalls."],
  ];
  return (
    <Prose>
      <p className="text-lg">Learn how machine learning classifies new observations by comparing them with nearby examples.</p>
      <DefinitionBlock title="The core idea">KNN classifies a new observation by finding the <strong>k nearest observations</strong> in the training dataset and using their class labels to determine the predicted class.</DefinitionBlock>
      <Callout kind="intuition" title="“Similar observations often have similar labels.”">This is an <strong>assumption</strong> the algorithm relies on, not a guarantee. It holds only when the features and the distance measure capture meaningful similarity.</Callout>
      <div className="grid gap-4 md:grid-cols-2">
        <div><H3>The KNN workflow</H3><Flow steps={WORKFLOW} /></div>
        <div>
          <H3>What the name means</H3>
          <ComparisonTable columns={["Meaning"]} rows={[{ label: "K", cells: ["the number of neighbors considered"] }, { label: "Nearest", cells: ["observations with the smallest distances"] }, { label: "Neighbors", cells: ["nearby training observations"] }, { label: "Classification", cells: ["assigning a class to the new observation"] }]} />
          <p className="text-sm">KNN is a <strong>supervised</strong> algorithm usable for classification and regression; this site focuses on classification. It is called <strong>distance-based</strong> because every prediction rests on distance calculations.</p>
        </div>
      </div>
      <H2>What is KNN?</H2>
      <ExampleBlock title="Apples and oranges">Each training fruit has two features — <strong>weight</strong> and <strong>sweetness</strong> — and a label. A new, unlabeled fruit arrives. KNN measures its distance to every labeled fruit and looks at the 3 closest. If 2 or 3 of them are apples, ordinary majority voting predicts <strong>apple</strong>.</ExampleBlock>
      <p>The answer depends on four choices: the <strong>distance metric</strong>, the value of <strong>k</strong>, the <strong>feature representation</strong> (including scaling) and the <strong>voting method</strong>. Each has its own lesson.</p>
      <H2>Try it</H2>
      <KnnLab prominent controls={["k"]} title="Preview · click anywhere on the plot" />
      <p>The full lab with every control is in <Go slug="knn-lab">Interactive KNN Lab</Go>.</p>
      <H2>Module map</H2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{cards.map(([t, slug, d]) => <Link key={slug} to="/algorithms/$slug" params={{ slug }}><ConceptCard title={t}>{d}</ConceptCard></Link>)}</div>
    </Prose>
  );
}

/* 2 · How KNN works */
function HowItWorks() {
  return (
    <Prose>
      <H2>Why KNN is called a lazy learner</H2>
      <p>Many models — like <Go slug="logistic-regression">Logistic Regression</Go> — do their heavy work during training, estimating parameters. Basic KNN postpones the work: it mostly <strong>stores</strong> the training data and does the real computation when asked to predict.</p>
      <Split left={{ title: "Training (fit)", body: <ul className="list-disc space-y-1 pl-4"><li>Store the training data</li><li>Prepare the feature representation (e.g. scaling)</li><li>Retain the labels needed for prediction</li><li>Optionally build a search structure</li></ul> }} right={{ title: "Prediction", body: <ul className="list-disc space-y-1 pl-4"><li>Calculate distances to training observations</li><li>Identify the nearest neighbors</li><li>Aggregate their labels</li><li>Return the predicted class</li></ul> }} />
      <Callout kind="note" title="Lazy ≠ no training">KNN still needs preparation: choosing features, scaling, and selecting k, the metric and the voting rule with validation data. The trade-off: little model-fitting work, but potentially expensive predictions and memory that grows with the training set.</Callout>
      <H2>How KNN classifies an observation</H2>
      <p>A five-row dataset, a new observation X = (3, 2), and the seven steps — with real calculations.</p>
      <WorkedExample />
      <H2>KNN classification vs KNN regression</H2>
      <ComparisonTable columns={["Uses neighbors' …", "Combines them by", "Example"]} rows={[{ label: "Classification", cells: ["class labels", "voting", "Is this email spam?"] }, { label: "Regression", cells: ["numeric targets", "average or weighted average", "Estimate a house price from similar houses"] }]} />
      <p className="text-sm text-muted-foreground">This site stays focused on classification.</p>
    </Prose>
  );
}

/* 3 · Lab */
function Lab() {
  return (
    <Prose>
      <p>Every calculation below runs live in your browser on a deterministic synthetic dataset of 36 points arranged in four clusters (two per class).</p>
      <KnnLab prominent />
      <ExampleBlock title="Reading the result">Suppose k = 5 and the neighbors are 3 × Class A and 2 × Class B. Under uniform majority voting the prediction is Class A. (Illustrative — the lab shows the actual counts for wherever you place ◆.)</ExampleBlock>
      <ul className="list-disc space-y-1 pl-5 text-sm"><li>Place ◆ between two clusters, then step k from 1 to 11.</li><li>Switch Euclidean ↔ Manhattan: the dashed neighborhood changes from a circle to a diamond.</li><li>Turn on decision regions to see the prediction for every location.</li></ul>
    </Prose>
  );
}

/* 4 · Distance metrics */
function Metrics() {
  return (
    <Prose>
      <p>KNN needs a way to measure how close two observations are. The <strong>distance metric</strong> decides which observations count as "nearest" — change it and the neighbors can change.</p>
      <H2>Euclidean distance</H2>
      <FormulaBlock tex={R`d(x, y) = \sqrt{\sum_i (x_i - y_i)^2}`} caption="The straight-line (“as the crow flies”) distance." />
      <ExampleBlock title="A = (1, 2), B = (4, 6)"><InlineMath tex={R`d = \sqrt{(4-1)^2 + (6-2)^2} = \sqrt{9 + 16} = \sqrt{25} = 5`} /></ExampleBlock>
      <H2>Manhattan distance</H2>
      <FormulaBlock tex={R`d(x, y) = \sum_i |x_i - y_i|`} caption="Distance travelled along a grid of streets: only horizontal and vertical moves." />
      <ExampleBlock title="Same points"><InlineMath tex={R`d = |4-1| + |6-2| = 3 + 4 = 7`} /></ExampleBlock>
      <H2>Minkowski distance</H2>
      <FormulaBlock tex={R`d(x, y) = \Big(\sum_i |x_i - y_i|^p\Big)^{1/p}`} caption="p = 1 → Manhattan · p = 2 → Euclidean" />
      <p>Minkowski is a family with a dial, p. Larger p gives more weight to the single largest coordinate difference.</p>
      <H2>Comparison</H2>
      <div className="overflow-x-auto rounded-lg border"><table className="w-full min-w-[640px] text-sm"><thead className="bg-muted/50"><tr>{["Metric", "Formula", "Intuition", "Common use", "Important consideration"].map((h) => <th key={h} scope="col" className="px-3 py-2 text-left font-semibold">{h}</th>)}</tr></thead><tbody>
        {[["Euclidean", R`\sqrt{\sum (x_i-y_i)^2}`, "Straight line", "Continuous, comparably scaled features", "Large differences are amplified by squaring"], ["Manhattan", R`\sum |x_i-y_i|`, "Grid path", "Grid-like data; sometimes more robust to one big difference", "Depends on axis orientation"], ["Minkowski", R`(\sum |x_i-y_i|^p)^{1/p}`, "Tunable family", "Trying p as a hyperparameter", "p is one more choice to validate"]].map(([m, tex, ...rest]) => <tr key={m} className="border-t"><th scope="row" className="px-3 py-2 text-left font-medium">{m}</th><td className="px-3 py-2"><InlineMath tex={tex!} /></td>{rest.map((c) => <td key={c} className="px-3 py-2">{c}</td>)}</tr>)}
      </tbody></table></div>
      <Callout kind="note">No metric is always best. All of them are sensitive to feature scale. Choose with the data and validation results — try it in the <Go slug="knn-distance-calculator">calculator</Go>.</Callout>
    </Prose>
  );
}

/* 5 · Calculator */
function Calculator() {
  return (
    <Prose>
      <p>Move two points and watch all three distances update. Defaults: A = (1, 2), B = (4, 6) → Euclidean 5, Manhattan 7, Minkowski (p = 3) = 91^(1/3) ≈ 4.498.</p>
      <DistanceCalculator />
      <Callout kind="intuition">Euclidean is never larger than Manhattan: the straight line is the shortest route. They are equal only when the points differ along one axis.</Callout>
    </Prose>
  );
}

/* 6 · Choosing k */
function ChoosingK() {
  return (
    <Prose>
      <p><strong>k</strong> is how many nearest training observations contribute to the prediction. It is a <strong>hyperparameter</strong>: you choose it, not the training step.</p>
      <Split left={{ title: "Small k (e.g. 1)", body: <ul className="list-disc space-y-1 pl-4"><li>Depends on a small neighborhood</li><li>Local patterns have more influence</li><li>Noise can have a larger effect</li><li>Boundaries can be irregular</li></ul> }} right={{ title: "Large k (e.g. 11)", body: <ul className="list-disc space-y-1 pl-4"><li>More observations vote</li><li>Single noisy points matter less</li><li>Local patterns may be smoothed out</li><li>Small regions can be overlooked</li></ul> }} />
      <p className="text-sm text-muted-foreground">Tendencies, not guarantees — every dataset behaves differently.</p>
      <H2>Bias and variance</H2>
      <TermBlock term="Bias" simple="Error from oversimplifying — the model misses real patterns." technical="Systematic error from the model's assumptions; large k averages over wide areas, which often raises bias." example="With k = 35 almost every prediction becomes the overall majority class." />
      <TermBlock term="Variance" simple="Error from over-reacting to the particular training sample." technical="How much predictions change if the training set changes; small k often has high variance." example="With k = 1, moving or relabeling one training point flips predictions near it." />
      <p>Small k often means <strong>lower bias, higher variance</strong>; large k often means <strong>higher bias, lower variance</strong>. The goal is good performance on <em>new</em> data — not on the training data.</p>
      <H2>k explorer</H2>
      <KnnLab defaults={{ q: [4.6, 4.8], boundary: true }} controls={["k", "boundary"]} title="Interactive · k changes neighbors, prediction and boundary" />
      <p className="text-sm text-muted-foreground">k is limited to 1–11 here, well below the 36 available training points, so every choice is valid.</p>
      <H2>Choosing k with validation data</H2>
      <ComparisonTable columns={["Role"]} rows={[{ label: "Training set", cells: ["The stored examples the neighbors come from"] }, { label: "Validation set", cells: ["Compare candidate k values and settings"] }, { label: "Test set", cells: ["One final, honest evaluation of the chosen model"] }]} />
      <div className="grid gap-3 md:grid-cols-3"><Flow className="my-2" steps={["Training Data", "Fit Candidate Models"]} /><Flow className="my-2" steps={["Validation Data", "Compare Candidate k", "Choose Hyperparameters"]} /><Flow className="my-2" steps={["Test Data", "Evaluate the Final Model"]} /></div>
      <Callout kind="note">Tuning repeatedly against the test set makes its score optimistic: the test set slowly becomes part of training.</Callout>
      <KValidationChart />
      <Callout kind="intuition" title="Odd k">In binary uniform voting an odd k avoids exact vote ties. It does not prevent every tie (multiclass votes, or equal distances), and odd values are not automatically better.</Callout>
    </Prose>
  );
}

/* 7 · Decision boundaries */
function Boundaries() {
  return (
    <Prose>
      <p>As in <PhaseLink to="/classification/$slug" slug="decision-boundaries">Phase 1</PhaseLink>, a decision boundary separates regions where the model predicts different classes. Standard <Go slug="logistic-regression-decision-boundary">Logistic Regression</Go> draws one straight line. KNN has no single formula for its boundary — each location simply takes the vote of its local neighborhood, so the boundary can bend around clusters: it is <strong>nonlinear</strong>.</p>
      <BoundaryCompare />
      <Callout kind="intuition">At k = 1 the regions hug individual points (a jagged, high-variance boundary). As k grows the regions merge and smooth out. Too large, and the small clusters disappear.</Callout>
    </Prose>
  );
}

/* 8 · Voting */
function Voting() {
  return (
    <Prose>
      <Split left={{ title: "Uniform voting", body: <p>Each of the k neighbors gets <strong>equal weight</strong>. The class with the most neighbors wins.</p> }} right={{ title: "Distance-weighted voting", body: <><p>Closer neighbors contribute <strong>more</strong>. A common choice:</p><InlineMath tex={R`\text{weight} \propto \frac{1}{d}`} /></> }} />
      <p>1/d is one common scheme, not the only one (others use 1/d², kernels, etc.). A neighbor at distance 0 needs special handling, since 1/0 is undefined.</p>
      <VotingCompare />
      <p>The two rules can disagree because they answer slightly different questions: "which class is most common nearby?" versus "which class is closest, weighted by closeness?". Neither is always better — validate both.</p>
    </Prose>
  );
}

/* 9 · Scaling */
function Scaling() {
  return (
    <Prose>
      <p>Suppose two features: <strong>age</strong> (18–80) and <strong>annual income</strong> (10,000–200,000). A 10-year age gap adds 10 to the distance; a $10,000 income gap adds 10,000. The distance is dominated by income — not because income matters more, but because its <strong>numbers are bigger</strong>.</p>
      <Callout kind="note" title="KNN only sees numbers">The algorithm does not know the real-world importance of a feature. It uses the numerical representation you give it.</Callout>
      <H2>Common scaling methods</H2>
      <FormulaBlock tex={R`z = \frac{x - \mu}{\sigma}`} caption="Standardization: mean 0, standard deviation 1." variables={[{ symbol: R`\mu`, meaning: "feature mean (training data)" }, { symbol: R`\sigma`, meaning: "feature standard deviation" }]} />
      <FormulaBlock tex={R`x_{\text{scaled}} = \frac{x - x_{\min}}{x_{\max} - x_{\min}}`} caption="Min-max scaling: maps the training range to [0, 1]; sensitive to extreme values." />
      <p>Neither is universally better. Both must be fitted on the <strong>training</strong> data only and then applied to new data.</p>
      <ScalingViz />
      <p>With k = 1 and no scaling, the nearest customer is the one with the most similar <em>income</em> — a 34-year-old in Class A. After either scaling method, age counts again and the nearest neighbors are customers aged 55–78 in Class B.</p>
    </Prose>
  );
}

/* 10 · Dimensionality */
function Dimensionality() {
  return (
    <Prose>
      <p>The <strong>curse of dimensionality</strong>: as the number of features grows, a fixed number of observations covers the space more and more sparsely. Neighbors that are "nearest" may still be far away, and the gap between the nearest and the farthest point shrinks.</p>
      <Split left={{ title: "Low-dimensional (2 features)", body: "200 points fill a square densely. The closest neighbors are genuinely close and informative." }} right={{ title: "High-dimensional (500 features)", body: "200 points are scattered in an enormous space. Almost every point is about equally far from the query." }} />
      <DimensionViz />
      <ul className="list-disc space-y-1 pl-5"><li>Distance calculations get more expensive with every feature.</li><li>Irrelevant features add noise to every distance.</li><li>Feature selection or dimensionality reduction can sometimes help — covered elsewhere.</li></ul>
    </Prose>
  );
}

/* 11 · scikit-learn */
const SK_BASIC = `from sklearn.neighbors import KNeighborsClassifier

model = KNeighborsClassifier(n_neighbors=5)
model.fit(X_train, y_train)          # stores (and indexes) the training data
predictions = model.predict(X_test)  # distances → neighbors → vote, per test row`;
const SK_PARAMS = `KNeighborsClassifier(
    n_neighbors=5,        # k
    weights="uniform",    # or "distance" (1/d weighting)
    algorithm="auto",     # neighbor-search strategy: "auto", "ball_tree", "kd_tree", "brute"
    metric="minkowski",   # distance family
    p=2,                  # p=1 → Manhattan, p=2 → Euclidean
)`;
const SK_FULL = `from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.neighbors import KNeighborsClassifier
from sklearn.metrics import (confusion_matrix, accuracy_score, precision_score,
                             recall_score, f1_score, roc_auc_score)

# 1-2. Load data; separate features and labels (0 = malignant, 1 = benign)
X, y = load_breast_cancer(return_X_y=True)

# 3. Stratified split BEFORE any scaling
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y)

# 4-5. Scaling + KNN in one pipeline: the scaler is fitted on X_train only
pipeline = Pipeline([
    ("scaler", StandardScaler()),
    ("knn", KNeighborsClassifier(n_neighbors=5)),
])
pipeline.fit(X_train, y_train)

# 6-7. Predictions and probabilities (share of neighbor votes per class)
y_pred = pipeline.predict(X_test)
proba = pipeline.predict_proba(X_test)
classes = list(pipeline.classes_)              # column order, e.g. [0, 1]
p_benign = proba[:, classes.index(1)]

# 8. Metrics (positive class here = 1 = benign)
print(confusion_matrix(y_test, y_pred))
print("Accuracy :", accuracy_score(y_test, y_pred))
print("Precision:", precision_score(y_test, y_pred))
print("Recall   :", recall_score(y_test, y_pred))
print("F1       :", f1_score(y_test, y_pred))
print("ROC-AUC  :", roc_auc_score(y_test, p_benign))

# 10. Experiment with k (for real selection use validation / cross-validation, not the test set)
for k in [1, 3, 5, 7, 9, 11]:
    pipeline.set_params(knn__n_neighbors=k).fit(X_train, y_train)
    print(k, f1_score(y_test, pipeline.predict(X_test)))`;
function Sklearn() {
  return (
    <Prose>
      <CodeBlock code={SK_BASIC} />
      <ComparisonTable columns={["What happens"]} rows={[{ label: "KNeighborsClassifier(n_neighbors=5)", cells: ["Creates the model with k = 5"] }, { label: "fit()", cells: ["Stores the training data (and may build a search index)"] }, { label: "predict()", cells: ["Uses the stored data: distances, neighbors and votes for each row"] }]} />
      <H2>Distance and voting parameters</H2>
      <CodeBlock code={SK_PARAMS} />
      <ComparisonTable columns={["Meaning"]} rows={[{ label: "n_neighbors", cells: ["Number of neighbors considered (k)"] }, { label: "weights", cells: ["Uniform votes or distance-weighted votes"] }, { label: "algorithm", cells: ["How neighbors are searched for — affects speed, not the answer"] }, { label: "metric", cells: ["Distance metric"] }, { label: "p", cells: ["Minkowski power: 1 = Manhattan, 2 = Euclidean"] }]} />
      <H2>Complete example</H2>
      <CodeBlock code={SK_FULL} />
      <Callout kind="note" title="Why the Pipeline matters">Fitting a scaler on the complete dataset before splitting lets test-set statistics leak into training and inflates scores. Inside a Pipeline the scaler only ever learns from the data passed to fit(). The printed numbers depend on the split, so none are quoted here.</Callout>
      <p>predict_proba for KNN is the (weighted) share of neighbors in each class, so with small k the probabilities are coarse — with k = 5 only 0, 0.2, 0.4 … 1.0 are possible.</p>
    </Prose>
  );
}

/* 12 · Evaluation */
function Evaluation() {
  return (
    <Prose>
      <p>KNN reuses the <PhaseLink to="/evaluation/$slug" slug="confusion-matrix">Phase 2</PhaseLink> evaluation tools unchanged: confusion matrix, accuracy, precision, recall, F1 and — using probabilities — ROC-AUC.</p>
      <Flow steps={["KNN neighbors", "Vote share = probability", "Predicted class", "Confusion Matrix", "Metrics"]} />
      <KnnEvaluation />
      <Callout kind="note" title="Define the positive class">For ROC-AUC pass probabilities, not hard labels, and select the column for your positive class using <code>model.classes_</code> — column order follows the sorted labels, not your intentions. In the breast-cancer data 1 means benign; if malignant is the case to detect, its column is <code>classes_.index(0)</code>.</Callout>
      <p>Which metric matters depends on the cost of false positives and false negatives — see <PhaseLink to="/evaluation/$slug" slug="choosing-metrics">Choosing Metrics</PhaseLink>.</p>
    </Prose>
  );
}

/* 13 · Tuning */
const SK_GRID = `from sklearn.model_selection import GridSearchCV

param_grid = {
    "knn__n_neighbors": [3, 5, 7, 9, 11],
    "knn__weights": ["uniform", "distance"],
    "knn__metric": ["minkowski"],
    "knn__p": [1, 2],
}

search = GridSearchCV(
    estimator=pipeline,   # StandardScaler → KNeighborsClassifier
    param_grid=param_grid,
    scoring="f1",         # choose the metric that matches your problem
    cv=5,                 # 5-fold cross-validation on the TRAINING data
)
search.fit(X_train, y_train)

print(search.best_params_)
print(search.best_score_)                 # mean cross-validated F1
best_model = search.best_estimator_
print(f1_score(y_test, best_model.predict(X_test)))   # one final test check`;
function Tuning() {
  return (
    <Prose>
      <CodeBlock code={SK_GRID} />
      <ComparisonTable columns={["What it means"]} rows={[
        { label: "Grid search", cells: ["Tries every combination in param_grid (5 × 2 × 1 × 2 = 20 here)"] },
        { label: "Cross-validation", cells: ["Splits the training data into 5 folds; each fold takes a turn as validation"] },
        { label: "knn__ prefix", cells: ["Targets the Pipeline step named \"knn\""] },
        { label: "scoring", cells: ["The metric used to rank combinations — accuracy, f1, recall, roc_auc …"] },
      ]} />
      <Callout kind="note">Keep the scaler inside the Pipeline so it is refitted on each training fold — scaling outside would leak validation statistics. Leave the test set untouched until the single final evaluation.</Callout>
    </Prose>
  );
}

/* 14 · Advantages & limitations */
const MISTAKES: [string, string, string][] = [
  ["Assuming larger k always improves performance", "Too large a k smooths away real local patterns (high bias).", "k has a sweet spot found with validation."],
  ["Assuming smaller k always gives better local predictions", "Small k follows noise (high variance).", "Local is not the same as accurate."],
  ["Forgetting to scale features", "Large-scale features dominate the distance.", "Scale inside a Pipeline unless features already share a meaningful scale."],
  ["Choosing a metric without considering the data", "Different metrics pick different neighbors.", "Treat the metric as a hyperparameter to validate."],
  ["Tuning k on the test set", "The test score becomes optimistic.", "Tune on validation/cross-validation; test once."],
  ["Fitting a scaler before splitting", "Test statistics leak into training.", "Split first; fit preprocessing on training data only."],
  ["Confusing classification voting with regression averaging", "Classes are voted on; numbers are averaged.", "Classifier votes labels, regressor averages targets."],
  ["Assuming distance weighting always performs better", "It can over-trust a single very close noisy point.", "Validate uniform and distance weights."],
  ["Treating training accuracy as proof of generalization", "With k = 1, each training point is its own neighbor: 100%.", "Judge on held-out data."],
  ["Ignoring class imbalance", "A dominant class wins many neighborhoods by sheer numbers.", "Check recall/precision per class; consider weighting or resampling."],
  ["Assuming odd k eliminates every tie", "Multiclass votes and equal distances can still tie.", "Know your library's tie rule."],
  ["Assuming no computational cost because training is simple", "Prediction compares against the stored data.", "Cost moves from training to prediction."],
];
function AdvLim() {
  return (
    <Prose>
      <H2>Advantages</H2>
      <div className="grid gap-3 sm:grid-cols-2">{[["Intuitive", "“Look at similar examples” is easy to explain."], ["Simple to implement", "A few lines of distance and voting code."], ["Nonlinear boundaries", "Regions follow local data, not a straight line."], ["Little explicit fitting", "Basic KNN stores data instead of estimating weights."], ["Natural multiclass support", "Voting works for any number of classes."], ["Good on small, well-scaled data", "Can work well when distance is meaningful."], ["Useful baseline", "A quick reference point for other models — not always the strongest."]].map(([t, d]) => <ConceptCard key={t} title={t!}>{d}</ConceptCard>)}</div>
      <H2>Limitations</H2>
      <ComparisonTable columns={["Why it matters"]} rows={[
        { label: "Expensive prediction", cells: ["Each query may compare against many stored observations."] }, { label: "Memory", cells: ["The training set must be kept for every future prediction."] },
        { label: "Scaling needed", cells: ["Unscaled features distort distances."] }, { label: "Irrelevant features", cells: ["They add noise to every distance."] },
        { label: "High dimensions", cells: ["Neighborhoods become less informative."] }, { label: "Depends on k", cells: ["Results change with the neighborhood size."] },
        { label: "Depends on metric", cells: ["A different metric can choose different neighbors."] }, { label: "Noise", cells: ["Mislabeled points sway small-k predictions."] },
        { label: "Class imbalance", cells: ["The majority class can dominate votes."] }, { label: "Probabilities", cells: ["Vote shares are coarse and may be poorly calibrated."] },
      ]} />
      <H2>Computational cost</H2>
      <Split left={{ title: "Training", body: "Usually inexpensive compared with many parameter-learning algorithms; mainly storing (and optionally indexing) the observations." }} right={{ title: "Prediction & memory", body: "May require comparing each query with many training observations; cost grows with dataset size and dimensionality. All training data stays in memory." }} />
      <p className="text-sm">Tree-based neighbor search (the <code>algorithm</code> parameter) can speed things up in suitable, lower-dimensional settings; its benefit depends on the data.</p>
      <H2>When to use KNN</H2>
      <Split left={{ title: "Good candidate when", body: <ul className="list-disc space-y-1 pl-4"><li>Dataset is small or moderate</li><li>Similar observations should share labels</li><li>Features and distance are meaningful</li><li>A nonlinear boundary may help</li><li>A simple baseline is needed</li></ul> }} right={{ title: "Less suitable when", body: <ul className="list-disc space-y-1 pl-4"><li>Training set is extremely large</li><li>Prediction latency is critical</li><li>Scales differ and preprocessing is impossible</li><li>Feature space is very high-dimensional</li><li>Distance is not a meaningful similarity</li></ul> }} />
      <p className="text-sm text-muted-foreground">Guidelines, not rules.</p>
      <H2>Common KNN mistakes</H2>
      <ol className="divide-y border-y">{MISTAKES.map(([m, why, right], i) => <li key={m} className="py-3"><p className="font-medium">{i + 1}. {m}</p><p className="text-sm"><strong>Why wrong:</strong> {why}</p><p className="text-sm text-muted-foreground"><strong>Correct mental model:</strong> {right}</p></li>)}</ol>
    </Prose>
  );
}

/* 15 · Experiments */
function Exp({ id, title, setup, change, expect, explain, takeaway, children }: { id: string; title: string; setup: string; change: string; expect: string; explain: string; takeaway: string; children: ReactNode }) {
  return (
    <section className="my-8 border-t pt-2" aria-labelledby={`exp-${id}`}>
      <h2 id={`exp-${id}`} className="mt-6 text-xl font-semibold tracking-tight">Experiment {id}: {title}</h2>
      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
        <div className="rounded-md border p-3"><dt className="font-mono text-xs uppercase text-muted-foreground">Initial setup</dt><dd>{setup}</dd></div>
        <div className="rounded-md border p-3"><dt className="font-mono text-xs uppercase text-muted-foreground">Parameter to change</dt><dd>{change}</dd></div>
        <div className="rounded-md border p-3"><dt className="font-mono text-xs uppercase text-muted-foreground">Expected observation</dt><dd>{expect}</dd></div>
      </dl>
      {children}
      <p className="text-sm"><strong>Explanation:</strong> {explain}</p>
      <p className="mt-1 text-sm"><strong>Key takeaway:</strong> {takeaway}</p>
    </section>
  );
}
const Actual = ({ children }: { children: ReactNode }) => <p className="mt-3 rounded-md border-l-4 border-primary bg-muted/40 px-3 py-2 text-sm"><strong>Actual result:</strong> {children}</p>;
function Experiments() {
  return (
    <div>
      <p className="text-[15.5px] leading-relaxed">Each experiment changes one thing. The "Actual result" line is computed live from the lab.</p>
      <Exp id="A" title="Change k" setup="◆ at (4.6, 4.8), between clusters, regions on." change="k: 1 → 11" expect="The prediction and region shapes may change as more neighbors vote." explain="More neighbors reach into other clusters, shifting the vote and smoothing the regions." takeaway="k sets how local the decision is.">
        <KnnLab defaults={{ q: [4.6, 4.8], boundary: true }} controls={["k", "boundary"]} title="Experiment A" summary={(r, s) => <Actual>k = {s.k}: {r.counts[0]} A vs {r.counts[1]} B → {cls(r)}.</Actual>} />
      </Exp>
      <Exp id="B" title="Change the distance metric" setup="◆ at (4, 4), k = 5." change="Euclidean ↔ Manhattan" expect="The neighbor set can differ, sometimes changing the prediction." explain="A circle and a diamond of the same 'radius' cover different points." takeaway="The metric defines who counts as nearby.">
        <KnnLab defaults={{ q: [4, 4] }} controls={["metric"]} title="Experiment B" summary={(r, s) => <Actual>{s.metric}: neighbors {r.neighbors.map((n) => n.id).join(", ")} → {cls(r)}.</Actual>} />
      </Exp>
      <Exp id="C" title="Change the voting method" setup="◆ at (4, 4), k = 5, Euclidean." change="Uniform ↔ distance-weighted" expect="With 3 A vs 2 B but closer B points, the weighted vote may flip." explain="Distance weighting lets the two closer Class B neighbors outweigh three farther Class A neighbors." takeaway="How votes are counted matters as much as who votes.">
        <KnnLab defaults={{ q: [4, 4] }} controls={["voting"]} title="Experiment C" summary={(r, s) => <Actual>{s.voting}: A {s.voting === "uniform" ? r.scores[0] : r.scores[0].toFixed(2)} vs B {s.voting === "uniform" ? r.scores[1] : r.scores[1].toFixed(2)} → {cls(r)}.</Actual>} />
      </Exp>
      <Exp id="D" title="Apply feature scaling" setup="Customer aged 60 earning $92,000, k = 1." change="No scaling → standardization / min-max" expect="The nearest neighbor changes once age is no longer drowned out by income." explain="Without scaling, income's large numbers decide the distance; after scaling, both features count." takeaway="Scale before measuring distance.">
        <ScalingViz />
        <Actual>shown in the table above — no scaling picks C5 (age 34, Class A); both scalers pick C9 (age 63, Class B).</Actual>
      </Exp>
      <Exp id="E" title="Add a noisy observation" setup="◆ at (3.2, 3.0) inside a Class A cluster." change="Add the mislabeled point, then raise k" expect="At k = 1 and 3 the noisy Class B point can flip the prediction; at k = 5 the majority recovers." explain="Small k trusts the few closest points, even a wrong one." takeaway="Larger k is more robust to isolated noise — at the cost of local detail.">
        <KnnLab defaults={{ q: [3.2, 3.0], k: 1, noise: true }} controls={["k", "noise"]} title="Experiment E" summary={(r, s) => <Actual>{s.noise ? "with" : "without"} noisy point, k = {s.k}: {r.counts[0]} A vs {r.counts[1]} B → {cls(r)}.</Actual>} />
      </Exp>
      <Exp id="F" title="Increase the number of features" setup="200 uniform random points." change="Number of features: 1 → 500" expect="Nearest and farthest distances become similar." explain="In high dimensions, space is so large that points are sparse and roughly equidistant." takeaway="More features is not automatically more information for KNN.">
        <DimensionViz />
        <Actual>the ratio rises from about 0.00 with 1 feature to about 0.87 with 500 features.</Actual>
      </Exp>
    </div>
  );
}

/* 16 · Cheat sheet */
const PY_REF = `from sklearn.neighbors import KNeighborsClassifier   # the classifier
from sklearn.preprocessing import StandardScaler     # mean 0 / std 1 scaling
from sklearn.pipeline import Pipeline                # preprocessing + model, leak-free
from sklearn.model_selection import train_test_split, GridSearchCV  # splitting / tuning
from sklearn.metrics import (confusion_matrix, accuracy_score, precision_score,
                             recall_score, f1_score, roc_auc_score)  # Phase 2 metrics

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)

model = Pipeline([
    ("scaler", StandardScaler()),
    ("knn", KNeighborsClassifier(n_neighbors=5, weights="uniform", metric="minkowski", p=2)),
])
model.fit(X_train, y_train)                    # stores scaled training data
y_pred = model.predict(X_test)                 # class labels
y_prob = model.predict_proba(X_test)[:, 1]     # share of neighbors in class 1 (check model.classes_)

search = GridSearchCV(model, {"knn__n_neighbors": [3, 5, 7, 9, 11]}, scoring="f1", cv=5)
search.fit(X_train, y_train)                   # tune on training folds only

print(confusion_matrix(y_test, y_pred), accuracy_score(y_test, y_pred),
      precision_score(y_test, y_pred), recall_score(y_test, y_pred),
      f1_score(y_test, y_pred), roc_auc_score(y_test, y_prob))`;
function Cheat() {
  const items: [string, ReactNode][] = [
    ["Core idea", "Classify a new observation using its nearest labeled observations."],
    ["Euclidean", <InlineMath key="e" tex={R`\sqrt{\textstyle\sum_i (x_i-y_i)^2}`} />], ["Manhattan", <InlineMath key="m" tex={R`\textstyle\sum_i |x_i-y_i|`} />],
    ["Minkowski", <InlineMath key="k" tex={R`(\textstyle\sum_i |x_i-y_i|^p)^{1/p}`} />],
    ["Uniform voting", "Each selected neighbor has equal weight."], ["Distance-weighted", "Closer neighbors contribute more weight (e.g. 1/d)."],
    ["Choosing k", "Small k: more sensitive to local noise. Large k: smoother predictions."], ["Feature scaling", "Stops large numeric ranges from dominating distance."],
    ["Evaluation", "Select hyperparameters on validation data; keep the test set for the end."],
  ];
  return (
    <Prose>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{items.map(([t, body]) => <div key={t} className="rounded-lg border bg-card p-4"><p className="font-mono text-xs uppercase text-muted-foreground">{t}</p><div className="mt-2 overflow-x-auto text-sm">{body}</div></div>)}</div>
      <H2>Python reference</H2>
      <CodeBlock code={PY_REF} />
      <H2>Concept map</H2>
      <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
        <div className="rounded-lg border p-3">
          <p className="text-center font-mono text-xs uppercase text-primary">Prediction path</p>
          <Flow className="my-2" steps={["KNN", "Training Dataset", "New Observation", "Distance Calculation", <span key="m">Distance Metric<br /><span className="text-xs text-muted-foreground">Euclidean · Manhattan · Minkowski</span></span>, "Select k Neighbors", <span key="v">Voting<br /><span className="text-xs text-muted-foreground">Uniform · Distance-Weighted</span></span>, "Predicted Class", "Evaluation Metrics"]} />
        </div>
        <div className="space-y-3">
          <div className="rounded-lg border p-3"><p className="text-center font-mono text-xs uppercase text-primary">Feeds distance</p><Flow className="my-2" steps={["Feature Scaling", "Distance Calculation"]} /></div>
          <div className="rounded-lg border p-3"><p className="text-center font-mono text-xs uppercase text-primary">Shape</p><Flow className="my-2" steps={["Choice of k", "Local Neighborhood", "Decision Boundary"]} /></div>
          <div className="rounded-lg border p-3"><p className="text-center font-mono text-xs uppercase text-primary">Tuning</p><Flow className="my-2" steps={["Validation", "Hyperparameter Selection"]} /></div>
        </div>
      </div>
      <DefinitionBlock title="In your own words">KNN classifies a new observation by measuring its distance to labeled training examples, selecting the k closest, and letting them vote. Its behaviour depends on k, the distance metric, the voting rule and — critically — how the features are scaled.</DefinitionBlock>
    </Prose>
  );
}

export const knnContent: Record<string, ComponentType> = {
  knn: Intro,
  "knn-how-it-works": HowItWorks,
  "knn-lab": Lab,
  "knn-distance-metrics": Metrics,
  "knn-distance-calculator": Calculator,
  "knn-choosing-k": ChoosingK,
  "knn-decision-boundaries": Boundaries,
  "knn-voting": Voting,
  "knn-feature-scaling": Scaling,
  "knn-dimensionality": Dimensionality,
  "knn-scikit-learn": Sklearn,
  "knn-evaluation": Evaluation,
  "knn-tuning": Tuning,
  "knn-advantages-limitations": AdvLim,
  "knn-experiments": Experiments,
  "knn-cheat-sheet": Cheat,
};
