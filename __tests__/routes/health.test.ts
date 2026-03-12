import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../../src/app.js";

describe("GET /health", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeAll(async () => {
    try {
      app = await buildApp();
      await app.ready();
    } catch (err) {
      console.error("buildApp error:", err);
      throw err;
    }
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it("returns status ok", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/health",
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "ok" });
  });
});
