import { ArrowDown } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Vertical flow: boxes joined by arrows. */
export function Flow({ steps, className }: { steps: ReactNode[]; className?: string }) {
  return (
    <div className={cn("my-6 flex flex-col items-center", className)} role="list">
      {steps.map((s, i) => (
        <div key={i} className="flex flex-col items-center" role="listitem">
          {i > 0 && <ArrowDown className="my-1 h-4 w-4 text-muted-foreground" aria-hidden />}
          <div className={cn("rounded-md border bg-card px-4 py-2 text-center text-sm", i === steps.length - 1 && "border-primary/60 font-medium text-primary")}>{s}</div>
        </div>
      ))}
    </div>
  );
}

/** Side-by-side panels for "A vs B" distinctions. */
export function Split({ left, right }: { left: { title: string; body: ReactNode }; right: { title: string; body: ReactNode } }) {
  return (
    <div className="my-6 grid gap-4 sm:grid-cols-2">
      {[left, right].map((p) => (
        <div key={p.title} className="rounded-lg border bg-card p-4">
          <p className="mb-2 font-mono text-xs uppercase tracking-wider text-primary">{p.title}</p>
          <div className="text-sm leading-relaxed">{p.body}</div>
        </div>
      ))}
    </div>
  );
}

export function Chip({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "pos" | "neg" | "primary" }) {
  const t = { neutral: "bg-muted text-foreground", pos: "bg-positive/15 text-positive", neg: "bg-negative/15 text-negative", primary: "bg-primary/10 text-primary" }[tone];
  return <span className={cn("inline-block rounded px-2 py-0.5 font-mono text-xs", t)}>{children}</span>;
}
