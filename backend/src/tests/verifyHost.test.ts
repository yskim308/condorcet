import { describe, it, expect, beforeEach, mock } from "bun:test";
import express from "express";
import request from "supertest";

// Mock RoomService
const mockRoomService = {
  getHostKey: mock(async (roomId: string) => {
    if (roomId === "room123") {
      return [null, "test-host-key", 200];
    }
    return [new Error("Room not found"), null, 404];
  }),
};

mock.module("../config/RoomService", () => ({
  __esModule: true,
  default: function () {
    return mockRoomService;
  },
}));

// Import after mocking
const { verifyHost } = await import("../middleware/verifyHost");

describe("verifyHost Middleware", () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.post("/test/:roomId", verifyHost, (req, res) => {
      res.status(200).send("OK");
    });

    // Reset mocks
    mockRoomService.getHostKey.mockClear();
  });

  it("should call next() if host key is valid", async () => {
    const response = await request(app).post("/test/room123").send({
      hostKey: "test-host-key",
    });

    expect(response.status).toBe(200);
    expect(response.text).toBe("OK");
    expect(mockRoomService.getHostKey).toHaveBeenCalledWith("room123");
  });

  it("should return 401 if no host key is provided", async () => {
    const response = await request(app).post("/test/room123").send({});

    expect(response.status).toBe(401);
  });

  it("should return 403 if host key is invalid", async () => {
    const response = await request(app).post("/test/room123").send({
      hostKey: "invalid-key",
    });

    expect(response.status).toBe(403);
  });

  it("should return 500 if the service throws an error", async () => {
    mockRoomService.getHostKey.mockResolvedValueOnce([
      new Error("service error"),
      null,
      500,
    ]);

    const response = await request(app).post("/test/room123").send({
      hostKey: "test-host-key",
    });

    expect(response.status).toBe(500);
  });
});
