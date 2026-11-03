import { Router } from "express";
import { z } from "zod";

import { Inbox, WebhookEvent } from "../models.js";
import { requireAuth } from "../middleware.js";
import { HttpError, serializeEvent } from "../utils.js";

const router = Router();
router.use(requireAuth);

async function ownedInbox(userId, inboxId) {
  const inbox = await Inbox.findOne({ _id: inboxId, user: userId }).lean();
  if (!inbox) throw new HttpError(404, "Inbox not found");
  return inbox;
}

router.get("/inboxes/:inboxId/events", async (req, res, next) => {
  try {
    await ownedInbox(req.user._id, req.params.inboxId);
    const page = z.coerce
      .number()
      .int()
      .positive()
      .default(1)
      .parse(req.query.page);
    const limit = Math.min(
      100,
      z.coerce.number().int().positive().default(25).parse(req.query.limit),
    );
    const [events, total] = await Promise.all([
      WebhookEvent.find({ inbox: req.params.inboxId })
        .sort({ receivedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      WebhookEvent.countDocuments({ inbox: req.params.inboxId }),
    ]);
    res.json({
      events: events.map(serializeEvent),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
});

router.get("/inboxes/:inboxId/events/:eventId", async (req, res, next) => {
  try {
    await ownedInbox(req.user._id, req.params.inboxId);
    const event = await WebhookEvent.findOne({
      _id: req.params.eventId,
      inbox: req.params.inboxId,
    });
    if (!event) throw new HttpError(404, "Event not found");
    res.json({ event: serializeEvent(event) });
  } catch (error) {
    next(error);
  }
});

router.delete("/inboxes/:inboxId/events/:eventId", async (req, res, next) => {
  try {
    await ownedInbox(req.user._id, req.params.inboxId);
    const result = await WebhookEvent.deleteOne({
      _id: req.params.eventId,
      inbox: req.params.inboxId,
    });
    if (!result.deletedCount) throw new HttpError(404, "Event not found");
    await Inbox.updateOne(
      { _id: req.params.inboxId },
      { $inc: { requestCount: -1 } },
    );
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

router.delete("/inboxes/:inboxId/events", async (req, res, next) => {
  try {
    await ownedInbox(req.user._id, req.params.inboxId);
    await WebhookEvent.deleteMany({ inbox: req.params.inboxId });
    await Inbox.updateOne(
      { _id: req.params.inboxId },
      { $set: { requestCount: 0, lastReceivedAt: null } },
    );
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

export default router;
