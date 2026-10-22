import type { ComponentType, ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { H2, H3, Prose } from "@/components/learning/LessonShell";
import { Callout, CodeBlock, ComparisonTable, ConceptCard, DefinitionBlock, ExampleBlock, FormulaBlock, InlineMath } from "@/components/learning/blocks";
import { Flow, Split } from "@/components/visualization/diagrams";
import {
  CExplorer, CGammaGrid, DecisionScoreTable, GammaExplorer, HardSoftDemo, HyperplaneExplorer, KernelCalculator, KernelComparison, LinearVsNonlinear, MarginViz,
  SupportVectorDemo, SvmEvaluation, SvmImbalanceViz, SvmLab, SvmScalingViz,
} from "@/components/visualization/SvmViz";

const R = String.raw;
const Go = ({ slug, children }: { slug: string; children: ReactNode }) => <Link to="/algorithms/$slug" params={{ slug }} className="font-medium text-primary underline-offset-4 hover:underline">{children}</Link>;
const PhaseLink = ({ slug, children }: { slug: string; children: ReactNode }) => <Link to="/evaluation/$slug" params={{ slug }} className="text-primary underline-offset-4 hover:underline">{children}</Link>;
const WORKFLOW = ["Training Data", "Represent Features", "Choose a Kernel", "Fit the SVM", "Determine the Decision Boundary", "Identify Support Vectors", "Predict Classes or Decision Scores", "Evaluate the Model"];
const List = ({ items }: { items: ReactNode[] }) => <ul className="list-disc space-y-1 pl-5">{items.map((x, i) => <li key={i}>{x}</li>)}</ul>;

/* 1 · Introduction */
function Intro() {
  const cards: [string, string, string][] = [
    ["SVM Fundamentals", "svm-hyperplanes", "Linear classifiers and signed scores."], ["Hyperplanes", "svm-hyperplane-explorer", "Move a boundary with w and b."],
    ["Margins", "svm-margins", "Half margin 1/‖w‖, full margin 2/‖w‖."], ["Support Vectors", "svm-support-vectors", "The points that constrain the boundary."],
    ["Hard and Soft Margins", "svm-hard-soft-margin", "Allowing controlled violations."], ["The C Hyperparameter", "svm-c-hyperparameter", "Penalty for margin violations."],
    ["Kernel Trick", "svm-kernel-trick", "Nonlinear boundaries via similarity."], ["RBF Kernel", "svm-rbf-kernel", "Gaussian similarity."],
    ["The gamma Hyperparameter", "svm-gamma", "Similarity scale and flexibility."], ["Scikit-learn Implementation", "svm-scikit-learn", "SVC in a Pipeline."],
  ];
  const stages = ["Labeled observations with numerical features.", "Encode and scale features — SVMs are distance/dot-product based.", "Linear, polynomial or RBF: what shape of boundary is possible.", "An optimizer balances a wide margin against training violations.", "The set where the decision score f(x) = 0.", "Training points on or inside the margin, or misclassified; they define the solution.", "Sign of f(x) gives the class; f(x) itself is a decision score.", "Confusion matrix, Phase 2 metrics and ROC-AUC on held-out data."];
  return (
    <Prose>
      <p className="text-lg">Understand how machine learning finds separating boundaries that maximize the margin between classes.</p>
      <DefinitionBlock title="The core idea">An SVM classifier seeks a decision boundary that separates classes while <strong>maximizing the margin</strong>, subject to the model's constraints and the chosen kernel.</DefinitionBlock>
      <p>Real datasets often contain overlapping classes, noisy observations or patterns no straight line can separate. SVMs handle these with a <strong>soft margin</strong> (controlled by <InlineMath tex="C" />) and <strong>kernels</strong> (curved boundaries, controlled for RBF by <InlineMath tex="\gamma" />).</p>
      <div className="grid gap-4 md:grid-cols-2">
        <div><H3>The SVM workflow</H3><Flow steps={WORKFLOW} /></div>
        <div><H3>What each stage does</H3><ol className="list-decimal space-y-1 pl-5 text-sm">{stages.map((s, i) => <li key={i}><strong>{WORKFLOW[i]}:</strong> {s}</li>)}</ol></div>
      </div>
      <H2>What is an SVM?</H2>
      <p>A Support Vector Machine is a <strong>supervised</strong> model. For classification (SVC) it learns a boundary from labeled examples. Unlike <Go slug="logistic-regression">Logistic Regression</Go>, it does not model probabilities directly; it maximizes a geometric margin. Unlike <Go slug="knn">KNN</Go>, after training it only needs its support vectors to predict. Unlike <Go slug="decision-trees">Decision Trees</Go>, its boundary is not built from axis-aligned splits.</p>
      <ExampleBlock title="Two groups on a table">Imagine red and blue coins on a table. Many straight sticks could separate them. An SVM picks the stick placed so that the <strong>widest possible empty corridor</strong> runs between the two groups.</ExampleBlock>
      <H2>Try it</H2>
      <MarginViz />
      <H2>Module map</H2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{cards.map(([t, slug, d]) => <Link key={t} to="/algorithms/$slug" params={{ slug }}><ConceptCard title={t}>{d}</ConceptCard></Link>)}</div>
    </Prose>
  );
}

/* 2 · Hyperplanes */
function Hyperplanes() {
  return (
    <Prose>
      <H2>Linear classifiers</H2>
      <p>A linear classifier computes a <strong>decision score</strong> from a weighted sum of features and predicts by its sign.</p>
      <FormulaBlock tex={R`f(\mathbf{x}) = \mathbf{w}^\top\mathbf{x} + b = w_1x_1 + w_2x_2 + \dots + w_dx_d + b`} variables={[{ symbol: "x", meaning: "feature vector of one observation" }, { symbol: "w", meaning: "weight vector — perpendicular to the boundary" }, { symbol: "b", meaning: "bias — shifts the boundary" }]} />
      <FormulaBlock tex={R`\hat y = \begin{cases} +1 & f(\mathbf{x}) \ge 0 \\ -1 & f(\mathbf{x}) < 0 \end{cases}`} caption="SVMs conventionally label the classes −1 and +1 (scikit-learn accepts any labels and maps them internally)." />
      <H2>What is a hyperplane?</H2>
      <p>The <strong>decision boundary</strong> is the set of points where <InlineMath tex={R`\mathbf{w}^\top\mathbf{x} + b = 0`} />. It is a <strong>hyperplane</strong>: a flat surface one dimension lower than the feature space.</p>
      <ComparisonTable columns={["The hyperplane is a…"]} rows={[{ label: "2 features", cells: ["line"] }, { label: "3 features", cells: ["plane"] }, { label: "d features", cells: ["(d − 1)-dimensional flat hyperplane"] }]} />
      <Callout kind="intuition" title="Signed distance">The distance from a point to the hyperplane is <InlineMath tex={R`f(\mathbf{x}) / \lVert\mathbf{w}\rVert`} />. Its sign says which side the point is on; its size says how far away it is. Multiplying by the true label, <InlineMath tex={R`y\,f(\mathbf{x})/\lVert\mathbf{w}\rVert`} /> is positive exactly when the point is on the correct side.</Callout>
      <p>Many hyperplanes may separate the same training data. The SVM's question is <em>which</em> one to choose. Try it in the <Go slug="svm-hyperplane-explorer">Interactive Hyperplane Explorer</Go>.</p>
    </Prose>
  );
}

function HyperplaneLesson() {
  return (
    <Prose>
      <p>Adjust <InlineMath tex="w_1" />, <InlineMath tex="w_2" /> and <InlineMath tex="b" />. Changing the weights <strong>rotates</strong> the line (and changes ‖w‖); changing the bias <strong>shifts</strong> it. Every score in the table is computed live.</p>
      <HyperplaneExplorer />
      <Callout kind="note" title="Things to notice">Several settings classify all six points correctly — but their minimum signed distances differ. Press “Show the maximum-margin line” to see the SVM's choice: it gives the largest smallest distance (≈ 1.58 here). Scaling w and b by the same positive number leaves the line unchanged but changes the scores — SVMs fix this by requiring the closest points to score exactly ±1.</Callout>
    </Prose>
  );
}

/* 4 · Margins */
function Margins() {
  return (
    <Prose>
      <DefinitionBlock title="Margin">The margin is the empty corridor between the decision boundary and the closest training points of each class.</DefinitionBlock>
      <p>SVMs fix the scale of w so the closest points satisfy <InlineMath tex={R`|\mathbf{w}^\top\mathbf{x}+b| = 1`} />. This gives three parallel hyperplanes:</p>
      <ComparisonTable columns={["Equation", "Meaning"]} rows={[{ label: "Decision boundary", cells: ["wᵀx + b = 0", "where predictions switch"] }, { label: "Positive margin boundary", cells: ["wᵀx + b = +1", "closest ▲ points lie here"] }, { label: "Negative margin boundary", cells: ["wᵀx + b = −1", "closest ● points lie here"] }]} />
      <FormulaBlock tex={R`\text{half-margin} = \frac{1}{\lVert\mathbf{w}\rVert} \qquad \text{full margin} = \frac{2}{\lVert\mathbf{w}\rVert}`} caption="Half margin: boundary to one margin line. Full margin: distance between the two margin lines." />
      <Callout kind="note" title="Don't mix them up">Some texts call 1/‖w‖ “the margin” and others call 2/‖w‖ the margin. This site always says <strong>half-margin</strong> (1/‖w‖) or <strong>full margin</strong> (2/‖w‖). Either way, a <strong>smaller ‖w‖ means a wider margin</strong>.</Callout>
      <ExampleBlock title="Worked example">If w = (0.6, 0.2) then ‖w‖ = √(0.36 + 0.04) = √0.40 ≈ 0.632. Half-margin = 1/0.632 ≈ 1.58; full margin = 2/0.632 ≈ 3.16. (This is the fitted model on the six-point dataset in the explorer.)</ExampleBlock>
      <H3>Why a margin point is 1/‖w‖ away</H3>
      <p>A point on the positive margin line has <InlineMath tex="f(\mathbf{x}) = 1" />, so its distance to the boundary is <InlineMath tex={R`f(\mathbf{x})/\lVert\mathbf{w}\rVert = 1/\lVert\mathbf{w}\rVert`} />. Same for the negative side, giving 2/‖w‖ in total.</p>
    </Prose>
  );
}
function MarginLesson() {
  return (
    <Prose>
      <p>Rotate the boundary direction. For each direction, the line is placed midway between the two classes and the margin is measured. The widest possible margin is the one the SVM finds.</p>
      <MarginViz />
      <Callout kind="note" title="Observe">The margin is determined only by the ringed points touching the margin lines. As you rotate, different points become the closest ones. The half-margin is always exactly half the full margin.</Callout>
    </Prose>
  );
}

/* 6 · Support vectors */
function SupportVectors() {
  return (
    <Prose>
      <DefinitionBlock title="Support vectors">Training observations that lie <strong>on the margin boundaries, inside the margin, or on the wrong side</strong> of the boundary. In the solution they have a nonzero weight αᵢ.</DefinitionBlock>
      <p>The fitted boundary can be written using only the support vectors:</p>
      <FormulaBlock tex={R`f(\mathbf{x}) = \sum_{i \in SV} \alpha_i\, y_i\, K(\mathbf{x}_i, \mathbf{x}) + b`} caption="For a linear kernel, K(xᵢ, x) = xᵢᵀx, so w = Σ αᵢ yᵢ xᵢ." />
      <SupportVectorDemo />
      <Callout kind="intuition" title="Why it matters">Removing a point that is not a support vector leaves the boundary unchanged. Removing a support vector can move it. Support vectors are not the “most important data” in general — they are the points that <em>constrain this particular solution</em>.</Callout>
    </Prose>
  );
}

/* 7 · Maximum margin */
function MaximumMargin() {
  return (
    <Prose>
      <H2>Why maximize the margin?</H2>
      <List items={[
        <>A wide margin means the boundary is not pressed against any training point, so small perturbations of new observations are less likely to flip their prediction.</>,
        <>Among all separating hyperplanes, the maximum-margin one is unique — a principled choice instead of an arbitrary one.</>,
        <>Statistical learning theory links larger margins to better generalization bounds. This is a tendency, not a guarantee: a wide margin on unrepresentative data can still generalize poorly.</>,
      ]} />
      <H2>The hard-margin optimization problem</H2>
      <FormulaBlock tex={R`\min_{\mathbf{w},b}\ \tfrac12\lVert\mathbf{w}\rVert^2 \quad\text{subject to}\quad y_i(\mathbf{w}^\top\mathbf{x}_i + b) \ge 1\ \ \forall i`} caption="Maximizing 2/‖w‖ is the same as minimizing ‖w‖, and ½‖w‖² is easier to optimize (smooth and convex)." />
      <p>The constraint says every training point must be on the correct side <em>and</em> at least on its margin line. Because the problem is convex, there is one global optimum — no local minima to get stuck in. Libraries solve it (or its dual) with specialized algorithms; you will not need to do it by hand.</p>
      <MarginViz />
    </Prose>
  );
}

/* 8 · Hard vs soft */
function HardSoft() {
  return (
    <Prose>
      <Split left={{ title: "Hard-margin SVM", body: <List items={["Requires perfect separation", "No point may be inside the margin", "Infeasible if classes overlap", "Very sensitive to a single outlier"]} /> }} right={{ title: "Soft-margin SVM", body: <List items={["Allows margin violations", "Each violation pays a penalty", "Works on overlapping, noisy data", "This is what SVC actually solves"]} /> }} />
      <H2>Slack variables</H2>
      <p>Each point gets a slack <InlineMath tex={R`\xi_i \ge 0`} /> measuring how far it violates its margin:</p>
      <ComparisonTable columns={["Meaning"]} rows={[{ label: "ξᵢ = 0", cells: ["on or beyond its margin line — no violation"] }, { label: "0 < ξᵢ ≤ 1", cells: ["inside the margin but correctly classified"] }, { label: "ξᵢ > 1", cells: ["on the wrong side of the boundary — misclassified"] }]} />
      <FormulaBlock tex={R`\min_{\mathbf{w},b,\xi}\ \tfrac12\lVert\mathbf{w}\rVert^2 + C\sum_i \xi_i \quad\text{s.t.}\quad y_i(\mathbf{w}^\top\mathbf{x}_i+b) \ge 1-\xi_i,\ \ \xi_i \ge 0`} />
      <p>Equivalently, <InlineMath tex={R`\xi_i = \max(0,\ 1 - y_i f(\mathbf{x}_i))`} />, the <strong>hinge loss</strong>.</p>
      <HardSoftDemo />
    </Prose>
  );
}

/* 9 · C */
function CParam() {
  return (
    <Prose>
      <DefinitionBlock title="C">The weight on the violation penalty <InlineMath tex={R`C\sum\xi_i`} />. It controls the trade-off between a <strong>wide margin</strong> and <strong>few training violations</strong>.</DefinitionBlock>
      <Split left={{ title: "Smaller C", body: <List items={["Violations are cheap", "Wider margin", "More support vectors", "Smoother, more regularized — may underfit"]} /> }} right={{ title: "Larger C", body: <List items={["Violations are expensive", "Narrower margin", "Fits training data more tightly", "Less regularization — may overfit noise"]} /> }} />
      <Callout kind="note" title="C is the inverse of regularization strength">In scikit-learn, <strong>larger C = weaker regularization</strong> (same convention as <Go slug="logistic-regression-regularization">LogisticRegression's C</Go>). It is not “the margin size” or “the number of errors” directly.</Callout>
      <CExplorer />
      <p>The best C is found on validation data — see <Go slug="svm-tuning">Hyperparameter Tuning</Go>.</p>
    </Prose>
  );
}

/* 10 · Linear vs nonlinear */
function Nonlinear() {
  return (
    <Prose>
      <p>A linear SVM can only draw a flat hyperplane. When one class surrounds another, no straight line separates them, however C is tuned.</p>
      <LinearVsNonlinear />
      <H2>One idea: add features</H2>
      <p>For the rings, the new feature <InlineMath tex={R`x_3 = (x_1-5)^2 + (x_2-5)^2`} /> (squared distance from the center) makes the classes separable by a flat plane <InlineMath tex="x_3 = c" /> in 3D — a circle back in 2D. Explicitly building such features is expensive in high dimensions; the <Go slug="svm-kernel-trick">kernel trick</Go> achieves the same effect implicitly.</p>
    </Prose>
  );
}

/* 11 · Kernel trick */
function KernelTrick() {
  return (
    <Prose>
      <p>The SVM training problem and its predictions can be written so the data appear only through <strong>dot products</strong> <InlineMath tex={R`\mathbf{x}_i^\top\mathbf{x}_j`} />. Replace every dot product with a kernel:</p>
      <FormulaBlock tex={R`K(\mathbf{x}, \mathbf{z}) = \phi(\mathbf{x})^\top\phi(\mathbf{z})`} variables={[{ symbol: "φ", meaning: "a (possibly huge or infinite-dimensional) feature mapping" }, { symbol: "K", meaning: "computes the dot product after mapping, without ever building φ(x)" }]} />
      <Flow steps={["Original features x", "Kernel K(x, z) measures similarity", "Linear separator in implicit feature space", "Curved boundary in original space"]} />
      <ExampleBlock title="Degree-2 polynomial kernel in 2D">With <InlineMath tex={R`K(\mathbf{x},\mathbf{z}) = (\mathbf{x}^\top\mathbf{z})^2`} />, the implicit mapping is <InlineMath tex={R`\phi(\mathbf{x}) = (x_1^2,\ \sqrt2\,x_1x_2,\ x_2^2)`} />. Check: φ(x)ᵀφ(z) = x₁²z₁² + 2x₁x₂z₁z₂ + x₂²z₂² = (x₁z₁ + x₂z₂)². One multiplication-and-square replaces building three features.</ExampleBlock>
      <KernelCalculator />
      <Callout kind="note" title="What the kernel trick is not">It does not make any dataset separable, and it is not free: the model still compares new points with every support vector, and kernel computations scale with the number of training points.</Callout>
    </Prose>
  );
}

function LinearKernel() {
  return (
    <Prose>
      <FormulaBlock tex={R`K(\mathbf{x},\mathbf{z}) = \mathbf{x}^\top\mathbf{z}`} caption="No transformation — the boundary is a hyperplane in the original features." />
      <List items={["Good when classes are roughly linearly separable", "Often strong for high-dimensional sparse data such as text (TF-IDF)", "Fast; only C to tune", "Coefficients (coef_) are available, because w exists explicitly"]} />
      <p>For large datasets, scikit-learn's <code>LinearSVC</code> (liblinear) is usually much faster than <code>SVC(kernel="linear")</code>; their defaults differ slightly (e.g. LinearSVC uses squared hinge loss by default).</p>
      <CExplorer />
    </Prose>
  );
}

function PolyKernel() {
  return (
    <Prose>
      <FormulaBlock tex={R`K(\mathbf{x},\mathbf{z}) = (\gamma\,\mathbf{x}^\top\mathbf{z} + r)^d`} variables={[{ symbol: "d", meaning: "degree (scikit-learn: degree, default 3)" }, { symbol: "γ", meaning: "scale of the dot product (gamma)" }, { symbol: "r", meaning: "constant term (coef0, default 0)" }]} />
      <p>The implicit features are all products of original features up to degree d, so the boundary is a polynomial curve. Degree 2 can represent circles and ellipses; higher degrees allow more complex shapes but grow numerically unstable and can overfit.</p>
      <ExampleBlock title="Calculation">x = (1, 2), z = (2, 3), γ = 0.5, r = 1, d = 2: xᵀz = 8, so K = (0.5·8 + 1)² = 5² = <strong>25</strong>.</ExampleBlock>
      <KernelCalculator />
    </Prose>
  );
}

function RbfKernel() {
  return (
    <Prose>
      <FormulaBlock tex={R`K(\mathbf{x},\mathbf{z}) = \exp\!\left(-\gamma\,\lVert\mathbf{x}-\mathbf{z}\rVert^2\right)`} caption="Radial basis function (Gaussian) kernel — scikit-learn's default kernel." />
      <List items={["K = 1 when x = z; it approaches 0 as the points move apart", "It is a similarity that depends only on distance", "Its implicit feature space is infinite-dimensional", "The prediction is a weighted sum of “bumps” centered on support vectors"]} />
      <ExampleBlock title="Calculation">x = (1, 2), z = (2, 3), γ = 0.5: ‖x − z‖² = 1 + 1 = 2, K = exp(−0.5 · 2) = exp(−1) ≈ <strong>0.368</strong>. With γ = 2: exp(−4) ≈ 0.018 — the same pair is far less similar.</ExampleBlock>
      <KernelCalculator />
      <LinearVsNonlinear />
    </Prose>
  );
}

function KernelCompare() {
  return (
    <Prose>
      <KernelComparison />
      <ComparisonTable columns={["Boundary shape", "Main parameters", "Typical use"]} rows={[
        { label: "Linear", cells: ["hyperplane", "C", "linearly separable or very high-dimensional data"] },
        { label: "Polynomial", cells: ["polynomial curves", "C, degree, gamma, coef0", "known feature interactions; less common in practice"] },
        { label: "RBF", cells: ["flexible, local curves", "C, gamma", "a strong general-purpose default after scaling"] },
      ]} />
      <p className="text-sm text-muted-foreground">scikit-learn also offers a “sigmoid” kernel; it is rarely used and not covered here.</p>
    </Prose>
  );
}

function Gamma() {
  return (
    <Prose>
      <DefinitionBlock title="gamma (RBF)">Sets how quickly similarity falls off with distance — the <strong>reach</strong> of each training point's influence. In <InlineMath tex={R`\exp(-\gamma\lVert\mathbf{x}-\mathbf{z}\rVert^2)`} />, the reach is roughly <InlineMath tex={R`1/\sqrt{\gamma}`} />.</DefinitionBlock>
      <Split left={{ title: "Small gamma", body: <List items={["Each point influences far away", "Very smooth boundary", "Behaves almost linearly", "May underfit"]} /> }} right={{ title: "Large gamma", body: <List items={["Influence is very local", "Wiggly boundary, islands around points", "Can memorize training data", "May overfit"]} /> }} />
      <GammaExplorer />
      <Callout kind="note" title="scikit-learn defaults">gamma="scale" (default) uses 1 / (n_features · X.var()); gamma="auto" uses 1 / n_features. gamma also applies to the polynomial kernel; it is ignored by the linear kernel.</Callout>
    </Prose>
  );
}

function CGamma() {
  return (
    <Prose>
      <p>C controls how much violations cost; γ controls how flexible the boundary shape can be. They interact, so they are tuned <strong>together</strong>.</p>
      <CGammaGrid />
      <ComparisonTable columns={["Small γ", "Large γ"]} rows={[{ label: "Small C", cells: ["very smooth, may underfit", "local shape, but violations tolerated"] }, { label: "Large C", cells: ["smooth shape fit tightly", "most flexible — highest overfitting risk"] }]} />
    </Prose>
  );
}

function Scaling() {
  return (
    <Prose>
      <p>Linear SVMs use dot products and RBF/polynomial SVMs use distances or dot products. A feature measured in large units dominates both, and also distorts the meaning of γ and the margin penalty.</p>
      <SvmScalingViz />
      <CodeBlock code={`from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC

model = make_pipeline(StandardScaler(), SVC(kernel="rbf"))
model.fit(X_train, y_train)  # scaler learns mean/std from training data only`} />
      <Callout kind="note" title="Avoid data leakage">Fit the scaler on training data only — a Pipeline does this automatically, including inside cross-validation.</Callout>
    </Prose>
  );
}

function Scores() {
  return (
    <Prose>
      <p><code>decision_function(X)</code> returns the decision score f(x): its sign is the predicted class, and its magnitude relates to distance from the boundary. It is <strong>not a probability</strong> — it is unbounded and not calibrated.</p>
      <DecisionScoreTable />
      <H2>Probabilities</H2>
      <p><code>SVC(probability=True)</code> fits an extra calibration model (Platt scaling with internal 5-fold cross-validation) mapping scores to <code>predict_proba</code>. This makes training slower, and the probabilities can occasionally disagree with <code>predict</code> for points near the boundary.</p>
      <ComparisonTable columns={["Range", "Extra cost", "Good for"]} rows={[{ label: "decision_function", cells: ["any real number", "none", "ranking, ROC-AUC, custom thresholds"] }, { label: "predict_proba", cells: ["0 to 1", "internal CV during fit", "when calibrated-looking probabilities are needed"] }]} />
      <p>For ROC-AUC, decision scores are enough — see <Go slug="svm-evaluation">Model Evaluation</Go>.</p>
    </Prose>
  );
}

function Multiclass() {
  return (
    <Prose>
      <p>The SVM formulation is binary. Multiclass problems are split into binary ones:</p>
      <ComparisonTable columns={["Classifiers for K classes", "How a class is chosen", "In scikit-learn"]} rows={[
        { label: "One-vs-One (OvO)", cells: ["K(K − 1)/2 — e.g. 3 for 3 classes, 45 for 10", "each pair votes; most votes wins", "SVC always trains OvO internally"] },
        { label: "One-vs-Rest (OvR)", cells: ["K — one per class", "highest decision score wins", "LinearSVC default; OneVsRestClassifier wrapper"] },
      ]} />
      <Callout kind="note" title="decision_function_shape">SVC trains OvO models, but by default (decision_function_shape="ovr") it reshapes the output of decision_function to one column per class. This changes only the output shape, not how the models are trained.</Callout>
      <ExampleBlock title="Three classes: cat, dog, bird">OvO trains cat-vs-dog, cat-vs-bird, dog-vs-bird. A new image predicted “dog”, “cat”, “dog” by the three models receives 2 votes for dog and is classified as dog.</ExampleBlock>
    </Prose>
  );
}

function Sklearn() {
  return (
    <Prose>
      <CodeBlock code={`from sklearn.svm import SVC

model = SVC(kernel="rbf", C=1.0, gamma="scale")
model.fit(X_train, y_train)
y_pred  = model.predict(X_test)            # class labels
scores  = model.decision_function(X_test)  # signed decision scores
model.support_vectors_                     # coordinates of support vectors
model.n_support_                           # number of SVs per class`} />
      <H2>Important SVC parameters</H2>
      <ComparisonTable columns={["Default", "Meaning"]} rows={[
        { label: "C", cells: ["1.0", "penalty for margin violations (inverse regularization)"] },
        { label: "kernel", cells: ['"rbf"', '"linear", "poly", "rbf", "sigmoid" or a callable'] },
        { label: "gamma", cells: ['"scale"', "kernel coefficient for rbf/poly/sigmoid"] },
        { label: "degree", cells: ["3", "polynomial degree (poly only)"] },
        { label: "coef0", cells: ["0.0", "constant term r (poly and sigmoid)"] },
        { label: "class_weight", cells: ["None", '"balanced" or dict; multiplies C per class'] },
        { label: "probability", cells: ["False", "enable predict_proba (slower fit)"] },
        { label: "decision_function_shape", cells: ['"ovr"', "output shape for multiclass scores"] },
        { label: "max_iter", cells: ["-1", "solver iteration limit (−1 = none)"] },
      ]} />
      <H2>Complete example</H2>
      <CodeBlock code={`from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC
from sklearn.metrics import confusion_matrix, classification_report, roc_auc_score

X, y = load_breast_cancer(return_X_y=True)   # in this dataset 0 = malignant, 1 = benign
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, stratify=y, random_state=42)

model = make_pipeline(StandardScaler(), SVC(kernel="rbf", C=1.0, gamma="scale"))
model.fit(X_train, y_train)

y_pred = model.predict(X_test)
scores = model.decision_function(X_test)     # higher = more likely class 1

print(confusion_matrix(y_test, y_pred))
print(classification_report(y_test, y_pred))
print("ROC-AUC:", roc_auc_score(y_test, scores))`} />
      <p className="text-sm text-muted-foreground">This is reference code; it is not executed on this site, so no results are shown. Run it locally to see your own numbers.</p>
    </Prose>
  );
}

function Evaluation() {
  return (
    <Prose>
      <p>An SVM is evaluated like any classifier, using the <PhaseLink slug="confusion-matrix">confusion matrix</PhaseLink> and <PhaseLink slug="choosing-metrics">Phase 2 metrics</PhaseLink>. The default threshold on the decision score is 0; moving it trades <PhaseLink slug="precision">precision</PhaseLink> against <PhaseLink slug="recall">recall</PhaseLink>.</p>
      <SvmEvaluation />
      <Callout kind="note" title="ROC-AUC uses scores">roc_auc_score needs scores, not hard predictions. decision_function works directly; probability=True is not required for ROC-AUC.</Callout>
    </Prose>
  );
}

function Tuning() {
  return (
    <Prose>
      <Flow steps={["Split train / test", "Cross-validate C × gamma on training data", "Pick best combination", "Refit on all training data", "Evaluate once on test"]} />
      <CodeBlock code={`from sklearn.model_selection import GridSearchCV
from sklearn.pipeline import Pipeline

pipe = Pipeline([("scaler", StandardScaler()), ("svc", SVC(kernel="rbf"))])
param_grid = {
    "svc__C":     [0.1, 1, 10, 100],
    "svc__gamma": [0.001, 0.01, 0.1, 1],
}
search = GridSearchCV(pipe, param_grid, cv=5, scoring="f1")
search.fit(X_train, y_train)
print(search.best_params_, search.best_score_)
print("Test F1:", search.score(X_test, y_test))`} />
      <p>Search C and γ on a <strong>logarithmic</strong> scale — their effects are multiplicative. Choose <code>scoring</code> to match the problem (see <PhaseLink slug="choosing-metrics">Choosing Metrics</PhaseLink>).</p>
      <CGammaGrid title="A small grid search, computed in your browser (single validation split)" />
    </Prose>
  );
}

function Imbalance() {
  return (
    <Prose>
      <p>With one class much rarer, a single C lets the optimizer ignore minority violations cheaply, and accuracy can look high while the minority is missed (<PhaseLink slug="accuracy">accuracy trap</PhaseLink>).</p>
      <SvmImbalanceViz />
      <List items={[<>class_weight="balanced" sets weight n_samples / (n_classes · n_samples_in_class); the effective penalty is C × weight.</>, <>Evaluate with recall, precision, F1 or PR curves rather than accuracy.</>, <>Adjusting the decision-score threshold is another lever.</>]} />
    </Prose>
  );
}

function Cost() {
  return (
    <Prose>
      <ComparisonTable columns={["Training", "Prediction", "Memory"]} rows={[
        { label: "Kernel SVC (libsvm)", cells: ["roughly between O(n²) and O(n³) in samples", "proportional to number of support vectors", "kernel cache; grows with n"] },
        { label: "LinearSVC (liblinear)", cells: ["roughly linear in samples", "one dot product", "stores w only"] },
      ]} />
      <List items={["Kernel SVC is practical up to tens of thousands of samples; beyond that, consider LinearSVC, SGDClassifier(loss=\"hinge\") or kernel approximation (Nystroem, RBFSampler).", "probability=True multiplies training cost through internal cross-validation.", "Large C and large gamma can slow convergence.", "Many support vectors means slow predictions."]} />
    </Prose>
  );
}

function AdvLim() {
  return (
    <Prose>
      <Split left={{ title: "Advantages", body: <List items={["Effective in high-dimensional spaces", "Convex training — a single global optimum", "Kernels give flexible nonlinear boundaries", "Prediction depends only on support vectors", "Margin-based regularization through C"]} /> }} right={{ title: "Limitations", body: <List items={["Requires feature scaling", "Sensitive to C and gamma", "Slow on very large datasets (kernel SVC)", "No native probabilities", "Kernel models are hard to interpret", "Binary formulation; multiclass via OvO/OvR"]} /> }} />
      <H2>When to use an SVM</H2>
      <List items={["Small to medium datasets with many features", "Text classification with a linear kernel", "Clear but nonlinear boundaries (RBF) when you can tune C and γ", "Avoid as a first choice for millions of rows, when well-calibrated probabilities are central, or when an interpretable model is required"]} />
      <H2>Common mistakes</H2>
      <ComparisonTable columns={["Why it's wrong", "Better mental model"]} rows={[
        { label: "Not scaling features", cells: ["large-unit features dominate distances", "always scale in a Pipeline"] },
        { label: "“Larger C means stronger regularization”", cells: ["it is the opposite", "C is inverse regularization strength"] },
        { label: "“1/‖w‖ and 2/‖w‖ are the same margin”", cells: ["they differ by a factor of 2", "half-margin vs full margin"] },
        { label: "Treating decision scores as probabilities", cells: ["unbounded and uncalibrated", "use them for ranking; calibrate if needed"] },
        { label: "Tuning on the test set", cells: ["optimistic, leaked estimate", "cross-validate on training data"] },
        { label: "Tuning C and gamma independently", cells: ["they interact", "search a joint log-scale grid"] },
        { label: "“Support vectors are outliers”", cells: ["they are points constraining the solution", "on, inside or across the margin"] },
        { label: "Huge gamma for “higher accuracy”", cells: ["training accuracy ↑, validation ↓", "check validation scores"] },
        { label: "Using accuracy on imbalanced data", cells: ["hides missed minority cases", "recall, precision, F1, PR curves"] },
        { label: "Assuming a kernel always helps", cells: ["linear data gains nothing", "compare kernels on validation data"] },
      ]} />
    </Prose>
  );
}

function Experiments() {
  const ex: [string, string][] = [
    ["A · Move the decision boundary", "In the hyperplane explorer, change b only. Watch scores shift equally for all points."],
    ["B · Change the margin", "In the margin visualization, rotate away from the optimum and watch the full margin shrink."],
    ["C · Change C", "In the lab, use Overlapping blobs + Linear and compare C = 0.01 with C = 100: support vectors and violations."],
    ["D · Change the kernel", "Use Rings and switch Linear → Polynomial → RBF. Compare validation accuracy."],
    ["E · Change gamma", "Rings + RBF: compare γ = 0.01, 0.1 and 10. Watch training vs validation accuracy."],
    ["F · Scale the features", "In Feature Scaling, toggle StandardScaler and compare validation accuracy."],
    ["G · Introduce an outlier", "Add the outlier in the lab with C = 100, then C = 0.1. Which boundary reacts more?"],
    ["H · Compare decision scores", "In Decision Scores, compare |f(x)| for points near and far from the boundary."],
  ];
  return (
    <Prose>
      <div className="grid gap-3 sm:grid-cols-2">{ex.map(([t, d]) => <ConceptCard key={t} title={t}>{d}</ConceptCard>)}</div>
      <SvmLab />
      <HyperplaneExplorer />
      <SvmScalingViz />
      <DecisionScoreTable />
    </Prose>
  );
}

function Cheat() {
  return (
    <Prose>
      <H2>Formulas</H2>
      <ComparisonTable columns={["Formula"]} rows={[
        { label: "Decision boundary", cells: ["wᵀx + b = 0"] },
        { label: "Margin boundaries", cells: ["wᵀx + b = +1 and wᵀx + b = −1"] },
        { label: "Half-margin width", cells: ["1 / ‖w‖"] },
        { label: "Full margin width", cells: ["2 / ‖w‖"] },
        { label: "Hard-margin objective", cells: ["min ½‖w‖²  s.t. yᵢ(wᵀxᵢ + b) ≥ 1"] },
        { label: "Soft-margin objective", cells: ["min ½‖w‖² + C Σ ξᵢ  s.t. yᵢ(wᵀxᵢ + b) ≥ 1 − ξᵢ, ξᵢ ≥ 0"] },
        { label: "Hinge loss", cells: ["max(0, 1 − y f(x))"] },
        { label: "Linear kernel", cells: ["K(x, z) = xᵀz"] },
        { label: "Polynomial kernel", cells: ["K(x, z) = (γ xᵀz + r)ᵈ"] },
        { label: "RBF kernel", cells: ["K(x, z) = exp(−γ ‖x − z‖²)"] },
      ]} />
      <H2>Hyperparameters</H2>
      <ComparisonTable columns={["Increase it →"]} rows={[{ label: "C", cells: ["fewer violations tolerated, narrower margin, less regularization"] }, { label: "gamma", cells: ["more local influence, more flexible boundary"] }, { label: "degree", cells: ["more complex polynomial boundary"] }]} />
      <H2>Practical reminders</H2>
      <List items={["Scale features inside a Pipeline", "Tune C and gamma together on a log grid with cross-validation", "Use decision_function for ROC-AUC", "Use class_weight for imbalance", "Prefer LinearSVC for large or sparse data"]} />
      <H2>Python reference</H2>
      <CodeBlock code={`from sklearn.svm import SVC, LinearSVC
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import GridSearchCV

clf = make_pipeline(StandardScaler(), SVC(kernel="rbf", C=1, gamma="scale"))
clf.fit(X_train, y_train)
clf.predict(X_test)
clf.decision_function(X_test)
svc = clf[-1]; svc.support_vectors_, svc.n_support_
LinearSVC(C=1.0)                                  # fast linear SVM
SVC(probability=True)                             # enables predict_proba (slower)
SVC(class_weight="balanced")                      # imbalance
GridSearchCV(clf, {"svc__C": [0.1, 1, 10], "svc__gamma": [0.01, 0.1, 1]}, cv=5)`} />
      <H2>Concept map</H2>
      <Flow steps={["Training Data", "Feature Representation (scaled)", "Kernel Selection", "SVM Optimization (C)", "Decision Boundary", "Margin", "Support Vectors", "Decision Scores / Class Predictions", "Evaluation"]} />
      <div className="grid gap-3 sm:grid-cols-3">
        <ConceptCard title="C">Penalty for margin violations → regularization trade-off.</ConceptCard>
        <ConceptCard title="RBF gamma">Similarity scale → boundary flexibility.</ConceptCard>
        <ConceptCard title="Validation">Hyperparameter selection → final test evaluation.</ConceptCard>
      </div>
      <Callout kind="intuition" title="In one sentence">Support Vector Machines classify observations by learning a decision boundary that balances margin size and training violations. Support vectors constrain the fitted boundary, while kernels allow the model to represent nonlinear relationships; C and gamma control important aspects of its behavior.</Callout>
    </Prose>
  );
}

const s = (x: string) => `svm-${x}`;
export const svmContent: Record<string, ComponentType> = {
  svm: Intro,
  [s("hyperplanes")]: Hyperplanes,
  [s("hyperplane-explorer")]: HyperplaneLesson,
  [s("margins")]: Margins,
  [s("margin-visualization")]: MarginLesson,
  [s("support-vectors")]: SupportVectors,
  [s("maximum-margin")]: MaximumMargin,
  [s("hard-soft-margin")]: HardSoft,
  [s("c-hyperparameter")]: CParam,
  [s("linear-vs-nonlinear")]: Nonlinear,
  [s("kernel-trick")]: KernelTrick,
  [s("linear-kernel")]: LinearKernel,
  [s("polynomial-kernel")]: PolyKernel,
  [s("rbf-kernel")]: RbfKernel,
  [s("kernel-comparison")]: KernelCompare,
  [s("gamma")]: Gamma,
  [s("c-gamma")]: CGamma,
  [s("feature-scaling")]: Scaling,
  [s("decision-scores")]: Scores,
  [s("multiclass")]: Multiclass,
  [s("scikit-learn")]: Sklearn,
  [s("evaluation")]: Evaluation,
  [s("tuning")]: Tuning,
  [s("imbalance")]: Imbalance,
  [s("computational-cost")]: Cost,
  [s("advantages-limitations")]: AdvLim,
  [s("experiments")]: Experiments,
  [s("cheat-sheet")]: Cheat,
};
