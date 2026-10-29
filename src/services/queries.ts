import { queryOptions, type QueryClient } from "@tanstack/react-query";

import { webhookService } from "./webhook-service";

export const queryKeys = {
  all: ["nexus"] as const,
  inboxes: () => [...queryKeys.all, "inboxes"] as const,
  inbox: (id: string) => [...queryKeys.all, "inbox", id] as const,
  requests: (inboxId: string) => [...queryKeys.all, "requests", inboxId] as const,
  recent: (limit?: number) => [...queryKeys.all, "recent", limit ?? "all"] as const,
  stats: () => [...queryKeys.all, "stats"] as const,
  profile: () => [...queryKeys.all, "profile"] as const,
};

export const inboxesQuery = () =>
  queryOptions({ queryKey: queryKeys.inboxes(), queryFn: () => webhookService.listInboxes() });

export const inboxQuery = (id: string) =>
  queryOptions({ queryKey: queryKeys.inbox(id), queryFn: () => webhookService.getInbox(id), retry: false });

export const requestsQuery = (inboxId: string) =>
  queryOptions({
    queryKey: queryKeys.requests(inboxId),
    queryFn: () => webhookService.listRequests(inboxId),
    retry: false,
  });

export const recentRequestsQuery = (limit?: number) =>
  queryOptions({
    queryKey: queryKeys.recent(limit),
    queryFn: () => webhookService.listRecentRequests(limit),
  });

export const statsQuery = () =>
  queryOptions({ queryKey: queryKeys.stats(), queryFn: () => webhookService.getStats() });

export const profileQuery = () =>
  queryOptions({ queryKey: queryKeys.profile(), queryFn: () => webhookService.getProfile() });


/** Any write can change counts everywhere, so refresh all Nexus data. */
export function invalidateAll(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: queryKeys.all });
}
