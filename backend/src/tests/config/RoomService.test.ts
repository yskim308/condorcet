import { describe, it, expect, mock } from "bun:test";
import roomService from "../../config/RoomService";
import type { RoomData } from "../../routes/hostRoutes";

// Mock the redisClient dependency for all tests in this file
mock.module("../../config/redisClient", () => ({
  __esModule: true,
  redisClient: {
    hset: mock(async (key: string, value: any) => {}),
    hget: mock(async (key: string, field: string) => "test-host-key"),
    exists: mock(async (key: string) => 1),
  },
}));

describe("RoomService", () => {
  it("should create a room", async () => {
    const roomData: RoomData = {
      roomName: "Test Room",
      hostName: "Test Host",
      hostKey: "test-key",
      state: "nominating",
    };
    const [error, status] = await roomService.createRoom("room123", roomData);

    expect(error).toBeNull();
    expect(status).toBe(200);
  });

  it("should update room state", async () => {
    const [error, status] = await roomService.updateState("room123", "voting");

    expect(error).toBeNull();
    expect(status).toBe(200);
  });

  it("should get room state", async () => {
    const [error, state, status] = await roomService.getState("room123");

    expect(error).toBeNull();
    // The mock for redisClient.hget returns "test-host-key" for any field
    expect(state).toBe("test-host-key");
    expect(status).toBe(200);
  });

  it("should check if a room exists", async () => {
    const [error, exists, status] = await roomService.exists("room123");

    expect(error).toBeNull();
    expect(exists).toBe(true);
    expect(status).toBe(200);
  });

  it("should get host key", async () => {
    const [error, hostKey, status] = await roomService.getHostKey("room123");

    expect(error).toBeNull();
    expect(hostKey).toBe("test-host-key");
    expect(status).toBe(200);
  });
});