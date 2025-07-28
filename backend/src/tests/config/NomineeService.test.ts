import { describe, it, expect, beforeEach, mock } from "bun:test";

// Mock the findWinner utility function
const mockFindWinner = mock(() => 0);
mock.module("../../util/findWinner", () => ({
  default: mockFindWinner,
}));

import NomineeService from "../../config/NomineeService";
// Test data constants
const TEST_ROOM_ID = "room123";
const MOCK_NOMINEES = {
  "0": "John Doe",
  "1": "Jane Smith",
  "2": "Bob Wilson",
};
const MOCK_VOTES = [
  ["0", "1", "2"],
  ["1", "0", "2"],
];
// factory function to mock redis client
const createMockRedisClient = () => ({
  set: mock(async (key: string, value: any) => {}),
  get: mock(async (key: string) => "1"),
  incr: mock(async (key: string) => 1),
  hSet: mock(async (key: string, field: string, value: any) => {}),
  hGet: mock(async (key: string, field: string) => "John Doe"),
  hGetAll: mock(async (key: string) => MOCK_NOMINEES),
  lPush: mock(async (key: string, value: any) => {}),
  lRange: mock(async (key: string, start: number, stop: number) =>
    MOCK_VOTES.map((v) => JSON.stringify(v)),
  ),
  expire: mock(async (key: string, ttl: number) => {}),
});

const setupSuccessfulTallyVotesMocks = (
  mockRedisClient: any,
  winnerId: number,
) => {
  mockRedisClient.lRange.mockResolvedValueOnce(
    MOCK_VOTES.map((v) => JSON.stringify(v)),
  );
  mockRedisClient.get.mockResolvedValueOnce("3");
  mockRedisClient.hGetAll.mockResolvedValueOnce(MOCK_NOMINEES);
  mockFindWinner.mockReturnValue(winnerId);
};

describe("NomineeService", () => {
  let nomineeService: any;
  let mockRedisClient: ReturnType<typeof createMockRedisClient>;

  beforeEach(async () => {
    mockRedisClient = createMockRedisClient();
    mockFindWinner.mockClear();
    nomineeService = new NomineeService(mockRedisClient as any);
  });

  describe("Basic Operations:", () => {
    describe("set and get nominee count", () => {
      it("should set nominee count successfully", async () => {
        await nomineeService.setNomineeCount(TEST_ROOM_ID);
        expect(mockRedisClient.set).toHaveBeenCalledWith(
          `room:${TEST_ROOM_ID}:nominee_count`,
          -1,
        );
      });
      it("should get nominee count successfully", async () => {
        const count = await nomineeService.getNomineeCount(TEST_ROOM_ID);
        expect(count).toBe(1);
        expect(mockRedisClient.get).toHaveBeenCalledWith(
          `room:${TEST_ROOM_ID}:nominee_count`,
        );
      });
      it("should return 0 if count does not exist", async () => {
        mockRedisClient.get.mockResolvedValueOnce("");
        const count = await nomineeService.getNomineeCount(TEST_ROOM_ID);
        expect(count).toBe(0);
      });
    });

    describe("nominee CRUD", () => {
      it("should add a nominee successfully", async () => {
        await nomineeService.addNominee(TEST_ROOM_ID, "John Doe");
        expect(mockRedisClient.hSet).toHaveBeenCalled();
      });

      it("should get all nominees successfully", async () => {
        const nominees = await nomineeService.getAllNominees(TEST_ROOM_ID);
        expect(nominees).toEqual(MOCK_NOMINEES);
      });
    });

    describe("vote crud", () => {
      it("should save a vote successfully", async () => {
        await nomineeService.saveVote(TEST_ROOM_ID, ["1", "2", "3"]);
        expect(mockRedisClient.lPush).toHaveBeenCalled();
      });
      it("should get all votes successfully", async () => {
        mockRedisClient.lRange.mockResolvedValueOnce([
          JSON.stringify(["1", "2", "3"]),
        ]);
        const votes = await nomineeService.getAllVotes(TEST_ROOM_ID);
        expect(votes).toEqual([["1", "2", "3"]]);
      });
    });
  });

  describe("Winner Determination", () => {
    describe("tallyVotes - success paths", () => {
      it("should find winner successfully with valid votes", async () => {
        setupSuccessfulTallyVotesMocks(mockRedisClient, 0);
        const winner = await nomineeService.tallyVotes(TEST_ROOM_ID);

        expect(winner).toBe("John Doe");

        expect(mockRedisClient.hSet).toHaveBeenNthCalledWith(
          1,
          `room:${TEST_ROOM_ID}`,
          "winnerId",
          0,
        );
        expect(mockRedisClient.hSet).toHaveBeenNthCalledWith(
          2,
          `room:${TEST_ROOM_ID}`,
          "winnerName",
          "John Doe",
        );
      });

      it("should handle a different winner", async () => {
        setupSuccessfulTallyVotesMocks(mockRedisClient, 1);
        const winner = await nomineeService.tallyVotes(TEST_ROOM_ID);

        expect(winner).toBe("Jane Smith");

        expect(mockRedisClient.hSet).toHaveBeenCalledWith(
          `room:${TEST_ROOM_ID}`,
          "winnerId",
          1,
        );
        expect(mockRedisClient.hSet).toHaveBeenCalledWith(
          `room:${TEST_ROOM_ID}`,
          "winnerName",
          "Jane Smith",
        );
      });
    });

    describe("tallyVotes - unhappy paths", () => {
      it("should throw error when no votes are recorded", async () => {
        mockRedisClient.lRange.mockResolvedValueOnce([]);

        await expect(
          nomineeService.tallyVotes(TEST_ROOM_ID),
        ).rejects.toThrow(`no recorded votes when tallying room ${TEST_ROOM_ID}`);
      });

      it("should throw error when nominee count is not initialized", async () => {
        mockRedisClient.lRange.mockResolvedValueOnce(
          MOCK_VOTES.map((v) => JSON.stringify(v)),
        );
        mockRedisClient.get.mockResolvedValueOnce(null);

        await expect(
          nomineeService.tallyVotes(TEST_ROOM_ID),
        ).rejects.toThrow(`nominee count not initialized in room ${TEST_ROOM_ID}`);
      });

      it("should throw error when winner ID is not in nominee map", async () => {
        setupSuccessfulTallyVotesMocks(mockRedisClient, 5); // ID 5 is not in MOCK_NOMINEES

        await expect(
          nomineeService.tallyVotes(TEST_ROOM_ID),
        ).rejects.toThrow(`winner Id not defined in map for ${TEST_ROOM_ID}`);
      });

      it("should throw error when winner ID returns -1 (invalid election)", async () => {
        setupSuccessfulTallyVotesMocks(mockRedisClient, -1);

        await expect(
          nomineeService.tallyVotes(TEST_ROOM_ID),
        ).rejects.toThrow(`winnerID -1 not valid in room ${TEST_ROOM_ID}`);
      });
    });

    describe("getWinner", () => {
      it("should get winner successfully", async () => {
        mockRedisClient.hGet.mockResolvedValueOnce("John Doe");

        const winner = await nomineeService.getWinner(TEST_ROOM_ID);

        expect(winner).toBe("John Doe");
      });

      it("should return empty string when no winner is set", async () => {
        mockRedisClient.hGet.mockResolvedValueOnce(null);

        const winner = await nomineeService.getWinner(TEST_ROOM_ID);

        expect(winner).toBe("");
      });
    });
  });
});
