import { createFileRoute } from "@tanstack/react-router";

const d = "Further reading and references for learning classification.";
const links = [
  { t: "scikit-learn: Supervised learning", u: "https://scikit-learn.org/stable/supervised_learning.html" },
  { t: "scikit-learn: Model evaluation", u: "https://scikit-learn.org/stable/modules/model_evaluation.html" },
  { t: "Google ML Crash Course: Classification", u: "https://developers.google.com/machine-learning/crash-course/classification" },
];

export const Route = createFileRoute("/resources")({
  head: () => ({
    meta: [
      { title: "Resources — Classification Lab" },
      { name: "description", content: d },
      { property: "og:title", content: "Resources — Classification Lab" },
      { property: "og:description", content: d },
    ],
  }),
  component: () => (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Resources</h1>
      <p className="mt-3 text-lg text-muted-foreground">{d}</p>
      <ul className="mt-8 divide-y rounded-lg border">
        {links.map((l) => (
          <li key={l.u}>
            <a href={l.u} target="_blank" rel="noreferrer" className="block px-4 py-3 hover:bg-muted/50">
              <span className="font-medium">{l.t}</span>
              <span className="block font-mono text-xs text-muted-foreground">{new URL(l.u).hostname}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  ),
});
