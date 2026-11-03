import mongoose from "mongoose";

import { config } from "./config.js";

export async function connectDatabase() {
  await mongoose.connect(config.MONGODB_URI);
  console.log("MongoDB connected");
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
}
