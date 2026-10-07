import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { ConceptCard, InlineMath } from "@/components/learning/blocks";

const desc = "A beginner-friendly guide to classification algorithms, evaluation metrics, mathematical intuition, and practical machine learning workflows.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Classification Lab — A visual guide to ML classification" },
      { name: "description", content: desc },
      { property: "og:title", content: "Classification Lab — A visual guide to ML classification" },
      { property: "og:description", content: desc },
    ],
  }),
  component: Index,
});

const areas = [
  { to: "/classification", title: "Classification Fundamentals", body: "Understand what classification is, binary vs multiclass classification, decision boundaries, probabilities, and thresholds." },
  { to: "/evaluation", title: "Model Evaluation", body: "Understand confusion matrices, accuracy, precision, recall, F1-score, ROC-AUC, and precision-recall trade-offs." },
  { to: "/algorithms", title: "Classification Algorithms", body: "Explore Logistic Regression, KNN, Decision Trees, and Support Vector Machines." },
  { to: "/compare", title: "Model Comparison", body: "Understand how and why different algorithms behave differently on the same dataset." },
] as const;

function Index() {
  return (
    <div className="mx-auto max-w-6xl px-4">
      <section className="grid items-center gap-10 py-16 md:grid-cols-[1.3fr_1fr] md:py-24">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-primary">A visual and practical guide</p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
            Understand Classification.<br />Visually. Practically.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">{desc}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/classification" className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              Start with Classification <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/algorithms" className="inline-flex items-center rounded-md border px-4 py-2.5 text-sm font-medium hover:bg-accent">
              Explore Algorithms
            </Link>
          </div>
        </div>
        <div className="grid-bg relative aspect-square rounded-xl border p-6" aria-hidden>
          <svg viewBox="0 0 100 100" className="h-full w-full">
            <line x1="8" y1="88" x2="92" y2="14" className="stroke-primary" strokeWidth="0.8" strokeDasharray="2 1.5" />
            {[[20,30],[28,18],[35,40],[15,50],[42,24],[30,55],[50,15]].map(([x,y],i)=>(<circle key={i} cx={x} cy={y} r="2.6" className="fill-positive" />))}
            {[[60,70],[72,58],[80,80],[55,85],[85,45],[68,88],[75,35]].map(([x,y],i)=>(<rect key={i} x={x!-2.4} y={y!-2.4} width="4.8" height="4.8" className="fill-negative" />))}
          </svg>
          <div className="absolute bottom-3 left-4 rounded bg-background/90 px-2 py-1 text-xs"><InlineMath tex="\sigma(z)=\frac{1}{1+e^{-z}}" /></div>
        </div>
      </section>
      <section className="pb-20">
        <h2 className="mb-6 font-mono text-xs uppercase tracking-wider text-muted-foreground">What you'll explore</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {areas.map((a) => (
            <Link key={a.to} to={a.to}>
              <ConceptCard title={a.title} footer={<span className="inline-flex items-center gap-1 text-sm text-primary">Open <ArrowRight className="h-3 w-3" /></span>}>{a.body}</ConceptCard>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
