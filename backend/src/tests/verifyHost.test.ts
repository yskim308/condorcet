import { describe, it, expect, beforeEach, mock } from "bun:test";
import express from "express";
import request from "supertest";

// Mock dependencies before importing verifyHost
const mockRedisClient = {
  hGet: mock((key: string, field: string) => {
    if (key === "room:room123" && field === "hostKey") {
      return Promise.resolve("test-host-key");
    }
    return Promise.resolve(null);
  }),
};

mock.module("../config/redisClient", () => ({
  redisClient: mockRedisClient,
}));

// Import after mocking
const { verifyHost } = await import("../middleware/verifyHost.js");

describe("verifyHost Middleware", () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.post("/test/:roomId", verifyHost, (req, res) => {
      res.status(200).send("OK");
    });

    // Reset mocks
    mockRedisClient.hGet.mockClear();
  });

  it("should call next() if host key is valid", async () => {
    const response = await request(app).post("/test/room123").send({
      hostKey: "test-host-key",
    });

    expect(response.status).toBe(200);
    expect(response.text).toBe("OK");
    expect(mockRedisClient.hGet).toHaveBeenCalledWith(
      "room:room123",
      "hostKey",
    );
  });

  it("should return 401 if no host key is provided", async () => {
    const response = await request(app).post("/test/room123").send({});

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("no host key provided");
  });

  it("should return 403 if host key is invalid", async () => {
    const response = await request(app).post("/test/room123").send({
      hostKey: "invalid-key",
    });

    expect(response.status).toBe(403);
    expect(response.body.error).toBe("invalid host key");
  });

  it("should return 500 if redis throws an error", async () => {
    mockRedisClient.hGet = mock(() => {
      return Promise.reject(new Error("redis error"));
    }) as typeof mockRedisClient.hGet;

    const response = await request(app).post("/test/room123").send({
      hostKey: "test-host-key",
    });

    expect(response.status).toBe(500);
    expect(response.body.error).toBe("host key verification failed");
  });
});
