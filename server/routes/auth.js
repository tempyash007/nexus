import bcrypt from "bcrypt";
import { Router } from "express";
import { z } from "zod";

import { config } from "../config.js";
import { User } from "../models.js";
import {
  clearSessionCookie,
  issueSession,
  requireAuth,
  setSessionCookie,
} from "../middleware.js";
import { HttpError } from "../utils.js";

const router = Router();
const credentials = z.object({
  email: z
    .string()
    .email()
    .transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(128),
  name: z.string().trim().min(1).max(80).optional(),
});

const publicUser = (user) => ({
  id: user._id,
  email: user.email,
  name: user.name,
});

router.post("/register", async (req, res, next) => {
  try {
    const input = credentials.parse(req.body);
    if (!input.name) throw new HttpError(400, "Name is required");
    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await User.create({
      email: input.email,
      name: input.name,
      passwordHash,
    });
    setSessionCookie(res, issueSession(user._id));
    res.status(201).json({ user: publicUser(user) });
  } catch (error) {
    next(
      error?.code === 11000
        ? new HttpError(409, "Email is already registered")
        : error,
    );
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const input = credentials
      .pick({ email: true, password: true })
      .parse(req.body);
    const user = await User.findOne({ email: input.email }).select(
      "+passwordHash",
    );
    if (!user || !(await bcrypt.compare(input.password, user.passwordHash)))
      throw new HttpError(401, "Invalid email or password");
    setSessionCookie(res, issueSession(user._id));
    res.json({ user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

router.post("/logout", (_req, res) => {
  clearSessionCookie(res);
  res.status(204).end();
});
router.get("/me", requireAuth, (req, res) =>
  res.json({ user: publicUser(req.user) }),
);

export default router;
