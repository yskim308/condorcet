import { describe, it, expect, beforeEach, mock } from "bun:test";
import express from "express";
import request from "supertest";

// Mock SocketService
const mockSocketService = {
  emitNewUser: mock<() => void>(() => {}),
};

mock.module("../../config/SocketService", () => ({
  __esModule: true,
  default: function () {
    return mockSocketService;
  },
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

mock.module("../../config/RoomService", () => ({
  __esModule: true,
  default: mockRoomService,
}));

mock.module("../../config/UserRoomService", () => ({
  __esModule: true,
  default: mockUserRoomService,
}));

// Import after mocking
const { createParticipantRouter } = await import(
  "../../routes/participantRoutes"
);

describe("Participant Router", () => {
  let app: express.Application;

  beforeEach(() => {
    // Reset all mocks before each test
    mockRoomService.exists.mockClear();
    mockRoomService.getState.mockClear();
    mockRoomService.getHostKey.mockClear();
    mockUserRoomService.enrollUser.mockClear();
    mockSocketService.emitNewUser.mockClear();

    // Create a fresh Express app for each test
    app = express();
    app.use(express.json());
    const participantRouter = createParticipantRouter(mockSocketService as any);
    app.use(participantRouter);
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
      expect(mockSocketService.emitNewUser).toHaveBeenCalledWith(
        "test-room-123",
        "testUser",
      );
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
        .post("/room/test-room-123/getRole")
        .send({});

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        role: "user",
      });

      expect(mockRoomService.exists).toHaveBeenCalledWith("test-room-123");
    });

    it("should return host role when correct hostKey is provided", async () => {
      const response = await request(app)
        .post("/room/test-room-123/getRole")
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
        .post("/room/test-room-123/getRole")
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
        .post("/room/nonexistent-room/getRole")
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
        .post("/room/test-room-123/getRole")
        .send({});

      expect(response.status).toBe(500);
    });
  });
});
