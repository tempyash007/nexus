import { Search, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import type { MethodFilter } from "@/features/webhooks/request-utils";
import { cn } from "@/lib/utils";
import { HTTP_METHODS, type WebhookRequest } from "@/services/types";

export function RequestToolbar({
  search,
  onSearchChange,
  method,
  onMethodChange,
  requests,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  method: MethodFilter;
  onMethodChange: (m: MethodFilter) => void;
  requests: WebhookRequest[];
}) {
  const counts = new Map<string, number>();
  for (const r of requests) counts.set(r.method, (counts.get(r.method) ?? 0) + 1);
  const options: MethodFilter[] = ["ALL", ...HTTP_METHODS];

  return (
    <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
      <div className="relative w-full lg:max-w-xs">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search path, event or body…"
          className="h-8 bg-surface pl-8 pr-8 text-sm"
          aria-label="Search requests"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>
      <div
        role="radiogroup"
        aria-label="Filter by HTTP method"
        className="flex gap-1 overflow-x-auto rounded-md border bg-surface p-0.5"
      >
        {options.map((m) => {
          const count = m === "ALL" ? requests.length : (counts.get(m) ?? 0);
          const selected = method === m;
          return (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onMethodChange(m)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded px-2.5 py-1 font-mono text-[11px] font-medium transition-colors",
                selected
                  ? "bg-accent text-accent-foreground shadow-card"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {m === "ALL" ? "All" : m}
              <span className="tabular-nums text-muted-foreground">{count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
