import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

import { config } from "./config.js";
import authRoutes from "./routes/auth.js";
import inboxRoutes from "./routes/inboxes.js";
import eventRoutes from "./routes/events.js";
import { errorHandler, notFound } from "./middleware.js";
import { registerCaptureRoutes } from "./capture.js";

export const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(cors({ origin: config.FRONTEND_ORIGIN, credentials: true }));
app.use(cookieParser());
app.use((req, _res, next) => {
  const safePath = req.originalUrl.replace(
    /(\/hooks\/)[^/?]+/,
    "$1[capture-token]",
  );
  console.info(`${req.method} ${safePath}`);
  next();
});

registerCaptureRoutes(app);
app.use(express.json({ limit: "100kb" }));
app.get("/health", (_req, res) => res.json({ ok: true, service: "nexus-api" }));
app.use("/api/auth", authRoutes);
app.use("/api/inboxes", inboxRoutes);
app.use("/api", eventRoutes);
app.use(notFound);
app.use(errorHandler);
