import { Link } from "@tanstack/react-router";
import { getSection } from "@/lib/curriculum";
import { DocsLayout } from "@/components/layout/DocsLayout";
import { ConceptCard } from "./blocks";

export function SectionOverview({ id }: { id: string }) {
  const s = getSection(id)!;
  return (
    <DocsLayout>
      <p className="font-mono text-xs uppercase tracking-wider text-primary">Section</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">{s.title}</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted-foreground">{s.blurb}</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {s.lessons.map((l, i) => (
          <Link key={l.slug} to={`/${s.id}/${l.slug}` as "/"}>
            <ConceptCard title={`${String(i + 1).padStart(2, "0")} · ${l.title}`}>{l.summary}</ConceptCard>
          </Link>
        ))}
      </div>
    </DocsLayout>
  );
}

export function sectionHead(id: string) {
  const s = getSection(id)!;
  const title = `${s.title} — Classification Lab`;
  return {
    meta: [
      { title },
      { name: "description", content: s.blurb },
      { property: "og:title", content: title },
      { property: "og:description", content: s.blurb },
    ],
  };
}
