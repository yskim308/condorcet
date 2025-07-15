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
const mockSocketService: Partial<SocketService> = {
  emitNewNomination: mock(() => {}),
  emitStateChange: mock(() => {}),
};

const mockRoomService: Partial<RoomService> = {
  createRoom: mock(async () => [null, 201]),
  updateState: mock(async () => [null, 200]),
  getHostKey: mock(async () => [null, "test-host-key", 200]),
};

const mockNomineeService: Partial<NomineeService> = {
  setNomineeCount: mock(async () => [null, 200]),
  addNominee: mock(async () => [null, 200]),
};

const mockUserRoomService: Partial<UserRoomService> = {
  enrollUser: mock(async () => [null, 200]),
};

const createMockVerifyHostMiddleware: CreateVerifyHostMiddleware = (roomService) => {
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

  beforeEach(() => {
    app = express();
    app.use(express.json());
    const hostRouter = createHostRouter(
      mockSocketService as SocketService,
      mockRoomService as RoomService,
      mockNomineeService as NomineeService,
      mockUserRoomService as UserRoomService,
      createMockVerifyHostMiddleware,
    );
    app.use(hostRouter);

    // Reset mocks
    for (const key in mockSocketService) {
      (mockSocketService[key as keyof SocketService] as any).mockClear();
    }
    for (const key in mockRoomService) {
      (mockRoomService[key as keyof RoomService] as any).mockClear();
    }
    for (const key in mockNomineeService) {
      (mockNomineeService[key as keyof NomineeService] as any).mockClear();
    }
    for (const key in mockUserRoomService) {
      (mockUserRoomService[key as keyof UserRoomService] as any).mockClear();
    }
  });

  describe("POST /rooms/create", () => {
    it("should create a room successfully", async () => {
      const response = await request(app).post("/rooms/create").send({
        roomName: "Test Room",
        userName: "user123",
      });

      expect(response.status).toBe(201);
      expect(response.body.roomId).toBeDefined();
      expect(response.body.hostKey).toBeDefined();
      expect(mockRoomService.createRoom).toHaveBeenCalled();
      expect(mockUserRoomService.enrollUser).toHaveBeenCalled();
      expect(mockNomineeService.setNomineeCount).toHaveBeenCalled();
    });

    it("should return 400 if roomName or userName is missing", async () => {
      const res1 = await request(app).post("/rooms/create").send({ userName: "user123" });
      const res2 = await request(app).post("/rooms/create").send({ roomName: "Test Room" });
      expect(res1.status).toBe(400);
      expect(res2.status).toBe(400);
    });

    it("should handle service errors gracefully", async () => {
        (mockRoomService.createRoom as any).mockResolvedValueOnce([new Error("Redis error"), 500]);
        const response = await request(app).post("/rooms/create").send({
            roomName: "Test Room",
            userName: "user123",
        });
        expect(response.status).toBe(500);
    });
  });

  describe("POST /rooms/:roomId/nomination", () => {
    it("should add a nominee successfully", async () => {
      const response = await request(app)
        .post("/rooms/room123/nomination")
        .send({ nominee: "John Doe", hostKey: "test-host-key" });

      expect(response.status).toBe(200);
      expect(mockNomineeService.addNominee).toHaveBeenCalledWith("room123", "John Doe");
      expect(mockSocketService.emitNewNomination).toHaveBeenCalledWith("room123", "John Doe");
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

    it("should handle service errors gracefully", async () => {
        (mockNomineeService.addNominee as any).mockResolvedValueOnce([new Error("Redis error"), 500]);
        const response = await request(app)
            .post("/rooms/room123/nomination")
            .send({ nominee: "John Doe", hostKey: "test-host-key" });
        expect(response.status).toBe(500);
    });
  });

  describe("POST /rooms/:roomId/state", () => {
    it("should update room state successfully", async () => {
      const response = await request(app)
        .post("/rooms/room123/state")
        .send({ state: "voting", hostKey: "test-host-key" });

      expect(response.status).toBe(200);
      expect(mockRoomService.updateState).toHaveBeenCalledWith("room123", "voting");
      expect(mockSocketService.emitStateChange).toHaveBeenCalledWith("room123", "voting");
    });

    it("should return 400 for invalid state", async () => {
      const response = await request(app)
        .post("/rooms/room123/state")
        .send({ state: "invalid_state", hostKey: "test-host-key" });
      expect(response.status).toBe(400);
    });

    it("should handle service errors gracefully", async () => {
        (mockRoomService.updateState as any).mockResolvedValueOnce([new Error("Redis error"), 500]);
        const response = await request(app)
            .post("/rooms/room123/state")
            .send({ state: "voting", hostKey: "test-host-key" });
        expect(response.status).toBe(500);
    });
  });
});