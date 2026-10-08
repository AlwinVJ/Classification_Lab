import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { getSection } from "@/lib/curriculum";
import { DocsLayout } from "@/components/layout/DocsLayout";
import { ConceptCard } from "@/components/learning/blocks";

const desc = "Learn how machine learning models assign observations to categories.";
export const Route = createFileRoute("/classification/")({
  head: () => ({
    meta: [
      { title: "Introduction to Classification — Classification Lab" },
      { name: "description", content: desc },
      { property: "og:title", content: "Introduction to Classification — Classification Lab" },
      { property: "og:description", content: desc },
    ],
  }),
  component: ClassificationLanding,
});

function ClassificationLanding() {
  const s = getSection("classification")!;
  return (
    <DocsLayout>
      <p className="font-mono text-xs uppercase tracking-wider text-primary">Classification fundamentals</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Introduction to Classification</h1>
      <p className="mt-3 text-lg text-muted-foreground">{desc}</p>
      <p className="mt-4 max-w-2xl leading-relaxed">
        Classification is a supervised machine learning task where a model learns from labeled examples to predict one or more categories for new observations.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link to={"/classification/introduction" as "/"} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          Start Learning <ArrowRight className="h-4 w-4" />
        </Link>
        <Link to={"/classification/workflow" as "/"} className="inline-flex items-center rounded-md border px-4 py-2.5 text-sm font-medium hover:bg-accent">
          View Classification Workflow
        </Link>
      </div>
      <h2 className="mt-12 mb-4 font-mono text-xs uppercase tracking-wider text-muted-foreground">In this section</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {s.lessons.map((l, i) => (
          <Link key={l.slug} to={`/classification/${l.slug}` as "/"}>
            <ConceptCard title={`${String(i + 1).padStart(2, "0")} · ${l.title}`}>{l.summary}</ConceptCard>
          </Link>
        ))}
      </div>
    </DocsLayout>
  );
}
