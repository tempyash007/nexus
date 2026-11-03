import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Loader2, Plus } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { invalidateAll } from "@/services/queries";
import type { InboxSummary } from "@/services/types";
import { webhookService } from "@/services/webhook-service";

import { EndpointField } from "./endpoint-field";

export function CreateInboxDialog({ trigger }: { trigger?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [created, setCreated] = useState<InboxSummary | null>(null);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (inboxName: string) => webhookService.createInbox(inboxName),
    onSuccess: async (inbox) => {
      setCreated(inbox);
      await invalidateAll(queryClient);
    },
  });

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      // reset after the close animation
      setTimeout(() => {
        setName("");
        setCreated(null);
        mutation.reset();
      }, 200);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus /> Create Inbox
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md gap-5 border bg-popover shadow-pop">
        {created ? (
          <>
            <DialogHeader>
              <div className="mb-1 flex size-9 items-center justify-center rounded-full bg-success/10">
                <CheckCircle2 className="size-5 text-success" />
              </div>
              <DialogTitle>Inbox created</DialogTitle>
              <DialogDescription>
                Send HTTP requests to this endpoint and they'll show up in{" "}
                <span className="font-medium text-foreground">{created.name}</span>.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Webhook endpoint</Label>
              <EndpointField url={created.endpoint} />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="ghost" onClick={() => handleOpenChange(false)}>
                Close
              </Button>
              <Button asChild onClick={() => handleOpenChange(false)}>
                <Link to="/inboxes/$inboxId" params={{ inboxId: created.id }}>
                  Open inbox <ArrowRight />
                </Link>
              </Button>
            </DialogFooter>
          </>
        ) : (
          <form
            className="grid gap-5"
            onSubmit={(e) => {
              e.preventDefault();
              if (name.trim()) mutation.mutate(name);
            }}
          >
            <DialogHeader>
              <DialogTitle>Create a webhook inbox</DialogTitle>
              <DialogDescription>
                Each inbox gets a unique URL that captures every request sent to it.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="inbox-name">Inbox name</Label>
              <Input
                id="inbox-name"
                autoFocus
                placeholder="e.g. Stripe production"
                value={name}
                maxLength={60}
                onChange={(e) => setName(e.target.value)}
                disabled={mutation.isPending}
              />
              {mutation.isError && (
                <p className="text-xs text-destructive">
                  {mutation.error instanceof Error ? mutation.error.message : "Couldn't create inbox."}
                </p>
              )}
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!name.trim() || mutation.isPending}>
                {mutation.isPending ? <Loader2 className="animate-spin" /> : <Plus />}
                Create
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
