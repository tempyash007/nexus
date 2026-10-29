import type { LucideIcon } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  loading,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  loading?: boolean;
}) {
  return (
    <div className="rounded-lg border bg-gradient-surface p-4 shadow-card">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <Icon className="size-4" />
      </div>
      {loading ? (
        <Skeleton className="mt-3 h-7 w-20" />
      ) : (
        <div className="mt-2 truncate text-2xl font-semibold tracking-tight tabular-nums">{value}</div>
      )}
      {hint && !loading && <div className="mt-1 truncate text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}
