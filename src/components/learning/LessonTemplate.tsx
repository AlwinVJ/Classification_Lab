import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getLesson } from "@/lib/curriculum";
import { DocsLayout } from "@/components/layout/DocsLayout";
import { CodeBlock, DefinitionBlock, ExampleBlock, FormulaBlock, Callout, VisualizationContainer } from "./blocks";

const H = ({ children }: { children: string }) => (
  <h2 id={children.toLowerCase().replace(/\s+/g, "-")} className="mt-10 mb-3 scroll-mt-20 text-xl font-semibold tracking-tight">{children}</h2>
);
const P = () => <p className="text-muted-foreground">Content for this section is coming in a later phase.</p>;

export function LessonTemplate({ section, slug }: { section: string; slug: string }) {
  const data = getLesson(section, slug)!;
  const { lesson, prev, next } = data;
  return (
    <DocsLayout>
      <article className="max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-wider text-primary">{lesson.section.title}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{lesson.title}</h1>
        <p className="mt-3 text-lg text-muted-foreground">{lesson.summary}</p>

        <H>Definition</H>
        <DefinitionBlock>A short, precise definition of {lesson.title.toLowerCase()} will appear here.</DefinitionBlock>
        <H>Why it matters</H><P />
        <H>Core intuition</H><P />
        <H>Mathematical intuition</H>
        <FormulaBlock tex="\hat{y} = f(\mathbf{x})" variables={[{ symbol: "\\mathbf{x}", meaning: "input features" }, { symbol: "\\hat{y}", meaning: "predicted class" }]} caption="Placeholder equation" />
        <H>Visual explanation</H>
        <VisualizationContainer title={`${lesson.title} — visualization`} />
        <H>Practical example</H>
        <ExampleBlock>A concrete, real-world example will appear here.</ExampleBlock>
        <H>Python implementation</H>
        <CodeBlock code={`from sklearn.linear_model import LogisticRegression\n\nmodel = LogisticRegression()\nmodel.fit(X_train, y_train)`} />
        <H>Advantages</H><P />
        <H>Limitations</H><P />
        <H>When to use it</H>
        <Callout kind="note">Common mistakes and important distinctions will be highlighted like this.</Callout>
        <H>Related concepts</H><P />

        <nav className="mt-12 grid gap-3 border-t pt-6 sm:grid-cols-2">
          {prev ? (
            <Link to={`/${prev.section.id}/${prev.slug}` as "/"} className="rounded-lg border p-4 hover:border-primary/50">
              <span className="flex items-center gap-1 text-xs text-muted-foreground"><ArrowLeft className="h-3 w-3" /> Previous</span>
              <span className="font-medium">{prev.title}</span>
            </Link>
          ) : <span />}
          {next && (
            <Link to={`/${next.section.id}/${next.slug}` as "/"} className="rounded-lg border p-4 text-right hover:border-primary/50">
              <span className="flex items-center justify-end gap-1 text-xs text-muted-foreground">Next concept <ArrowRight className="h-3 w-3" /></span>
              <span className="font-medium">{next.title}</span>
            </Link>
          )}
        </nav>
      </article>
    </DocsLayout>
  );
}
