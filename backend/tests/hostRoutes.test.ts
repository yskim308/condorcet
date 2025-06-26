import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import express from "express";
import request from "supertest";
import { router as hostRoutes } from "../routes/hostRoutes.js";

// Mock dependencies
const mockRedisClient = {
  hSet: mock(() => Promise.resolve()),
  sAdd: mock(() => Promise.resolve()),
  exists: mock(() => Promise.resolve(1)),
  lPush: mock(() => Promise.resolve()),
};

const mockIo = {
  to: mock(() => ({
    emit: mock(() => {}),
  })),
};

// Mock the index.js imports
mock.module("../index.js", () => ({
  redisClient: mockRedisClient,
  io: mockIo,
}));

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
    mockIo.to.mockClear();
  });

  describe("POST /host/rooms/create", () => {
    it("should create a room successfully", async () => {
      const response = await request(app).post("/host/rooms/create").send({
        roomName: "Test Room",
        userId: "user123",
      });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        roomName: "Test Room",
        message: "Room created successfully",
      });
      expect(response.body.roomId).toBeDefined();
      expect(mockRedisClient.hSet).toHaveBeenCalled();
      expect(mockRedisClient.sAdd).toHaveBeenCalled();
    });

    it("should return 400 when roomName is missing", async () => {
      const response = await request(app).post("/host/rooms/create").send({
        userId: "user123",
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("roomName and userId are required");
    });

    it("should return 400 when userId is missing", async () => {
      const response = await request(app).post("/host/rooms/create").send({
        roomName: "Test Room",
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("roomName and userId are required");
    });
  });

  describe("POST /host/rooms/:roomId/nomination", () => {
    it("should add a nominee successfully", async () => {
      const response = await request(app)
        .post("/host/rooms/room123/nomination")
        .send({
          nominee: "John Doe",
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        message: "Nominee added successfully",
        nominee: "John Doe",
      });
      expect(mockRedisClient.lPush).toHaveBeenCalledWith(
        "room:room123:nominees",
        "John Doe",
      );
      expect(mockIo.to).toHaveBeenCalledWith("room123");
    });

    it("should return 400 when nominee is missing", async () => {
      const response = await request(app)
        .post("/host/rooms/room123/nomination")
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("nominee is required");
    });

    it("should return 404 when room does not exist", async () => {
      mockRedisClient.exists.mockResolvedValueOnce(0);

      const response = await request(app)
        .post("/host/rooms/nonexistent/nomination")
        .send({
          nominee: "John Doe",
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Room not found");
    });
  });

  describe("POST /host/rooms/:roomId/state", () => {
    it("should update room state successfully", async () => {
      const response = await request(app)
        .post("/host/rooms/room123/state")
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

    it("should accept all valid states", async () => {
      const validStates = ["nominating", "voting", "done"];

      for (const state of validStates) {
        const response = await request(app)
          .post("/host/rooms/room123/state")
          .send({ state });

        expect(response.status).toBe(200);
        expect(response.body.state).toBe(state);
      }
    });

    it("should return 400 for invalid state", async () => {
      const response = await request(app)
        .post("/host/rooms/room123/state")
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
        .send({
          state: "voting",
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("room not found");
    });
  });
});

