import { describe, it, expect, mock, beforeEach } from "bun:test";
import RoomService from "../../config/RoomService";
import type { RoomData } from "../../types/room";

// Mock Redis client
const mockRedisClient = {
  hSet: mock(async (key: string, values: any) => 1),
  hGet: mock(async (key: string, field: string) => "nominating"),
  exists: mock(async (key: string) => 1),
};

describe("RoomService", () => {
  let roomService: RoomService;

  beforeEach(() => {
    // Reset mocks before each test
    mockRedisClient.hSet.mockClear();
    mockRedisClient.hGet.mockClear();
    mockRedisClient.exists.mockClear();

    // Create a new instance of RoomService with the mock client
    roomService = new RoomService(mockRedisClient as any);
  });

  describe("createRoom", () => {
    it("should create a room successfully", async () => {
      const roomData: RoomData = {
        name: "Test Room",
        state: "nominating",
        host: "host123",
        hostKey: "key123",
      };
      const [error, status] = await roomService.createRoom("room123", roomData);

      expect(error).toBeNull();
      expect(status).toBe(200);
      expect(mockRedisClient.hSet).toHaveBeenCalledWith(
        `room:room123`,
        roomData,
      );
    });

    it("should return an error if Redis fails", async () => {
      mockRedisClient.hSet.mockRejectedValueOnce(new Error("Redis error"));
      const roomData: RoomData = {
        name: "Test Room",
        state: "nominating",
        host: "host123",
        hostKey: "key123",
      };
      const [error, status] = await roomService.createRoom("room123", roomData);

      expect(error).toBeInstanceOf(Error);
      expect(status).toBe(500);
    });
  });

  describe("updateState", () => {
    it("should update the room state successfully", async () => {
      const [error, status] = await roomService.updateState(
        "room123",
        "voting",
      );

      expect(error).toBeNull();
      expect(status).toBe(200);
      expect(mockRedisClient.hSet).toHaveBeenCalledWith(
        `room:room123`,
        "state",
        "voting",
      );
    });

    it("should return an error if Redis fails", async () => {
      mockRedisClient.hSet.mockRejectedValueOnce(new Error("Redis error"));
      const [error, status] = await roomService.updateState(
        "room123",
        "voting",
      );

      expect(error).toBeInstanceOf(Error);
      expect(status).toBe(500);
    });
  });

  describe("getState", () => {
    it("should get the room state successfully", async () => {
      mockRedisClient.hGet.mockResolvedValueOnce("voting");
      const [error, state, status] = await roomService.getState("room123");

      expect(error).toBeNull();
      expect(state).toBe("voting");
      expect(status).toBe(200);
      expect(mockRedisClient.hGet).toHaveBeenCalledWith(`room:room123`, "state");
    });

    it("should return an empty string if state does not exist", async () => {
      mockRedisClient.hGet.mockResolvedValueOnce(null);
      const [error, state, status] = await roomService.getState("room123");

      expect(error).toBeNull();
      expect(state).toBe("");
      expect(status).toBe(200);
    });

    it("should return an error if Redis fails", async () => {
      mockRedisClient.hGet.mockRejectedValueOnce(new Error("Redis error"));
      const [error, state, status] = await roomService.getState("room123");

      expect(error).toBeInstanceOf(Error);
      expect(state).toBe("");
      expect(status).toBe(500);
    });
  });

  describe("exists", () => {
    it("should return true if the room exists", async () => {
      mockRedisClient.exists.mockResolvedValueOnce(1);
      const [error, exists, status] = await roomService.exists("room123");

      expect(error).toBeNull();
      expect(exists).toBe(true);
      expect(status).toBe(200);
      expect(mockRedisClient.exists).toHaveBeenCalledWith(`room:room123`);
    });

    it("should return false if the room does not exist", async () => {
      mockRedisClient.exists.mockResolvedValueOnce(0);
      const [error, exists, status] = await roomService.exists("room123");

      expect(error).toBeNull();
      expect(exists).toBe(false);
      expect(status).toBe(200);
    });

    it("should return an error if Redis fails", async () => {
      mockRedisClient.exists.mockRejectedValueOnce(new Error("Redis error"));
      const [error, exists, status] = await roomService.exists("room123");

      expect(error).toBeInstanceOf(Error);
      expect(exists).toBe(false);
      expect(status).toBe(500);
    });
  });

  describe("getHostKey", () => {
    it("should get the host key successfully", async () => {
      mockRedisClient.hGet.mockResolvedValueOnce("key123");
      const [error, hostKey, status] = await roomService.getHostKey("room123");

      expect(error).toBeNull();
      expect(hostKey).toBe("key123");
      expect(status).toBe(200);
      expect(mockRedisClient.hGet).toHaveBeenCalledWith(
        `room:room123`,
        "hostKey",
      );
    });

    it("should return an error if host key does not exist", async () => {
      mockRedisClient.hGet.mockResolvedValueOnce(null);
      const [error, hostKey, status] = await roomService.getHostKey("room123");

      expect(error).toBeInstanceOf(Error);
      expect(hostKey).toBe("");
      expect(status).toBe(404);
    });

    it("should return an error if Redis fails", async () => {
      mockRedisClient.hGet.mockRejectedValueOnce(new Error("Redis error"));
      const [error, hostKey, status] = await roomService.getHostKey("room123");

      expect(error).toBeInstanceOf(Error);
      expect(hostKey).toBe("");
      expect(status).toBe(500);
    });
  });
});