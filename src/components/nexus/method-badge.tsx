import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";
import type { HttpMethod } from "@/services/types";

const methodBadge = cva(
  "inline-flex h-5 min-w-[3.25rem] items-center justify-center rounded px-1.5 font-mono text-[10.5px] font-semibold tracking-wide ring-1 ring-inset",
  {
    variants: {
      method: {
        GET: "bg-method-get/12 text-method-get ring-method-get/30",
        POST: "bg-method-post/12 text-method-post ring-method-post/30",
        PUT: "bg-method-put/12 text-method-put ring-method-put/30",
        PATCH: "bg-method-patch/12 text-method-patch ring-method-patch/30",
        DELETE: "bg-method-delete/12 text-method-delete ring-method-delete/30",
      },
    },
  },
);

export function MethodBadge({ method, className }: { method: HttpMethod; className?: string }) {
  return <span className={cn(methodBadge({ method }), className)}>{method}</span>;
}
