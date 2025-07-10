import { describe, it, expect, mock, beforeEach } from "bun:test";
import roomService from "../../config/RoomService";
import type { RoomData } from "../../routes/hostRoutes";

const mockRedisClient = {
  set: mock(async (key: string, value: any) => {}),
  get: mock(async (key: string) => "1"),
  incr: mock(async (key: string) => 1),
  hset: mock(async (key: string, field: string, value: any) => {}),
  hGetAll: mock(async (key: string) => ({ "1": "John Doe" })),
  lPush: mock(async (key: string, value: any) => {}),
  lRange: mock(async (key: string, start: number, stop: number) => [
    JSON.stringify(["John Doe"]),
  ]),
};
// Mock the redisClient dependency for all tests in this file
mock.module("../../config/redisClient", () => ({
  __esModule: true,
  redisClient: mockRedisClient,
}));

describe("RoomService", () => {
  beforeEach(() => {
    mockRedisClient.set.mockClear();
    mockRedisClient.get.mockClear();
    mockRedisClient.incr.mockClear();
    mockRedisClient.hset.mockClear();
    mockRedisClient.hGetAll.mockClear();
    mockRedisClient.lPush.mockClear();
    mockRedisClient.lRange.mockClear();
  });
  it("should create a room", async () => {
    const roomData: RoomData = {
      name: "room123",
      state: "nominating",
      host: "user123",
      hostKey: "test-host-key",
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
