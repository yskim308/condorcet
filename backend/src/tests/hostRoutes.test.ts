import { describe, it, expect, beforeEach, mock } from "bun:test";
import express from "express";
import request from "supertest";

// Mock dependencies before importing hostRoutes
const mockRedisClient = {
  hSet: mock(() => Promise.resolve()),
  sAdd: mock(() => Promise.resolve()),
  exists: mock(() => Promise.resolve(1)),
  lPush: mock(() => Promise.resolve()),
  incr: mock(() => Promise.resolve(0)),
  set: mock(() => Promise.resolve()),
  hGet: mock((key: string, field: string) => {
    if (field === "hostKey") {
      return Promise.resolve("test-host-key");
    }
    return Promise.resolve("testHost");
  }),
};

const mockIo = {
  to: mock(() => ({
    emit: mock(() => {}),
  })),
};

// Mock the index.js imports before importing the router
mock.module("../index", () => ({
  io: mockIo,
}));

mock.module("../config/redisClient", () => ({
  redisClient: mockRedisClient,
}));

// Import after mocking
const { router: hostRoutes } = await import("../routes/hostRoutes");

describe("Host Routes", () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/host", hostRoutes);

    // Reset all mocks
    mockRedisClient.hSet.mockClear();
    mockRedisClient.sAdd.mockClear();
    mockRedisClient.exists.mockClear();
    mockRedisClient.lPush.mockClear();
    mockRedisClient.incr.mockClear();
    mockRedisClient.set.mockClear();
    mockRedisClient.hGet.mockClear();
    mockIo.to.mockClear();
  });

  describe("POST /host/rooms/create", () => {
    it("should create a room successfully", async () => {
      const response = await request(app).post("/host/rooms/create").send({
        roomName: "Test Room",
        userName: "user123",
      });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        roomName: "Test Room",
        message: "Room created successfully",
      });
      expect(response.body.roomId).toBeDefined();
      expect(response.body.hostKey).toBeDefined();
      expect(mockRedisClient.hSet).toHaveBeenCalled();
      expect(mockRedisClient.sAdd).toHaveBeenCalled();
      expect(mockRedisClient.set).toHaveBeenCalledWith(
        expect.stringMatching(/^room:.+:nominee_count$/),
        -1,
      );
    });

    it("should return 400 when roomName is missing", async () => {
      const response = await request(app).post("/host/rooms/create").send({
        userName: "user123",
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("roomName and userId are required");
    });

    it("should return 400 when userName is missing", async () => {
      const response = await request(app).post("/host/rooms/create").send({
        roomName: "Test Room",
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("roomName and userId are required");
    });
  });

  describe("POST /host/rooms/:roomId/nomination", () => {
    it("should add a nominee successfully with valid host key", async () => {
      mockRedisClient.incr.mockResolvedValueOnce(0);

      const response = await request(app)
        .post("/host/rooms/room123/nomination")
        .send({
          nominee: "John Doe",
          hostKey: "test-host-key",
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        message: "Nominee added successfully",
        nominee: "John Doe",
      });
      expect(mockRedisClient.incr).toHaveBeenCalledWith(
        "room:room123:nominee_count",
      );
      expect(mockRedisClient.hSet).toHaveBeenCalledWith(
        "room:room123:nominees",
        "0",
        "John Doe",
      );
      expect(mockIo.to).toHaveBeenCalledWith("room123");
    });

    it("should return 401 when no host key is provided", async () => {
      const response = await request(app)
        .post("/host/rooms/room123/nomination")
        .send({
          nominee: "John Doe",
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("no host key provided");
    });

    it("should return 403 when invalid host key is provided", async () => {
      const response = await request(app)
        .post("/host/rooms/room123/nomination")
        .send({
          nominee: "John Doe",
          hostKey: "invalid-key",
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe("invalid host key");
    });

    it("should return 400 when nominee is missing", async () => {
      const response = await request(app)
        .post("/host/rooms/room123/nomination")
        .send({ hostKey: "test-host-key" });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("nominee is required");
    });
  });

  describe("POST /host/rooms/:roomId/state", () => {
    it("should update room state successfully with valid host key", async () => {
      const response = await request(app)
        .post("/host/rooms/room123/state")
        .send({
          state: "voting",
          hostKey: "test-host-key",
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        message: "Room state updated successfully",
        state: "voting",
      });
      expect(mockRedisClient.hSet).toHaveBeenCalledWith(
        "room:room123",
        "state",
        "voting",
      );
      expect(mockIo.to).toHaveBeenCalledWith("room123");
    });

    it("should return 401 when no host key is provided", async () => {
      const response = await request(app)
        .post("/host/rooms/room123/state")
        .send({
          state: "voting",
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("no host key provided");
    });

    it("should return 403 when invalid host key is provided", async () => {
      const response = await request(app)
        .post("/host/rooms/room123/state")
        .send({
          state: "voting",
          hostKey: "invalid-key",
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe("invalid host key");
    });

    it("should return 400 for invalid state", async () => {
      const response = await request(app)
        .post("/host/rooms/room123/state")
        .send({
          state: "invalid_state",
          hostKey: "test-host-key",
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe(
        "state is required and must be 'nominating', 'voting', or 'done'",
      );
    });
  });
});
