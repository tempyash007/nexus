import crypto from "node:crypto";

const SENSITIVE_HEADER =
  /authorization|cookie|set-cookie|api[-_]?key|token|secret|password|signature/i;

export function createCaptureToken() {
  return crypto.randomBytes(24).toString("base64url");
}

export function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function redactHeaders(headers) {
  return Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [
      key,
      SENSITIVE_HEADER.test(key) ? "[REDACTED]" : String(value),
    ]),
  );
}

export function serializeEvent(event) {
  return {
    id: event._id,
    inboxId: event.inbox,
    method: event.method,
    originalUrl: event.originalUrl,
    query: event.query,
    headers: event.headers,
    body: event.rawBody?.toString("utf8") ?? "",
    contentType: event.contentType,
    bodySize: event.bodySize,
    sourceIp: event.sourceIp,
    receivedAt: event.receivedAt,
  };
}

export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}
