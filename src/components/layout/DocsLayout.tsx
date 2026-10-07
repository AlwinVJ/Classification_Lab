import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { sections } from "@/lib/curriculum";

export function DocsLayout({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  return (
    <div className="mx-auto flex max-w-6xl gap-10 px-4 py-8">
      <aside className="sticky top-20 hidden h-[calc(100vh-6rem)] w-56 shrink-0 overflow-y-auto md:block">
        {sections.map((s) => (
          <div key={s.id} className="mb-6">
            <Link to={`/${s.id}` as "/classification"} className="mb-2 block font-mono text-xs uppercase tracking-wider text-muted-foreground">
              {s.title}
            </Link>
            <ul className="space-y-0.5 border-l">
              {s.lessons.map((l) => {
                const href = `/${s.id}/${l.slug}`;
                const active = path === href;
                return (
                  <li key={l.slug}>
                    <a
                      href={href}
                      onClick={(e) => { e.preventDefault(); navigate({ to: href }); }}
                      className={`-ml-px block border-l py-1 pl-3 text-sm ${active ? "border-primary font-medium text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                    >
                      {l.title}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </aside>
      <div className="min-w-0 flex-1">
        <label className="mb-6 block md:hidden">
          <span className="sr-only">Jump to topic</span>
          <select
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            value={path}
            onChange={(e) => navigate({ to: e.target.value })}
          >
            {sections.map((s) => (
              <optgroup key={s.id} label={s.title}>
                <option value={`/${s.id}`}>{s.title} overview</option>
                {s.lessons.map((l) => (
                  <option key={l.slug} value={`/${s.id}/${l.slug}`}>{l.title}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        {children}
      </div>
    </div>
  );
}
