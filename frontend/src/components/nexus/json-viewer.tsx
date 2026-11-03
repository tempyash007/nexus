import { Fragment, type ReactNode } from "react";

import { cn } from "@/lib/utils";

const TOKEN =
  /("(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(?:true|false)\b|\bnull\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|[{}[\],])/g;

function highlight(json: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let key = 0;
  for (const match of json.matchAll(TOKEN)) {
    const [token] = match;
    const index = match.index ?? 0;
    if (index > last) out.push(json.slice(last, index));
    let cls = "text-syntax-number";
    if (token.startsWith('"')) cls = match[2] ? "text-syntax-key" : "text-syntax-string";
    else if (token === "true" || token === "false") cls = "text-syntax-boolean";
    else if (token === "null") cls = "text-syntax-null";
    else if (/^[{}[\],]$/.test(token)) cls = "text-syntax-punct";

    if (match[2]) {
      const keyText = token.slice(0, token.length - match[2].length);
      out.push(
        <Fragment key={key++}>
          <span className={cls}>{keyText}</span>
          <span className="text-syntax-punct">{match[2]}</span>
        </Fragment>,
      );
    } else {
      out.push(
        <span key={key++} className={cls}>
          {token}
        </span>,
      );
    }
    last = index + token.length;
  }
  if (last < json.length) out.push(json.slice(last));
  return out;
}

export function CodeBlock({
  children,
  className,
  wrap = false,
}: {
  children: ReactNode;
  className?: string | undefined;
  wrap?: boolean;
}) {
  return (
    <pre
      className={cn(
        "max-h-[60vh] overflow-auto rounded-md border bg-code p-4 font-mono text-[12.5px] leading-relaxed text-foreground/90",
        wrap ? "whitespace-pre-wrap break-all" : "whitespace-pre",
        className,
      )}
    >
      {children}
    </pre>
  );
}

export function JsonViewer({ json, className }: { json: string; className?: string | undefined }) {
  return <CodeBlock className={className}>{highlight(json)}</CodeBlock>;
}
