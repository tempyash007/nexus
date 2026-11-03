import express, { Router } from "express";
import rateLimit from "express-rate-limit";

import { Inbox, WebhookEvent } from "./models.js";
import { hashToken, redactHeaders } from "./utils.js";

const router = Router();
const captureRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Capture rate limit exceeded" },
});

async function capture(req, res) {
  try {
    const inbox = await Inbox.findOne({
      captureTokenHash: hashToken(req.params.captureToken),
    }).select("+captureTokenHash");
    if (!inbox)
      return res.status(404).json({ error: "Webhook endpoint not found" });

    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
    const event = await WebhookEvent.create({
      inbox: inbox._id,
      method: req.method,
      originalUrl: req.originalUrl.replace(
        `/hooks/${req.params.captureToken}`,
        "/hooks/[capture-token]",
      ),
      query: req.query,
      headers: redactHeaders(req.headers),
      rawBody,
      contentType: req.get("content-type") ?? "",
      bodySize: rawBody.length,
      sourceIp: req.ip,
    });
    await Inbox.updateOne(
      { _id: inbox._id },
      { $inc: { requestCount: 1 }, $set: { lastReceivedAt: event.receivedAt } },
    );
    return res.status(200).json({ received: true, eventId: event._id });
  } catch (error) {
    console.error("Webhook persistence failed", {
      method: req.method,
      error: error.message,
    });
    return res.status(503).json({ error: "Webhook could not be persisted" });
  }
}

export function registerCaptureRoutes(app) {
  // Raw parsing is intentionally scoped to capture routes and runs before any JSON parser.
  app.all(
    "/hooks/:captureToken",
    captureRateLimit,
    express.raw({ type: () => true, limit: "1mb" }),
    (req, res, next) => capture(req, res).catch(next),
  );
}
