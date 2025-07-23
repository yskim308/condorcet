import { describe, it, expect, beforeEach, mock } from "bun:test";
import express from "express";
import request from "supertest";
import { createHostRouter } from "../../routes/hostRoutes";
import type SocketService from "../../config/SocketService";
import type RoomService from "../../config/RoomService";
import type NomineeService from "../../config/NomineeService";
import type UserRoomService from "../../config/UserRoomService";
import type { CreateVerifyHostMiddleware } from "../../middleware/verifyHost";

// Mock services
const createMockSocketService = () => ({
  emitNewNomination: mock(() => {}),
  emitStateChange: mock(() => {}),
  emitWinner: mock(() => {}),
});

const createMockRoomService = () => ({
  createRoom: mock(async () => [null, 201]),
  getHostKey: mock(async () => [null, "test-host-key", 200]),
  setVoting: mock(async () => [null, 200]),
  setDone: mock(async () => [null, 200]),
});

const createMockNomineeService = () => ({
  setNomineeCount: mock(async () => [null, 200]),
  addNominee: mock(async () => [null, 200]),
  tallyVotes: mock(async () => [null, "winner1", 200]),
});

const createMockUserRoomService = () => ({
  enrollUser: mock(async () => [null, 200]),
});

const createMockVerifyHostMiddleware: CreateVerifyHostMiddleware = (
  roomService,
) => {
  return async (req, res, next) => {
    const { hostKey } = req.body;
    if (!hostKey) {
      res.status(401).json({ error: "no host key provided" });
      return;
    }
    if (hostKey === "test-host-key") {
      next();
    } else {
      res.status(403).json({ error: "invalid host key" });
    }
  };
};

describe("Host Routes", () => {
  let app: express.Application;
  let mockSocketService: ReturnType<typeof createMockSocketService>;
  let mockRoomService: ReturnType<typeof createMockRoomService>;
  let mockNomineeService: ReturnType<typeof createMockNomineeService>;
  let mockUserRoomService: ReturnType<typeof createMockUserRoomService>;
  beforeEach(() => {
    app = express();
    app.use(express.json());
    mockSocketService = createMockSocketService();
    mockRoomService = createMockRoomService();
    mockNomineeService = createMockNomineeService();
    mockUserRoomService = createMockUserRoomService();
    const hostRouter = createHostRouter(
      mockSocketService as any,
      mockRoomService as any,
      mockNomineeService as any,
      mockUserRoomService as any,
      createMockVerifyHostMiddleware,
    );
    app.use(hostRouter);
  });

  describe("POST /rooms/create", () => {
    it("should create a room successfully", async () => {
      const response = await request(app).post("/rooms/create").send({
        roomName: "Test Room",
        userName: "user123",
      });

      expect(response.status).toBe(201);
      expect(mockRoomService.createRoom).toHaveBeenCalled();
      expect(mockUserRoomService.enrollUser).toHaveBeenCalled();
      expect(mockNomineeService.setNomineeCount).toHaveBeenCalled();
    });

    it("should return 400 if roomName or userName is missing", async () => {
      const res1 = await request(app)
        .post("/rooms/create")
        .send({ userName: "user123" });
      const res2 = await request(app)
        .post("/rooms/create")
        .send({ roomName: "Test Room" });
      expect(res1.status).toBe(400);
      expect(res2.status).toBe(400);
    });
  });

  describe("POST /rooms/:roomId/nomination", () => {
    it("should add a nominee successfully", async () => {
      const response = await request(app)
        .post("/rooms/room123/nomination")
        .send({ nominee: "John Doe", hostKey: "test-host-key" });

      expect(response.status).toBe(200);
      expect(mockNomineeService.addNominee).toHaveBeenCalledWith(
        "room123",
        "John Doe",
      );
      expect(mockSocketService.emitNewNomination).toHaveBeenCalledWith(
        "room123",
        "John Doe",
      );
    });

    it("should return 400 if nominee is missing", async () => {
      const response = await request(app)
        .post("/rooms/room123/nomination")
        .send({ hostKey: "test-host-key" });
      expect(response.status).toBe(400);
    });

    it("should return 401 for missing host key", async () => {
      const response = await request(app)
        .post("/rooms/room123/nomination")
        .send({ nominee: "John Doe" });
      expect(response.status).toBe(401);
    });

    it("should return 403 for invalid host key", async () => {
      const response = await request(app)
        .post("/rooms/room123/nomination")
        .send({ nominee: "John Doe", hostKey: "invalid-key" });
      expect(response.status).toBe(403);
    });
  });

  describe("POST /rooms/:roomId/setVoting", () => {
    it("should set the room state to voting successfully", async () => {
      const response = await request(app)
        .post("/rooms/room123/setVoting")
        .send({ hostKey: "test-host-key" });

      expect(response.status).toBe(200);
      expect(mockRoomService.setVoting).toHaveBeenCalledWith("room123");
      expect(mockSocketService.emitStateChange).toHaveBeenCalledWith(
        "room123",
        "voting",
      );
    });

    it("should return 401 for missing host key", async () => {
      const response = await request(app)
        .post("/rooms/room123/setVoting")
        .send({});
      expect(response.status).toBe(401);
    });

    it("should return 403 for invalid host key", async () => {
      const response = await request(app)
        .post("/rooms/room123/setVoting")
        .send({ hostKey: "invalid-key" });
      expect(response.status).toBe(403);
    });
  });

  describe("POST /rooms/:roomId/setDone", () => {
    it("should set the room state to done successfully and find winner", async () => {
      (mockNomineeService.tallyVotes as any).mockResolvedValueOnce([
        null,
        "winner1",
        200,
      ]);
      (mockRoomService.setDone as any).mockResolvedValueOnce([null, 200]);
      const response = await request(app)
        .post("/rooms/room123/setDone")
        .send({ hostKey: "test-host-key" });

      expect(response.status).toBe(200);
      expect(mockNomineeService.tallyVotes).toHaveBeenCalledWith("room123");
      expect(mockRoomService.setDone).toHaveBeenCalledWith("room123");
      expect(mockSocketService.emitStateChange).toHaveBeenCalledWith(
        "room123",
        "done",
      );
      expect(mockSocketService.emitWinner).toHaveBeenCalledWith(
        "room123",
        "winner1",
      );
    });

    it("should return 401 for missing host key", async () => {
      const response = await request(app)
        .post("/rooms/room123/setDone")
        .send({});
      expect(response.status).toBe(401);
    });

    it("should return 403 for invalid host key", async () => {
      const response = await request(app)
        .post("/rooms/room123/setDone")
        .send({ hostKey: "invalid-key" });
      expect(response.status).toBe(403);
    });
  });
});
