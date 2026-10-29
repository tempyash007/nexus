import { useQuery } from "@tanstack/react-query";
import { Link, useRouterState } from "@tanstack/react-router";
import { Activity, FlaskConical, Inbox, LayoutGrid, LogOut, Settings } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { usePreferences } from "@/lib/preferences";
import { inboxesQuery, profileQuery } from "@/services/queries";

import { NexusLogo } from "./nexus-logo";

const NAV = [
  { title: "Overview", to: "/", icon: LayoutGrid, exact: true },
  { title: "Webhook Inboxes", to: "/inboxes", icon: Inbox, exact: false },
  { title: "Recent Events", to: "/events", icon: Activity, exact: false },
  { title: "Request Tester", to: "/testers", icon: FlaskConical, exact: false },
  { title: "Settings", to: "/settings", icon: Settings, exact: false },
] as const;

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function AppSidebar() {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed" && !isMobile;
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: inboxes } = useQuery(inboxesQuery());
  const { data: profile } = useQuery(profileQuery());
  const { signOut } = usePreferences();

  const isActive = (to: string, exact: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(`${to}/`);

  const closeOnMobile = () => isMobile && setOpenMobile(false);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-14 justify-center border-b border-sidebar-border px-3">
        <Link to="/" onClick={closeOnMobile} aria-label="Nexus home">
          <NexusLogo collapsed={collapsed} />
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Webhook Inspector</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton asChild isActive={isActive(item.to, item.exact)} tooltip={item.title}>
                    <Link to={item.to} onClick={closeOnMobile}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                  {item.to === "/inboxes" && inboxes && (
                    <SidebarMenuBadge className="tabular-nums text-muted-foreground">
                      {inboxes.length}
                    </SidebarMenuBadge>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {inboxes && inboxes.length > 0 && !collapsed && (
          <SidebarGroup>
            <SidebarGroupLabel>Inboxes</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {inboxes.slice(0, 6).map((inbox) => (
                  <SidebarMenuItem key={inbox.id}>
                    <SidebarMenuButton
                      asChild
                      size="sm"
                      isActive={pathname === `/inboxes/${inbox.id}`}
                    >
                      <Link to="/inboxes/$inboxId" params={{ inboxId: inbox.id }} onClick={closeOnMobile}>
                        <span
                          className={
                            inbox.active
                              ? "size-1.5 shrink-0 rounded-full bg-success"
                              : "size-1.5 shrink-0 rounded-full bg-muted-foreground"
                          }
                        />
                        <span className="truncate">{inbox.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2.5 rounded-md p-1.5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0">
              <Avatar className="size-7 rounded-md">
                <AvatarFallback className="rounded-md bg-gradient-primary text-[11px] font-semibold text-primary-foreground">
                  {profile ? initials(profile.name) : "··"}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <>
                  <Link to="/settings" onClick={closeOnMobile} className="min-w-0 flex-1 leading-tight">
                    <div className="truncate text-sm font-medium text-sidebar-accent-foreground">
                      {profile?.name ?? "Loading…"}
                    </div>
                    <div className="truncate text-[11px] text-muted-foreground">{profile?.email ?? ""}</div>
                  </Link>
                  <button
                    type="button"
                    onClick={signOut}
                    className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
                    aria-label="Log out"
                    title="Log out"
                  >
                    <LogOut className="size-4" />
                  </button>
                </>
              )}
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
