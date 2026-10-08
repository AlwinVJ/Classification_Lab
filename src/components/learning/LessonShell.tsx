import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { getLesson } from "@/lib/curriculum";
import { DocsLayout } from "@/components/layout/DocsLayout";

export const H2 = ({ children }: { children: string }) => (
  <h2 id={children.toLowerCase().replace(/[^a-z0-9]+/g, "-")} className="mt-10 mb-3 scroll-mt-20 text-xl font-semibold tracking-tight">{children}</h2>
);
export const H3 = ({ children }: { children: ReactNode }) => <h3 className="mt-6 mb-2 font-semibold">{children}</h3>;
export const Prose = ({ children }: { children: ReactNode }) => <div className="space-y-4 text-[15.5px] leading-relaxed [&_strong]:font-semibold">{children}</div>;

/** Wraps any lesson: title block, content, and stateless prev/next navigation. */
export function LessonShell({ section, slug, children }: { section: string; slug: string; children: ReactNode }) {
  const { lesson, prev, next } = getLesson(section, slug)!;
  return (
    <DocsLayout>
      <article className="max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-wider text-primary">{lesson.section.title}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{lesson.title}</h1>
        <p className="mt-3 text-lg text-muted-foreground">{lesson.summary}</p>
        <div className="mt-8">{children}</div>
        <nav aria-label="Lesson navigation" className="mt-12 grid gap-3 border-t pt-6 sm:grid-cols-2">
          {prev ? (
            <Link to={`/${prev.section.id}/${prev.slug}` as "/"} className="rounded-lg border p-4 hover:border-primary/50">
              <span className="flex items-center gap-1 text-xs text-muted-foreground"><ArrowLeft className="h-3 w-3" /> Previous concept</span>
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
