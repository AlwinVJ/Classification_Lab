import type { ComponentType, ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { H2, H3, Prose } from "@/components/learning/LessonShell";
import { Callout, CodeBlock, ComparisonTable, ConceptCard, DefinitionBlock, ExampleBlock, FormulaBlock, InlineMath, TermBlock } from "@/components/learning/blocks";
import { Flow, Split } from "@/components/visualization/diagrams";
import { ChurnExample, FittedEvaluation, GradientDescentViz, LinearScoreExplorer, LogisticPlayground, LogLossViz, LogOddsExplorer, LRThresholdExplorer, ProbabilityTable, RegularizationViz, SigmoidViz } from "@/components/visualization/LogisticViz";
import { sigmoid } from "@/lib/logistic";

const R = String.raw;
const Go = ({ slug, children }: { slug: string; children: ReactNode }) => <Link to="/algorithms/$slug" params={{ slug }} className="font-medium text-primary underline-offset-4 hover:underline">{children}</Link>;
const PIPELINE = ["Features", "Linear Score", "Sigmoid Function", "Probability", "Threshold", "Predicted Class", "Evaluation"];

function ConceptMap() {
  return (
    <div className="my-6 grid gap-4 md:grid-cols-3">
      <div className="rounded-lg border p-3"><p className="text-center font-mono text-xs uppercase text-primary">Prediction</p><Flow className="my-2" steps={["Logistic Regression", "Features", <>Linear score <InlineMath tex="z=w^Tx+b" /></>, "Sigmoid", "Probability", "Threshold", "Prediction", "Confusion Matrix", "Evaluation Metrics"]} /></div>
      <div className="rounded-lg border p-3"><p className="text-center font-mono text-xs uppercase text-primary">Training</p><Flow className="my-2" steps={["Parameters w, b", "Loss (log loss)", "Gradient", "Parameter Updates", "Training"]} /><p className="text-center text-xs text-muted-foreground">Training produces the w and b used on the left.</p></div>
      <div className="rounded-lg border p-3"><p className="text-center font-mono text-xs uppercase text-primary">Control</p><Flow className="my-2" steps={["Regularization (C)", "Coefficient Constraints", "Generalization"]} /><p className="text-center text-xs text-muted-foreground">Regularization is added to the training loss.</p></div>
    </div>
  );
}

/* 1 · Introduction */
function Intro() {
  return (
    <Prose>
      <p className="text-lg">Learn how a linear model can estimate probabilities and make classification decisions.</p>
      <DefinitionBlock title="The core idea">Logistic Regression takes input features, computes a <strong>weighted linear score</strong>, transforms that score into a <strong>probability</strong> using the sigmoid function, and then uses a <strong>decision threshold</strong> to determine the predicted class.</DefinitionBlock>
      <div className="grid gap-4 md:grid-cols-2">
        <div><H3>The pipeline</H3><Flow steps={PIPELINE} /></div>
        <div><H3>Example: loan default</H3><Flow steps={["Age · Income · Credit score", "Linear combination", <InlineMath key="z" tex="z = w_1x_1 + w_2x_2 + b" />, "Sigmoid", <InlineMath key="p" tex="P(y=1)" />, "Threshold", "Class 0 / Class 1"]} /></div>
      </div>
      <Callout kind="intuition" title="Keep this mental model">Every lesson in this section zooms into one box of that pipeline — or explains how the weights inside it are learned.</Callout>
      <H2>Why is it called regression?</H2>
      <p>Because the model regresses a <strong>continuous</strong> quantity: the probability of the positive class given the features,</p>
      <FormulaBlock tex={R`P(y = 1 \mid x) \in (0, 1)`} />
      <p>The model does not directly learn "Class 0" or "Class 1". It learns <em>how likely is this observation to belong to Class 1?</em> A threshold — the same idea from <Link to="/classification/$slug" params={{ slug: "threshold" }} className="text-primary underline-offset-4 hover:underline">Phase 1's Classification Threshold</Link> — then converts that probability into the final class.</p>
      <Split left={{ title: "Probability 0.82 · threshold 0.50", body: <>0.82 ≥ 0.50 → <strong>Class 1</strong></> }} right={{ title: "Probability 0.31 · threshold 0.50", body: <>0.31 &lt; 0.50 → <strong>Class 0</strong></> }} />
      <H2>Build the classifier</H2>
      <p>Try the whole pipeline now. Move a new observation (◆), adjust the weights, bias and threshold, and watch the linear score, probability and predicted class update together with the boundary.</p>
      <LogisticPlayground lab />
      <H2>Concept map</H2>
      <ConceptMap />
      <H2>Lessons in this module</H2>
      <p>Linear score → sigmoid → probability & threshold → log-odds → decision boundary → loss → training → regularization → multiclass → scikit-learn → evaluation → advantages & limitations → practical example → cheat sheet. Start with the <Go slug="logistic-regression-linear-score">linear score</Go>.</p>
    </Prose>
  );
}

/* 2 · Linear score */
function LinearScore() {
  return (
    <Prose>
      <p>The first step turns the features of one observation into a single number — the <strong>linear score</strong> <InlineMath tex="z" />.</p>
      <FormulaBlock tex={R`z = w_1x_1 + w_2x_2 + \dots + w_nx_n + b = w^T x + b`} variables={[{ symbol: "x", meaning: "feature values of one observation" }, { symbol: "w", meaning: "weights / coefficients, one per feature" }, { symbol: "b", meaning: "bias / intercept" }, { symbol: "z", meaning: "linear score (a real number)" }]} />
      <p><InlineMath tex="w^Tx" /> is shorthand for multiplying each weight by its feature and adding the results.</p>
      <H2>z can be any real number</H2>
      <p>The linear score lives on <InlineMath tex={R`(-\infty, +\infty)`} />. Values like −4, −1, 0, 2 and 7 are all valid scores. That is exactly the problem: a probability must lie between 0 and 1, and <strong>z is not a probability</strong>.</p>
      <LinearScoreExplorer />
      <ExampleBlock title="Worked example">With w₁ = 2, w₂ = −1, b = 0.5, x₁ = 3, x₂ = 1: z = 2(3) − 1(1) + 0.5 = <strong>5.5</strong>. A score of 5.5 says "strongly toward class 1", but we still need a function that turns it into a probability — next lesson: <Go slug="logistic-regression-sigmoid">the sigmoid</Go>.</ExampleBlock>
    </Prose>
  );
}

/* 3 · Sigmoid */
function Sigmoid() {
  const rows = [-5, -2, 0, 2, 5];
  return (
    <Prose>
      <FormulaBlock tex={R`\sigma(z) = \frac{1}{1 + e^{-z}}`} variables={[{ symbol: "z", meaning: "linear score" }, { symbol: "e", meaning: "Euler's number ≈ 2.718" }]} caption="Also called the logistic function — the source of the model's name." />
      <p>The sigmoid maps any real number into the open interval <InlineMath tex="(0, 1)" />.</p>
      <ComparisonTable columns={["σ(z)", "Reading"]} rows={rows.map((z) => ({ label: `z = ${z}`, cells: [`≈ ${sigmoid(z).toFixed(3)}`, z < 0 ? "leans class 0" : z === 0 ? "exactly undecided" : "leans class 1"] }))} highlight={[[2, 0]]} />
      <ul className="list-disc space-y-1 pl-5"><li>Large negative z → probability approaches 0 (never reaches it).</li><li>z = 0 → probability exactly 0.5.</li><li>Large positive z → probability approaches 1 (never reaches it).</li></ul>
      <SigmoidViz />
      <H2>Why sigmoid is useful</H2>
      <p>Scores like −100, −10, 0, 10 or 100 are all possible, but a classification probability must lie between 0 and 1. Sigmoid performs exactly that squeeze while keeping order: a larger z always gives a larger probability.</p>
      <Flow steps={[<>Linear score <InlineMath tex={R`(-\infty, +\infty)`} /></>, "Sigmoid", <>Probability <InlineMath tex="(0, 1)" /></>]} />
      <Callout kind="note" title="Sigmoid does not make the boundary curved">The sigmoid is applied <em>after</em> the linear score. Since σ is monotonic, "p ≥ 0.5" is the same as "z ≥ 0" — a linear condition. Standard Logistic Regression therefore still has a <strong>linear decision boundary</strong> in the original feature space; the S-curve only shapes how probability changes as you move away from it.</Callout>
    </Prose>
  );
}

/* 4 · Probability & threshold */
function ProbThreshold() {
  return (
    <Prose>
      <Split left={{ title: "Model output", body: <><InlineMath tex="P(y=1 \mid x) = 0.73" /><p className="mt-2">A probability <strong>estimate</strong>: "73% likely to be class 1".</p></> }} right={{ title: "Final decision", body: <><p>Predicted class = <strong>1</strong></p><p className="mt-2">A hard label produced by comparing 0.73 with a threshold.</p></> }} />
      <FormulaBlock tex={R`\hat{y} = \begin{cases} 1 & \text{if } p \ge t \\ 0 & \text{if } p < t \end{cases}`} caption="With t = 0.50: p = 0.73 → class 1; p = 0.42 → class 0." />
      <ProbabilityTable />
      <H2>Thresholds change the metrics</H2>
      <p>This builds on the Phase 1 threshold and the Phase 2 metrics, using exactly the same counting and metric code. Eight synthetic observations have predicted probabilities and known actual classes.</p>
      <LRThresholdExplorer />
      <Callout kind="intuition">Logistic Regression produces the probabilities; <strong>you</strong> choose the threshold. Lowering it usually finds more positives (higher recall) at the cost of more false alarms — see <Link to="/evaluation/$slug" params={{ slug: "precision-recall" }} className="text-primary underline-offset-4 hover:underline">Precision-Recall</Link>.</Callout>
    </Prose>
  );
}

/* 5 · Log-odds & coefficients */
function LogOdds() {
  return (
    <Prose>
      <p>There is a second, equivalent way to read the model. Build it up one step at a time.</p>
      <Flow steps={["Probability p", "Odds p / (1 − p)", "Log-odds log(p / (1 − p))", "= Linear score z"]} />
      <H3>1 · Odds</H3>
      <FormulaBlock tex={R`\text{odds} = \frac{p}{1-p}`} caption="p = 0.8 → odds = 4 (“4 to 1”). p = 0.5 → odds = 1." />
      <H3>2 · Log-odds (the logit)</H3>
      <FormulaBlock tex={R`\operatorname{logit}(p) = \log\!\left(\frac{p}{1-p}\right)`} caption="Natural logarithm. The logit is the inverse of the sigmoid." />
      <H3>3 · The Logistic Regression relationship</H3>
      <FormulaBlock tex={R`\log\!\left(\frac{p}{1-p}\right) = w^T x + b`} />
      <DefinitionBlock title="In plain language">Logistic Regression assumes that the <strong>log-odds</strong> of the positive class are a <strong>linear</strong> function of the features. The linear score z <em>is</em> the log-odds.</DefinitionBlock>
      <LogOddsExplorer />
      <H2>Coefficients</H2>
      <p>A coefficient <InlineMath tex="w_j" /> controls how feature <InlineMath tex="x_j" /> moves the linear score, holding the other features constant:</p>
      <ComparisonTable columns={["Effect of increasing the feature"]} rows={[{ label: "w > 0", cells: ["z (log-odds) increases"] }, { label: "w < 0", cells: ["z (log-odds) decreases"] }, { label: "w ≈ 0", cells: ["little influence on z, all else equal"] }]} />
      <Callout kind="note" title="Magnitude is not the same as importance">Coefficient size depends on the feature's <strong>scale</strong>: income measured in dollars gets a tiny weight, the same income in thousands a weight 1,000× larger. Correlated features can also share or swap weight. Compare magnitudes only for features on comparable scales, and even then interpret with care.</Callout>
      <H2>Odds ratio</H2>
      <FormulaBlock tex={R`\text{odds ratio for a one-unit increase in } x_j = e^{w_j}`} />
      <ul className="list-disc space-y-1 pl-5"><li><InlineMath tex="w_j > 0" /> → odds are multiplied by more than 1 (increase).</li><li><InlineMath tex="w_j < 0" /> → multiplied by less than 1 (decrease).</li><li><InlineMath tex="w_j = 0" /> → multiplied by 1 (unchanged).</li></ul>
      <ExampleBlock title="w = 0.7">e^0.7 ≈ 2.01. A one-unit increase in the feature <strong>multiplies the estimated odds by about 2.01</strong>, holding other features constant. It does <em>not</em> mean the probability doubles or rises by 0.7: from p = 0.5 (odds 1) odds become 2.01 → p ≈ 0.67; from p = 0.9 (odds 9) odds become 18.1 → p ≈ 0.95.</ExampleBlock>
    </Prose>
  );
}

/* 6 · Decision boundary */
function Boundary() {
  return (
    <Prose>
      <p>Recall <Link to="/classification/$slug" params={{ slug: "decision-boundaries" }} className="text-primary underline-offset-4 hover:underline">decision boundaries from Phase 1</Link>: the place where the predicted class changes. For binary Logistic Regression with threshold 0.5:</p>
      <FormulaBlock tex={R`p = 0.5 \;\Longleftrightarrow\; z = 0 \;\Longleftrightarrow\; w^T x + b = 0`} caption="Because σ(0) = 0.5." />
      <ComparisonTable columns={["Shape of wᵀx + b = 0"]} rows={[{ label: "2 features", cells: ["a line"] }, { label: "3 features", cells: ["a plane"] }, { label: "n features", cells: ["a hyperplane (a flat surface in n dimensions)"] }]} />
      <LogisticPlayground />
      <Callout kind="intuition">The bias b slides the line without rotating it. The ratio of w₁ to w₂ sets its angle. The overall size of the weights sets how sharply probability changes across the line — doubling both weights and b keeps the same line but makes the model more confident.</Callout>
      <p>Other thresholds give other lines parallel to this one: <InlineMath tex={R`w^Tx + b = \operatorname{logit}(t)`} />. Try it in the <Go slug="logistic-regression">Build the classifier</Go> lab.</p>
    </Prose>
  );
}

/* 7 · Loss */
function Loss() {
  return (
    <Prose>
      <p>To learn good weights, a model needs a way to measure <strong>how wrong</strong> its probabilities are. Logistic Regression commonly uses <strong>binary cross-entropy</strong>, also called <strong>log loss</strong>.</p>
      <FormulaBlock tex={R`L = -\big[\,y\log(p) + (1-y)\log(1-p)\,\big]`} variables={[{ symbol: "y", meaning: "actual class (0 or 1)" }, { symbol: "p", meaning: "predicted probability of class 1" }]} />
      <Split left={{ title: "If y = 1", body: <><InlineMath tex="L = -\log(p)" /><p className="mt-1">Small when p is near 1.</p></> }} right={{ title: "If y = 0", body: <><InlineMath tex="L = -\log(1-p)" /><p className="mt-1">Small when p is near 0.</p></> }} />
      <p>For a dataset of m observations, average the losses:</p>
      <FormulaBlock tex={R`J = -\frac{1}{m}\sum_{i=1}^{m}\big[\,y_i\log(p_i) + (1-y_i)\log(1-p_i)\,\big]`} />
      <LogLossViz />
      <Callout kind="note" title="Confident mistakes are expensive">For a real class-1 case: p = 0.9 costs 0.105, p = 0.5 costs 0.693, p = 0.1 costs 2.30 and p = 0.01 costs 4.61. Loss grows without limit as a wrong answer gets more confident.</Callout>
      <H2>Why not mean squared error?</H2>
      <p>Squared error on a probability can never exceed 1, so a confidently wrong prediction (p = 0.01 for y = 1) is penalised only about 0.98 — barely more than a mildly wrong one. Log loss comes from the probability the model assigns to what actually happened, so it is naturally aligned with probabilistic classification and punishes confident errors strongly. It also gives a smooth, bowl-shaped objective for Logistic Regression, which makes optimisation well-behaved. No proof needed — the intuition is: <em>score the probability the model gave to the truth</em>.</p>
    </Prose>
  );
}

/* 8 · Training */
function Training() {
  return (
    <Prose>
      <p><strong>Training</strong> means finding the parameter values (w and b) that make the model's predictions fit the training data according to the chosen objective — here, the lowest average log loss (plus any regularization).</p>
      <Flow steps={["Initialize parameters", "Calculate linear scores", "Apply sigmoid", "Calculate log loss", "Calculate gradients", "Update weights", "Repeat …", "Loss decreases", "Final model"]} />
      <H2>Gradient descent</H2>
      <p>Picture the loss as a landscape over all possible parameter values. The <strong>gradient</strong> points in the direction where the loss increases fastest — so we take a small step the <em>opposite</em> way, downhill.</p>
      <FormulaBlock tex={R`\theta_{\text{new}} = \theta_{\text{old}} - \eta\,\nabla J(\theta)`} variables={[{ symbol: R`\theta`, meaning: "model parameters (w and b)" }, { symbol: R`\eta`, meaning: "learning rate — the step size" }, { symbol: R`\nabla J`, meaning: "gradient of the loss" }, { symbol: "J", meaning: "loss function" }]} />
      <GradientDescentViz />
      <TermBlock term="Learning rate η" simple="How big each downhill step is." technical="Too small: slow progress. Too large: steps overshoot and the loss can bounce or diverge." example="scikit-learn's solvers (e.g. lbfgs) choose steps automatically, so you rarely set η yourself." />
      <Callout kind="intuition">For Logistic Regression the gradient has a friendly form: each point contributes (p − y) × its features. Points the model already gets right with confidence contribute almost nothing; badly wrong points pull the hardest.</Callout>
    </Prose>
  );
}

/* 9 · Regularization */
function Regularization() {
  return (
    <Prose>
      <p>A model can become too dependent on its training data — fitting noise with very large coefficients and becoming overconfident. <strong>Regularization</strong> adds a penalty on coefficient size to the loss, discouraging overly large weights and often improving generalization to new data.</p>
      <FormulaBlock tex={R`\text{objective} = \text{log loss} + \text{penalty}(w)`} />
      <Split left={{ title: "L1 (lasso)", body: <><InlineMath tex={R`\sum_j |w_j|`} /><p className="mt-2">Can drive some coefficients <strong>exactly to zero</strong> — a built-in form of feature selection.</p></> }} right={{ title: "L2 (ridge)", body: <><InlineMath tex={R`\sum_j w_j^2`} /><p className="mt-2"><strong>Shrinks</strong> coefficients toward zero, usually without making them exactly zero. scikit-learn's default.</p></> }} />
      <H2>The C hyperparameter</H2>
      <DefinitionBlock title="C in scikit-learn">C is the <strong>inverse</strong> of regularization strength. scikit-learn minimises roughly <InlineMath tex={R`\tfrac12\lVert w\rVert^2 + C\sum \text{log loss}`} />, so C multiplies the data term, not the penalty.</DefinitionBlock>
      <ComparisonTable columns={["Regularization", "Coefficients", "Model"]} rows={[{ label: "Small C (e.g. 0.01)", cells: ["Stronger", "Smaller, more constrained", "Simpler, more cautious"] }, { label: "Large C (e.g. 100)", cells: ["Weaker", "Larger, less constrained", "More flexible, more confident"] }]} />
      <RegularizationViz />
      <Callout kind="note">Exact behaviour depends on the dataset and feature setup. Very small C can underfit; very large C can overfit. Choose C with validation data or cross-validation, not by training accuracy.</Callout>
    </Prose>
  );
}

/* 10 · Multiclass */
function Multiclass() {
  return (
    <Prose>
      <p>Phase 1 introduced <Link to="/classification/$slug" params={{ slug: "multiclass" }} className="text-primary underline-offset-4 hover:underline">multiclass classification</Link>. Logistic Regression can be extended beyond two classes — for example classifying iris flowers as <strong>Setosa</strong>, <strong>Versicolor</strong> or <strong>Virginica</strong>.</p>
      <H2>One-vs-Rest (One-vs-All)</H2>
      <div className="grid gap-3 sm:grid-cols-3">
        {[["Model 1", "Setosa vs all others", 0.08], ["Model 2", "Versicolor vs all others", 0.71], ["Model 3", "Virginica vs all others", 0.36]].map(([m, d, p]) => <ConceptCard key={m as string} title={m as string} footer={<span className="font-mono text-sm">P = {p as number}</span>}>{d}</ConceptCard>)}
      </div>
      <p>Each model is an ordinary binary Logistic Regression. For a new flower, pick the class whose model is most confident — here <strong>Versicolor</strong> (0.71). Note the three scores need not add to 1.</p>
      <H2>Multinomial (softmax)</H2>
      <p>Modern implementations, including scikit-learn's default <code>lbfgs</code> solver, can instead fit one joint model with a score per class and convert the scores into probabilities that <strong>sum to 1</strong> using the softmax function.</p>
      <FormulaBlock tex={R`P(y = k \mid x) = \frac{e^{z_k}}{\sum_j e^{z_j}}`} caption="Shown for recognition only — with two classes it reduces to the sigmoid." />
      <ComparisonTable columns={["One-vs-Rest", "Multinomial"]} rows={[{ label: "Models", cells: ["K separate binary models", "One joint model"] }, { label: "Probabilities", cells: ["Need not sum to 1", "Sum to 1"] }, { label: "Prediction", cells: ["Highest-confidence class", "Highest-probability class"] }]} />
    </Prose>
  );
}

/* 11 · scikit-learn */
const SK_BASIC = `from sklearn.linear_model import LogisticRegression

model = LogisticRegression()
model.fit(X_train, y_train)                    # learn w and b

predictions = model.predict(X_test)            # class labels, e.g. [0, 1, 1, ...]
probabilities = model.predict_proba(X_test)    # shape (n, 2): [P(class 0), P(class 1)]
positive_prob = probabilities[:, 1]            # probability of class 1

print(model.coef_)       # weights w, one per feature
print(model.intercept_)  # bias b`;
const SK_PARAMS = `LogisticRegression(
    C=1.0,            # inverse regularization strength (smaller = stronger)
    penalty="l2",     # regularization type: "l2" (default), "l1", ...
    solver="lbfgs",   # optimisation algorithm ("liblinear"/"saga" support l1)
    max_iter=100,     # raise if you see a ConvergenceWarning
)`;
const SK_PIPE = `from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression

pipeline = Pipeline([
    ("scaler", StandardScaler()),
    ("model", LogisticRegression()),
])

pipeline.fit(X_train, y_train)          # scaler learns mean/std from TRAIN only
predictions = pipeline.predict(X_test)  # test data scaled with the same numbers
probabilities = pipeline.predict_proba(X_test)[:, 1]`;
function Sklearn() {
  return (
    <Prose>
      <CodeBlock code={SK_BASIC} />
      <ComparisonTable columns={["What it does", "Returns"]} rows={[{ label: "fit()", cells: ["Learns parameters from training data", "the fitted model"] }, { label: "predict()", cells: ["Applies the 0.5 threshold to probabilities", "class labels"] }, { label: "predict_proba()", cells: ["Estimates class probabilities", "one column per class"] }]} />
      <Callout kind="note" title="predict() uses a fixed 0.5 threshold">To use a different threshold, take <code>predict_proba(X)[:, 1]</code> and compare it yourself: <code>(proba &gt;= 0.3).astype(int)</code>.</Callout>
      <H2>Important parameters</H2>
      <CodeBlock code={SK_PARAMS} />
      <ComparisonTable columns={["Meaning"]} rows={[{ label: "C", cells: ["Inverse regularization strength — large C = weaker regularization"] }, { label: "penalty", cells: ["Regularization type (L2 default, L1 needs a compatible solver)"] }, { label: "solver", cells: ["Optimisation algorithm used to minimise the loss"] }, { label: "max_iter", cells: ["Maximum optimisation iterations"] }]} />
      <H2>Pipeline</H2>
      <CodeBlock code={SK_PIPE} />
      <ul className="list-disc space-y-1 pl-5"><li>Prevents preprocessing mistakes such as forgetting to scale test data.</li><li>Keeps transformations consistent between training and prediction.</li><li>Reduces data-leakage risk: the scaler only ever learns from training data, also inside cross-validation.</li><li>Makes the workflow cleaner — one object to fit, tune and save.</li></ul>
      <p>The complete worked example is in <Go slug="logistic-regression-evaluation">Evaluation</Go>.</p>
    </Prose>
  );
}

/* 12 · Evaluation */
const SK_FULL = `from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (confusion_matrix, accuracy_score, precision_score,
                             recall_score, f1_score, roc_auc_score)

# 1. Load data and separate features X from target y
data = load_breast_cancer()
X, y = data.data, data.target          # 30 numeric features; target 0 = malignant, 1 = benign

# 2. Hold out a test set (stratify keeps class proportions similar)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y)

# 3. Scale + model in one pipeline
pipeline = Pipeline([
    ("scaler", StandardScaler()),
    ("model", LogisticRegression(C=1.0, max_iter=1000)),
])
pipeline.fit(X_train, y_train)

# 4. Predict classes and probabilities
y_pred = pipeline.predict(X_test)
y_prob = pipeline.predict_proba(X_test)[:, 1]   # P(class 1)

# 5. Phase 2 metrics
print(confusion_matrix(y_test, y_pred))         # rows = actual, columns = predicted
print("Accuracy :", accuracy_score(y_test, y_pred))
print("Precision:", precision_score(y_test, y_pred))
print("Recall   :", recall_score(y_test, y_pred))
print("F1       :", f1_score(y_test, y_pred))
print("ROC-AUC  :", roc_auc_score(y_test, y_prob))  # uses probabilities, not labels`;
function Evaluation() {
  return (
    <Prose>
      <p>Logistic Regression does not need a new evaluation system — it plugs straight into Phase 2.</p>
      <Flow steps={["Model", "Probability", "Threshold", "Prediction", "Confusion Matrix", "Metrics"]} />
      <FittedEvaluation />
      <H2>Complete scikit-learn example</H2>
      <p>Using scikit-learn's built-in Breast Cancer Wisconsin dataset. Your printed numbers depend on the split, so none are quoted here.</p>
      <CodeBlock code={SK_FULL} />
      <Callout kind="note" title="Check the positive class">In this dataset label 1 means <strong>benign</strong>. If detecting malignant tumours is the goal, treat class 0 as positive (e.g. <code>pos_label=0</code>, and use <code>1 - y_prob</code> for ROC-AUC) — otherwise precision and recall answer a different question.</Callout>
      <H2>Why scale?</H2>
      <p>The features range from fractions to thousands. Regularization penalises all coefficients equally, so on unscaled data it effectively punishes some features more than others; scaling puts them on comparable footing, often helps solvers converge, and makes coefficient magnitudes more comparable. Scaling is not mathematically mandatory for every Logistic Regression setup — an unregularised model can work without it — but it is a sensible default.</p>
      <H2>Which metric is best?</H2>
      <p>It depends on the problem. A missed malignant tumour (false negative) is usually costlier than a false alarm, which favours recall and a lower threshold — but that trade-off is a decision about consequences, revisited in <Link to="/evaluation/$slug" params={{ slug: "choosing-metrics" }} className="text-primary underline-offset-4 hover:underline">Choosing Metrics</Link>.</p>
    </Prose>
  );
}

/* 13 · Advantages & limitations */
const MISTAKES: [string, string][] = [
  ["Thinking it predicts continuous values like Linear Regression", "It models a probability between 0 and 1, then classifies."],
  ["Confusing probability with class", "0.73 is an estimate; Class 1 is the decision."],
  ["Forgetting the threshold", "Every class prediction depends on one — predict() silently uses 0.5."],
  ["Treating the sigmoid output as the final prediction", "Sigmoid output is a probability; a threshold makes it a class."],
  ["Reading coefficients as direct probability changes", "Coefficients change log-odds; e^w multiplies odds."],
  ["Confusing odds with probability", "Odds 2 means p ≈ 0.67, not 2%."],
  ["Forgetting C is inverse regularization strength", "C multiplies the data term, not the penalty."],
  ["Assuming larger C means stronger regularization", "Larger C means weaker regularization."],
  ["Ignoring feature scaling with regularization", "Unscaled features are penalised unevenly; use a Pipeline with StandardScaler."],
  ["Using accuracy alone on imbalanced data", "Check precision, recall, F1 and curves — see Phase 2."],
  ["Thinking it is nonlinear because of the sigmoid", "The boundary wᵀx + b = logit(t) is linear in the features."],
  ["Assuming every problem should use Logistic Regression", "It is one strong baseline; nonlinear problems may need other models."],
];
function AdvLim() {
  return (
    <Prose>
      <H2>Advantages</H2>
      <div className="grid gap-3 sm:grid-cols-2">
        {[["Simple and interpretable", "A weighted sum you can read and explain."], ["Fast to train and predict", "Efficient even on large tabular datasets."], ["Probability estimates", "Supports threshold tuning and risk ranking."], ["Strong baseline", "A sensible first model for many binary problems — not always the best one."], ["Good fit for linear log-odds", "Works well when log-odds are roughly linear in the features."], ["Interpretable coefficients", "Signs and odds ratios carry meaning (with care about scale)."], ["Supports regularization", "L1/L2 via C help control overfitting."]].map(([t, d]) => <ConceptCard key={t} title={t!}>{d}</ConceptCard>)}
      </div>
      <H2>Limitations</H2>
      <ComparisonTable columns={["Why it matters"]} rows={[
        { label: "Linear boundary", cells: ["Only a line/plane/hyperplane in the original feature space."] },
        { label: "Strong nonlinearity", cells: ["Curved or circular patterns need engineered features (squares, interactions)."] },
        { label: "Extreme outliers", cells: ["Can pull coefficients in some settings."] },
        { label: "Multicollinearity", cells: ["Correlated features make individual coefficients unstable and hard to interpret."] },
        { label: "Preprocessing", cells: ["Scaling, encoding and missing values need deliberate choices."] },
        { label: "Calibration", cells: ["Probabilities are often reasonable but not guaranteed to be perfectly calibrated."] },
        { label: "Underfitting", cells: ["May miss complex patterns a more flexible model could capture."] },
      ]} />
      <H2>When to use Logistic Regression</H2>
      <Split left={{ title: "Good candidate when", body: <ul className="list-disc space-y-1 pl-4"><li>Binary classification</li><li>Interpretability matters</li><li>Relationships are roughly linear in log-odds</li><li>Probability estimates are useful</li><li>A strong baseline is needed</li><li>Training/prediction speed matters</li></ul> }} right={{ title: "Less suitable when", body: <ul className="list-disc space-y-1 pl-4"><li>Highly nonlinear relationships dominate</li><li>Essential interactions have not been engineered</li><li>The data needs very flexible boundaries</li></ul> }} />
      <p className="text-sm text-muted-foreground">Guidance, not rules — compare against alternatives on validation data.</p>
      <H2>Common Logistic Regression mistakes</H2>
      <ol className="divide-y border-y">{MISTAKES.map(([m, fix], i) => <li key={m} className="py-3"><p className="font-medium">{i + 1}. {m}</p><p className="text-sm text-muted-foreground"><strong>Correct model:</strong> {fix}</p></li>)}</ol>
    </Prose>
  );
}

/* 14 · Practical example */
function Practical() {
  return (
    <Prose>
      <p>Predict whether a customer will <strong>churn</strong> (0 = No, 1 = Yes) from tenure, monthly charges and support tickets.</p>
      <ChurnExample />
      <ExampleBlock title="Default customer">Tenure 8, charges 80, tickets 2 → z = −0.4 + 2.4 + 0.8 − 1.5 = 1.3 → P(churn) ≈ 0.79 → with threshold 0.50, prediction = <strong>Churn</strong>.</ExampleBlock>
      <H2>Logistic Regression workflow</H2>
      <p>The general <Link to="/classification/$slug" params={{ slug: "workflow" }} className="text-primary underline-offset-4 hover:underline">Phase 1 workflow</Link>, specialised:</p>
      <Flow steps={["Problem Definition", "Collect Labeled Data", "Explore Data", "Prepare Features", "Train/Test Split", "Scale Features if appropriate", "Train Logistic Regression", "Generate Probabilities", "Choose Threshold", "Generate Predictions", "Evaluate", "Tune Regularization / Threshold", "Final Model"]} />
      <Callout kind="note">Tune C and the threshold on validation data (or cross-validation); keep the test set for one final check.</Callout>
    </Prose>
  );
}

/* 15 · Cheat sheet */
const PY_REF = `# Import
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.metrics import (confusion_matrix, accuracy_score, precision_score,
                             recall_score, f1_score, roc_auc_score, classification_report)

# Split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

# Model (key parameters: C, penalty, solver, max_iter)
model = Pipeline([
    ("scaler", StandardScaler()),
    ("model", LogisticRegression(C=1.0, penalty="l2", solver="lbfgs", max_iter=1000)),
])

# Training
model.fit(X_train, y_train)

# Prediction / probability
y_pred = model.predict(X_test)
y_prob = model.predict_proba(X_test)[:, 1]
y_custom = (y_prob >= 0.3).astype(int)      # your own threshold

# Coefficients / intercept
lr = model.named_steps["model"]
print(lr.coef_, lr.intercept_)

# Classification metrics
print(confusion_matrix(y_test, y_pred))
print(classification_report(y_test, y_pred))
print(roc_auc_score(y_test, y_prob))`;
function Cheat() {
  const items: [string, string][] = [["Linear score", "z = w^Tx + b"], ["Sigmoid", R`\sigma(z) = \frac{1}{1+e^{-z}}`], ["Probability", R`p = \sigma(z)`], ["Decision", R`p \ge t \Rightarrow 1,\quad p < t \Rightarrow 0`], ["Logit", R`\log\frac{p}{1-p} = w^Tx + b`], ["Odds ratio", R`e^{w_j}`], ["Loss", R`L = -[y\log p + (1-y)\log(1-p)]`], ["Gradient step", R`\theta \leftarrow \theta - \eta\nabla J`], ["F1 (Phase 2)", R`F_1 = \frac{2PR}{P+R}`]];
  return (
    <Prose>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(([t, tex]) => <div key={t} className="rounded-lg border bg-card p-4"><p className="font-mono text-xs uppercase text-muted-foreground">{t}</p><div className="mt-2 overflow-x-auto"><InlineMath tex={tex} /></div></div>)}
      </div>
      <p className="text-sm">C: large → weaker regularization; small → stronger. For other metrics see the <Link to="/evaluation/$slug" params={{ slug: "choosing-metrics" }} className="text-primary underline-offset-4 hover:underline">Phase 2 reference table</Link>.</p>
      <H2>Python reference</H2>
      <CodeBlock code={PY_REF} />
      <H2>Concept map</H2>
      <ConceptMap />
      <DefinitionBlock title="In your own words">Logistic Regression takes a weighted combination of features, converts the resulting score into a probability using the sigmoid function, and uses a threshold to make a classification decision. During training, it adjusts its parameters to minimize a classification loss, often with regularization to improve generalization.</DefinitionBlock>
    </Prose>
  );
}

export const algorithmsContent: Record<string, ComponentType> = {
  "logistic-regression": Intro,
  "logistic-regression-linear-score": LinearScore,
  "logistic-regression-sigmoid": Sigmoid,
  "logistic-regression-probability-threshold": ProbThreshold,
  "logistic-regression-log-odds": LogOdds,
  "logistic-regression-decision-boundary": Boundary,
  "logistic-regression-loss-function": Loss,
  "logistic-regression-training": Training,
  "logistic-regression-regularization": Regularization,
  "logistic-regression-multiclass": Multiclass,
  "logistic-regression-scikit-learn": Sklearn,
  "logistic-regression-evaluation": Evaluation,
  "logistic-regression-advantages-limitations": AdvLim,
  "logistic-regression-practical-example": Practical,
  "logistic-regression-cheat-sheet": Cheat,
};
