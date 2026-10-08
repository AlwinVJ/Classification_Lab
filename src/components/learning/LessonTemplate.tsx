import { CodeBlock, DefinitionBlock, ExampleBlock, FormulaBlock, Callout, VisualizationContainer } from "./blocks";
import { LessonShell, H2 } from "./LessonShell";

const P = () => <p className="text-muted-foreground">Content for this section is coming in a later phase.</p>;

/** Placeholder lesson used until a section's real content is written. */
export function LessonTemplate({ section, slug }: { section: string; slug: string }) {
  return (
    <LessonShell section={section} slug={slug}>
      <H2>Definition</H2>
      <DefinitionBlock>A short, precise definition will appear here.</DefinitionBlock>
      <H2>Why it matters</H2><P />
      <H2>Core intuition</H2><P />
      <H2>Mathematical intuition</H2>
      <FormulaBlock tex="\hat{y} = f(\mathbf{x})" variables={[{ symbol: "\\mathbf{x}", meaning: "input features" }, { symbol: "\\hat{y}", meaning: "predicted class" }]} caption="Placeholder equation" />
      <H2>Visual explanation</H2>
      <VisualizationContainer title="Visualization" />
      <H2>Practical example</H2>
      <ExampleBlock>A concrete, real-world example will appear here.</ExampleBlock>
      <H2>Python implementation</H2>
      <CodeBlock code={`from sklearn.linear_model import LogisticRegression\n\nmodel = LogisticRegression()\nmodel.fit(X_train, y_train)`} />
      <H2>Advantages</H2><P />
      <H2>Limitations</H2><P />
      <H2>When to use it</H2>
      <Callout kind="note">Common mistakes and important distinctions will be highlighted like this.</Callout>
      <H2>Related concepts</H2><P />
    </LessonShell>
  );
}
