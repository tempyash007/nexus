import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Activity, SearchX } from "lucide-react";
import { useState } from "react";

import { PageHeader } from "@/components/nexus/page-header";
import { RequestTable, RequestTableSkeleton } from "@/components/nexus/request-table";
import { RequestToolbar } from "@/components/nexus/request-toolbar";
import { EmptyState, ErrorState } from "@/components/nexus/states";
import { filterRequests, type MethodFilter } from "@/features/webhooks/request-utils";
import { recentRequestsQuery } from "@/services/queries";

export const Route = createFileRoute("/events")({
  head: () => ({
    meta: [
      { title: "Recent Events — Nexus" },
      { name: "description", content: "Every webhook request received across all inboxes." },
      { property: "og:title", content: "Recent Events — Nexus" },
      { property: "og:description", content: "Every webhook request received across all inboxes." },
    ],
  }),
  component: EventsPage,
});

function EventsPage() {
  const navigate = useNavigate();
  const recent = useQuery(recentRequestsQuery());
  const [search, setSearch] = useState("");
  const [method, setMethod] = useState<MethodFilter>("ALL");
  const all = recent.data ?? [];
  const filtered = filterRequests(all, { search, method });

  return (
    <div className="space-y-6">
      <PageHeader title="Recent Events" description="Every request received across all of your inboxes." />
      {recent.isPending ? (
        <RequestTableSkeleton rows={8} />
      ) : recent.isError ? (
        <ErrorState error={recent.error} onRetry={() => recent.refetch()} />
      ) : all.length === 0 ? (
        <EmptyState icon={Activity} title="No events yet" description="Requests sent to any inbox will appear here." />
      ) : (
        <div className="space-y-3">
          <RequestToolbar search={search} onSearchChange={setSearch} method={method} onMethodChange={setMethod} requests={all} />
          {filtered.length === 0 ? (
            <EmptyState icon={SearchX} title="No matching events" description="Try a different search or method filter." />
          ) : (
            <RequestTable
              showInbox
              requests={filtered}
              onSelect={(id) => {
                const r = all.find((x) => x.id === id);
                if (r) navigate({ to: "/inboxes/$inboxId", params: { inboxId: r.inboxId }, search: { r: id } });
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
