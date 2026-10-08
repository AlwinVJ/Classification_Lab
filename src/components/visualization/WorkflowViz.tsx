import { useState } from "react";
import { cn } from "@/lib/utils";

export const WORKFLOW = [
  ["Problem definition", "Decide exactly what to predict and why. Example: “Will this customer cancel next month?”"],
  ["Collect labeled data", "Gather past examples where the answer (the label) is already known."],
  ["Explore data", "Look at distributions, missing values and class balance before modelling."],
  ["Prepare features", "Clean, encode and scale the input variables so a model can use them."],
  ["Split data", "Hold back a test set so you can later check performance on unseen data."],
  ["Train model", "The model learns the relationship between features and labels from the training set."],
  ["Generate predictions", "Use the trained model to produce scores, probabilities or classes for new rows."],
  ["Evaluate model", "Compare predictions against true test labels to measure quality."],
  ["Tune / improve", "Adjust features, thresholds or settings and evaluate again."],
  ["Deploy", "Put the model where it makes real decisions — an app, a pipeline, an API."],
  ["Monitor", "Watch for data drift and falling performance; retrain when needed."],
] as const;

export function WorkflowViz() {
  const [i, setI] = useState(0);
  return (
    <figure className="my-6 overflow-hidden rounded-lg border">
      <figcaption className="border-b bg-muted/40 px-4 py-2 font-mono text-xs text-muted-foreground">Interactive · Select a stage</figcaption>
      <div className="grid gap-4 p-4 sm:p-6 md:grid-cols-[240px_1fr]">
        <ol className="space-y-1">
          {WORKFLOW.map(([name], k) => (
            <li key={name}>
              <button
                onClick={() => setI(k)}
                aria-pressed={i === k}
                className={cn("flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm focus-visible:outline-2 focus-visible:outline-ring", i === k ? "bg-primary/10 font-medium text-primary" : "hover:bg-muted")}
              >
                <span className="font-mono text-xs text-muted-foreground">{String(k + 1).padStart(2, "0")}</span>{name}
              </button>
            </li>
          ))}
        </ol>
        <div className="rounded-md border bg-card p-5" aria-live="polite">
          <p className="font-mono text-xs text-muted-foreground">Stage {i + 1} of {WORKFLOW.length}</p>
          <p className="mt-1 text-lg font-semibold">{WORKFLOW[i]![0]}</p>
          <p className="mt-2 leading-relaxed">{WORKFLOW[i]![1]}</p>
          <div className="mt-5 flex gap-2">
            <button disabled={i === 0} onClick={() => setI(i - 1)} className="rounded-md border px-3 py-1.5 text-sm disabled:opacity-40">← Back</button>
            <button disabled={i === WORKFLOW.length - 1} onClick={() => setI(i + 1)} className="rounded-md border px-3 py-1.5 text-sm disabled:opacity-40">Next stage →</button>
          </div>
        </div>
      </div>
    </figure>
  );
}
