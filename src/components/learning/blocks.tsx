import "katex/dist/katex.min.css";
import katex from "katex";
import { Highlight, themes } from "prism-react-renderer";
import { Check, Copy, Info, AlertTriangle, Lightbulb, BookOpen, BarChart3 } from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ---------- Math ---------- */
export function InlineMath({ tex }: { tex: string }) {
  return <span dangerouslySetInnerHTML={{ __html: katex.renderToString(tex, { throwOnError: false }) }} />;
}

export function FormulaBlock({ tex, caption, variables }: { tex: string; caption?: string; variables?: { symbol: string; meaning: string }[] }) {
  return (
    <figure className="my-6 rounded-lg border bg-muted/40 p-5">
      <div className="overflow-x-auto text-center" dangerouslySetInnerHTML={{ __html: katex.renderToString(tex, { displayMode: true, throwOnError: false }) }} />
      {variables && (
        <dl className="mt-4 grid gap-1 border-t pt-3 text-sm sm:grid-cols-2">
          {variables.map((v) => (
            <div key={v.symbol} className="flex gap-3">
              <dt className="w-10 shrink-0"><InlineMath tex={v.symbol} /></dt>
              <dd className="text-muted-foreground">{v.meaning}</dd>
            </div>
          ))}
        </dl>
      )}
      {caption && <figcaption className="mt-3 text-center text-xs text-muted-foreground">{caption}</figcaption>}
    </figure>
  );
}

/* ---------- Code ---------- */
export function CodeBlock({ code, language = "python" }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="group relative my-6 overflow-hidden rounded-lg border bg-code">
      <div className="flex items-center justify-between border-b px-4 py-1.5 font-mono text-xs text-muted-foreground">
        {language}
        <button
          onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
          className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 hover:text-foreground"
          aria-label="Copy code"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <Highlight code={code.trim()} language={language} theme={themes.vsDark}>
        {({ tokens, getLineProps, getTokenProps }) => (
          <pre className="code-pre overflow-x-auto p-4 font-mono text-[13px] leading-relaxed">
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })}>
                {line.map((token, k) => <span key={k} {...getTokenProps({ token })} />)}
              </div>
            ))}
          </pre>
        )}
      </Highlight>
    </div>
  );
}

/* ---------- Content blocks ---------- */
const kinds = {
  definition: { icon: BookOpen, label: "Definition", cls: "border-l-primary" },
  intuition: { icon: Lightbulb, label: "Intuition", cls: "border-l-secondary-accent" },
  example: { icon: Info, label: "Example", cls: "border-l-muted-foreground" },
  note: { icon: AlertTriangle, label: "Important", cls: "border-l-warning" },
} as const;

export function Callout({ kind, title, children }: { kind: keyof typeof kinds; title?: string; children: ReactNode }) {
  const k = kinds[kind];
  const Icon = k.icon;
  return (
    <div className={cn("my-5 rounded-r-lg border border-l-4 bg-card p-4", k.cls)}>
      <p className="mb-1 flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {title ?? k.label}
      </p>
      <div className="text-[15px] leading-relaxed">{children}</div>
    </div>
  );
}
export const DefinitionBlock = (p: { title?: string; children: ReactNode }) => <Callout kind="definition" {...p} />;
export const ExampleBlock = (p: { title?: string; children: ReactNode }) => <Callout kind="example" {...p} />;

/** Simple explanation → technical definition → example */
export function TermBlock({ term, simple, technical, example }: { term: string; simple: ReactNode; technical: ReactNode; example: ReactNode }) {
  return (
    <div className="my-6 rounded-lg border">
      <p className="border-b px-4 py-2 font-semibold">{term}</p>
      <div className="divide-y text-[15px]">
        <p className="px-4 py-3"><span className="mr-2 font-mono text-xs text-muted-foreground">SIMPLE</span>{simple}</p>
        <p className="px-4 py-3"><span className="mr-2 font-mono text-xs text-muted-foreground">TECHNICAL</span>{technical}</p>
        <p className="px-4 py-3"><span className="mr-2 font-mono text-xs text-muted-foreground">EXAMPLE</span>{example}</p>
      </div>
    </div>
  );
}

/* ---------- Comparison ---------- */
export function ComparisonTable({ columns, rows, highlight = [] }: { columns: string[]; rows: { label: string; cells: string[] }[]; highlight?: [number, number][] }) {
  const isHi = (r: number, c: number) => highlight.some(([hr, hc]) => hr === r && hc === c);
  return (
    <div className="my-6 overflow-x-auto rounded-lg border">
      <table className="w-full min-w-[560px] text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-3 py-2 text-left font-medium text-muted-foreground"></th>
            {columns.map((c) => <th key={c} className="px-3 py-2 text-left font-semibold">{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={row.label} className="border-t">
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">{row.label}</th>
              {row.cells.map((cell, c) => (
                <td key={c} className={cn("px-3 py-2", isHi(r, c) && "bg-primary/10 font-medium text-primary")}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- Visualization placeholder ---------- */
export function VisualizationContainer({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <figure className="my-6 overflow-hidden rounded-lg border">
      <figcaption className="border-b bg-muted/40 px-4 py-2 font-mono text-xs text-muted-foreground">{title}</figcaption>
      <div className="grid-bg grid min-h-56 place-items-center p-6">
        {children ?? (
          <div className="text-center">
            <BarChart3 className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
            <p className="text-sm font-medium">Interactive visualization</p>
            <p className="text-xs text-muted-foreground">Coming in the next learning section</p>
          </div>
        )}
      </div>
    </figure>
  );
}

export function ConceptCard({ title, children, footer }: { title: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="flex h-full flex-col rounded-lg border bg-card p-5 transition-colors hover:border-primary/50">
      <h3 className="mb-2 font-semibold">{title}</h3>
      <div className="flex-1 text-sm leading-relaxed text-muted-foreground">{children}</div>
      {footer && <div className="mt-4">{footer}</div>}
    </div>
  );
}
