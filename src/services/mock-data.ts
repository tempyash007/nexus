import { buildEndpoint } from "./endpoint";
import type { HttpMethod, Inbox, Store, WebhookRequest } from "./types";

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

interface Draft {
  inboxId: string;
  method: HttpMethod;
  subpath?: string;
  query?: Record<string, string>;
  headers?: Record<string, string>;
  body?: unknown;
  rawBody?: string;
  contentType?: string;
  ago: number;
  sourceIp: string;
}

const INBOXES: Array<Omit<Inbox, "endpoint" | "createdAt"> & { createdAgo: number }> = [
  { id: "inb_stripe", name: "Stripe Payments", slug: "k7f2q9xm4pzt", active: true, createdAgo: 12 * DAY },
  { id: "inb_shop", name: "Shop Orders", slug: "r3n8w1vd6hya", active: true, createdAgo: 8 * DAY },
  { id: "inb_auth", name: "Auth Service", slug: "b5c0e7lu2gso", active: true, createdAgo: 5 * DAY },
  { id: "inb_staging", name: "Staging Sandbox", slug: "m9t4j6ak1wqe", active: false, createdAgo: 2 * DAY },
];

function slugFor(inboxId: string): string {
  return INBOXES.find((i) => i.id === inboxId)?.slug ?? "unknown";
}

function stripeEvent(type: string, id: string, data: Record<string, unknown>) {
  return {
    id,
    object: "event",
    api_version: "2024-06-20",
    created: 1731840000,
    type,
    livemode: false,
    data: { object: data },
    request: { id: `req_${id.slice(-8)}`, idempotency_key: null },
  };
}

const DRAFTS: Draft[] = [
  {
    inboxId: "inb_stripe",
    method: "POST",
    subpath: "/stripe",
    ago: 4 * MIN,
    sourceIp: "54.187.174.169",
    headers: {
      "user-agent": "Stripe/1.0 (+https://stripe.com/docs/webhooks)",
      "stripe-signature": "t=1731840000,v1=5257a869e7ecebeda32affa62cdca3fa51cad7e77a0e56ff536d0ce8e108d8bd",
      authorization: "Bearer sk_test_51Nx9rQKz8mVt2pLaYbC3dE4fG5h",
      "x-request-id": "8f2a6c1e-3b4d-4e5f-9a0b-1c2d3e4f5a6b",
    },
    body: stripeEvent("payment.succeeded", "evt_3QkLm2Kz8mVt2pLa1x9aBcDe", {
      id: "pi_3QkLm2Kz8mVt2pLa0R7sTuVw",
      object: "payment_intent",
      amount: 4900,
      currency: "usd",
      status: "succeeded",
      customer: "cus_R4nD0mCuSt0m3r",
      payment_method_types: ["card"],
      metadata: { order_id: "ord_10482", plan: "pro_monthly" },
      receipt_email: "jamie@acme.io",
    }),
  },
  {
    inboxId: "inb_stripe",
    method: "POST",
    subpath: "/stripe",
    ago: 38 * MIN,
    sourceIp: "54.187.205.235",
    headers: {
      "user-agent": "Stripe/1.0 (+https://stripe.com/docs/webhooks)",
      "stripe-signature": "t=1731837720,v1=9c1b7d3e2f8a6c4b5d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c",
    },
    body: stripeEvent("payment.failed", "evt_3QkKz9Kz8mVt2pLa0f3gHiJk", {
      id: "pi_3QkKz9Kz8mVt2pLa1M2nOpQr",
      object: "payment_intent",
      amount: 12900,
      currency: "eur",
      status: "requires_payment_method",
      last_payment_error: {
        code: "card_declined",
        decline_code: "insufficient_funds",
        message: "Your card has insufficient funds.",
      },
      customer: "cus_Q8wXyZaBcDeFg",
      metadata: { order_id: "ord_10479" },
    }),
  },
  {
    inboxId: "inb_stripe",
    method: "POST",
    subpath: "/stripe",
    query: { attempt: "2" },
    ago: 3 * HOUR,
    sourceIp: "54.187.174.169",
    headers: {
      "user-agent": "Stripe/1.0 (+https://stripe.com/docs/webhooks)",
      "stripe-signature": "t=1731829200,v1=1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b",
    },
    body: stripeEvent("payment.succeeded", "evt_3QkHa1Kz8mVt2pLa0b2cDeFg", {
      id: "pi_3QkHa1Kz8mVt2pLa1h3iJkLm",
      object: "payment_intent",
      amount: 1999,
      currency: "usd",
      status: "succeeded",
      customer: "cus_N1nEtEeNnInE",
      metadata: { order_id: "ord_10466", plan: "starter" },
    }),
  },
  {
    inboxId: "inb_stripe",
    method: "GET",
    subpath: "/health",
    query: { probe: "uptime", region: "us-east-1" },
    ago: 26 * HOUR,
    sourceIp: "34.120.88.12",
    headers: { "user-agent": "UptimeBot/2.4", accept: "*/*" },
  },
  {
    inboxId: "inb_stripe",
    method: "POST",
    subpath: "/stripe",
    ago: 2 * DAY + 3 * HOUR,
    sourceIp: "54.187.205.235",
    headers: {
      "user-agent": "Stripe/1.0 (+https://stripe.com/docs/webhooks)",
      "stripe-signature": "t=1731667200,v1=0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e",
    },
    body: stripeEvent("payment.failed", "evt_3QjAa7Kz8mVt2pLa0x8yZaBc", {
      id: "pi_3QjAa7Kz8mVt2pLa1q2wErTy",
      object: "payment_intent",
      amount: 7500,
      currency: "gbp",
      status: "requires_payment_method",
      last_payment_error: { code: "expired_card", message: "Your card has expired." },
    }),
  },
  {
    inboxId: "inb_shop",
    method: "POST",
    subpath: "/orders",
    ago: 12 * MIN,
    sourceIp: "23.227.38.65",
    headers: {
      "user-agent": "ShopHooks/3.1",
      "x-shop-topic": "order.created",
      "x-shop-domain": "acme-goods.example.com",
      "x-api-key": "shk_live_9f8e7d6c5b4a3f2e1d0c9b8a",
      "x-shop-hmac-sha256": "XWmrwMey6OsLMeiZKwP4FppHH3cmAiiJJAweH5Jo4bM=",
    },
    body: {
      event: "order.created",
      id: 5810293847,
      order_number: 1042,
      created_at: "2026-11-17T12:48:03Z",
      currency: "USD",
      total_price: "184.50",
      financial_status: "paid",
      customer: { id: 7720193, email: "sam.lee@example.com", first_name: "Sam", last_name: "Lee" },
      line_items: [
        { sku: "TEE-BLK-M", title: "Logo Tee — Black / M", quantity: 2, price: "32.00" },
        { sku: "HOOD-GRY-L", title: "Zip Hoodie — Grey / L", quantity: 1, price: "89.00" },
      ],
      shipping_address: { city: "Portland", province: "OR", country: "US", zip: "97205" },
      tags: ["first-order", "web"],
      test: false,
    },
  },
  {
    inboxId: "inb_shop",
    method: "POST",
    subpath: "/orders",
    ago: 5 * HOUR,
    sourceIp: "23.227.38.66",
    headers: {
      "user-agent": "ShopHooks/3.1",
      "x-shop-topic": "order.created",
      "x-api-key": "shk_live_9f8e7d6c5b4a3f2e1d0c9b8a",
    },
    body: {
      event: "order.created",
      id: 5810287711,
      order_number: 1041,
      currency: "USD",
      total_price: "42.00",
      financial_status: "pending",
      customer: { id: 7720188, email: "priya@example.com", first_name: "Priya", last_name: null },
      line_items: [{ sku: "MUG-WHT", title: "Ceramic Mug", quantity: 2, price: "21.00" }],
      discount_codes: [],
      test: true,
    },
  },
  {
    inboxId: "inb_shop",
    method: "PUT",
    subpath: "/orders/1039",
    ago: 30 * HOUR,
    sourceIp: "23.227.38.65",
    headers: { "user-agent": "ShopHooks/3.1", "x-shop-topic": "order.updated" },
    body: { event: "order.updated", id: 5810271002, order_number: 1039, fulfillment_status: "fulfilled", tracking: { carrier: "UPS", number: "1Z999AA10123456784" } },
  },
  {
    inboxId: "inb_shop",
    method: "DELETE",
    subpath: "/orders/1031",
    query: { reason: "customer_request" },
    ago: 3 * DAY,
    sourceIp: "23.227.38.65",
    headers: { "user-agent": "ShopHooks/3.1", "x-shop-topic": "order.cancelled" },
  },
  {
    inboxId: "inb_auth",
    method: "POST",
    subpath: "/users",
    ago: 22 * MIN,
    sourceIp: "104.18.32.7",
    headers: {
      "user-agent": "AuthKit-Webhooks/1.8",
      cookie: "session=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.sig; theme=dark",
      "x-webhook-id": "wh_01JCZ8K3M4N5P6Q7R8S9T0",
    },
    body: {
      type: "user.created",
      id: "evt_01JCZ8K3M4N5P6Q7R8S9T0",
      created_at: "2026-11-17T12:38:11.204Z",
      data: {
        id: "user_2pQrStUvWxYz",
        email: "nora.kim@example.com",
        email_verified: false,
        name: "Nora Kim",
        provider: "google",
        organization_id: "org_8hJ2kL4m",
        roles: ["member"],
        mfa_enabled: false,
      },
    },
  },
  {
    inboxId: "inb_auth",
    method: "PATCH",
    subpath: "/users/user_2pQrStUvWxYz",
    ago: 2 * HOUR,
    sourceIp: "104.18.32.7",
    headers: { "user-agent": "AuthKit-Webhooks/1.8", "x-webhook-id": "wh_01JCZ6A1B2C3D4E5F6G7H8" },
    body: { type: "user.updated", id: "evt_01JCZ6A1B2C3D4E5F6G7H8", data: { id: "user_2pQrStUvWxYz", email_verified: true } },
  },
  {
    inboxId: "inb_auth",
    method: "POST",
    subpath: "/legacy",
    ago: 20 * HOUR,
    sourceIp: "198.51.100.23",
    contentType: "application/x-www-form-urlencoded",
    rawBody: "event=user.created&user_id=48213&email=dev%40example.com&plan=free",
    headers: { "user-agent": "curl/8.7.1", "set-cookie": "legacy_sid=a8f3c2e1d9b7; Path=/; HttpOnly" },
  },
  {
    inboxId: "inb_auth",
    method: "POST",
    subpath: "/ping",
    ago: 2 * DAY,
    sourceIp: "198.51.100.23",
    contentType: "text/plain",
    rawBody: "ping from deploy hook — build #2187 finished in 42s",
    headers: { "user-agent": "curl/8.7.1" },
  },
  {
    inboxId: "inb_auth",
    method: "POST",
    subpath: "/users",
    ago: 4 * DAY,
    sourceIp: "104.18.32.7",
    contentType: "application/json",
    rawBody: '{"type":"user.created","data":{"id":"user_broken",', // truncated / invalid JSON
    headers: { "user-agent": "AuthKit-Webhooks/1.7" },
  },
];

function toRequest(draft: Draft, index: number, now: number): WebhookRequest {
  const slug = slugFor(draft.inboxId);
  const query = draft.query ?? {};
  const qs = new URLSearchParams(query).toString();
  const path = `/in/${slug}${draft.subpath ?? ""}${qs ? `?${qs}` : ""}`;
  const body =
    draft.rawBody ?? (draft.body === undefined ? "" : JSON.stringify(draft.body));
  const contentType =
    draft.contentType ?? (draft.body === undefined ? "" : "application/json; charset=utf-8");
  const headers: Record<string, string> = {
    host: "hooks.nexus.dev",
    accept: "*/*",
    "x-forwarded-for": draft.sourceIp,
    "x-forwarded-proto": "https",
    ...draft.headers,
  };
  if (contentType) headers["content-type"] = contentType;
  if (body) headers["content-length"] = String(new TextEncoder().encode(body).length);

  return {
    id: `req_${String(index + 1).padStart(3, "0")}${slug.slice(0, 5)}`,
    inboxId: draft.inboxId,
    method: draft.method,
    path,
    query,
    headers,
    body,
    contentType,
    receivedAt: new Date(now - draft.ago).toISOString(),
    sourceIp: draft.sourceIp,
    event: detectEvent(body, headers),
  };
}

export function detectEvent(body: string, headers: Record<string, string>): string | null {
  if (headers["x-shop-topic"]) return headers["x-shop-topic"];
  if (!body) return null;
  try {
    const parsed: unknown = JSON.parse(body);
    if (parsed && typeof parsed === "object") {
      const rec = parsed as Record<string, unknown>;
      for (const key of ["type", "event"]) {
        const v = rec[key];
        if (typeof v === "string") return v;
      }
    }
  } catch {
    const match = /(?:^|&)event=([^&]+)/.exec(body);
    if (match?.[1]) return decodeURIComponent(match[1]);
  }
  return null;
}

export function createSeedStore(now = Date.now()): Store {
  const inboxes: Inbox[] = INBOXES.map(({ createdAgo, ...rest }) => ({
    ...rest,
    endpoint: buildEndpoint(rest.slug),
    createdAt: new Date(now - createdAgo).toISOString(),
  }));
  return {
    version: 1,
    inboxes,
    requests: DRAFTS.map((d, i) => toRequest(d, i, now)),
    profile: {
      name: "Alex Morgan",
      email: "alex@acme.dev",
      role: "Backend Engineer",
      workspace: "Acme Inc.",
    },
  };
}

/** Sample payloads used by "Send test request" on an empty inbox. */
export const SAMPLE_EVENTS = [
  {
    type: "payment.succeeded",
    payload: { type: "payment.succeeded", data: { id: "pi_test_123", amount: 2500, currency: "usd", status: "succeeded" } },
  },
  {
    type: "payment.failed",
    payload: { type: "payment.failed", data: { id: "pi_test_456", amount: 990, currency: "usd", failure_code: "card_declined" } },
  },
  {
    type: "order.created",
    payload: { event: "order.created", order_number: 2001, total_price: "64.00", currency: "USD", line_items: [{ sku: "CAP-NVY", quantity: 1 }] },
  },
  {
    type: "user.created",
    payload: { type: "user.created", data: { id: "user_test_789", email: "test@example.com", name: "Test User" } },
  },
] as const;
