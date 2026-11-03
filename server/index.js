import { app } from "./app.js";
import { config } from "./config.js";
import { connectDatabase } from "./db.js";

try {
  await connectDatabase();
  app.listen(config.PORT, () =>
    console.log(`Nexus API listening on http://localhost:${config.PORT}`),
  );
} catch (error) {
  console.error("Failed to start Nexus API", error);
  process.exit(1);
}
