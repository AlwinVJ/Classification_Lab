import type { ComponentType, ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { H2, H3, Prose } from "@/components/learning/LessonShell";
import { Callout, CodeBlock, ComparisonTable, ConceptCard, DefinitionBlock, ExampleBlock, FormulaBlock, InlineMath } from "@/components/learning/blocks";
import { Flow, Split } from "@/components/visualization/diagrams";
import {
  BoundaryTriptych, DepthExplorer, ImbalanceViz, ImportanceViz, ImpurityCalculator, PrePruning, PruningExplorer, SplitComparison, StructureDemo, TreeBuilder, TreeChip as C, TreeEvaluation, TreeExplorer,
} from "@/components/visualization/TreeViz";
import { entropy, evaluateSplit } from "@/lib/tree";

const R = String.raw;
const Go = ({ slug, children }: { slug: string; children: ReactNode }) => <Link to="/algorithms/$slug" params={{ slug }} className="font-medium text-primary underline-offset-4 hover:underline">{children}</Link>;
const EvalLink = ({ slug, children }: { slug: string; children: ReactNode }) => <Link to="/evaluation/$slug" params={{ slug }} className="text-primary underline-offset-4 hover:underline">{children}</Link>;
const s = (x: string) => `decision-trees-${x}`;
const n3 = (v: number) => v.toFixed(3);

/* 1 · Introduction */
function Intro() {
  const cards: [string, string, string][] = [
    ["Decision Tree Fundamentals", "decision-trees", "What a tree is and how it predicts."], ["Tree Structure", s("structure"), "Root, internal nodes, branches, leaves."],
    ["Splitting Criteria", s("splitting"), "How candidate splits are compared."], ["Gini Impurity", s("gini"), "1 − Σpᵢ² with a live calculator."],
    ["Entropy", s("entropy"), "Uncertainty measured in bits."], ["Information Gain", s("information-gain"), "Weighted reduction in entropy."],
    ["Tree Depth", s("depth"), "Complexity and decision boundaries."], ["Overfitting and Pruning", s("overfitting"), "Pre- and post-pruning."],
    ["Scikit-learn Implementation", s("scikit-learn"), "DecisionTreeClassifier end to end."],
  ];
  return (
    <Prose>
      <p className="text-lg">Learn how classification models make predictions by asking a sequence of feature-based questions.</p>
      <DefinitionBlock title="The core idea">A Decision Tree classifies an observation by following a <strong>sequence of decisions</strong> based on its feature values until it reaches a <strong>leaf node</strong> containing a predicted class.</DefinitionBlock>
      <ExampleBlock title="Illustrative churn tree (not a universal churn rule)">
        <ol className="list-decimal space-y-1 pl-5"><li>Is the customer's contract month-to-month? — if <strong>no</strong> → <em>Unlikely to churn</em></li><li>If yes: is tenure below 6 months? — if <strong>no</strong> → <em>Unlikely to churn</em></li><li>If yes: are monthly charges above a chosen threshold? — <strong>yes</strong> → <em>Likely to churn</em>, <strong>no</strong> → <em>Unlikely to churn</em></li></ol>
        <p className="mt-2 text-sm text-muted-foreground">A real tree learns its questions and thresholds from data; these are made up to show the shape.</p>
      </ExampleBlock>
      <div className="grid gap-6 md:grid-cols-2">
        <div><H3>How a tree is learned</H3><Flow steps={["Training Data", "Evaluate Candidate Splits", "Choose a Split", "Create Child Nodes", "Repeat Recursively", "Stop Splitting", "Assign Predictions to Leaf Nodes"]} /></div>
        <div className="text-sm"><H3>Each stage in one line</H3><ul className="list-disc space-y-1 pl-4">
          <li><strong>Training data</strong>: labeled examples start together in the root.</li><li><strong>Candidate splits</strong>: possible questions like "F1 ≤ 4.5?".</li>
          <li><strong>Choose</strong>: keep the question that makes children most class-pure.</li><li><strong>Child nodes</strong>: the data is divided by the answer.</li>
          <li><strong>Recurse</strong>: repeat inside each child.</li><li><strong>Stop</strong>: pure node, depth limit or too few samples.</li><li><strong>Leaves</strong>: predict the majority class of their training samples.</li></ul></div>
      </div>
      <H2>Module map</H2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{cards.map(([t, slug, d]) => <Link key={t} to="/algorithms/$slug" params={{ slug }}><ConceptCard title={t}>{d}</ConceptCard></Link>)}</div>
      <H2>What is a decision tree?</H2>
      <p>A Decision Tree is a <strong>supervised</strong> algorithm that can do classification and regression; this site focuses on classification. Say we predict whether a customer <strong>subscribes</strong> using <em>age</em>, <em>monthly spending</em> and <em>previous purchases</em>. The tree might first ask "previous purchases ≥ 2?", then "monthly spending &gt; 40?", following a branch after each answer until it reaches a leaf saying <em>Subscribes</em> or <em>Does not subscribe</em>.</p>
      <p>That is why it looks like a <strong>flowchart</strong>: boxes with questions, arrows for answers, and end boxes with outcomes.</p>
      <ComparisonTable columns={["How a prediction is made"]} rows={[{ label: "Logistic Regression", cells: ["a weighted linear score, turned into a probability"] }, { label: "KNN", cells: ["the labels of neighboring examples"] }, { label: "Decision Tree", cells: ["a sequence of feature-based decisions"] }]} />
      <p className="text-sm">Recap: <Go slug="logistic-regression">Logistic Regression</Go> · <Go slug="knn">KNN</Go>.</p>
    </Prose>
  );
}

/* 2 · Structure */
function Structure() {
  return (
    <Prose>
      <div className="grid gap-3 sm:grid-cols-2">
        <ConceptCard title="Root node">The first node at the top. It holds all training observations.</ConceptCard>
        <ConceptCard title="Internal node">A node that applies a decision (split), such as F2 ≤ 4.5.</ConceptCard>
        <ConceptCard title="Branch">The path followed according to the outcome of a decision (≤ yes, &gt; no).</ConceptCard>
        <ConceptCard title="Leaf node">A terminal node that produces a prediction — its majority class.</ConceptCard>
        <ConceptCard title="Depth">The number of edges from the root to a node. The root has depth 0 (scikit-learn's convention).</ConceptCard>
        <ConceptCard title="Node impurity">How mixed the class labels are within a node; 0 means every sample has the same class.</ConceptCard>
      </div>
      <H2>Explore a real tree</H2>
      <StructureDemo />
      <p className="text-sm">Try: click the root, then a leaf. The leaf's prediction is simply the majority class of the training samples that reached it.</p>
    </Prose>
  );
}

/* 3 · Explorer */
function Explorer() {
  return (
    <Prose>
      <p>Each split is a straight cut parallel to an axis, so a tree divides the plot into <strong>rectangles</strong>. Move the thresholds and watch counts, impurity and regions change.</p>
      <TreeExplorer />
      <ul className="list-disc space-y-1 pl-5 text-sm"><li>Drag the root threshold far left: the left child becomes tiny and almost all points go right.</li><li>Select a child node and collapse it: its region becomes one colour (its majority class).</li><li>The default thresholds (5, 7, 3) match the hidden pattern used to generate the data; some points are still wrong because ~10% of labels are noisy.</li></ul>
    </Prose>
  );
}

/* 4 · Splitting */
function Splitting() {
  return (
    <Prose>
      <p>A classification tree evaluates <strong>candidate feature splits</strong> and chooses one using its <strong>splitting criterion</strong>. A good split generally produces children that are <strong>more class-pure</strong> than the parent.</p>
      <Flow steps={["Parent Node", "Generate Candidate Splits", "Calculate Child-Node Impurity", "Calculate Weighted Impurity", "Measure Impurity Reduction", "Choose a Preferred Split"]} />
      <Callout kind="note" title="Useful ≠ perfect">A split does not have to create perfectly pure children to be useful — it only has to reduce impurity. The best split depends on the dataset, the candidate thresholds, the criterion and any constraints on growth.</Callout>
      <H2>Numerical splits</H2>
      <p>For a numerical feature the question is a threshold: <strong>Age ≤ 35?</strong> Observations satisfying it go to one child; the rest go to the other. Candidate thresholds are typically midpoints between neighboring sorted values.</p>
      <H2>Categorical splits</H2>
      <p>For a category the question might be <strong>Contract type = Month-to-month?</strong> How this is represented depends on the implementation and the encoding.</p>
      <Callout kind="note" title="scikit-learn needs numbers">The standard <C>DecisionTreeClassifier</C> requires categorical values to be <strong>encoded numerically</strong> before fitting — you cannot pass raw strings like "Month-to-month". One-hot encoding is a common choice; it turns "Contract = Month-to-month?" into a 0/1 column the tree can split on, which can change how splits are represented compared with a native categorical split.</Callout>
      <CodeBlock code={`from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder

pre = ColumnTransformer([("cat", OneHotEncoder(handle_unknown="ignore"), ["contract_type"])],
                        remainder="passthrough")`} />
    </Prose>
  );
}

/* 5 · Gini */
function Gini() {
  return (
    <Prose>
      <FormulaBlock tex={R`\text{Gini} = 1 - \sum_i p_i^2`} variables={[{ symbol: "p_i", meaning: "proportion of observations in the node that belong to class i" }]} caption="Gini impurity measures how mixed the classes are within a node." />
      <p>For two classes: <InlineMath tex={R`\text{Gini} = 1 - p_0^2 - p_1^2`} />. A node containing only one class has Gini impurity <strong>0</strong>.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <ExampleBlock title="Example A · 100% Class A"><InlineMath tex={R`1 - 1^2 - 0^2 = 0`} /> — pure.</ExampleBlock>
        <ExampleBlock title="Example B · 50% A, 50% B"><InlineMath tex={R`1 - 0.5^2 - 0.5^2 = 0.5`} /> — maximally mixed for two classes.</ExampleBlock>
      </div>
      <Callout kind="note">For binary classification, Gini is maximized (0.5) when the classes are equally represented. Most impure nodes are <strong>not</strong> 0.5 — e.g. 30/70 gives 0.42. With k classes the maximum is 1 − 1/k (0.667 for three).</Callout>
      <H2>Interactive Gini calculator</H2>
      <ImpurityCalculator kind="gini" />
    </Prose>
  );
}

/* 6 · Entropy */
function Entropy() {
  return (
    <Prose>
      <FormulaBlock tex={R`\text{Entropy} = -\sum_i p_i \log_2 p_i`} variables={[{ symbol: "p_i", meaning: "proportion of class i in the node" }, { symbol: R`\log_2`, meaning: "logarithm base 2, so the unit is bits" }]} caption="Entropy measures uncertainty, or class mixture, within a node." />
      <p>Binary form: <InlineMath tex={R`-p_0\log_2 p_0 - p_1 \log_2 p_1`} />. A pure node has entropy 0; a balanced binary node has <strong>1 bit</strong>; any mixture has positive entropy.</p>
      <Callout kind="note" title="Convention: 0 · log₂(0) = 0">log₂(0) is undefined, but p·log₂p approaches 0 as p approaches 0. So a class that is absent from a node contributes nothing — which is why a pure node has entropy exactly 0.</Callout>
      <div className="grid gap-3 sm:grid-cols-2">
        <ExampleBlock title="Example A · 100% Class A"><InlineMath tex={R`-(1\cdot\log_2 1 + 0) = 0`} /></ExampleBlock>
        <ExampleBlock title="Example B · 50% / 50%"><InlineMath tex={R`-(0.5\cdot(-1) + 0.5\cdot(-1)) = 1\text{ bit}`} /></ExampleBlock>
      </div>
      <H2>Interactive entropy calculator</H2>
      <ImpurityCalculator kind="entropy" />
    </Prose>
  );
}

/* 7 · Gini vs entropy */
function GiniVsEntropy() {
  return (
    <Prose>
      <p>Both measure class mixture and both can evaluate candidate splits.</p>
      <ComparisonTable columns={["Gini Impurity", "Entropy"]} rows={[
        { label: "Formula", cells: ["1 − Σpᵢ²", "−Σpᵢ log₂(pᵢ)"] }, { label: "Pure node", cells: ["0", "0"] }, { label: "Balanced binary node", cells: ["0.5", "1 bit"] },
        { label: "Interpretation", cells: ["Impurity", "Uncertainty"] }, { label: "Typical criterion", cells: ["gini", "entropy"] }, { label: "Main purpose", cells: ["Evaluate candidate splits", "Evaluate candidate splits"] },
      ]} />
      <p>They <strong>often select similar splits but can differ</strong>. Neither is universally better; try both with validation data if it matters. scikit-learn also accepts <C>criterion="log_loss"</C> in recent versions (equivalent to entropy for classification trees); this site uses <C>gini</C> and <C>entropy</C> as the main examples.</p>
      <H2>Gain and impurity reduction</H2>
      <div className="grid gap-3 md:grid-cols-2">
        <FormulaBlock tex={R`\text{Information Gain} = H_{\text{parent}} - H_{\text{weighted children}}`} caption="For entropy" />
        <FormulaBlock tex={R`\text{Gini Reduction} = G_{\text{parent}} - G_{\text{weighted children}}`} caption="For Gini" />
      </div>
      <Callout kind="note" title="Precise terms">Both measure how much a split improves purity, using different impurity functions. "Information gain" refers to entropy; for Gini, say <strong>Gini reduction</strong> (or impurity decrease).</Callout>
      <H2>See them disagree</H2>
      <SplitComparison initial="Criteria disagree" />
      <p className="text-sm">With the "Criteria disagree" preset, Gini prefers the balanced split A while entropy prefers B, which isolates a perfectly pure child. Switch the criterion to check.</p>
    </Prose>
  );
}

/* 8 · Information gain */
function InfoGain() {
  const e = evaluateSplit([36, 4], [14, 46], "entropy")!;
  return (
    <Prose>
      <p>Information gain measures the <strong>reduction in entropy</strong> caused by a split.</p>
      <FormulaBlock tex={R`IG = H(\text{parent}) - \left[\tfrac{n_L}{n_P} H(L) + \tfrac{n_R}{n_P} H(R)\right]`} variables={[{ symbol: R`n_P, n_L, n_R`, meaning: "observations in the parent, left child and right child" }, { symbol: "H(\\cdot)", meaning: "entropy of a node" }]} caption="Child entropies are weighted by child size." />
      <Callout kind="note" title="Weight by size">A child with 60 observations should count more than one with 40. A plain average is only correct when both children are the same size.</Callout>
      <H2>Worked example</H2>
      <ol className="list-decimal space-y-2 pl-5">
        <li>Parent: 100 observations, 50 A / 50 B → <strong>H = 1 bit</strong>.</li>
        <li>Left child: 40 observations (36 A, 4 B), p = 0.9 / 0.1 → <InlineMath tex={R`-(0.9\log_2 0.9 + 0.1\log_2 0.1)`} /> = <strong>{n3(e.left)}</strong> bits.</li>
        <li>Right child: 60 observations (14 A, 46 B), p ≈ 0.233 / 0.767 → <strong>{n3(e.right)}</strong> bits.</li>
        <li>Weighted child entropy = 0.4 × {n3(e.left)} + 0.6 × {n3(e.right)} = <strong>{n3(e.weighted)}</strong> bits.</li>
        <li>Information gain = 1 − {n3(e.weighted)} = <strong>{n3(e.reduction)}</strong> bits.</li>
      </ol>
      <p className="text-sm text-muted-foreground">These numbers are computed in your browser from the counts above (an unweighted average would wrongly give {n3((e.left + e.right) / 2)}). Check left: {n3(entropy([36, 4])!)}.</p>
    </Prose>
  );
}

/* 9 · Split comparison */
function SplitCompare() {
  return (
    <Prose>
      <p>Edit the parent and each candidate's left child; the right child is whatever remains. The preferred split is <strong>calculated</strong>, not hardcoded — and ties are reported.</p>
      <SplitComparison />
      <p className="text-sm">The "Worked example" preset's Split A is the split from <Go slug={s("information-gain")}>Information Gain</Go>.</p>
    </Prose>
  );
}

/* 10 · Building */
function Building() {
  return (
    <Prose>
      <ol className="list-decimal space-y-1 pl-5"><li>Start with all training observations in the root.</li><li>Evaluate candidate splits.</li><li>Choose one according to the criterion.</li><li>Partition the observations.</li><li>Decide whether each child should be split further.</li><li>Repeat until stopping conditions are reached.</li></ol>
      <Callout kind="intuition" title="Greedy, not globally optimal">At each step the algorithm picks the <strong>locally</strong> best split given its criterion and constraints. It does not generally search every possible complete tree, so the final tree is not guaranteed to be the best possible one.</Callout>
      <TreeBuilder />
      <p className="text-sm text-muted-foreground">This demo evaluates every midpoint threshold for both features (15 at the root) and lists the best four. Previous/Next only move through the demo.</p>
    </Prose>
  );
}

/* 11 · Depth */
function Depth() {
  return (
    <Prose>
      <p>A deeper tree can represent more complex patterns, but it can also fit noise. A shallow tree is easier to interpret but may miss important patterns.</p>
      <div className="grid gap-3 sm:grid-cols-3"><ConceptCard title="Underfitting">Too simple to capture the structure.</ConceptCard><ConceptCard title="Appropriate complexity">Captures the pattern, ignores most noise.</ConceptCard><ConceptCard title="Overfitting">Carves out tiny regions around noisy points.</ConceptCard></div>
      <BoundaryTriptych />
      <Callout kind="note">Deeper is not always overfitting and shallow is not always underfitting — it depends on the data and other settings.</Callout>
      <H2>Interactive depth explorer</H2>
      <DepthExplorer />
    </Prose>
  );
}

/* 12 · Overfitting */
function Overfitting() {
  return (
    <Prose>
      <Split left={{ title: "Underfitting", body: "The tree is too simple to capture important patterns. Both training and validation performance are usually low." }} right={{ title: "Overfitting", body: "The tree fits training-specific patterns or noise. Training performance is high, validation performance lags behind." }} />
      <BoundaryTriptych />
      <p><strong>Training performance alone is insufficient</strong> for choosing a model: an unrestricted tree reaches 100% training accuracy here simply by isolating every point.</p>
      <p>This is the bias-variance trade-off from <Go slug="knn-choosing-k">Choosing k</Go>: shallow trees have high bias, deep trees high variance (small changes in data can reshape them).</p>
    </Prose>
  );
}

/* 13 · Pre-pruning */
function PrePrune() {
  return (
    <Prose>
      <p><strong>Pre-pruning</strong> restricts growth during training.</p>
      <ComparisonTable columns={["What it limits"]} rows={[
        { label: "max_depth", cells: ["the maximum depth of the tree"] }, { label: "min_samples_split", cells: ["minimum samples a node needs before it may be split"] },
        { label: "min_samples_leaf", cells: ["minimum samples every leaf must keep"] }, { label: "max_leaf_nodes", cells: ["the total number of leaves (scikit-learn then grows best-first)"] },
      ]} />
      <PrePruning />
      <p className="text-sm text-muted-foreground">The lab implements the first three; <C>max_leaf_nodes</C> is described but not simulated. No setting is guaranteed to improve generalization — compare using validation data.</p>
    </Prose>
  );
}

/* 14 · Post-pruning */
function PostPrune() {
  return (
    <Prose>
      <p><strong>Post-pruning</strong> grows a tree first and then simplifies it by removing branches that contribute too little predictive value relative to a <strong>complexity penalty</strong>. scikit-learn implements <strong>cost-complexity pruning</strong> via <C>ccp_alpha</C>.</p>
      <ul className="list-disc space-y-1 pl-5"><li>Smaller <C>ccp_alpha</C> → weaker penalty, usually a larger tree (0 = no pruning).</li><li>Larger <C>ccp_alpha</C> → stronger penalty; the tree generally becomes simpler.</li><li>The exact result depends on the data and its cost-complexity path.</li></ul>
      <PruningExplorer />
      <CodeBlock code={`path = DecisionTreeClassifier(random_state=42).cost_complexity_pruning_path(X_train, y_train)
alphas = path.ccp_alphas  # candidate values to compare with cross-validation`} />
    </Prose>
  );
}

/* 15 · Importance */
function Importance() {
  return (
    <Prose>
      <p>Impurity-based feature importance estimates how much a feature contributes to reducing weighted impurity across all splits that use it. For a fitted scikit-learn tree (<C>feature_importances_</C>) the values are normalized to sum to 1.</p>
      <ComparisonTable columns={["Importance (illustrative values)"]} rows={[{ label: "Feature A", cells: ["0.52"] }, { label: "Feature B", cells: ["0.31"] }, { label: "Feature C", cells: ["0.17"] }]} />
      <ImportanceViz />
      <H2>Limitations</H2>
      <ul className="list-disc space-y-1 pl-5"><li>Can be biased toward features with many possible split points (e.g. continuous or ID-like columns).</li><li>Correlated features can split importance between them.</li><li>Importance does <strong>not</strong> establish causation.</li><li>It describes the model, not the feature's real-world or business importance.</li></ul>
      <Callout kind="note">Permutation importance on validation data is a common cross-check.</Callout>
    </Prose>
  );
}

/* 16 · scikit-learn */
function Sklearn() {
  return (
    <Prose>
      <CodeBlock code={`from sklearn.tree import DecisionTreeClassifier

model = DecisionTreeClassifier(
    criterion="gini",
    max_depth=3,
    random_state=42
)
model.fit(X_train, y_train)          # learn splits from training data
predictions = model.predict(X_test)  # follow each row to a leaf`} />
      <Callout kind="intuition" title="Scaling usually not needed">Standard numerical splits compare a feature with a threshold, not Euclidean distances, so rescaling a feature does not change which rows go left or right. Other preprocessing (encoding, imputation, feature engineering) can still matter.</Callout>
      <H2>Important parameters</H2>
      <ComparisonTable columns={["Purpose"]} rows={[
        { label: "criterion", cells: ['"gini", "entropy", or "log_loss" where supported'] }, { label: "max_depth", cells: ["limit tree depth"] },
        { label: "min_samples_split", cells: ["min samples to split an internal node"] }, { label: "min_samples_leaf", cells: ["min samples in a leaf"] },
        { label: "max_leaf_nodes", cells: ["limit the number of leaves"] }, { label: "class_weight", cells: ['weight classes in the fitting objective, e.g. "balanced"'] },
        { label: "random_state", cells: ["reproducibility of random choices (e.g. feature order ties)"] }, { label: "ccp_alpha", cells: ["cost-complexity pruning strength"] },
      ]} />
      <CodeBlock code={`DecisionTreeClassifier(criterion="entropy", min_samples_leaf=5)
DecisionTreeClassifier(class_weight="balanced", ccp_alpha=0.01)`} />
      <H2>Visualizing a fitted tree</H2>
      <CodeBlock code={`from sklearn.tree import plot_tree
import matplotlib.pyplot as plt

plt.figure(figsize=(16, 8))

plot_tree(
    model,
    feature_names=feature_names,
    class_names=class_names,
    filled=True,
    rounded=True
)

plt.show()`} />
      <p className="text-sm">Each box shows the <strong>feature condition</strong>, the <strong>impurity</strong>, <strong>samples</strong>, the <strong>class distribution</strong> (<C>value</C>) and the <strong>predicted class</strong>. This runs in a Python environment; the website does not execute Python.</p>
      <H2>Complete example · Breast Cancer Wisconsin</H2>
      <CodeBlock code={`from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier, plot_tree
from sklearn.metrics import (confusion_matrix, accuracy_score, precision_score,
                             recall_score, f1_score, roc_auc_score)
import matplotlib.pyplot as plt

# 1-2. Load data; separate features and target
data = load_breast_cancer()
X, y = data.data, data.target   # in this dataset: 0 = malignant, 1 = benign

# Make "malignant" the positive class explicitly
y_pos = (y == 0).astype(int)    # 1 = malignant

# 3. Stratified train/test split
X_train, X_test, y_train, y_test = train_test_split(
    X, y_pos, test_size=0.25, stratify=y_pos, random_state=42)

# 4. Train
model = DecisionTreeClassifier(max_depth=3, random_state=42)
model.fit(X_train, y_train)

# 5. Predict labels and probabilities
pred = model.predict(X_test)
proba = model.predict_proba(X_test)[:, 1]   # P(malignant)

# 6-11. Evaluate (positive class = malignant)
print(confusion_matrix(y_test, pred))
print("accuracy ", accuracy_score(y_test, pred))
print("precision", precision_score(y_test, pred))
print("recall   ", recall_score(y_test, pred))
print("f1       ", f1_score(y_test, pred))
print("roc_auc  ", roc_auc_score(y_test, proba))  # scores, not hard labels

# 12. Visualize
plt.figure(figsize=(16, 8))
plot_tree(model, feature_names=data.feature_names,
          class_names=["benign", "malignant"], filled=True, rounded=True)
plt.show()

# 13. Experiment with max_depth
for depth in [1, 2, 3, 5, None]:
    m = DecisionTreeClassifier(max_depth=depth, random_state=42).fit(X_train, y_train)
    print(depth, m.score(X_train, y_train), m.score(X_test, y_test))`} />
      <Callout kind="note" title="14. Explaining the results">No results are shown here — run the code to get them. Expect training accuracy to approach 1.0 as depth grows; compare that with test scores and with recall for the malignant class. For honest tuning, use cross-validation on the training set instead of looping over the test set (see <Go slug={s("tuning")}>Hyperparameter Tuning</Go>).</Callout>
    </Prose>
  );
}

/* 17 · Evaluation */
function Evaluation() {
  return (
    <Prose>
      <p>Trees are evaluated with the same Phase 2 tools: <EvalLink slug="confusion-matrix">confusion matrix</EvalLink>, <EvalLink slug="accuracy">accuracy</EvalLink>, <EvalLink slug="precision">precision</EvalLink>, <EvalLink slug="recall">recall</EvalLink>, <EvalLink slug="f1-score">F1</EvalLink> and <EvalLink slug="roc-auc">ROC-AUC</EvalLink>.</p>
      <Flow steps={["Training Data", "Decision Tree", "Predictions / Probabilities", "Confusion Matrix", "Evaluation Metrics", "Hyperparameter Tuning"]} />
      <TreeEvaluation />
      <Callout kind="note">Define the positive class (here Class B). ROC-AUC needs predicted probabilities (<C>predict_proba</C>), not hard labels. Which metric matters depends on the cost of false positives versus false negatives — see <EvalLink slug="choosing-metrics">Choosing Metrics</EvalLink>.</Callout>
    </Prose>
  );
}

/* 18 · Tuning */
function Tuning() {
  return (
    <Prose>
      <div className="grid gap-3 sm:grid-cols-3"><ConceptCard title="Training data">Fit candidate trees.</ConceptCard><ConceptCard title="Validation / CV folds">Compare hyperparameters.</ConceptCard><ConceptCard title="Test data">One final, untouched evaluation.</ConceptCard></div>
      <Flow steps={["Training Data → Fit Candidate Trees", "Cross-Validation → Compare Hyperparameters", "Select Configuration → Refit Using Training Data", "Test Data → Final Evaluation"]} />
      <CodeBlock code={`from sklearn.model_selection import GridSearchCV
from sklearn.tree import DecisionTreeClassifier

param_grid = {
    "max_depth": [2, 3, 5, 8, None],
    "min_samples_split": [2, 5, 10],
    "min_samples_leaf": [1, 2, 5],
    "criterion": ["gini", "entropy"]
}

search = GridSearchCV(
    estimator=DecisionTreeClassifier(random_state=42),
    param_grid=param_grid,
    scoring="f1",
    cv=5
)

search.fit(X_train, y_train)
print(search.best_params_)
best = search.best_estimator_   # refit on all training data by default`} />
      <ul className="list-disc space-y-1 pl-5 text-sm"><li>F1 is the selection metric here; recall, ROC-AUC or another metric may suit a different problem.</li><li><C>max_depth=None</C> lets the tree grow until other stopping conditions apply.</li></ul>
      <Callout kind="note" title="Do not tune on the test set">Picking hyperparameters by repeatedly checking test performance leaks test information into the choice, so the final test score becomes overly optimistic.</Callout>
    </Prose>
  );
}

/* 19 · Imbalance */
function Imbalance() {
  return (
    <Prose>
      <ul className="list-disc space-y-1 pl-5"><li>Accuracy can hide poor minority-class performance (<EvalLink slug="accuracy">Phase 2</EvalLink>).</li><li>Impurity-based splitting does not automatically guarantee good minority detection: a node with 7 A / 1 B already looks fairly pure.</li><li>Class weighting can help in some situations — it is not guaranteed to improve results.</li><li>Evaluate with metrics suited to the problem, such as recall, precision and F1.</li></ul>
      <ImbalanceViz />
      <p className="text-sm">On this data, balanced weights raise recall but add false positives. Whether that trade is worth it depends on error costs.</p>
    </Prose>
  );
}

/* 20 · Missing values */
function Missing() {
  return (
    <Prose>
      <p>Missing-value handling depends on the estimator <strong>and</strong> the scikit-learn version: some recent versions can handle NaN in trees natively, older ones raise an error. A reliable, version-independent approach is to impute in a Pipeline:</p>
      <CodeBlock code={`from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.tree import DecisionTreeClassifier

pipeline = Pipeline([
    ("imputer", SimpleImputer(strategy="median")),
    ("model", DecisionTreeClassifier(random_state=42))
])`} />
      <ul className="list-disc space-y-1 pl-5"><li>Median imputation suits many numerical features but is not universally appropriate (e.g. when "missing" itself carries meaning).</li><li>Categorical columns may need <C>SimpleImputer(strategy="most_frequent")</C> or a constant, followed by encoding.</li><li>Do not assume every tree implementation supports every missing-value representation.</li></ul>
    </Prose>
  );
}

/* 21 · Advantages, limitations, when to use, mistakes */
const MISTAKES: [string, string, string][] = [
  ["Assuming deeper trees are always better", "Depth can memorize noise.", "Choose depth with validation data."],
  ["Confusing node impurity with model accuracy", "Impurity describes one node's class mix.", "Accuracy is measured on predictions, ideally on held-out data."],
  ["Averaging child impurity without weighting", "Small children would count as much as large ones.", "Weight by nLeft/nParent and nRight/nParent."],
  ["Calling Gini reduction 'information gain'", "Information gain is defined with entropy.", "Use 'Gini reduction' for Gini."],
  ["Treating feature importance as causation", "It reflects how the model splits.", "It is a model description with known biases."],
  ["Scaling features for ordinary tree splits", "Thresholds are unaffected by rescaling.", "Scaling is usually unnecessary for trees (but harmless)."],
  ["Tuning hyperparameters on the test set", "Test results become optimistic.", "Tune with CV; test once."],
  ["Evaluating only training performance", "Unrestricted trees can reach 100% on training data.", "Compare validation or CV scores."],
  ["Assuming pruning always improves test performance", "Too much pruning underfits.", "Pruning is a knob to tune."],
  ["Passing raw categorical strings", "DecisionTreeClassifier needs numeric input.", "Encode categories first."],
  ["Assuming all versions behave the same", "Criteria (log_loss) and NaN support vary.", "Check your scikit-learn version's docs."],
  ["Treating a simple-looking tree as proof of quality", "Readable ≠ accurate.", "Judge with appropriate metrics."],
];
function AdvLim() {
  return (
    <Prose>
      <Split left={{ title: "Advantages", body: <ul className="list-disc space-y-1 pl-4"><li>Easy to visualize</li><li>Readable as a sequence of rules</li><li>Captures nonlinear boundaries</li><li>Models feature interactions through successive splits</li><li>Usually no feature scaling needed</li><li>Binary and multiclass classification</li><li>Handles numerical features naturally</li><li>Useful baseline</li></ul> }}
        right={{ title: "Limitations", body: <ul className="list-disc space-y-1 pl-4"><li>Can overfit, especially when deep</li><li>Unstable: small data changes can change the tree</li><li>Axis-aligned, step-shaped boundaries can approximate smooth or diagonal patterns poorly</li><li>Impurity-based importance has limitations</li><li>A single tree may underperform more complex models</li><li>Large trees are hard to interpret</li><li>Class imbalance affects splits and predictions</li></ul> }} />
      <p className="text-sm text-muted-foreground">Ensembles of trees (random forests, gradient boosting) address several of these — future topics, not covered here.</p>
      <H2>When to use decision trees</H2>
      <ComparisonTable columns={["Guideline"]} rows={[
        { label: "Often useful", cells: ["interpretability matters; rule-like explanations wanted; nonlinear relationships; scaling inconvenient; need a baseline; feature interactions"] },
        { label: "Less suitable", cells: ["stable predictions under small data changes are essential; a very smooth boundary is needed; patterns need a huge tree"] },
      ]} />
      <H2>Common decision tree mistakes</H2>
      <div className="overflow-x-auto rounded-lg border"><table className="w-full min-w-[620px] text-sm"><thead className="bg-muted/50 text-left"><tr><th className="px-3 py-2">Mistake</th><th className="px-3 py-2">Why it is wrong</th><th className="px-3 py-2">Correct mental model</th></tr></thead>
        <tbody>{MISTAKES.map(([m, w, c], i) => <tr key={m} className="border-t"><td className="px-3 py-2 font-medium">{i + 1}. {m}</td><td className="px-3 py-2">{w}</td><td className="px-3 py-2">{c}</td></tr>)}</tbody></table></div>
    </Prose>
  );
}

/* 22 · Experiments */
function Exp({ id, title, setup, change, observe, explain, takeaway, children }: { id: string; title: string; setup: string; change: string; observe: string; explain: string; takeaway: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="mt-10">
      <h2 id={id} className="mb-3 text-xl font-semibold tracking-tight">{title}</h2>
      <dl className="grid gap-2 text-sm sm:grid-cols-2"><div><dt className="font-medium">Initial setup</dt><dd>{setup}</dd></div><div><dt className="font-medium">Parameter to change</dt><dd>{change}</dd></div><div><dt className="font-medium">Observable result</dt><dd>{observe}</dd></div><div><dt className="font-medium">Explanation</dt><dd>{explain}</dd></div></dl>
      {children}
      <Callout kind="intuition" title="Key takeaway">{takeaway}</Callout>
    </section>
  );
}
function Experiments() {
  return (
    <Prose>
      <p>Every result below is computed in your browser. Nothing is recorded.</p>
      <Exp id="exp-a" title="Experiment A · Change the splitting criterion" setup="Parent 20 A / 20 B with two candidate splits." change="Gini ↔ entropy." observe="The preferred split flips." explain="Entropy rewards the perfectly pure child more strongly than Gini." takeaway="Criteria usually agree but can choose different splits."><SplitComparison initial="Criteria disagree" /></Exp>
      <Exp id="exp-b" title="Experiment B · Change maximum depth" setup="60 noisy training points." change="max_depth 1 → unrestricted." observe="More rectangles; training accuracy climbs to 100%." explain="Each extra level adds splits that can chase noise." takeaway="Validation performance, not training, should guide depth."><DepthExplorer /></Exp>
      <Exp id="exp-c" title="Experiment C · Change minimum leaf size" setup="Unrestricted tree." change="min_samples_leaf 1 → 15." observe="Leaves shrink in number; tiny noise regions vanish." explain="Splits that would leave fewer samples than the minimum are disallowed." takeaway="Leaf size is a simple, effective growth constraint."><PrePruning only="leaf" /></Exp>
      <Exp id="exp-d" title="Experiment D · Prune the tree" setup="Fully grown tree." change="Pruning strength α." observe="Leaf count and depth fall; validation accuracy changes." explain="Weakest branches are collapsed first (simplified implementation)." takeaway="Pruning trades complexity for simplicity; tune its strength."><PruningExplorer /></Exp>
      <Exp id="exp-e" title="Experiment E · Introduce class imbalance" setup="About 1 in 8 training points is Class B." change="class_weight None ↔ balanced." observe="Recall and false positives change." explain="Weights make minority errors count more in impurity." takeaway="High accuracy can hide poor minority detection."><ImbalanceViz /></Exp>
      <Exp id="exp-f" title="Experiment F · Inspect feature importance" setup="Third feature is random noise." change="max_depth 2 → unrestricted." observe="Noise can receive non-zero importance in deep trees." explain="Deep trees split on whatever helps fit training points." takeaway="Importance describes the fitted model, not the real world."><ImportanceViz /></Exp>
    </Prose>
  );
}

/* 23 · Cheat sheet + concept map */
function Cheat() {
  const items: [string, string][] = [
    ["Core idea", "A sequence of feature-based splits leads to a predicted class."], ["Gini impurity", "Gini = 1 − Σpᵢ²"], ["Entropy", "Entropy = −Σpᵢ log₂(pᵢ)"],
    ["Information gain", "Parent Entropy − Weighted Child Entropy"], ["Gini reduction", "Parent Gini − Weighted Child Gini"], ["Overfitting", "Fitting training-specific patterns that do not generalize."],
    ["Pre-pruning", "Restrict growth during training."], ["Post-pruning", "Simplify a fitted tree (ccp_alpha)."], ["Important parameters", "criterion, max_depth, min_samples_split, min_samples_leaf, max_leaf_nodes, class_weight, ccp_alpha"],
  ];
  const ref: [string, string][] = [
    ["GridSearchCV", "search hyperparameters with cross-validation"], ["Pipeline", "chain preprocessing and model"], ["SimpleImputer", "fill missing values"], ["train_test_split", "hold out a test set"],
    ["confusion_matrix", "TP / TN / FP / FN table"], ["accuracy_score", "share correct"], ["precision_score", "TP / (TP + FP)"], ["recall_score", "TP / (TP + FN)"], ["f1_score", "harmonic mean of P and R"], ["roc_auc_score", "ranking quality from probabilities"],
  ];
  return (
    <Prose>
      <H2>Decision tree cheat sheet</H2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{items.map(([t, d]) => <ConceptCard key={t} title={t}>{d}</ConceptCard>)}</div>
      <H2>Python reference</H2>
      <CodeBlock code={`from sklearn.tree import DecisionTreeClassifier, plot_tree

model = DecisionTreeClassifier(
    criterion="gini",
    max_depth=3,
    min_samples_split=2,
    min_samples_leaf=1,
    random_state=42
)
model.fit(X_train, y_train)
predictions = model.predict(X_test)
probabilities = model.predict_proba(X_test)`} />
      <ComparisonTable columns={["Purpose"]} rows={ref.map(([l, c]) => ({ label: l, cells: [c] }))} />
      <H2>Concept map</H2>
      <div className="grid gap-6 md:grid-cols-2">
        <Flow steps={["Decision Tree", "Training Data", "Root Node", "Candidate Feature Splits", "Splitting Criterion: Gini Impurity | Entropy / Information Gain", "Choose Split", "Child Nodes", "Recursive Splitting", "Stopping Conditions", "Leaf Nodes", "Predicted Class", "Evaluation Metrics"]} />
        <div className="space-y-4">
          <Flow steps={["Tree Depth", "Model Complexity", "Overfitting / Underfitting"]} />
          <Flow steps={["Pruning", "Simpler Tree", "Potential Generalization Improvement"]} />
          <Flow steps={["Validation", "Hyperparameter Selection"]} />
          <Flow steps={["Feature Importance", "Interpretation with Limitations"]} />
        </div>
      </div>
      <Callout kind="intuition" title="The whole process">Training data → candidate splits → impurity calculation → split selection → recursive construction → leaf prediction → evaluation.</Callout>
    </Prose>
  );
}

export const treesContent: Record<string, ComponentType> = {
  "decision-trees": Intro,
  [s("structure")]: Structure,
  [s("explorer")]: Explorer,
  [s("splitting")]: Splitting,
  [s("gini")]: Gini,
  [s("entropy")]: Entropy,
  [s("gini-vs-entropy")]: GiniVsEntropy,
  [s("information-gain")]: InfoGain,
  [s("split-comparison")]: SplitCompare,
  [s("building")]: Building,
  [s("depth")]: Depth,
  [s("overfitting")]: Overfitting,
  [s("pre-pruning")]: PrePrune,
  [s("post-pruning")]: PostPrune,
  [s("feature-importance")]: Importance,
  [s("scikit-learn")]: Sklearn,
  [s("evaluation")]: Evaluation,
  [s("tuning")]: Tuning,
  [s("imbalance")]: Imbalance,
  [s("missing-values")]: Missing,
  [s("advantages-limitations")]: AdvLim,
  [s("experiments")]: Experiments,
  [s("cheat-sheet")]: Cheat,
};
