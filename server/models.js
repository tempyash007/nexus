import mongoose from "mongoose";

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    passwordHash: { type: String, required: true, select: false },
  },
  { timestamps: true },
);

const inboxSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 60 },
    captureTokenHash: {
      type: String,
      required: true,
      unique: true,
      select: false,
    },
    captureTokenLast4: { type: String, required: true, select: false },
    requestCount: { type: Number, default: 0 },
    lastReceivedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

const webhookEventSchema = new Schema(
  {
    inbox: {
      type: Schema.Types.ObjectId,
      ref: "Inbox",
      required: true,
      index: true,
    },
    method: { type: String, required: true },
    originalUrl: { type: String, required: true },
    query: { type: Schema.Types.Mixed, default: {} },
    headers: { type: Schema.Types.Mixed, default: {} },
    rawBody: { type: Buffer, default: Buffer.alloc(0) },
    contentType: { type: String, default: "" },
    bodySize: { type: Number, required: true },
    sourceIp: { type: String, default: "" },
    receivedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true },
);

webhookEventSchema.index({ inbox: 1, receivedAt: -1 });

export const User = mongoose.model("User", userSchema);
export const Inbox = mongoose.model("Inbox", inboxSchema);
export const WebhookEvent = mongoose.model("WebhookEvent", webhookEventSchema);
