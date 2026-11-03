/**
 * Centralized mock service layer. Every screen reads and writes through these async
 * functions, so a real backend can replace this module without touching the UI.
 * Data is kept in memory and persisted to localStorage in the browser.
 */
import { buildEndpoint, generateSlug, randomId } from "./endpoint";
import { createSeedStore, detectEvent, SAMPLE_EVENTS } from "./mock-data";
import type {
  DashboardStats,
  Inbox,
  InboxSummary,
  Profile,
  RequestWithInbox,
  RequestDraft,
  Store,
  WebhookRequest,
} from "./types";

const STORAGE_KEY = "nexus.store.v1";
const LATENCY_MS = 350;

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

let store: Store | null = null;
let latency = LATENCY_MS;

/** Test hook: disable simulated latency and start from fresh seed data. */
export function __resetForTests(next: Store = createSeedStore()) {
  store = next;
  latency = 0;
}

function hasStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function getStore(): Store {
  if (store) return store;
  if (hasStorage()) {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Store;
        if (parsed.version === 1) {
          store = parsed;
          return store;
        }
      }
    } catch {
      // fall through to seed data
    }
  }
  store = createSeedStore();
  persist();
  return store;
}

function persist() {
  if (!store || !hasStorage()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // storage full or blocked — keep working in memory
  }
}

function wait() {
  return latency > 0 ? new Promise((r) => setTimeout(r, latency)) : Promise.resolve();
}

function byNewest(a: WebhookRequest, b: WebhookRequest) {
  return b.receivedAt.localeCompare(a.receivedAt);
}

function summarize(inbox: Inbox, requests: WebhookRequest[]): InboxSummary {
  const own = requests.filter((r) => r.inboxId === inbox.id);
  const last = own.reduce<string | null>(
    (acc, r) => (acc === null || r.receivedAt > acc ? r.receivedAt : acc),
    null,
  );
  return { ...inbox, requestCount: own.length, lastActivity: last };
}

function findInbox(s: Store, inboxId: string): Inbox {
  const inbox = s.inboxes.find((i) => i.id === inboxId);
  if (!inbox) throw new NotFoundError(`Inbox "${inboxId}" was not found.`);
  return inbox;
}

function isSameLocalDay(iso: string, now: Date) {
  const d = new Date(iso);
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export const webhookService = {
  async listInboxes(): Promise<InboxSummary[]> {
    await wait();
    const s = getStore();
    return s.inboxes
      .map((i) => summarize(i, s.requests))
      .sort((a, b) => (b.lastActivity ?? b.createdAt).localeCompare(a.lastActivity ?? a.createdAt));
  },

  async getInbox(inboxId: string): Promise<InboxSummary> {
    await wait();
    const s = getStore();
    return summarize(findInbox(s, inboxId), s.requests);
  },

  async createInbox(name: string): Promise<InboxSummary> {
    await wait();
    const trimmed = name.trim();
    if (!trimmed) throw new Error("Inbox name is required.");
    if (trimmed.length > 60) throw new Error("Inbox name must be 60 characters or fewer.");
    const s = getStore();
    const slug = generateSlug(s.inboxes.map((i) => i.slug));
    const inbox: Inbox = {
      id: `inb_${randomId(8)}`,
      name: trimmed,
      slug,
      endpoint: buildEndpoint(slug),
      createdAt: new Date().toISOString(),
      active: true,
    };
    s.inboxes.push(inbox);
    persist();
    return summarize(inbox, s.requests);
  },

  async listRequests(inboxId: string): Promise<WebhookRequest[]> {
    await wait();
    const s = getStore();
    findInbox(s, inboxId);
    return s.requests.filter((r) => r.inboxId === inboxId).sort(byNewest);
  },

  async saveDraftRequest(inboxId: string, draft: RequestDraft): Promise<WebhookRequest> {
    await wait();
    const s = getStore();
    const inbox = findInbox(s, inboxId);
    const url = new URL(draft.url);
    const query = Object.fromEntries(url.searchParams.entries());
    const headers: Record<string, string> = { host: "hooks.nexus.dev", ...draft.headers };
    if (draft.body && !headers["content-type"]) headers["content-type"] = "application/json";
    const request: WebhookRequest = {
      id: `req_${randomId(10)}`,
      inboxId: inbox.id,
      method: draft.method,
      path: `${url.pathname}${url.search}`,
      query,
      headers,
      body: draft.body,
      contentType: headers["content-type"] ?? "",
      receivedAt: new Date().toISOString(),
      sourceIp: "127.0.0.1",
      event: detectEvent(draft.body, headers),
    };
    s.requests.push(request);
    persist();
    return request;
  },

  async listRecentRequests(limit?: number): Promise<RequestWithInbox[]> {
    await wait();
    const s = getStore();
    const names = new Map(s.inboxes.map((i) => [i.id, i.name]));
    const all = [...s.requests].sort(byNewest).map((r) => ({
      ...r,
      inboxName: names.get(r.inboxId) ?? "Unknown inbox",
    }));
    return limit === undefined ? all : all.slice(0, limit);
  },

  async getStats(now = new Date()): Promise<DashboardStats> {
    await wait();
    const s = getStore();
    const sorted = [...s.requests].sort(byNewest);
    return {
      totalInboxes: s.inboxes.length,
      requestsReceived: s.requests.length,
      requestsToday: s.requests.filter((r) => isSameLocalDay(r.receivedAt, now)).length,
      lastReceived: sorted[0]?.receivedAt ?? null,
    };
  },

  async clearRequests(inboxId: string): Promise<void> {
    await wait();
    const s = getStore();
    findInbox(s, inboxId);
    s.requests = s.requests.filter((r) => r.inboxId !== inboxId);
    persist();
  },

  /** Mock-only: drops a sample webhook into an inbox so the UI can be explored. */
  async sendTestRequest(inboxId: string): Promise<WebhookRequest> {
    await wait();
    const s = getStore();
    const inbox = findInbox(s, inboxId);
    const sample = SAMPLE_EVENTS[Math.floor(Math.random() * SAMPLE_EVENTS.length)] ?? SAMPLE_EVENTS[0];
    const body = JSON.stringify(sample.payload);
    const headers: Record<string, string> = {
      host: "hooks.nexus.dev",
      "user-agent": "Nexus-Test/1.0",
      accept: "*/*",
      "content-type": "application/json",
      "content-length": String(new TextEncoder().encode(body).length),
      "x-forwarded-for": "127.0.0.1",
    };
    const request: WebhookRequest = {
      id: `req_${randomId(10)}`,
      inboxId,
      method: "POST",
      path: `/in/${inbox.slug}`,
      query: {},
      headers,
      body,
      contentType: "application/json",
      receivedAt: new Date().toISOString(),
      sourceIp: "127.0.0.1",
      event: detectEvent(body, headers),
    };
    s.requests.push(request);
    persist();
    return request;
  },

  async getProfile(): Promise<Profile> {
    await wait();
    return { ...getStore().profile };
  },

  async updateProfile(profile: Profile): Promise<Profile> {
    await wait();
    if (!profile.name.trim()) throw new Error("Name is required.");
    if (!/^\S+@\S+\.\S+$/.test(profile.email)) throw new Error("Enter a valid email address.");
    const s = getStore();
    s.profile = { ...profile, name: profile.name.trim(), email: profile.email.trim() };
    persist();
    return { ...s.profile };
  },

  async resetDemoData(): Promise<void> {
    await wait();
    store = createSeedStore();
    persist();
  },
};
