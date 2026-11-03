import type { HttpMethod, WebhookRequest } from "@/services/types";

export type MethodFilter = HttpMethod | "ALL";

/** Filters by method and a case-insensitive search over path, event, content type and body. */
export function filterRequests<T extends WebhookRequest>(
  requests: T[],
  { search, method }: { search: string; method: MethodFilter },
): T[] {
  const q = search.trim().toLowerCase();
  return requests.filter((r) => {
    if (method !== "ALL" && r.method !== method) return false;
    if (!q) return true;
    return [r.path, r.event ?? "", r.contentType, r.body, r.method].some((field) =>
      field.toLowerCase().includes(q),
    );
  });
}

const SENSITIVE_EXACT = new Set([
  "authorization",
  "proxy-authorization",
  "cookie",
  "set-cookie",
]);
const SENSITIVE_PATTERN = /(api[-_]?key|apikey|secret|token|password)/i;

export function isSensitiveHeader(name: string): boolean {
  const lower = name.toLowerCase();
  return SENSITIVE_EXACT.has(lower) || SENSITIVE_PATTERN.test(lower);
}

export const MASK = "••••••••";

/** Masks sensitive header values. Keeps an auth scheme (e.g. "Bearer") for context. */
export function maskHeaderValue(name: string, value: string): string {
  if (!isSensitiveHeader(name)) return value;
  const lower = name.toLowerCase();
  if (lower === "authorization" || lower === "proxy-authorization") {
    const match = /^(\w+)\s+\S+/.exec(value);
    if (match?.[1]) return `${match[1]} ${MASK}`;
  }
  return MASK;
}

export type ParsedBody =
  | { kind: "empty" }
  | { kind: "json"; raw: string; formatted: string }
  | { kind: "text"; raw: string; invalidJson: boolean };

export function parseBody(body: string, contentType: string): ParsedBody {
  if (!body) return { kind: "empty" };
  const looksJson = /json/i.test(contentType) || /^\s*[[{]/.test(body);
  if (looksJson) {
    try {
      const parsed: unknown = JSON.parse(body);
      return { kind: "json", raw: body, formatted: JSON.stringify(parsed, null, 2) };
    } catch {
      return { kind: "text", raw: body, invalidJson: /json/i.test(contentType) };
    }
  }
  return { kind: "text", raw: body, invalidJson: false };
}

export function byteLength(text: string): number {
  return new TextEncoder().encode(text).length;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function shortContentType(contentType: string): string {
  return contentType.split(";")[0]?.trim() || "—";
}

export function bodyPreview(body: string, max = 80): string {
  if (!body) return "";
  const flat = body.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max)}…` : flat;
}

/** Splits "/in/abc/stripe?x=1" into path and query string for display. */
export function splitPath(path: string): { pathname: string; search: string } {
  const i = path.indexOf("?");
  return i === -1 ? { pathname: path, search: "" } : { pathname: path.slice(0, i), search: path.slice(i) };
}
