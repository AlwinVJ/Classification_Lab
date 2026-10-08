import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Callout, ComparisonTable, ConceptCard, DefinitionBlock, ExampleBlock, InlineMath, TermBlock, FormulaBlock } from "@/components/learning/blocks";
import { H2, Prose } from "@/components/learning/LessonShell";
import { Chip, Flow, Split } from "@/components/visualization/diagrams";
import { ThresholdViz } from "@/components/visualization/ThresholdViz";
import { BoundaryViz } from "@/components/visualization/BoundaryViz";
import { WorkflowViz } from "@/components/visualization/WorkflowViz";

/* ---------------- Lessons ---------------- */

function Introduction() {
  return (
    <Prose>
      <p>Imagine sorting your mail into two piles: <em>important</em> and <em>junk</em>. You glance at the sender, the subject and a few words, then decide. A classification model does the same thing — automatically and at scale.</p>
      <DefinitionBlock title="Classification">Classification is a <strong>supervised learning</strong> task: a model learns from examples whose correct category is already known, then predicts the category for new examples.</DefinitionBlock>
      <p><strong>Supervised</strong> simply means the training data comes with answers. The model studies many “question + answer” pairs until it can answer new questions on its own.</p>
      <Flow steps={["Input features", "Trained model", "Predicted class"]} />
      <H2>Example: spam detection</H2>
      <p>An email has measurable properties. The model looks at them and outputs one of two categories.</p>
      <Flow steps={[
        <span className="block text-left">Email features<br /><span className="font-mono text-xs text-muted-foreground">├ number of links<br />├ sender information<br />├ message length<br />└ certain words</span></span>,
        "Classification model",
        <span><Chip tone="neg">Spam</Chip> / <Chip tone="pos">Not spam</Chip></span>,
      ]} />
      <p>The model was never given a rule like “more than 5 links means spam”. Instead it saw thousands of historical emails that people had already labeled, and <strong>learned the relationship between the features and the known labels</strong>.</p>
      <Callout kind="note">A model can only learn patterns that exist in its training examples. If the historical labels are wrong or biased, the predictions will be too.</Callout>
      <H2>Where classification is used</H2>
      <Applications />
    </Prose>
  );
}

function VsRegression() {
  return (
    <Prose>
      <p>Both regression and classification are supervised learning. The difference is the <strong>kind of answer</strong> they produce.</p>
      <Split
        left={{ title: "Regression", body: <><p className="mb-3">Predicts a <strong>continuous number</strong>.</p><Flow className="my-2" steps={["House features", "Regression model", "₹52,00,000"]} /></> }}
        right={{ title: "Classification", body: <><p className="mb-3">Predicts a <strong>category</strong>.</p><Flow className="my-2" steps={["Customer features", "Classification model", "High risk / Low risk"]} /></> }}
      />
      <ComparisonTable
        columns={["Regression", "Classification"]}
        rows={[
          { label: "Output", cells: ["Continuous value", "Class / category"] },
          { label: "Example task", cells: ["House price", "Spam detection"] },
          { label: "Output example", cells: ["₹52 lakh", "Spam"] },
          { label: "Typical objective", cells: ["Predict magnitude", "Predict category"] },
        ]}
        highlight={[[0, 1]]}
      />
      <p>A quick test: ask whether the answer could sensibly be “halfway between” two values. A price of ₹51.5 lakh makes sense; “halfway between spam and not spam” does not.</p>
      <Callout kind="note">Many classifiers compute a number first — a score or probability such as 0.82 — and only then turn it into a class. That number does not make the task regression; the final answer is still a category. See <Link to={"/classification/scores-probabilities" as "/"} className="text-primary underline">Scores &amp; Probabilities</Link>.</Callout>
    </Prose>
  );
}

function FeaturesLabels() {
  const rows = [["25", "40,000", "2 years", "No churn"], ["42", "75,000", "5 years", "Churn"], ["31", "55,000", "3 years", "No churn"]];
  return (
    <Prose>
      <p>Every classification dataset is a table. Some columns describe each example; one column holds the answer we want to predict.</p>
      <TermBlock term="Feature" simple="A piece of information the model looks at." technical="An input variable used by the model to make a prediction." example="Age, income, tenure, number of purchases." />
      <TermBlock term="Label" simple="The answer the model is trying to learn." technical="The known target category that the model is trained to predict." example="Whether the customer churned." />
      <figure className="my-6 overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[420px] text-sm">
          <thead>
            <tr className="font-mono text-xs uppercase tracking-wider">
              <th colSpan={3} className="bg-primary/10 px-3 py-2 text-left text-primary">Features (inputs)</th>
              <th className="bg-secondary-accent/15 px-3 py-2 text-left text-secondary-accent">Label (target)</th>
            </tr>
            <tr className="border-t text-left text-muted-foreground"><th className="px-3 py-2 font-medium">Age</th><th className="px-3 py-2 font-medium">Income</th><th className="px-3 py-2 font-medium">Tenure</th><th className="border-l-2 border-secondary-accent px-3 py-2 font-medium">Churn?</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r[0]} className="border-t">
                {r.slice(0, 3).map((c, i) => <td key={i} className="px-3 py-2 font-mono">{c}</td>)}
                <td className="border-l-2 border-secondary-accent px-3 py-2 font-medium">{r[3]}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <figcaption className="border-t px-3 py-2 text-xs text-muted-foreground">During training the model sees both. When predicting for a new customer, it sees only the features.</figcaption>
      </figure>
      <H2>Classes</H2>
      <TermBlock term="Class" simple="One of the possible answers." technical="One possible category that the model can predict." example="For spam detection the classes are Spam and Not spam; for an animal classifier, Cat, Dog and Horse." />
      <Flow steps={["Classification problem", "Set of possible classes", "Model predicts one or more classes"]} />
      <p>The label column of a dataset contains class values. “Label” refers to the answer attached to a specific example; “class” refers to the category itself.</p>
      <H2>Feature space</H2>
      <p>If each example has two features, you can plot it as a point with coordinates <InlineMath tex="(x_1, x_2)" />. With <InlineMath tex="n" /> features each example becomes a point in an <InlineMath tex="n" />-dimensional <strong>feature space</strong>:</p>
      <FormulaBlock tex="\mathbf{x} = (x_1, x_2, \dots, x_n)" variables={[{ symbol: "x_1", meaning: "value of feature 1 (e.g. age)" }, { symbol: "n", meaning: "number of features" }]} />
      <p>This idea returns when we discuss <Link to={"/classification/decision-boundaries" as "/"} className="text-primary underline">decision boundaries</Link>.</p>
    </Prose>
  );
}

function Binary() {
  return (
    <Prose>
      <DefinitionBlock title="Binary classification">A classification problem with <strong>exactly two</strong> possible classes.</DefinitionBlock>
      <div className="flex flex-wrap gap-2">
        {["Spam / Not spam", "Fraud / Legitimate", "Churn / No churn", "Pass / Fail", "Defective / Non-defective"].map((e) => <Chip key={e}>{e}</Chip>)}
      </div>
      <H2>Encoding classes as 0 and 1</H2>
      <p>Software usually stores the two classes as numbers. One class is called the <strong>positive class</strong> (<code className="font-mono">1</code>) — normally the thing we are looking for — and the other the <strong>negative class</strong> (<code className="font-mono">0</code>).</p>
      <ComparisonTable columns={["Class", "Encoded as"]} rows={[{ label: "Fraud", cells: ["Positive class", "1"] }, { label: "Legitimate", cells: ["Negative class", "0"] }]} />
      <Callout kind="note">0 and 1 are <strong>names</strong>, not quantities. Fraud is not “one more” than legitimate, and averaging labels does not produce a meaningful class. “Positive” doesn't mean “good” either — it is just the class of interest.</Callout>
      <ExampleBlock>A bank flags transactions. Each one is either fraud (1) or legitimate (0); the model never outputs “0.5 of a fraud” as a final answer.</ExampleBlock>
    </Prose>
  );
}

function Multiclass() {
  return (
    <Prose>
      <DefinitionBlock title="Multiclass classification">More than two possible classes, where each observation normally receives <strong>exactly one</strong> class.</DefinitionBlock>
      <div className="my-6 rounded-lg border bg-card p-5 text-center text-sm">
        <div className="mx-auto w-fit rounded-md border px-4 py-2">Photo</div>
        <div className="my-1 text-muted-foreground">↓</div>
        <div className="mx-auto w-fit rounded-md border px-4 py-2 font-medium">Animal classifier</div>
        <div className="my-1 text-muted-foreground">↓</div>
        <div className="flex justify-center gap-3">
          <span className="rounded-md border px-4 py-2">Cat</span>
          <span className="rounded-md border-2 border-primary px-4 py-2 font-medium text-primary">Dog ✓</span>
          <span className="rounded-md border px-4 py-2">Horse</span>
        </div>
      </div>
      <p>The model weighs several options and picks one. Other examples: recognizing handwritten digits 0–9, assigning a support ticket to a department, or classifying a news article's topic.</p>
      <Callout kind="note">Multiclass is still “one answer per example”. If an example can belong to several categories at once, that's <Link to={"/classification/multilabel" as "/"} className="text-primary underline">multilabel</Link> classification.</Callout>
    </Prose>
  );
}

function Multilabel() {
  return (
    <Prose>
      <DefinitionBlock title="Multilabel classification">Each observation can receive <strong>one or more</strong> labels at the same time.</DefinitionBlock>
      <Split
        left={{ title: "Multiclass — one class", body: <p className="font-mono">Image → <Chip tone="primary">Dog</Chip></p> }}
        right={{ title: "Multilabel — several labels", body: <p className="font-mono">Image → <Chip tone="primary">Dog</Chip> <Chip tone="primary">Animal</Chip> <Chip tone="primary">Outdoor</Chip></p> }}
      />
      <ComparisonTable
        columns={["Multiclass", "Multilabel"]}
        rows={[
          { label: "Possible labels", cells: ["Multiple", "Multiple"] },
          { label: "Labels per sample", cells: ["Usually one", "One or more"] },
          { label: "Example", cells: ["Cat / Dog / Horse", "Animal / Outdoor / Dog"] },
        ]}
        highlight={[[1, 0], [1, 1]]}
      />
      <Callout kind="note" title="Common confusion">Both types have many possible labels. The question that separates them is: <strong>how many can one example get?</strong> Exactly one → multiclass. Any number → multilabel.</Callout>
      <ExampleBlock>A movie can be tagged <em>Comedy</em>, <em>Romance</em> and <em>Drama</em> simultaneously — a classic multilabel problem.</ExampleBlock>
    </Prose>
  );
}

function ScoresProbabilities() {
  return (
    <Prose>
      <p>So far we've drawn models as “input → class”. Many models actually take an extra step: they first produce a number expressing how strongly they lean toward a class.</p>
      <Split
        left={{ title: "Direct output", body: <Flow className="my-1" steps={["Input", "Model", "Class"]} /> }}
        right={{ title: "Score first", body: <Flow className="my-1" steps={["Input", "Model", "Score / probability", "Threshold", "Class"]} /> }}
      />
      <H2>Three different outputs</H2>
      <TermBlock term="Score" simple="A number showing how strongly the model favours a class." technical="A raw model output; its scale depends on the model and need not lie between 0 and 1." example="A decision score of 2.3 (higher = more likely positive)." />
      <TermBlock term="Probability" simple="A score expressed on a 0-to-1 scale." technical="A model's estimate of how likely an example belongs to a class." example="Fraud probability = 0.82." />
      <TermBlock term="Class prediction" simple="The final answer." technical="The category assigned after applying a decision rule to the score." example="Prediction = Fraud." />
      <p>Probabilities lie in a fixed range:</p>
      <FormulaBlock tex="0 \le P(\text{fraud} \mid \mathbf{x}) \le 1" variables={[{ symbol: "P(\\cdot \\mid \\mathbf{x})", meaning: "estimated probability given the features" }]} />
      <ExampleBlock>
        <span className="font-mono text-sm">Fraud probability = 0.82 · Threshold = 0.50 · 0.82 ≥ 0.50 → <strong>Prediction = Fraud</strong></span>
      </ExampleBlock>
      <Callout kind="note">A probability and a class prediction are <strong>not the same thing</strong>. 0.51 and 0.99 both become “Fraud”, yet the model is far more confident in one. Also, not every algorithm produces well-calibrated probabilities — some mainly produce decision scores. We'll see this with specific algorithms later.</Callout>
    </Prose>
  );
}

function Threshold() {
  return (
    <Prose>
      <DefinitionBlock title="Classification threshold">The cutoff used to convert a score or probability into a class prediction.</DefinitionBlock>
      <FormulaBlock tex="\hat{y} = \begin{cases} 1 & \text{if } p \ge t \\ 0 & \text{if } p < t \end{cases}" variables={[{ symbol: "p", meaning: "predicted probability" }, { symbol: "t", meaning: "threshold" }, { symbol: "\\hat{y}", meaning: "predicted class" }]} />
      <Split
        left={{ title: "Threshold = 0.50", body: <p className="font-mono">p = 0.82 ≥ 0.50 → <Chip tone="pos">Positive</Chip></p> }}
        right={{ title: "Threshold = 0.85", body: <p className="font-mono">p = 0.82 &lt; 0.85 → <Chip tone="neg">Negative</Chip></p> }}
      />
      <p>The model and its probability are identical in both cases. Only the cutoff moved — and the final classification changed.</p>
      <H2>Try it</H2>
      <p>Each mark below is a transaction with its fraud probability. Drag the threshold and watch predictions flip.</p>
      <ThresholdViz />
      <Flow steps={["Threshold changes", "Predicted classes change", "Classification behaviour changes"]} />
      <Callout kind="intuition" title="Intuition">A <strong>low</strong> threshold flags more cases (catches more fraud, but more false alarms). A <strong>high</strong> threshold flags fewer cases (fewer alarms, but more fraud slips by). 0.50 is a default, not a rule.</Callout>
      <p className="text-sm text-muted-foreground">How to measure these trade-offs precisely is covered in the <Link to="/evaluation" className="text-primary underline">Evaluation</Link> section.</p>
    </Prose>
  );
}

function DecisionBoundaries() {
  return (
    <Prose>
      <p>Recall that with two features each example is a point on a plane. A trained model divides that plane into regions — one region per class.</p>
      <DefinitionBlock title="Decision boundary">The boundary in feature space where the model's predicted class changes. In two dimensions it is a line or curve; in three it is a surface.</DefinitionBlock>
      <Flow steps={["Point on one side → Class A", "Point on the other side → Class B"]} />
      <H2>Try it</H2>
      <p>Shift and tilt the line. Every point above it is predicted Class A; below, Class B. Try to place it so no point is on the wrong side.</p>
      <BoundaryViz />
      <Callout kind="note">This is a hand-drawn line, not a trained model. Real algorithms <em>learn</em> where to place the boundary from data, and many produce curved or jagged boundaries. You'll see each algorithm's boundary in the <Link to="/algorithms" className="text-primary underline">Algorithms</Link> section.</Callout>
      <p>Thresholds and boundaries are connected: the boundary is exactly where the model's score equals the threshold. Change the threshold and the boundary moves.</p>
    </Prose>
  );
}

function Workflow() {
  return (
    <Prose>
      <p>Building a classifier is more than training a model. Here is the typical end-to-end process.</p>
      <WorkflowViz />
      <H2>Train/test split</H2>
      <p>If you judged a student using the exact questions they practised, you'd overestimate their skill. Models are the same, so we keep some data aside.</p>
      <div className="my-6 overflow-hidden rounded-lg border font-mono text-sm" role="img" aria-label="Dataset split: 80% training, 20% test">
        <div className="flex">
          <div className="w-4/5 bg-primary/15 px-4 py-4"><span className="font-semibold text-primary">Training · 80%</span></div>
          <div className="w-1/5 border-l bg-secondary-accent/15 px-3 py-4"><span className="font-semibold text-secondary-accent">Test · 20%</span></div>
        </div>
      </div>
      <Split
        left={{ title: "Training data", body: "Used by the model to learn patterns between features and labels." }}
        right={{ title: "Test data", body: "Hidden during training; used to estimate how well the model performs on unseen data." }}
      />
      <Callout kind="note">Never let test data influence training — that includes choosing features or thresholds based on it. Otherwise your performance estimate becomes overly optimistic.</Callout>
      <H2>Applications</H2>
      <Applications />
      <H2>Concept map</H2>
      <ConceptMap />
      <H2>Glossary</H2>
      <Glossary />
    </Prose>
  );
}

/* ---------------- Shared sections ---------------- */

const APPS = [
  ["Spam detection", "Predict whether an email is spam."],
  ["Fraud detection", "Predict whether a transaction is potentially fraudulent."],
  ["Medical screening", "Flag scans or test results that may need a doctor's review."],
  ["Customer churn", "Predict whether a customer is likely to leave."],
  ["Image recognition", "Identify what object or animal appears in a photo."],
  ["Sentiment analysis", "Classify text as positive, negative, or neutral."],
];
function Applications() {
  return (
    <div className="not-prose grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {APPS.map(([t, d]) => <ConceptCard key={t} title={t!}>{d}</ConceptCard>)}
    </div>
  );
}

function ConceptMap() {
  const branches: [string, string[]][] = [
    ["What are we predicting?", ["Classes"]],
    ["What do we use?", ["Features"]],
    ["How many classes?", ["Binary", "Multiclass", "Multilabel"]],
    ["What does the model produce?", ["Score", "Probability", "Class"]],
    ["How does it separate classes?", ["Decision boundary"]],
  ];
  return (
    <div className="rounded-lg border bg-card p-5">
      <p className="mb-3 font-semibold">Classification</p>
      <ul className="space-y-3 border-l pl-4">
        {branches.map(([q, a]) => (
          <li key={q}>
            <p className="text-sm text-muted-foreground">{q}</p>
            <div className="mt-1 flex flex-wrap gap-1.5">{a.map((x) => <Chip key={x} tone="primary">{x}</Chip>)}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

const TERMS = [
  ["Classification", "Predicting a category from input data.", "Email → Spam"],
  ["Feature", "An input variable the model uses.", "Customer age"],
  ["Label", "The known answer attached to a training example.", "Churned = Yes"],
  ["Class", "One possible category.", "Cat"],
  ["Binary classification", "Exactly two classes.", "Pass / Fail"],
  ["Multiclass classification", "Three or more classes, one per example.", "Cat / Dog / Horse"],
  ["Multilabel classification", "Several labels can apply to one example.", "Dog + Outdoor"],
  ["Prediction", "The model's output for a new example.", "Fraud"],
  ["Score", "A raw number showing how strongly the model favours a class.", "2.3"],
  ["Probability", "A 0-to-1 estimate of class likelihood.", "0.82"],
  ["Threshold", "Cutoff that turns a score into a class.", "0.50"],
  ["Decision boundary", "Where in feature space the predicted class changes.", "A line between two clusters"],
];
function Glossary() {
  return (
    <dl className="divide-y rounded-lg border">
      {TERMS.map(([t, d, e]) => (
        <div key={t} className="grid gap-1 px-4 py-3 sm:grid-cols-[200px_1fr]">
          <dt className="font-semibold">{t}</dt>
          <dd className="text-sm">{d} <span className="text-muted-foreground">e.g. <span className="font-mono">{e}</span></span></dd>
        </div>
      ))}
    </dl>
  );
}

export const classificationContent: Record<string, () => ReactNode> = {
  introduction: Introduction,
  "vs-regression": VsRegression,
  "features-labels": FeaturesLabels,
  binary: Binary,
  multiclass: Multiclass,
  multilabel: Multilabel,
  "scores-probabilities": ScoresProbabilities,
  threshold: Threshold,
  "decision-boundaries": DecisionBoundaries,
  workflow: Workflow,
};

