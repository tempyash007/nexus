import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Clock, Inbox as InboxIcon } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { numberFormat, timeAgo } from "@/lib/format";
import type { InboxSummary } from "@/services/types";

import { CopyButton } from "./copy-button";
import { StatusPill } from "./status-dot";

export function InboxCard({ inbox }: { inbox: InboxSummary }) {
  return (
    <div className="group relative flex flex-col rounded-lg border bg-card p-4 shadow-card transition-colors hover:border-primary/40">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-surface-raised">
            <InboxIcon className="size-4 text-muted-foreground transition-colors group-hover:text-primary" />
          </div>
          <div className="min-w-0">
            <Link
              to="/inboxes/$inboxId"
              params={{ inboxId: inbox.id }}
              className="block truncate text-sm font-medium after:absolute after:inset-0 after:rounded-lg"
            >
              {inbox.name}
            </Link>
            <div className="text-[11px] text-muted-foreground">{inbox.slug}</div>
          </div>
        </div>
        <StatusPill active={inbox.active} />
      </div>

      <div className="relative z-10 mt-4 flex items-center gap-1 rounded-md border bg-code py-1 pl-2.5 pr-1">
        <span className="min-w-0 flex-1 truncate font-mono text-[11.5px] text-muted-foreground" title={inbox.endpoint}>
          {inbox.endpoint}
        </span>
        <CopyButton value={inbox.endpoint} variant="ghost" toastMessage="Endpoint URL copied" className="size-7" />
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>
            <span className="font-medium tabular-nums text-foreground">{numberFormat.format(inbox.requestCount)}</span>{" "}
            {inbox.requestCount === 1 ? "request" : "requests"}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="size-3" /> {timeAgo(inbox.lastActivity)}
          </span>
        </div>
        <span className="flex items-center gap-0.5 font-medium text-foreground/80 transition-colors group-hover:text-primary">
          Open <ArrowUpRight className="size-3.5" />
        </span>
      </div>
    </div>
  );
}

export function InboxCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center gap-2.5">
        <Skeleton className="size-8" />
        <div className="space-y-1.5">
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="h-2.5 w-20" />
        </div>
      </div>
      <Skeleton className="mt-4 h-9 w-full" />
      <Skeleton className="mt-4 h-3 w-40" />
    </div>
  );
}
