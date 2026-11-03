import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Inbox, Plus } from "lucide-react";

import { CreateInboxDialog } from "@/components/nexus/create-inbox-dialog";
import { InboxCard, InboxCardSkeleton } from "@/components/nexus/inbox-card";
import { PageHeader } from "@/components/nexus/page-header";
import { EmptyState, ErrorState } from "@/components/nexus/states";
import { Button } from "@/components/ui/button";
import { inboxesQuery } from "@/services/queries";

export const Route = createFileRoute("/inboxes/")({
  head: () => ({
    meta: [
      { title: "Webhook Inboxes — Nexus" },
      { name: "description", content: "All your webhook inboxes and their unique endpoint URLs." },
      { property: "og:title", content: "Webhook Inboxes — Nexus" },
      { property: "og:description", content: "All your webhook inboxes and their unique endpoint URLs." },
    ],
  }),
  component: InboxesPage,
});

function InboxesPage() {
  const inboxes = useQuery(inboxesQuery());
  return (
    <div className="space-y-6">
      <PageHeader title="Webhook Inboxes" description="Each inbox has its own endpoint that captures every request." actions={<CreateInboxDialog />} />
      {inboxes.isPending ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((i) => <InboxCardSkeleton key={i} />)}</div>
      ) : inboxes.isError ? (
        <ErrorState error={inboxes.error} onRetry={() => inboxes.refetch()} />
      ) : inboxes.data.length === 0 ? (
        <EmptyState icon={Inbox} title="No inboxes yet" description="Create an inbox to get a unique webhook URL.">
          <CreateInboxDialog trigger={<Button size="sm"><Plus /> Create Inbox</Button>} />
        </EmptyState>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{inboxes.data.map((i) => <InboxCard key={i.id} inbox={i} />)}</div>
      )}
    </div>
  );
}
