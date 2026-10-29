import { AlertTriangle, FileX2, KeyRound, ListTree, Lock } from "lucide-react";
import { useState, type ReactNode } from "react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  byteLength,
  formatBytes,
  isSensitiveHeader,
  maskHeaderValue,
  parseBody,
  shortContentType,
} from "@/features/webhooks/request-utils";
import { formatTimestamp, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { WebhookRequest } from "@/services/types";
import { WEBHOOK_BASE_URL } from "@/services/endpoint";

import { CopyButton } from "./copy-button";
import { CodeBlock, JsonViewer } from "./json-viewer";
import { MethodBadge } from "./method-badge";
import { EmptyState } from "./states";

type InspectorRequest = WebhookRequest & { inboxName?: string };

export function RequestInspector({
  open,
  onOpenChange,
  request,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: InspectorRequest | undefined;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 border-l bg-background p-0 sm:max-w-2xl"
      >
        {request ? (
          <InspectorBody key={request.id} request={request} />
        ) : (
          <div className="flex flex-1 items-center p-6">
            <SheetHeader className="sr-only">
              <SheetTitle>Request not found</SheetTitle>
              <SheetDescription>This request no longer exists.</SheetDescription>
            </SheetHeader>
            <EmptyState
              icon={FileX2}
              title="Request not found"
              description="It may have been cleared from this inbox's history."
              className="w-full"
            />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function InspectorBody({ request }: { request: InspectorRequest }) {
  const headerCount = Object.keys(request.headers).length;
  const queryCount = Object.keys(request.query).length;
  const fullUrl = `${WEBHOOK_BASE_URL.replace(/\/in$/, "")}${request.path}`;

  return (
    <Tabs defaultValue="overview" className="flex min-h-0 flex-1 flex-col">
      <div className="border-b px-5 pb-0 pt-5">
        <SheetHeader className="space-y-2 pr-8 text-left">
          <div className="flex items-center gap-2">
            <MethodBadge method={request.method} />
            {request.event && (
              <span className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[11px] text-primary">
                {request.event}
              </span>
            )}
          </div>
          <SheetTitle className="break-all font-mono text-sm font-medium leading-relaxed">
            {request.path}
          </SheetTitle>
          <SheetDescription className="text-xs">
            Received {timeAgo(request.receivedAt)} · {formatTimestamp(request.receivedAt)}
            {request.inboxName && <> · {request.inboxName}</>}
          </SheetDescription>
        </SheetHeader>
        <TabsList className="mt-4 h-auto w-full justify-start gap-1 overflow-x-auto rounded-none bg-transparent p-0">
          {[
            { value: "overview", label: "Overview" },
            { value: "headers", label: "Headers", count: headerCount },
            { value: "query", label: "Query Parameters", count: queryCount },
            { value: "body", label: "Body" },
          ].map((t) => (
            <TabsTrigger
              key={t.value}
              value={t.value}
              className="relative shrink-0 rounded-none border-b-2 border-transparent px-2.5 pb-2.5 pt-1 text-xs data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              {t.label}
              {t.count !== undefined && (
                <span className="ml-1.5 rounded bg-muted px-1 text-[10px] tabular-nums text-muted-foreground">
                  {t.count}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="p-5">
          <TabsContent value="overview" className="mt-0">
            <OverviewTab request={request} fullUrl={fullUrl} />
          </TabsContent>
          <TabsContent value="headers" className="mt-0">
            <HeadersTab headers={request.headers} />
          </TabsContent>
          <TabsContent value="query" className="mt-0">
            <QueryTab query={request.query} />
          </TabsContent>
          <TabsContent value="body" className="mt-0">
            <BodyTab body={request.body} contentType={request.contentType} />
          </TabsContent>
        </div>
      </ScrollArea>
    </Tabs>
  );
}

function Field({ label, children, mono }: { label: string; children: ReactNode; mono?: boolean }) {
  return (
    <div className="grid grid-cols-[8rem_1fr] items-start gap-3 border-b py-2.5 text-sm last:border-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={cn("min-w-0 break-all", mono && "font-mono text-[12.5px]")}>{children}</dd>
    </div>
  );
}

function OverviewTab({ request, fullUrl }: { request: InspectorRequest; fullUrl: string }) {
  const size = byteLength(request.body);
  return (
    <div className="space-y-5">
      <dl className="rounded-lg border bg-card px-4">
        <Field label="Method">
          <MethodBadge method={request.method} />
        </Field>
        <Field label="Full path" mono>
          <div className="flex items-start justify-between gap-2">
            <span>{request.path}</span>
            <CopyButton value={fullUrl} variant="ghost" className="-my-1 size-7 shrink-0" toastMessage="Request URL copied" />
          </div>
        </Field>
        <Field label="Time received">{formatTimestamp(request.receivedAt)}</Field>
        <Field label="Content type" mono>
          {request.contentType ? shortContentType(request.contentType) : <Muted>None</Muted>}
        </Field>
        <Field label="Body size">
          <span className="tabular-nums">{formatBytes(size)}</span>
        </Field>
        <Field label="Source IP" mono>
          {request.sourceIp}
        </Field>
        <Field label="Event">{request.event ?? <Muted>Not detected</Muted>}</Field>
        <Field label="Request ID" mono>
          {request.id}
        </Field>
      </dl>
      <div className="grid grid-cols-3 gap-2 text-center">
        <MiniStat label="Headers" value={Object.keys(request.headers).length} />
        <MiniStat label="Query params" value={Object.keys(request.query).length} />
        <MiniStat label="Body" value={formatBytes(size)} />
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-md border bg-card px-3 py-2.5">
      <div className="text-sm font-semibold tabular-nums">{value}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}

function Muted({ children }: { children: ReactNode }) {
  return <span className="text-muted-foreground">{children}</span>;
}

function KeyValueTable({
  rows,
  renderValue,
}: {
  rows: Array<[string, string]>;
  renderValue?: (key: string, value: string) => ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <table className="w-full text-left font-mono text-[12.5px]">
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k} className="border-b align-top last:border-0">
              <td className="w-2/5 break-all px-4 py-2 text-syntax-key">{k}</td>
              <td className="break-all px-4 py-2 text-foreground/90">{renderValue ? renderValue(k, v) : v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HeadersTab({ headers }: { headers: Record<string, string> }) {
  const rows = Object.entries(headers).sort(([a], [b]) => a.localeCompare(b));
  const maskedCount = rows.filter(([k]) => isSensitiveHeader(k)).length;
  if (rows.length === 0) return <EmptyState icon={ListTree} title="No headers" />;
  return (
    <div className="space-y-3">
      {maskedCount > 0 && (
        <div className="flex items-center gap-2 rounded-md border bg-surface-raised px-3 py-2 text-xs text-muted-foreground">
          <Lock className="size-3.5" />
          {maskedCount} sensitive {maskedCount === 1 ? "value is" : "values are"} masked.
        </div>
      )}
      <KeyValueTable
        rows={rows}
        renderValue={(k, v) =>
          isSensitiveHeader(k) ? (
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <KeyRound className="size-3 shrink-0" />
              {maskHeaderValue(k, v)}
            </span>
          ) : (
            v
          )
        }
      />
    </div>
  );
}

function QueryTab({ query }: { query: Record<string, string> }) {
  const rows = Object.entries(query);
  if (rows.length === 0)
    return (
      <EmptyState
        icon={ListTree}
        title="No query parameters"
        description="This request was sent without a query string."
      />
    );
  return <KeyValueTable rows={rows} />;
}

function BodyTab({ body, contentType }: { body: string; contentType: string }) {
  const parsed = parseBody(body, contentType);
  const [mode, setMode] = useState<"formatted" | "raw">("formatted");

  if (parsed.kind === "empty") {
    return (
      <EmptyState
        icon={FileX2}
        title="No request body"
        description="This request didn't include a payload — common for GET and DELETE requests."
      />
    );
  }

  const isJson = parsed.kind === "json";
  const copyValue = isJson && mode === "formatted" ? parsed.formatted : parsed.raw;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="rounded border bg-surface-raised px-1.5 py-0.5 font-mono">
            {isJson ? "JSON" : shortContentType(contentType) === "—" ? "text" : shortContentType(contentType)}
          </span>
          <span className="tabular-nums">{formatBytes(byteLength(body))}</span>
        </div>
        <div className="flex items-center gap-2">
          {isJson && (
            <div role="radiogroup" aria-label="Body view mode" className="flex rounded-md border bg-surface p-0.5">
              {(["formatted", "raw"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={mode === m}
                  onClick={() => setMode(m)}
                  className={cn(
                    "rounded px-2.5 py-1 text-xs font-medium capitalize transition-colors",
                    mode === m ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          )}
          <CopyButton value={copyValue} label="Copy body" toastMessage="Body copied" className="h-8" />
        </div>
      </div>

      {parsed.kind === "text" && parsed.invalidJson && (
        <div className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
          Content type says JSON, but the body isn't valid JSON. Showing it as plain text.
        </div>
      )}

      {isJson ? (
        mode === "formatted" ? (
          <JsonViewer json={parsed.formatted} />
        ) : (
          <CodeBlock wrap>{parsed.raw}</CodeBlock>
        )
      ) : (
        <CodeBlock wrap>{parsed.raw}</CodeBlock>
      )}
    </div>
  );
}
