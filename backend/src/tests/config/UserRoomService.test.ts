import { describe, it, expect, beforeEach, mock } from "bun:test";
import UserRoomService from "../../config/UserRoomService";

const mockRedisClient = {
  sAdd: mock(async (key: string, value: any) => {}),
};

mock.module("../../config/redisClient", () => ({
  __esModule: true,
  redisClient: mockRedisClient,
}));

describe("UserRoomService", () => {
  let userRoomService: UserRoomService;

  beforeEach(() => {
    userRoomService = new UserRoomService();
    mockRedisClient.sAdd.mockClear();
  });

  it("should enroll a user in a room", async () => {
    const [error, status] = await userRoomService.enrollUser(
      "room123",
      "Test User",
    );

    expect(error).toBeNull();
    expect(status).toBe(200);
    expect(mockRedisClient.sAdd).toHaveBeenCalledWith(
      "room:room123:users",
      "Test User",
    );
  });
});
