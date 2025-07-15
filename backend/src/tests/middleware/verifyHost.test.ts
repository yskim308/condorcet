import { describe, it, expect, beforeEach, mock } from "bun:test";
import express from "express";
import request from "supertest";
import { createVerifyHostMiddleware } from "../../middleware/verifyHost";
import type RoomService from "../../config/RoomService";

// Mock RoomService
const mockRoomService: Partial<RoomService> = {
  getHostKey: mock(async (roomId: string) => {
    if (roomId === "room123") {
      return [null, "test-host-key", 200];
    }
    return [new Error("Room not found"), "", 404];
  }),
};

describe("verifyHost Middleware", () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    const verifyHost = createVerifyHostMiddleware(mockRoomService as RoomService);
    app.post("/test/:roomId", verifyHost, (req, res) => {
      res.status(200).send("OK");
    });

    // Reset mocks
    (mockRoomService.getHostKey as any).mockClear();
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
    (mockRoomService.getHostKey as any).mockResolvedValueOnce([
      new Error("service error"),
      "",
      500,
    ]);

    const response = await request(app).post("/test/room123").send({
      hostKey: "test-host-key",
    });

    expect(response.status).toBe(500);
  });
});