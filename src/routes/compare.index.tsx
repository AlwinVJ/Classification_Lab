import { createFileRoute, Link } from '@tanstack/react-router';
import { DocsLayout } from '@/components/layout/DocsLayout';
import { ConceptCard } from '@/components/learning/blocks';
import { sectionHead } from '@/components/learning/SectionOverview';
import { getSection } from '@/lib/curriculum';

export const Route = createFileRoute('/compare/')({ head: () => sectionHead('compare'), component: CompareOverview });

function CompareOverview() {
  const section = getSection('compare');
  if (!section) return null;
  return <DocsLayout><p className="font-mono text-xs uppercase tracking-wider text-primary">Phase 7 · Compare</p><h1 className="mt-2 text-3xl font-semibold">{section.title}</h1><p className="mt-3 text-lg text-muted-foreground">{section.blurb}</p><div className="mt-8 grid gap-4 sm:grid-cols-2">{section.lessons.map((l, i) => <Link key={l.slug} to="/compare/$slug" params={{ slug: l.slug }}><ConceptCard title={`${String(i + 1).padStart(2, '0')} · ${l.title}`}>{l.summary}</ConceptCard></Link>)}</div></DocsLayout>;
}