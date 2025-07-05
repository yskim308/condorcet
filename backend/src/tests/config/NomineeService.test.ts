import { describe, it, expect, beforeEach, mock } from "bun:test";
import NomineeService from "../../config/NomineeService";

const mockRedisClient = {
  set: mock(async (key: string, value: any) => {}),
  incr: mock(async (key: string) => 1),
  hset: mock(async (key: string, field: string, value: any) => {}),
};

mock.module("../../config/redisClient", () => ({
  __esModule: true,
  redisClient: mockRedisClient,
}));

describe("NomineeService", () => {
  let nomineeService: NomineeService;

  beforeEach(() => {
    nomineeService = new NomineeService();
    mockRedisClient.set.mockClear();
    mockRedisClient.incr.mockClear();
    mockRedisClient.hset.mockClear();
  });

  it("should set nominee count", async () => {
    const [error, status] = await nomineeService.setNomineeCount("room123");

    expect(error).toBeNull();
    expect(status).toBe(200);
    expect(mockRedisClient.set).toHaveBeenCalledWith(
      "room:room123:nominee_count",
      -1,
    );
  });

  it("should add a nominee", async () => {
    const [error, status] = await nomineeService.addNominee(
      "room123",
      "John Doe",
    );

    expect(error).toBeNull();
    expect(status).toBe(200);
    expect(mockRedisClient.incr).toHaveBeenCalledWith(
      "room:room123:nominee_count",
    );
    expect(mockRedisClient.hset).toHaveBeenCalledWith(
      "room:room123:nominees",
      1,
      "John Doe",
    );
  });
});
