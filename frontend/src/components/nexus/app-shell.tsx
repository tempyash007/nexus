import { useRouterState } from "@tanstack/react-router";
import { LogIn } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { usePreferences } from "@/lib/preferences";

import { AppSidebar } from "./app-sidebar";
import { NexusMark } from "./nexus-logo";

const CRUMBS: Array<[RegExp, string]> = [
  [/^\/$/, "Overview"],
  [/^\/inboxes\/.+/, "Inbox"],
  [/^\/inboxes/, "Webhook Inboxes"],
  [/^\/events/, "Recent Events"],
  [/^\/testers/, "Request Tester"],
  [/^\/settings/, "Settings"],
];

export function AppShell({ children }: { children: ReactNode }) {
  const { signedIn } = usePreferences();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const crumb = CRUMBS.find(([re]) => re.test(pathname))?.[1] ?? "";

  if (!signedIn) return <SignedOut />;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset className="min-w-0 bg-background">
          <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-md">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="h-4" />
            <div className="flex min-w-0 items-center gap-1.5 text-sm">
              <span className="text-muted-foreground">Webhook Inspector</span>
              <span className="text-muted-foreground/50">/</span>
              <span className="truncate font-medium">{crumb}</span>
            </div>
          </header>
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:py-8">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

function SignedOut() {
  const { signIn } = usePreferences();
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
      <div className="relative w-full max-w-sm rounded-xl border bg-card p-8 text-center shadow-pop">
        <NexusMark className="mx-auto size-10" />
        <h1 className="mt-5 text-lg font-semibold tracking-tight">You've been logged out</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Your inboxes and captured requests are kept safe until you sign back in.
        </p>
        <Button className="mt-6 w-full" onClick={signIn}>
          <LogIn /> Sign back in
        </Button>
      </div>
    </div>
  );
}
