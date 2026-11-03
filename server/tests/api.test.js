import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret-that-is-long-enough-for-jwt-tests";
process.env.FRONTEND_ORIGIN = "http://localhost:5173";
process.env.WEBHOOK_BASE_URL = "http://localhost:4000/hooks";

const mongo = await MongoMemoryServer.create();
process.env.MONGODB_URI = mongo.getUri();
const [
  { app },
  { connectDatabase, disconnectDatabase },
  { User, Inbox, WebhookEvent },
] = await Promise.all([
  import("../app.js"),
  import("../db.js"),
  import("../models.js"),
]);

describe("Nexus API", () => {
  let agent;
  let captureEndpoint;

  before(async () => {
    await connectDatabase();
    agent = request.agent(app);
  });

  after(async () => {
    await User.deleteMany({});
    await Inbox.deleteMany({});
    await WebhookEvent.deleteMany({});
    await disconnectDatabase();
    await mongo.stop();
  });

  it("registers, authenticates, creates an inbox, captures raw JSON, and lists it", async () => {
    const registered = await agent
      .post("/api/auth/register")
      .send({
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      })
      .expect(201);
    assert.equal(registered.body.user.email, "test@example.com");

    const created = await agent
      .post("/api/inboxes")
      .send({ name: "Payments" })
      .expect(201);
    captureEndpoint = created.body.inbox.endpoint;
    assert.match(captureEndpoint, /^http:\/\/localhost:4000\/hooks\//);

    const captured = await request(app)
      .post(new URL(captureEndpoint).pathname + "?attempt=2")
      .set("Content-Type", "application/json")
      .set("Authorization", "Bearer secret")
      .send('{"event":"payment.succeeded"}')
      .expect(200);
    assert.equal(captured.body.received, true);

    const events = await agent
      .get(`/api/inboxes/${created.body.inbox.id}/events`)
      .expect(200);
    assert.equal(events.body.pagination.total, 1);
    assert.equal(events.body.events[0].body, '{"event":"payment.succeeded"}');
    assert.equal(events.body.events[0].headers.authorization, "[REDACTED]");
    assert.deepEqual(events.body.events[0].query, { attempt: "2" });
  });

  it("rejects unauthenticated resource access", async () => {
    await request(app).get("/api/inboxes").expect(401);
  });
});
