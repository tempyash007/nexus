import { beforeEach, describe, expect, it } from "vitest";

import { createSeedStore } from "@/services/mock-data";
import { __resetForTests, webhookService } from "@/services/webhook-service";

describe("mock webhook service", () => {
  beforeEach(() => {
    __resetForTests(createSeedStore(Date.parse("2026-11-17T12:00:00.000Z")));
  });

  it("creates a unique inbox and exposes its endpoint", async () => {
    const before = await webhookService.listInboxes();
    const created = await webhookService.createInbox("Razorpay Sandbox");
    const after = await webhookService.listInboxes();

    expect(after).toHaveLength(before.length + 1);
    expect(created.name).toBe("Razorpay Sandbox");
    expect(created.endpoint).toMatch(/^https:\/\/hooks\.nexus\.dev\/in\/[a-z0-9]{12}$/);
    expect(created.requestCount).toBe(0);
  });

  it("adds a test webhook that can be inspected and cleared", async () => {
    const inbox = (await webhookService.listInboxes())[0];
    expect(inbox).toBeDefined();

    const request = await webhookService.sendTestRequest(inbox!.id);
    const requests = await webhookService.listRequests(inbox!.id);
    expect(request.method).toBe("POST");
    expect(request.event).toBeTruthy();
    expect(requests.some((item) => item.id === request.id)).toBe(true);

    await webhookService.clearRequests(inbox!.id);
    expect(await webhookService.listRequests(inbox!.id)).toHaveLength(0);
  });

  it("saves a custom URL request into a selected inbox", async () => {
    const inbox = (await webhookService.listInboxes())[0]!;
    const request = await webhookService.saveDraftRequest(inbox.id, {
      url: "https://merchant.example/hooks/payment?attempt=2",
      method: "POST",
      headers: { "content-type": "application/json", "x-test": "true" },
      body: '{"event":"payment.succeeded"}',
    });

    expect(request.path).toBe("/hooks/payment?attempt=2");
    expect(request.query).toEqual({ attempt: "2" });
    expect(request.event).toBe("payment.succeeded");
  });
});
