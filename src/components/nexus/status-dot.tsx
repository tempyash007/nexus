import { cn } from "@/lib/utils";

export function StatusPill({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        active ? "border-success/30 bg-success/10 text-success" : "bg-muted text-muted-foreground",
      )}
    >
      <span
        className={cn("size-1.5 rounded-full", active ? "animate-pulse-dot bg-success" : "bg-muted-foreground")}
      />
      {active ? "Active" : "Paused"}
    </span>
  );
}
