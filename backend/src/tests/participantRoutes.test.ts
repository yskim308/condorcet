import { describe, it, expect, beforeEach, mock } from "bun:test";
import express from "express";
import request from "supertest";

// Mock Redis client
const mockRedisClient = {
  exists: mock(() => Promise.resolve(1)),
  hGet: mock(() => Promise.resolve("nominating")),
  sAdd: mock(() => Promise.resolve(1)),
};

// Mock Socket.IO
const mockIo = {
  to: mock(() => ({
    emit: mock(() => {}),
  })),
};

// Mock the modules
mock.module("../config/redisClient", () => ({
  redisClient: mockRedisClient,
}));

mock.module("../index", () => ({
  io: mockIo,
}));

// Import after mocking
const { router: participantRoutes } = await import(
  "../routes/participantRoutes"
);
describe("Room Router", () => {
  let app: express.Application;

  beforeEach(() => {
    // Reset all mocks before each test
    mockRedisClient.exists.mockClear();
    mockRedisClient.hGet.mockClear();
    mockRedisClient.sAdd.mockClear();
    mockIo.to.mockClear();

    // Create a fresh Express app for each test
    app = express();
    app.use(express.json());
    app.use("/participant", participantRoutes);
  });

  describe("POST /room/join", () => {
    it("should successfully join a room with valid data", async () => {
      mockRedisClient.exists.mockResolvedValue(1);
      mockRedisClient.hGet.mockResolvedValue("nominating");
      mockRedisClient.sAdd.mockResolvedValue(1);

      const response = await request(app).post("/participant/room/join").send({
        roomId: "test-room-123",
        userName: "testUser",
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: "Joined room successfully",
        roomId: "test-room-123",
        userName: "testUser",
      });

      // Verify Redis calls
      expect(mockRedisClient.exists).toHaveBeenCalledWith("room:test-room-123");
      expect(mockRedisClient.hGet).toHaveBeenCalledWith(
        "room:test-room-123",
        "state",
      );
      expect(mockRedisClient.sAdd).toHaveBeenCalledWith(
        "room:test-room-123:users",
        "testUser",
      );

      // Verify Socket.IO emission
      expect(mockIo.to).toHaveBeenCalledWith("test-room-123");
    });

    it("should return 400 when roomId is missing", async () => {
      const response = await request(app).post("/participant/room/join").send({
        userName: "testUser",
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: "roomId and userName are required",
      });
    });

    it("should return 400 when userName is missing", async () => {
      const response = await request(app).post("/participant/room/join").send({
        roomId: "test-room-123",
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: "roomId and userName are required",
      });
    });

    it("should return 400 when both roomId and userName are missing", async () => {
      const response = await request(app)
        .post("/participant/room/join")
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: "roomId and userName are required",
      });
    });

    it("should return 404 when room does not exist", async () => {
      mockRedisClient.exists.mockResolvedValue(0);

      const response = await request(app).post("/participant/room/join").send({
        roomId: "nonexistent-room",
        userName: "testUser",
      });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        error: "Room not found",
      });

      expect(mockRedisClient.exists).toHaveBeenCalledWith(
        "room:nonexistent-room",
      );
      // Should not proceed to check state or add user
      expect(mockRedisClient.hGet).not.toHaveBeenCalled();
      expect(mockRedisClient.sAdd).not.toHaveBeenCalled();
    });

    it("should return 403 when room is not in nominating state", async () => {
      mockRedisClient.exists.mockResolvedValue(1);
      mockRedisClient.hGet.mockResolvedValue("voting");

      const response = await request(app).post("/participant/room/join").send({
        roomId: "test-room-123",
        userName: "testUser",
      });

      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        error: "Room is not in a joinable state",
      });

      expect(mockRedisClient.exists).toHaveBeenCalledWith("room:test-room-123");
      expect(mockRedisClient.hGet).toHaveBeenCalledWith(
        "room:test-room-123",
        "state",
      );
      // Should not add user to room
      expect(mockRedisClient.sAdd).not.toHaveBeenCalled();
    });

    it("should handle Redis errors gracefully", async () => {
      mockRedisClient.exists = mock(() => {
        return Promise.reject(new Error("redis error"));
      }) as typeof mockRedisClient.exists;

      const response = await request(app).post("/participant/room/join").send({
        roomId: "test-room-123",
        userName: "testUser",
      });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: "Failed to join room",
      });
    });

    it("should handle empty strings as invalid input", async () => {
      const response = await request(app).post("/participant/room/join").send({
        roomId: "",
        userName: "",
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: "roomId and userName are required",
      });
    });
  });

  describe("GET /room/:roomId/getRole", () => {
    it("should return user role when no hostKey is provided", async () => {
      mockRedisClient.exists.mockResolvedValue(1);

      const response = await request(app)
        .get("/participant/room/test-room-123/getRole")
        .send({});

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        role: "user",
      });

      expect(mockRedisClient.exists).toHaveBeenCalledWith("room:test-room-123");
    });

    it("should return host role when correct hostKey is provided", async () => {
      mockRedisClient.exists.mockResolvedValue(1);
      mockRedisClient.hGet.mockResolvedValue("secret-host-key");

      const response = await request(app)
        .get("/participant/room/test-room-123/getRole")
        .send({
          hostKey: "secret-host-key",
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        role: "host",
      });

      expect(mockRedisClient.exists).toHaveBeenCalledWith("room:test-room-123");
      expect(mockRedisClient.hGet).toHaveBeenCalledWith(
        "room:test-room-123",
        "hostKey",
      );
    });

    it("should return user role when incorrect hostKey is provided", async () => {
      mockRedisClient.exists.mockResolvedValue(1);
      mockRedisClient.hGet.mockResolvedValue("secret-host-key");

      const response = await request(app)
        .get("/api/room/test-room-123/getRole")
        .send({
          hostKey: "wrong-key",
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        role: "user",
      });

      expect(mockRedisClient.exists).toHaveBeenCalledWith("room:test-room-123");
      expect(mockRedisClient.hGet).toHaveBeenCalledWith(
        "room:test-room-123",
        "hostKey",
      );
    });

    it("should return 404 when room does not exist", async () => {
      mockRedisClient.exists.mockResolvedValue(0);

      const response = await request(app)
        .get("/api/room/nonexistent-room/getRole")
        .send({
          hostKey: "some-key",
        });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        error: "Room not found",
      });

      expect(mockRedisClient.exists).toHaveBeenCalledWith(
        "room:nonexistent-room",
      );
      // Should not proceed to check hostKey
      expect(mockRedisClient.hGet).not.toHaveBeenCalled();
    });

    it("should handle Redis errors gracefully", async () => {
      mockRedisClient.exists = mock(() => {
        return Promise.reject(new Error("redis error"));
      }) as typeof mockRedisClient.exists;

      const response = await request(app)
        .get("/api/room/test-room-123/getRole")
        .send({});

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: "Failed to get role",
      });
    });

    it("should return user role when hostKey is empty string", async () => {
      mockRedisClient.exists.mockResolvedValue(1);

      const response = await request(app)
        .get("/participant/room/test-room-123/getRole")
        .send({
          hostKey: "",
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        role: "user",
      });

      expect(mockRedisClient.exists).toHaveBeenCalledWith("room:test-room-123");
      // Should not check for hostKey in Redis since it's empty
      expect(mockRedisClient.hGet).not.toHaveBeenCalled();
    });

    it("should return user role when hostKey is null", async () => {
      mockRedisClient.exists.mockResolvedValue(1);

      const response = await request(app)
        .get("/participant/room/test-room-123/getRole")
        .send({
          hostKey: null,
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        role: "user",
      });

      expect(mockRedisClient.exists).toHaveBeenCalledWith("room:test-room-123");
      expect(mockRedisClient.hGet).not.toHaveBeenCalled();
    });
  });
});
