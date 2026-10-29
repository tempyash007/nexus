import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2, SearchX, Send, Trash2, Webhook } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { CopyButton } from "@/components/nexus/copy-button";
import { EndpointField } from "@/components/nexus/endpoint-field";
import { PageHeader } from "@/components/nexus/page-header";
import { RequestInspector } from "@/components/nexus/request-inspector";
import { RequestTable, RequestTableSkeleton } from "@/components/nexus/request-table";
import { RequestToolbar } from "@/components/nexus/request-toolbar";
import { StatusPill } from "@/components/nexus/status-dot";
import { EmptyState, ErrorState } from "@/components/nexus/states";
import { JsonViewer } from "@/components/nexus/json-viewer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { filterRequests, type MethodFilter } from "@/features/webhooks/request-utils";
import { numberFormat, timeAgo } from "@/lib/format";
import { inboxQuery, invalidateAll, requestsQuery } from "@/services/queries";
import { webhookService } from "@/services/webhook-service";

export const Route = createFileRoute("/inboxes/$inboxId")({
  validateSearch: (search: Record<string, unknown>): { r?: string } =>
    typeof search["r"] === "string" ? { r: search["r"] } : {},
  head: () => ({
    meta: [
      { title: "Inbox — Nexus Webhook Inspector" },
      { name: "description", content: "Request history for a webhook inbox." },
      { property: "og:title", content: "Inbox — Nexus Webhook Inspector" },
      { property: "og:description", content: "Request history for a webhook inbox." },
    ],
  }),
  component: InboxPage,
});

function InboxPage() {
  const { inboxId } = Route.useParams();
  const { r } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const queryClient = useQueryClient();
  const inbox = useQuery(inboxQuery(inboxId));
  const requests = useQuery(requestsQuery(inboxId));
  const [search, setSearch] = useState("");
  const [method, setMethod] = useState<MethodFilter>("ALL");

  const clear = useMutation({
    mutationFn: () => webhookService.clearRequests(inboxId),
    onSuccess: async () => {
      await invalidateAll(queryClient);
      toast.success("Request history cleared");
    },
  });
  const sendTest = useMutation({
    mutationFn: () => webhookService.sendTestRequest(inboxId),
    onSuccess: async () => {
      await invalidateAll(queryClient);
      toast.success("Test request received");
    },
  });

  if (inbox.isError) {
    return (
      <ErrorState title="Inbox unavailable" error={inbox.error} onRetry={() => inbox.refetch()}>
        <Button asChild variant="ghost" size="sm"><Link to="/inboxes">Back to inboxes</Link></Button>
      </ErrorState>
    );
  }

  const all = requests.data ?? [];
  const filtered = filterRequests(all, { search, method });
  const selected = r ? all.find((x) => x.id === r) : undefined;
  const curl = inbox.data
    ? `curl -X POST ${inbox.data.endpoint} \\\n  -H "Content-Type: application/json" \\\n  -d '{"type":"payment.succeeded","amount":4900}'`
    : "";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={
          <Link to="/inboxes" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-3" /> Inboxes
          </Link>
        }
        title={inbox.data ? (
          <span className="flex items-center gap-3">{inbox.data.name}<StatusPill active={inbox.data.active} /></span>
        ) : <Skeleton className="h-7 w-48" />}
        description={inbox.data ? `${numberFormat.format(inbox.data.requestCount)} requests · Last activity ${timeAgo(inbox.data.lastActivity)}` : undefined}
        actions={
          <div className="flex flex-wrap justify-end gap-2">
            <Button asChild variant="secondary" size="sm"><Link to="/testers">Request tester</Link></Button>
            <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" disabled={all.length === 0 || clear.isPending}>
                {clear.isPending ? <Loader2 className="animate-spin" /> : <Trash2 />} Clear history
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear request history?</AlertDialogTitle>
                <AlertDialogDescription>All {all.length} captured requests in this inbox will be removed. The endpoint keeps working.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => clear.mutate()}>Clear history</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
            </AlertDialog>
          </div>
        }
      />

      {inbox.data ? <EndpointField url={inbox.data.endpoint} className="max-w-2xl" /> : <Skeleton className="h-9 max-w-2xl" />}

      {requests.isPending ? (
        <RequestTableSkeleton />
      ) : requests.isError ? (
        <ErrorState error={requests.error} onRetry={() => requests.refetch()} />
      ) : all.length === 0 ? (
        <EmptyState
          icon={Webhook}
          title="Waiting for your first webhook"
          description="Point your provider's webhook settings at the endpoint above, or send a request from your terminal:"
        >
          <div className="mx-auto max-w-xl space-y-3 text-left">
            <div className="relative">
              <JsonViewer json={curl} />
              <CopyButton value={curl} variant="ghost" className="absolute right-2 top-2 size-7" toastMessage="Command copied" />
            </div>
            <div className="text-center">
              <Button size="sm" variant="secondary" onClick={() => sendTest.mutate()} disabled={sendTest.isPending}>
                {sendTest.isPending ? <Loader2 className="animate-spin" /> : <Send />} Send a test request
              </Button>
            </div>
          </div>
        </EmptyState>
      ) : (
        <div className="space-y-3">
          <RequestToolbar search={search} onSearchChange={setSearch} method={method} onMethodChange={setMethod} requests={all} />
          {filtered.length === 0 ? (
            <EmptyState icon={SearchX} title="No matching requests" description="Try a different search or method filter." />
          ) : (
            <RequestTable requests={filtered} selectedId={r} onSelect={(id) => navigate({ search: { r: id } })} />
          )}
        </div>
      )}

      <RequestInspector
        open={Boolean(r)}
        onOpenChange={(open) => !open && navigate({ search: {} })}
        request={selected ? { ...selected, ...(inbox.data ? { inboxName: inbox.data.name } : {}) } : undefined}
      />
    </div>
  );
}
