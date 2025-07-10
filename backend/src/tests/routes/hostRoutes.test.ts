import { describe, it, expect, beforeEach, mock } from "bun:test";
import express from "express";
import request from "supertest";

// Mock SocketService
const mockSocketService = {
  emitNewNomination: mock<() => void>(() => {}),
  emitStateChange: mock<() => void>(() => {}),
};

mock.module("../../config/SocketService", () => ({
  __esModule: true,
  default: function () {
    return mockSocketService;
  },
}));

// Mock services
const mockRoomService = {
  createRoom: mock<() => Promise<[Error | null, number]>>(async () => [
    null,
    201,
  ]),
  updateState: mock<() => Promise<[Error | null, number]>>(async () => [
    null,
    200,
  ]),
  getHostKey: mock<() => Promise<[Error | null, string, number]>>(async () => [
    null,
    "test-host-key",
    200,
  ]),
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
};

const mockNomineeService = {
  setNomineeCount: mock<() => Promise<[Error | null, number]>>(async () => {
    return [null, 200];
  }),
  addNominee: mock<() => Promise<[Error | null, number]>>(async () => {
    return [null, 200];
  }),
};

const mockUserRoomService = {
  enrollUser: mock<() => Promise<[Error | null, number]>>(async () => {
    return [null, 200];
  }),
};

mock.module("../../config/RoomService", () => ({
  __esModule: true,
  default: mockRoomService,
}));

mock.module("../../config/NomineeService", () => ({
  __esModule: true,
  default: mockNomineeService,
}));

mock.module("../../config/UserRoomService", () => ({
  __esModule: true,
  default: mockUserRoomService,
}));

// Import after mocking
const { createHostRouter } = await import("../../routes/hostRoutes");

describe("Host Routes", () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    const hostRouter = createHostRouter(mockSocketService as any);
    app.use(hostRouter);

    // Reset all mocks
    mockRoomService.createRoom.mockClear();
    mockRoomService.updateState.mockClear();
    mockRoomService.getHostKey.mockClear();
    mockNomineeService.setNomineeCount.mockClear();
    mockNomineeService.addNominee.mockClear();
    mockUserRoomService.enrollUser.mockClear();
    mockSocketService.emitNewNomination.mockClear();
    mockSocketService.emitStateChange.mockClear();
  });

  describe("POST /rooms/create", () => {
    it("should create a room successfully", async () => {
      const response = await request(app).post("/rooms/create").send({
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
      expect(mockRoomService.createRoom).toHaveBeenCalled();
      expect(mockUserRoomService.enrollUser).toHaveBeenCalled();
      expect(mockNomineeService.setNomineeCount).toHaveBeenCalled();
    });

    it("should return 400 when roomName is missing", async () => {
      const response = await request(app).post("/rooms/create").send({
        userName: "user123",
      });

      expect(response.status).toBe(400);
    });

    it("should return 400 when userName is missing", async () => {
      const response = await request(app).post("/rooms/create").send({
        roomName: "Test Room",
      });

      expect(response.status).toBe(400);
    });

    it("should handle service errors gracefully during room creation", async () => {
      mockRoomService.createRoom.mockResolvedValueOnce([
        new Error("service error"),
        500,
      ]);

      const response = await request(app).post("/rooms/create").send({
        roomName: "Test Room",
        userName: "user123",
      });

      expect(response.status).toBe(500);
    });
  });

  describe("POST /rooms/:roomId/nomination", () => {
    it("should add a nominee successfully with valid host key", async () => {
      mockRoomService.getHostKey.mockResolvedValueOnce([
        null,
        "test-host-key",
        200,
      ]);
      const response = await request(app)
        .post("/rooms/room123/nomination")
        .send({
          nominee: "John Doe",
          hostKey: "test-host-key",
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        message: "Nominee added successfully",
        nominee: "John Doe",
      });
      expect(mockNomineeService.addNominee).toHaveBeenCalledWith(
        "room123",
        "John Doe",
      );
      expect(mockSocketService.emitNewNomination).toHaveBeenCalledWith(
        "room123",
        "John Doe",
      );
    });

    it("should return 401 when no host key is provided", async () => {
      const response = await request(app)
        .post("/rooms/room123/nomination")
        .send({
          nominee: "John Doe",
        });

      expect(response.status).toBe(401);
    });

    it("should return 403 when invalid host key is provided", async () => {
      mockRoomService.getHostKey.mockResolvedValueOnce([
        null,
        "correct-key",
        200,
      ]);
      const response = await request(app)
        .post("/rooms/room123/nomination")
        .send({
          nominee: "John Doe",
          hostKey: "invalid-key",
        });

      expect(response.status).toBe(403);
    });

    it("should return 400 when nominee is missing", async () => {
      mockRoomService.getHostKey.mockResolvedValueOnce([
        null,
        "test-host-key",
        200,
      ]);
      const response = await request(app)
        .post("/rooms/room123/nomination")
        .send({ hostKey: "test-host-key" });

      expect(response.status).toBe(400);
    });

    it("should handle service errors gracefully during nomination", async () => {
      mockRoomService.getHostKey.mockResolvedValueOnce([
        null,
        "test-host-key",
        200,
      ]);
      mockNomineeService.addNominee.mockResolvedValueOnce([
        new Error("service error"),
        500,
      ]);

      const response = await request(app)
        .post("/rooms/room123/nomination")
        .send({
          nominee: "John Doe",
          hostKey: "test-host-key",
        });

      expect(response.status).toBe(500);
    });
  });

  describe("POST /rooms/:roomId/state", () => {
    it("should update room state successfully with valid host key", async () => {
      mockRoomService.getHostKey.mockResolvedValueOnce([
        null,
        "test-host-key",
        200,
      ]);
      const response = await request(app).post("/rooms/room123/state").send({
        state: "voting",
        hostKey: "test-host-key",
      });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        message: "Room state updated successfully",
        state: "voting",
      });
      expect(mockRoomService.updateState).toHaveBeenCalledWith(
        "room123",
        "voting",
      );
      expect(mockSocketService.emitStateChange).toHaveBeenCalledWith(
        "room123",
        "voting",
      );
    });

    it("should return 401 when no host key is provided", async () => {
      const response = await request(app).post("/rooms/room123/state").send({
        state: "voting",
      });

      expect(response.status).toBe(401);
    });

    it("should return 403 when invalid host key is provided", async () => {
      mockRoomService.getHostKey.mockResolvedValueOnce([
        null,
        "correct-key",
        200,
      ]);
      const response = await request(app).post("/rooms/room123/state").send({
        state: "voting",
        hostKey: "invalid-key",
      });

      expect(response.status).toBe(403);
    });

    it("should return 400 for invalid state", async () => {
      mockRoomService.getHostKey.mockResolvedValueOnce([
        null,
        "test-host-key",
        200,
      ]);
      const response = await request(app).post("/rooms/room123/state").send({
        state: "invalid_state",
        hostKey: "test-host-key",
      });

      expect(response.status).toBe(400);
    });

    it("should handle service errors gracefully during state update", async () => {
      mockRoomService.getHostKey.mockResolvedValueOnce([
        null,
        "test-host-key",
        200,
      ]);
      mockRoomService.updateState.mockResolvedValueOnce([
        new Error("service error"),
        500,
      ]);

      const response = await request(app).post("/rooms/room123/state").send({
        state: "voting",
        hostKey: "test-host-key",
      });

      expect(response.status).toBe(500);
    });
  });
});
