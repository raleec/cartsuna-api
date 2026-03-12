import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { buildApp } from "../../src/app.js";

// Mock the database and redis to avoid real connections in unit tests
vi.mock("../../src/db/connection.js", () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    }),
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([
          {
            userId: "00000000-0000-0000-0000-000000000001",
            email: "test@example.com",
            name: "Test User",
            role: "customer",
            passphrase: "$2b$12$hashedpassword",
          },
        ]),
      }),
    }),
  },
  pool: {
    connect: vi.fn(),
    end: vi.fn(),
  },
}));

vi.mock("../../src/redis/client.js", () => ({
  redis: {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue("OK"),
    setex: vi.fn().mockResolvedValue("OK"),
  },
}));

vi.mock("../../src/queue/producer.js", () => ({
  publishEvent: vi.fn().mockResolvedValue(undefined),
  eventQueue: {
    add: vi.fn().mockResolvedValue(undefined),
  },
}));

describe("POST /auth/register", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns 400 for invalid payload", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { email: "not-an-email", password: "short" },
    });
    expect(response.statusCode).toBe(400);
  });
});

describe("POST /auth/login - invalid credentials", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns 401 when user not found", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "nobody@example.com", password: "password123" },
    });
    expect(response.statusCode).toBe(401);
  });
});
