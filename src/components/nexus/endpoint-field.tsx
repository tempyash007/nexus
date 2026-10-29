import { Link2 } from "lucide-react";

import { cn } from "@/lib/utils";

import { CopyButton } from "./copy-button";

export function EndpointField({ url, className }: { url: string; className?: string }) {
  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-2 rounded-md border bg-code py-1 pl-3 pr-1 font-mono text-xs",
        className,
      )}
    >
      <Link2 className="size-3.5 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1 truncate text-foreground/90" title={url}>
        {url}
      </span>
      <CopyButton value={url} label="Copy" variant="secondary" toastMessage="Endpoint URL copied" className="h-7" />
    </div>
  );
}
