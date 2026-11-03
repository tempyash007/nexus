import { cn } from "@/lib/utils";

/** Geometric Nexus mark: three nodes linked around a central hub. */
export function NexusMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" className={cn("size-7", className)}>
      <defs>
        <linearGradient id="nexus-grad" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--primary-glow)" />
          <stop offset="1" stopColor="var(--primary)" />
        </linearGradient>
      </defs>
      <rect x="0.5" y="0.5" width="31" height="31" rx="8" fill="url(#nexus-grad)" />
      <g stroke="var(--primary-foreground)" strokeWidth="1.6" strokeLinecap="round" opacity="0.9">
        <path d="M16 16 L9 9.5" />
        <path d="M16 16 L23 9.5" />
        <path d="M16 16 L16 24" />
        <path d="M9 9.5 L23 9.5" opacity="0.45" />
      </g>
      <g fill="var(--primary-foreground)">
        <circle cx="9" cy="9.5" r="2.4" />
        <circle cx="23" cy="9.5" r="2.4" />
        <circle cx="16" cy="24" r="2.4" />
        <circle cx="16" cy="16" r="3.2" />
      </g>
    </svg>
  );
}

export function NexusLogo({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <NexusMark className="shrink-0" />
      {!collapsed && (
        <div className="leading-tight">
          <div className="text-sm font-semibold tracking-tight text-sidebar-accent-foreground">Nexus</div>
          <div className="text-[11px] text-muted-foreground">Developer Tools</div>
        </div>
      )}
    </div>
  );
}
