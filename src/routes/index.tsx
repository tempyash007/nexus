import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Activity, ArrowRight, CalendarClock, Clock, Inbox, Plus } from "lucide-react";

import { CreateInboxDialog } from "@/components/nexus/create-inbox-dialog";
import { InboxCard, InboxCardSkeleton } from "@/components/nexus/inbox-card";
import { PageHeader } from "@/components/nexus/page-header";
import { RequestTable, RequestTableSkeleton } from "@/components/nexus/request-table";
import { StatCard } from "@/components/nexus/stat-card";
import { EmptyState, ErrorState } from "@/components/nexus/states";
import { Button } from "@/components/ui/button";
import { numberFormat, timeAgo } from "@/lib/format";
import { inboxesQuery, recentRequestsQuery, statsQuery } from "@/services/queries";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Webhook Inspector — Nexus" },
      { name: "description", content: "Capture and inspect incoming webhook requests in real time." },
      { property: "og:title", content: "Webhook Inspector — Nexus" },
      { property: "og:description", content: "Capture and inspect incoming webhook requests in real time." },
    ],
  }),
  component: Overview,
});

function Overview() {
  const navigate = useNavigate();
  const stats = useQuery(statsQuery());
  const inboxes = useQuery(inboxesQuery());
  const recent = useQuery(recentRequestsQuery(6));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Webhook Inspector"
        description="Capture and inspect incoming webhook requests."
        actions={<CreateInboxDialog />}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total Inboxes" icon={Inbox} loading={stats.isPending} value={numberFormat.format(stats.data?.totalInboxes ?? 0)} />
        <StatCard label="Requests Received" icon={Activity} loading={stats.isPending} value={numberFormat.format(stats.data?.requestsReceived ?? 0)} />
        <StatCard label="Requests Today" icon={CalendarClock} loading={stats.isPending} value={numberFormat.format(stats.data?.requestsToday ?? 0)} />
        <StatCard label="Last Received" icon={Clock} loading={stats.isPending} value={timeAgo(stats.data?.lastReceived ?? null)} />
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">Webhook inboxes</h2>
          <Button asChild variant="ghost" size="sm">
            <Link to="/inboxes">View all <ArrowRight /></Link>
          </Button>
        </div>
        {inboxes.isPending ? (
          <div className="grid gap-3 md:grid-cols-2">{[0, 1, 2, 3].map((i) => <InboxCardSkeleton key={i} />)}</div>
        ) : inboxes.isError ? (
          <ErrorState error={inboxes.error} onRetry={() => inboxes.refetch()} />
        ) : inboxes.data.length === 0 ? (
          <EmptyState icon={Inbox} title="No inboxes yet" description="Create an inbox to get a unique webhook URL.">
            <CreateInboxDialog trigger={<Button size="sm"><Plus /> Create Inbox</Button>} />
          </EmptyState>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">{inboxes.data.slice(0, 4).map((i) => <InboxCard key={i.id} inbox={i} />)}</div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">Recent requests</h2>
          <Button asChild variant="ghost" size="sm">
            <Link to="/events">All events <ArrowRight /></Link>
          </Button>
        </div>
        {recent.isPending ? (
          <RequestTableSkeleton />
        ) : recent.isError ? (
          <ErrorState error={recent.error} onRetry={() => recent.refetch()} />
        ) : recent.data.length === 0 ? (
          <EmptyState icon={Activity} title="No requests yet" description="Requests sent to any inbox will appear here." />
        ) : (
          <RequestTable
            showInbox
            requests={recent.data}
            onSelect={(id) => {
              const r = recent.data.find((x) => x.id === id);
              if (r) navigate({ to: "/inboxes/$inboxId", params: { inboxId: r.inboxId }, search: { r: id } });
            }}
          />
        )}
      </section>
    </div>
  );
}
