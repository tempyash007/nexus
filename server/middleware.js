import jwt from "jsonwebtoken";

import { config } from "./config.js";
import { User } from "./models.js";
import { HttpError } from "./utils.js";

export function issueSession(userId) {
  return jwt.sign({ sub: String(userId) }, config.JWT_SECRET, {
    expiresIn: "7d",
  });
}

export function setSessionCookie(res, token) {
  res.cookie(config.COOKIE_NAME, token, {
    httpOnly: true,
    secure: config.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export function clearSessionCookie(res) {
  res.clearCookie(config.COOKIE_NAME, {
    httpOnly: true,
    sameSite: "lax",
    secure: config.NODE_ENV === "production",
  });
}

export async function requireAuth(req, _res, next) {
  try {
    const token = req.cookies?.[config.COOKIE_NAME];
    if (!token) throw new HttpError(401, "Authentication required");
    const payload = jwt.verify(token, config.JWT_SECRET);
    const user = await User.findById(payload.sub).lean();
    if (!user) throw new HttpError(401, "Authentication required");
    req.user = user;
    next();
  } catch (error) {
    next(
      error instanceof HttpError
        ? error
        : new HttpError(401, "Authentication required"),
    );
  }
}

export function notFound(_req, _res, next) {
  next(new HttpError(404, "Route not found"));
}

export function errorHandler(error, _req, res, _next) {
  let status = error.status;
  if (!status) {
    if (
      error.name === "ValidationError" ||
      error.name === "ZodError" ||
      error.name === "CastError"
    )
      status = 400;
    else if (error.type === "entity.too.large") status = 413;
    else status = 500;
  }
  if (status >= 500) console.error(error);
  res.status(status).json({
    error: error.message || "Internal server error",
    ...(error.details ? { details: error.details } : {}),
    ...(error.name === "ZodError" ? { details: error.issues } : {}),
  });
}
