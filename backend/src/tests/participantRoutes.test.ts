import { describe, it, expect, beforeEach, mock } from "bun:test";
import express from "express";
import request from "supertest";

// Mock Socket.IO
const mockIo = {
  to: mock(() => ({
    emit: mock(() => {}),
  })),
};

mock.module("../index", () => ({
  io: mockIo,
}));

// Mock services
const mockRoomService = {
  exists: mock<() => Promise<[Error | null, boolean, number]>>(async () => [
    null,
    true,
    200,
  ]),
  getState: mock<() => Promise<[Error | null, string, number]>>(async () => [
    null,
    "nominating",
    200,
  ]),
  getHostKey: mock<() => Promise<[Error | null, string, number]>>(async () => [
    null,
    "secret-host-key",
    200,
  ]),
};

const mockUserRoomService = {
  enrollUser: mock<() => Promise<[Error | null, number]>>(async () => [
    null,
    200,
  ]),
};

mock.module("../config/RoomService", () => ({
  __esModule: true,
  default: function () {
    return mockRoomService;
  },
}));

mock.module("../config/UserRoomService", () => ({
  __esModule: true,
  default: function () {
    return mockUserRoomService;
  },
}));

// Import after mocking
const { router: participantRoutes } = await import(
  "../routes/participantRoutes"
);

describe("Room Router", () => {
  let app: express.Application;

  beforeEach(() => {
    // Reset all mocks before each test
    mockRoomService.exists.mockClear();
    mockRoomService.getState.mockClear();
    mockRoomService.getHostKey.mockClear();
    mockUserRoomService.enrollUser.mockClear();
    mockIo.to.mockClear();

    // Create a fresh Express app for each test
    app = express();
    app.use(express.json());
    app.use(participantRoutes);
  });

  describe("POST /room/join", () => {
    it("should successfully join a room with valid data", async () => {
      const response = await request(app).post("/room/join").send({
        roomId: "test-room-123",
        userName: "testUser",
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: "Joined room successfully",
        roomId: "test-room-123",
        userName: "testUser",
      });

      // Verify service calls
      expect(mockRoomService.exists).toHaveBeenCalledWith("test-room-123");
      expect(mockRoomService.getState).toHaveBeenCalledWith("test-room-123");
      expect(mockUserRoomService.enrollUser).toHaveBeenCalledWith(
        "test-room-123",
        "testUser",
      );

      // Verify Socket.IO emission
      expect(mockIo.to).toHaveBeenCalledWith("test-room-123");
    });

    it("should return 400 when roomId is missing", async () => {
      const response = await request(app).post("/room/join").send({
        userName: "testUser",
      });

      expect(response.status).toBe(400);
    });

    it("should return 404 when room does not exist", async () => {
      mockRoomService.exists.mockResolvedValueOnce([null, false, 404]);

      const response = await request(app).post("/room/join").send({
        roomId: "nonexistent-room",
        userName: "testUser",
      });

      expect(response.status).toBe(404);

      expect(mockRoomService.exists).toHaveBeenCalledWith("nonexistent-room");
      // Should not proceed to check state or add user
      expect(mockRoomService.getState).not.toHaveBeenCalled();
      expect(mockUserRoomService.enrollUser).not.toHaveBeenCalled();
    });

    it("should return 403 when room is not in nominating state", async () => {
      mockRoomService.getState.mockResolvedValueOnce([null, "voting", 200]);

      const response = await request(app).post("/room/join").send({
        roomId: "test-room-123",
        userName: "testUser",
      });

      expect(response.status).toBe(403);

      expect(mockRoomService.exists).toHaveBeenCalledWith("test-room-123");
      expect(mockRoomService.getState).toHaveBeenCalledWith("test-room-123");
      // Should not add user to room
      expect(mockUserRoomService.enrollUser).not.toHaveBeenCalled();
    });

    it("should handle service errors gracefully", async () => {
      mockRoomService.exists.mockResolvedValueOnce([
        new Error("service error"),
        false,
        500,
      ]);

      const response = await request(app).post("/room/join").send({
        roomId: "test-room-123",
        userName: "testUser",
      });

      expect(response.status).toBe(500);
    });
  });

  describe("GET /room/:roomId/getRole", () => {
    it("should return user role when no hostKey is provided", async () => {
      const response = await request(app)
        .get("/room/test-room-123/getRole")
        .send({});

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        role: "user",
      });

      expect(mockRoomService.exists).toHaveBeenCalledWith("test-room-123");
    });

    it("should return host role when correct hostKey is provided", async () => {
      const response = await request(app)
        .get("/room/test-room-123/getRole")
        .send({
          hostKey: "secret-host-key",
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        role: "host",
      });

      expect(mockRoomService.exists).toHaveBeenCalledWith("test-room-123");
      expect(mockRoomService.getHostKey).toHaveBeenCalledWith("test-room-123");
    });

    it("should return user role when incorrect hostKey is provided", async () => {
      const response = await request(app)
        .get("/room/test-room-123/getRole")
        .send({
          hostKey: "wrong-key",
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        role: "user",
      });

      expect(mockRoomService.exists).toHaveBeenCalledWith("test-room-123");
      expect(mockRoomService.getHostKey).toHaveBeenCalledWith("test-room-123");
    });

    it("should return 404 when room does not exist", async () => {
      mockRoomService.exists.mockResolvedValueOnce([null, false, 404]);

      const response = await request(app)
        .get("/room/nonexistent-room/getRole")
        .send({
          hostKey: "some-key",
        });

      expect(response.status).toBe(404);

      expect(mockRoomService.exists).toHaveBeenCalledWith("nonexistent-room");
      // Should not proceed to check hostKey
      expect(mockRoomService.getHostKey).not.toHaveBeenCalled();
    });

    it("should handle service errors gracefully", async () => {
      mockRoomService.exists.mockResolvedValueOnce([
        new Error("service error"),
        false,
        500,
      ]);

      const response = await request(app)
        .get("/room/test-room-123/getRole")
        .send({});

      expect(response.status).toBe(500);
    });
  });
});
