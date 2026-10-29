import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, LogOut, Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/nexus/page-header";
import { ErrorState } from "@/components/nexus/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { usePreferences, type ThemePreference } from "@/lib/preferences";
import { cn } from "@/lib/utils";
import { invalidateAll, profileQuery } from "@/services/queries";
import type { Profile } from "@/services/types";
import { webhookService } from "@/services/webhook-service";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Nexus" },
      { name: "description", content: "Manage your Nexus profile and theme preferences." },
      { property: "og:title", content: "Settings — Nexus" },
      { property: "og:description", content: "Manage your Nexus profile and theme preferences." },
    ],
  }),
  component: SettingsPage,
});

const THEMES: Array<{ value: ThemePreference; label: string; icon: typeof Moon }> = [
  { value: "dark", label: "Dark", icon: Moon },
  { value: "light", label: "Light", icon: Sun },
  { value: "system", label: "System", icon: Monitor },
];

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-4 rounded-lg border bg-card p-5 shadow-card md:grid-cols-[14rem_1fr]">
      <div>
        <h2 className="text-sm font-medium">{title}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>
      <div>{children}</div>
    </section>
  );
}

function SettingsPage() {
  const profile = useQuery(profileQuery());
  const { theme, setTheme, signOut } = usePreferences();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Profile | null>(null);
  useEffect(() => {
    if (profile.data) setForm(profile.data);
  }, [profile.data]);

  const save = useMutation({
    mutationFn: (p: Profile) => webhookService.updateProfile(p),
    onSuccess: async () => {
      await invalidateAll(queryClient);
      toast.success("Profile saved");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Couldn't save profile"),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage your profile and preferences." />

      <Section title="Profile" description="How you appear in this workspace.">
        {profile.isError ? (
          <ErrorState error={profile.error} onRetry={() => profile.refetch()} />
        ) : !form ? (
          <div className="grid gap-3 sm:grid-cols-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-9" />)}</div>
        ) : (
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); save.mutate(form); }}>
            <div className="grid gap-3 sm:grid-cols-2">
              {(["name", "email", "role", "workspace"] as const).map((key) => (
                <div key={key} className="space-y-1.5">
                  <Label htmlFor={key} className="text-xs capitalize text-muted-foreground">{key}</Label>
                  <Input id={key} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
                </div>
              ))}
            </div>
            <Button type="submit" size="sm" disabled={save.isPending}>
              {save.isPending && <Loader2 className="animate-spin" />} Save changes
            </Button>
          </form>
        )}
      </Section>

      <Section title="Theme" description="Nexus is designed dark-first.">
        <div role="radiogroup" aria-label="Theme" className="grid grid-cols-3 gap-2">
          {THEMES.map((t) => (
            <button
              key={t.value}
              type="button"
              role="radio"
              aria-checked={theme === t.value}
              onClick={() => setTheme(t.value)}
              className={cn(
                "flex flex-col items-center gap-2 rounded-md border bg-surface px-3 py-4 text-sm transition-colors hover:border-primary/40",
                theme === t.value && "border-primary bg-primary/10 text-foreground",
              )}
            >
              <t.icon className="size-4" /> {t.label}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Session" description="Sign out of Nexus on this device.">
        <Button variant="outline" size="sm" onClick={signOut}>
          <LogOut /> Log out
        </Button>
      </Section>
    </div>
  );
}
