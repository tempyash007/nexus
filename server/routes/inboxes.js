import { Router } from "express";
import { z } from "zod";

import { config } from "../config.js";
import { Inbox, WebhookEvent } from "../models.js";
import { requireAuth } from "../middleware.js";
import { createCaptureToken, hashToken, HttpError } from "../utils.js";

const router = Router();
const nameSchema = z.object({ name: z.string().trim().min(1).max(60) });

router.use(requireAuth);

router.post("/", async (req, res, next) => {
  try {
    const { name } = nameSchema.parse(req.body);
    const token = createCaptureToken();
    const inbox = await Inbox.create({
      user: req.user._id,
      name,
      captureTokenHash: hashToken(token),
      captureTokenLast4: token.slice(-4),
    });
    res.status(201).json({
      inbox: {
        id: inbox._id,
        name: inbox.name,
        endpoint: `${config.WEBHOOK_BASE_URL}/${token}`,
        requestCount: 0,
        lastReceivedAt: null,
        createdAt: inbox.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const inboxes = await Inbox.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .lean();
    res.json({
      inboxes: inboxes.map((inbox) => ({
        id: inbox._id,
        name: inbox.name,
        requestCount: inbox.requestCount,
        lastReceivedAt: inbox.lastReceivedAt,
        createdAt: inbox.createdAt,
      })),
    });
  } catch (error) {
    next(error);
  }
});

router.delete("/:inboxId", async (req, res, next) => {
  try {
    const inbox = await Inbox.findOne({
      _id: req.params.inboxId,
      user: req.user._id,
    });
    if (!inbox) throw new HttpError(404, "Inbox not found");
    await WebhookEvent.deleteMany({ inbox: inbox._id });
    await inbox.deleteOne();
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

export default router;
