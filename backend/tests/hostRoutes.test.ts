import { describe, it, expect, beforeEach, mock } from "bun:test";
import express from "express";
import request from "supertest";
import jwt from "jsonwebtoken";

// Set environment variable before importing anything
process.env.SECRET_KEY = "test-secret-key";

// Mock dependencies before importing hostRoutes
const mockRedisClient = {
  hSet: mock(() => Promise.resolve()),
  sAdd: mock(() => Promise.resolve()),
  exists: mock(() => Promise.resolve(1)),
  lPush: mock(() => Promise.resolve()),
  incr: mock(() => Promise.resolve(0)),
  set: mock(() => Promise.resolve()),
  hget: mock(() => Promise.resolve("testHost")),
};

const mockIo = {
  to: mock(() => ({
    emit: mock(() => {}),
  })),
};

// Mock the index.js imports before importing the router
mock.module("../index.js", () => ({
  redisClient: mockRedisClient,
  io: mockIo,
}));

// Import after mocking
const { router: hostRoutes } = await import("../routes/hostRoutes.js");

describe("Host Routes", () => {
  let app: express.Application;
  let validToken: string;
  const secretKey = "test-secret-key";

  beforeEach(() => {
    process.env.SECRET_KEY = secretKey;
    
    app = express();
    app.use(express.json());
    app.use("/host", hostRoutes);

    // Create a valid token for testing
    validToken = jwt.sign(
      { userName: "testHost", roomId: "room123" },
      secretKey,
      { expiresIn: "30m" }
    );

    // Reset all mocks
    mockRedisClient.hSet.mockClear();
    mockRedisClient.sAdd.mockClear();
    mockRedisClient.exists.mockClear();
    mockRedisClient.lPush.mockClear();
    mockRedisClient.incr.mockClear();
    mockRedisClient.set.mockClear();
    mockRedisClient.hget.mockClear();
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
      expect(mockRedisClient.hSet).toHaveBeenCalled();
      expect(mockRedisClient.sAdd).toHaveBeenCalled();
      expect(mockRedisClient.set).toHaveBeenCalledWith(
        expect.stringMatching(/^room:.+:nominee_count$/),
        -1
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
    it("should add a nominee successfully with valid token", async () => {
      mockRedisClient.incr.mockResolvedValueOnce(0);

      const response = await request(app)
        .post("/host/rooms/room123/nomination")
        .set("Authorization", `Bearer ${validToken}`)
        .send({
          nominee: "John Doe",
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        message: "Nominee added successfully",
        nominee: "John Doe",
      });
      expect(mockRedisClient.incr).toHaveBeenCalledWith(
        "room:room123:nominee_count"
      );
      expect(mockRedisClient.hSet).toHaveBeenCalledWith(
        "room:room123:nominees",
        "0",
        "John Doe",
      );
      expect(mockIo.to).toHaveBeenCalledWith("room123");
    });

    it("should return 401 when no token is provided", async () => {
      const response = await request(app)
        .post("/host/rooms/room123/nomination")
        .send({
          nominee: "John Doe",
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("No token provided");
    });

    it("should return 401 when invalid token is provided", async () => {
      const response = await request(app)
        .post("/host/rooms/room123/nomination")
        .set("Authorization", "Bearer invalid-token")
        .send({
          nominee: "John Doe",
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("Invalid token");
    });

    it("should return 403 when user is not the host", async () => {
      const nonHostToken = jwt.sign(
        { userName: "notHost", roomId: "room123" },
        secretKey,
        { expiresIn: "30m" }
      );

      const response = await request(app)
        .post("/host/rooms/room123/nomination")
        .set("Authorization", `Bearer ${nonHostToken}`)
        .send({
          nominee: "John Doe",
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe("client is not the host");
    });

    it("should return 400 when nominee is missing", async () => {
      const response = await request(app)
        .post("/host/rooms/room123/nomination")
        .set("Authorization", `Bearer ${validToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("nominee is required");
    });

    it("should return 404 when room does not exist", async () => {
      mockRedisClient.exists.mockResolvedValueOnce(0);

      const response = await request(app)
        .post("/host/rooms/nonexistent/nomination")
        .set("Authorization", `Bearer ${validToken}`)
        .send({
          nominee: "John Doe",
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Room not found");
    });

    it("should generate sequential nominee IDs", async () => {
      mockRedisClient.incr.mockResolvedValueOnce(0);

      const response = await request(app)
        .post("/host/rooms/room123/nomination")
        .set("Authorization", `Bearer ${validToken}`)
        .send({
          nominee: "Alice",
        });

      expect(response.status).toBe(200);
      expect(mockRedisClient.incr).toHaveBeenCalledWith(
        "room:room123:nominee_count"
      );
      expect(mockRedisClient.hSet).toHaveBeenCalledWith(
        "room:room123:nominees",
        "0",
        "Alice"
      );
    });

    it("should increment nominee counter for multiple nominations", async () => {
      mockRedisClient.incr
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(2);

      // First nomination
      await request(app)
        .post("/host/rooms/room123/nomination")
        .set("Authorization", `Bearer ${validToken}`)
        .send({ nominee: "Alice" });

      // Second nomination  
      await request(app)
        .post("/host/rooms/room123/nomination")
        .set("Authorization", `Bearer ${validToken}`)
        .send({ nominee: "Bob" });

      // Third nomination
      await request(app)
        .post("/host/rooms/room123/nomination")
        .set("Authorization", `Bearer ${validToken}`)
        .send({ nominee: "Charlie" });

      expect(mockRedisClient.incr).toHaveBeenCalledTimes(3);
      expect(mockRedisClient.hSet).toHaveBeenNthCalledWith(
        1,
        "room:room123:nominees",
        "0",
        "Alice"
      );
      expect(mockRedisClient.hSet).toHaveBeenNthCalledWith(
        2,
        "room:room123:nominees", 
        "1",
        "Bob"
      );
      expect(mockRedisClient.hSet).toHaveBeenNthCalledWith(
        3,
        "room:room123:nominees",
        "2", 
        "Charlie"
      );
    });
  });

  describe("POST /host/rooms/:roomId/state", () => {
    it("should update room state successfully with valid token", async () => {
      const response = await request(app)
        .post("/host/rooms/room123/state")
        .set("Authorization", `Bearer ${validToken}`)
        .send({
          state: "voting",
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

    it("should return 401 when no token is provided", async () => {
      const response = await request(app)
        .post("/host/rooms/room123/state")
        .send({
          state: "voting",
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("No token provided");
    });

    it("should return 401 when invalid token is provided", async () => {
      const response = await request(app)
        .post("/host/rooms/room123/state")
        .set("Authorization", "Bearer invalid-token")
        .send({
          state: "voting",
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("Invalid token");
    });

    it("should return 403 when user is not the host", async () => {
      const nonHostToken = jwt.sign(
        { userName: "notHost", roomId: "room123" },
        secretKey,
        { expiresIn: "30m" }
      );

      const response = await request(app)
        .post("/host/rooms/room123/state")
        .set("Authorization", `Bearer ${nonHostToken}`)
        .send({
          state: "voting",
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe("client is not the host");
    });

    it("should accept all valid states", async () => {
      const validStates = ["nominating", "voting", "done"];

      for (const state of validStates) {
        const response = await request(app)
          .post("/host/rooms/room123/state")
          .set("Authorization", `Bearer ${validToken}`)
          .send({ state });

        expect(response.status).toBe(200);
        expect(response.body.state).toBe(state);
      }
    });

    it("should return 400 for invalid state", async () => {
      const response = await request(app)
        .post("/host/rooms/room123/state")
        .set("Authorization", `Bearer ${validToken}`)
        .send({
          state: "invalid_state",
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe(
        "state is required and must be 'nominating', 'voting', or 'done'",
      );
    });

    it("should return 400 when state is missing", async () => {
      const response = await request(app)
        .post("/host/rooms/room123/state")
        .set("Authorization", `Bearer ${validToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe(
        "state is required and must be 'nominating', 'voting', or 'done'",
      );
    });

    it("should return 404 when room does not exist", async () => {
      mockRedisClient.exists.mockResolvedValueOnce(0);

      const response = await request(app)
        .post("/host/rooms/nonexistent/state")
        .set("Authorization", `Bearer ${validToken}`)
        .send({
          state: "voting",
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("room not found");
    });
  });
});

