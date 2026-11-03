import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button, type ButtonProps } from "@/components/ui/button";
import { copyText } from "@/lib/clipboard";
import { cn } from "@/lib/utils";

interface CopyButtonProps extends Omit<ButtonProps, "onClick"> {
  value: string;
  label?: string;
  toastMessage?: string;
}

export function CopyButton({
  value,
  label,
  toastMessage = "Copied to clipboard",
  className,
  variant = "outline",
  size = "sm",
  ...props
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(t);
  }, [copied]);

  return (
    <Button
      type="button"
      variant={variant}
      size={label ? size : "icon"}
      className={cn(!label && "size-8", className)}
      aria-label={label ?? "Copy"}
      onClick={async (e) => {
        e.stopPropagation();
        const ok = await copyText(value);
        if (ok) {
          setCopied(true);
          toast.success(toastMessage);
        } else {
          toast.error("Couldn't access the clipboard");
        }
      }}
      {...props}
    >
      {copied ? <Check className="text-success" /> : <Copy />}
      {label && <span>{copied ? "Copied" : label}</span>}
    </Button>
  );
}
