export const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;
export type HttpMethod = (typeof HTTP_METHODS)[number];

export interface Inbox {
  id: string;
  name: string;
  slug: string;
  endpoint: string;
  createdAt: string;
  active: boolean;
}

export interface InboxSummary extends Inbox {
  requestCount: number;
  lastActivity: string | null;
}

export interface RequestDraft {
  url: string;
  method: HttpMethod;
  headers: Record<string, string>;
  body: string;
}

export interface WebhookRequest {
  id: string;
  inboxId: string;
  method: HttpMethod;
  /** Path including query string, e.g. /in/abc123/stripe?attempt=1 */
  path: string;
  query: Record<string, string>;
  headers: Record<string, string>;
  body: string;
  contentType: string;
  receivedAt: string;
  sourceIp: string;
  /** Event type parsed from the payload when known, e.g. payment.succeeded */
  event: string | null;
}

export interface RequestWithInbox extends WebhookRequest {
  inboxName: string;
}

export interface DashboardStats {
  totalInboxes: number;
  requestsReceived: number;
  requestsToday: number;
  lastReceived: string | null;
}

export interface Profile {
  name: string;
  email: string;
  role: string;
  workspace: string;
}

export interface Store {
  version: 1;
  inboxes: Inbox[];
  requests: WebhookRequest[];
  profile: Profile;
}
