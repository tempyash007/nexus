import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Check, CheckCircle2, Play, Save, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/nexus/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { invalidateAll, inboxesQuery } from "@/services/queries";
import type { HttpMethod, RequestDraft } from "@/services/types";
import { webhookService } from "@/services/webhook-service";

export const Route = createFileRoute("/testers")({
  head: () => ({ meta: [{ title: "Request Tester — Nexus" }, { name: "description", content: "Compose and save webhook requests." }] }),
  component: RequestTesterPage,
});

const METHODS: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];

type ResponseState =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "response"; code: number; text: string }
  | { kind: "blocked"; message: string };

function parseHeaders(value: string) {
  return Object.fromEntries(value.split("\n").map((line) => line.trim()).filter(Boolean).map((line) => {
    const separator = line.indexOf(":");
    return separator === -1 ? [line, ""] : [line.slice(0, separator).trim(), line.slice(separator + 1).trim()];
  }));
}

function RequestTesterPage() {
  const queryClient = useQueryClient();
  const inboxes = useQuery(inboxesQuery());
  const [method, setMethod] = useState<HttpMethod>("POST");
  const [url, setUrl] = useState("https://example.com/webhooks");
  const [headers, setHeaders] = useState("content-type: application/json");
  const [body, setBody] = useState('{\n  "event": "payment.succeeded"\n}');
  const [saveOpen, setSaveOpen] = useState(false);
  const [selectedInbox, setSelectedInbox] = useState("");
  const [newInboxName, setNewInboxName] = useState("");
  const [response, setResponse] = useState<ResponseState>({ kind: "idle" });
  const [saved, setSaved] = useState(false);
  const draft = useMemo<RequestDraft>(() => ({ url, method, headers: parseHeaders(headers), body: method === "GET" || method === "DELETE" ? "" : body }), [url, method, headers, body]);

  const save = useMutation({
    mutationFn: async () => {
      let inboxId = selectedInbox;
      if (!inboxId) inboxId = (await webhookService.createInbox(newInboxName.trim() || `${method}-URL`)).id;
      return webhookService.saveDraftRequest(inboxId, draft);
    },
    onSuccess: async () => { await invalidateAll(queryClient); setSaved(true); setSaveOpen(false); toast.success("Request saved to inbox"); },
    onError: () => toast.error("Enter a valid URL before saving"),
  });

  async function send() {
    setResponse({ kind: "sending" });
    try {
      const response = await fetch(draft.url, { method: draft.method, headers: draft.headers, body: draft.body || undefined });
      setResponse({ kind: "response", code: response.status, text: response.statusText || "Response received" });
    } catch {
      setResponse({ kind: "blocked", message: "Browser blocked this request (usually CORS)." });
    }
  }

  const responseBadge = response.kind === "response"
    ? response.code >= 200 && response.code < 300
      ? { className: "border-success/30 bg-success/10 text-success", icon: CheckCircle2, label: `${response.code} ${response.text}` }
      : response.code >= 400
        ? { className: "border-destructive/30 bg-destructive/10 text-destructive", icon: XCircle, label: `${response.code} ${response.text}` }
        : { className: "border-warning/30 bg-warning/10 text-warning", icon: AlertTriangle, label: `${response.code} ${response.text}` }
    : response.kind === "sending"
      ? { className: "border-border bg-muted text-muted-foreground", icon: Play, label: "Sending…" }
      : response.kind === "blocked"
        ? { className: "border-warning/30 bg-warning/10 text-warning", icon: AlertTriangle, label: "Blocked / failed" }
        : null;

  return (
    <div className="space-y-6">
      <PageHeader title="Request Tester" description="Compose a request to any URL. It stays unsaved until you choose to save it to an inbox." />
      <section className="rounded-lg border bg-card p-5 shadow-card">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 gap-2">
            <Select value={method} onValueChange={(value) => setMethod(value as HttpMethod)}><SelectTrigger className="w-32 shrink-0"><SelectValue /></SelectTrigger><SelectContent>{METHODS.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>
            <Input value={url} onChange={(event) => { setUrl(event.target.value); setSaved(false); }} placeholder="https://your-webhook-url.com/path" className="min-w-0 flex-1 font-mono" />
          </div>
          {responseBadge && <div className={`inline-flex max-w-full shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium sm:max-w-[15rem] ${responseBadge.className}`} title={response.kind === "blocked" ? response.message : responseBadge.label}><responseBadge.icon className="size-3.5 shrink-0" /> <span className="truncate">{responseBadge.label}</span></div>}
        </div>
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <div className="space-y-2"><Label htmlFor="request-headers">Headers</Label><Textarea id="request-headers" value={headers} onChange={(event) => setHeaders(event.target.value)} placeholder="authorization: Bearer ..." className="min-h-44 font-mono text-xs" /><p className="text-xs text-muted-foreground">One header per line: <code>name: value</code></p></div>
          <div className="space-y-2"><Label htmlFor="request-body">Body</Label><Textarea id="request-body" value={body} onChange={(event) => setBody(event.target.value)} disabled={method === "GET" || method === "DELETE"} className="min-h-44 font-mono text-xs" /></div>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-2 border-t pt-4">
          <Button onClick={send}><Play /> Send request</Button>
          <Button variant="outline" onClick={() => setSaveOpen((value) => !value)}><Save /> Save request</Button>
          {saved && <span className="inline-flex items-center gap-1 text-xs text-success"><Check className="size-3.5" /> Saved to inbox</span>}
          {response.kind === "blocked" && <span className="text-xs text-warning">{response.message}</span>}
        </div>
      </section>
      {saveOpen && <section className="rounded-lg border bg-surface p-5 shadow-card"><h2 className="text-sm font-medium">Save this request</h2><p className="mt-1 text-xs text-muted-foreground">Choose an inbox, or create a new one. If you leave the name blank, Nexus uses {method}-URL.</p><div className="mt-4 grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label>Existing inbox</Label><Select value={selectedInbox} onValueChange={setSelectedInbox}><SelectTrigger><SelectValue placeholder="Create a new inbox instead" /></SelectTrigger><SelectContent>{inboxes.data?.map((inbox) => <SelectItem key={inbox.id} value={inbox.id}>{inbox.name}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label htmlFor="new-inbox-name">New inbox name</Label><Input id="new-inbox-name" value={newInboxName} onChange={(event) => setNewInboxName(event.target.value)} placeholder={`${method}-URL`} disabled={Boolean(selectedInbox)} /></div></div><Button className="mt-4" onClick={() => save.mutate()} disabled={save.isPending}><Save /> {save.isPending ? "Saving…" : "Save request"}</Button></section>}
    </div>
  );
}
