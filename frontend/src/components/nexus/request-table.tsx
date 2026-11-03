import { ChevronRight } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { bodyPreview, shortContentType, splitPath } from "@/features/webhooks/request-utils";
import { formatShortDate, formatTime, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { RequestWithInbox, WebhookRequest } from "@/services/types";

import { MethodBadge } from "./method-badge";

type Row = WebhookRequest & { inboxName?: string };

export function RequestTable({
  requests,
  selectedId,
  onSelect,
  showInbox = false,
}: {
  requests: Row[] | RequestWithInbox[];
  selectedId?: string | undefined;
  onSelect: (id: string) => void;
  showInbox?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-lg border bg-card shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-surface-raised/60 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <th className="w-20 px-4 py-2.5 font-medium">Method</th>
              <th className="px-4 py-2.5 font-medium">Path</th>
              {showInbox && <th className="hidden px-4 py-2.5 font-medium md:table-cell">Inbox</th>}
              <th className="hidden px-4 py-2.5 font-medium lg:table-cell">Content type</th>
              <th className="hidden px-4 py-2.5 font-medium xl:table-cell">Body preview</th>
              <th className="px-4 py-2.5 text-right font-medium">Received</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {requests.map((r: Row) => {
              const { pathname, search } = splitPath(r.path);
              const selected = r.id === selectedId;
              return (
                <tr
                  key={r.id}
                  tabIndex={0}
                  aria-selected={selected}
                  onClick={() => onSelect(r.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelect(r.id);
                    }
                  }}
                  className={cn(
                    "group cursor-pointer border-b transition-colors last:border-0 hover:bg-accent/50 focus-visible:bg-accent/60 focus-visible:outline-none",
                    selected && "bg-primary/8 hover:bg-primary/10",
                  )}
                >
                  <td className="px-4 py-2.5 align-middle">
                    <MethodBadge method={r.method} />
                  </td>
                  <td className="max-w-0 px-4 py-2.5">
                    <div className="truncate font-mono text-[12.5px]">
                      {pathname}
                      <span className="text-muted-foreground">{search}</span>
                    </div>
                    {r.event && <div className="mt-0.5 truncate text-[11px] text-primary">{r.event}</div>}
                  </td>
                  {showInbox && (
                    <td className="hidden whitespace-nowrap px-4 py-2.5 text-xs text-muted-foreground md:table-cell">
                      {r.inboxName}
                    </td>
                  )}
                  <td className="hidden whitespace-nowrap px-4 py-2.5 font-mono text-[11.5px] text-muted-foreground lg:table-cell">
                    {shortContentType(r.contentType)}
                  </td>
                  <td className="hidden max-w-[18rem] px-4 py-2.5 xl:table-cell">
                    <div className="truncate font-mono text-[11.5px] text-muted-foreground">
                      {bodyPreview(r.body) || <span className="italic opacity-60">empty</span>}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right">
                    <div className="text-xs tabular-nums">{timeAgo(r.receivedAt)}</div>
                    <div className="text-[11px] tabular-nums text-muted-foreground">
                      {formatShortDate(r.receivedAt)} · {formatTime(r.receivedAt)}
                    </div>
                  </td>
                  <td className="pr-3">
                    <ChevronRight
                      className={cn(
                        "size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100",
                        selected && "text-primary opacity-100",
                      )}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function RequestTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <div className="h-9 border-b bg-surface-raised/60" />
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4 border-b px-4 py-3 last:border-0">
          <Skeleton className="h-5 w-14" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="hidden h-4 w-28 lg:block" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}
