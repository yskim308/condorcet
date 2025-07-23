import { describe, it, expect, beforeEach, mock } from "bun:test";
import NomineeService from "../../config/NomineeService";

// Mock the findWinner utility function
const mockFindWinner = mock((votes: string[][], nominees: number) => 0);
mock.module("../util/findWinner", () => ({
  default: mockFindWinner,
}));
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
  hGetAll: mock(async (key: string) => ({ "0": "John Doe" })),
  lPush: mock(async (key: string, value: any) => {}),
  lRange: mock(async (key: string, start: number, stop: number) => [
    JSON.stringify(["1", "2", "3"]),
  ]),
});

const setupSuccessfulFindWinner = (mockRedisClient: any, winnerId = 0) => {
  mockRedisClient.lRange.mockResolvedValueOnce(
    MOCK_VOTES.map((v) => JSON.stringify(v)),
  );
  mockRedisClient.get.mockResolvedValueOnce("3");
  mockRedisClient.hGetAll.mockResolvedValueOnce(MOCK_NOMINEES);
  mockFindWinner.mockReturnValueOnce(winnerId);
};

describe("NomineeService", () => {
  let nomineeService: NomineeService;
  let mockRedisClient: ReturnType<typeof createMockRedisClient>;

  beforeEach(() => {
    mockRedisClient = createMockRedisClient();
    mockFindWinner.mockClear();
    nomineeService = new NomineeService(mockRedisClient as any);
  });

  describe("Basic Operations:", () => {
    describe("setNomineeCount", () => {
      it("should set nominee count successfully", async () => {
        const [error, status] =
          await nomineeService.setNomineeCount(TEST_ROOM_ID);

        expect(error).toBeNull();
        expect(status).toBe(200);
        expect(mockRedisClient.set).toHaveBeenCalledWith(
          `room:${TEST_ROOM_ID}:nominee_count`,
          -1,
        );
      });

      it("should return an error if redis fails", async () => {
        mockRedisClient.set.mockRejectedValueOnce(new Error("Redis error"));
        const [error, status] =
          await nomineeService.setNomineeCount(TEST_ROOM_ID);

        expect(error).toBeInstanceOf(Error);
        expect(status).toBe(500);
      });
    });

    describe("getNomineeCount", () => {
      it("should get nominee count successfully", async () => {
        const [error, count, status] =
          await nomineeService.getNomineeCount(TEST_ROOM_ID);

        expect(error).toBeNull();
        expect(count).toBe(1);
        expect(status).toBe(200);
        expect(mockRedisClient.get).toHaveBeenCalledWith(
          `room:${TEST_ROOM_ID}:nominee_count`,
        );
      });

      it("should return null if count does not exist", async () => {
        mockRedisClient.get.mockResolvedValueOnce("");
        const [error, count, status] =
          await nomineeService.getNomineeCount(TEST_ROOM_ID);

        expect(error).toBeNull();
        expect(count).toBeNull();
        expect(status).toBe(200);
      });

      it("should return an error if redis fails", async () => {
        mockRedisClient.get.mockRejectedValueOnce(new Error("Redis error"));
        const [error, count, status] =
          await nomineeService.getNomineeCount(TEST_ROOM_ID);

        expect(error).toBeInstanceOf(Error);
        expect(count).toBeNull();
        expect(status).toBe(500);
      });
    });

    describe("addNominee", () => {
      it("should add a nominee successfully", async () => {
        const [error, status] = await nomineeService.addNominee(
          TEST_ROOM_ID,
          "John Doe",
        );

        expect(error).toBeNull();
        expect(status).toBe(200);
      });

      it("should return an error if redis fails", async () => {
        mockRedisClient.incr.mockRejectedValueOnce(new Error("Redis error"));
        const [error, status] = await nomineeService.addNominee(
          TEST_ROOM_ID,
          "John Doe",
        );
        expect(error).toBeInstanceOf(Error);
        expect(status).toBe(500);
      });
    });

    describe("getAllNominees", () => {
      it("should get all nominees successfully", async () => {
        const [error, nominees, status] =
          await nomineeService.getAllNominees(TEST_ROOM_ID);

        expect(error).toBeNull();
        expect(nominees).toEqual({ "0": "John Doe" });
        expect(status).toBe(200);
      });

      it("should return an error if redis fails", async () => {
        mockRedisClient.hGetAll.mockRejectedValueOnce(new Error("Redis error"));
        const [error, nominees, status] =
          await nomineeService.getAllNominees(TEST_ROOM_ID);

        expect(error).toBeInstanceOf(Error);
        expect(nominees).toBeNull();
        expect(status).toBe(500);
      });
    });

    describe("saveVote", () => {
      it("should save a vote successfully", async () => {
        const [error, status] = await nomineeService.saveVote(TEST_ROOM_ID, [
          "1",
          "2",
          "3",
        ]);

        expect(error).toBeNull();
        expect(status).toBe(200);
      });

      it("should return an error if redis fails", async () => {
        mockRedisClient.lPush.mockRejectedValueOnce(new Error("Redis error"));
        const [error, status] = await nomineeService.saveVote(TEST_ROOM_ID, [
          "John Doe",
        ]);

        expect(error).toBeInstanceOf(Error);
        expect(status).toBe(500);
      });
    });

    describe("getAllVotes", () => {
      it("should get all votes successfully", async () => {
        const [error, votes, status] =
          await nomineeService.getAllVotes(TEST_ROOM_ID);

        expect(error).toBeNull();
        expect(votes).toEqual([["1", "2", "3"]]);
        expect(status).toBe(200);
      });

      it("should return an empty array if no votes", async () => {
        mockRedisClient.lRange.mockResolvedValueOnce([]);
        const [error, votes, status] =
          await nomineeService.getAllVotes(TEST_ROOM_ID);

        expect(error).toBeNull();
        expect(votes).toEqual([]);
        expect(status).toBe(200);
      });

      it("should return an error if redis fails", async () => {
        mockRedisClient.lRange.mockRejectedValueOnce(new Error("Redis error"));
        const [error, votes, status] =
          await nomineeService.getAllVotes(TEST_ROOM_ID);

        expect(error).toBeInstanceOf(Error);
        expect(votes).toBeNull();
        expect(status).toBe(500);
      });
    });
  });

  describe("Winner Determination", () => {
    describe("findWinner - success paths", () => {
      it("should find winner successfully with valid votes", async () => {
        setupSuccessfulFindWinner(mockRedisClient, 0);
        const [error, winner, status] =
          await nomineeService.findWinner(TEST_ROOM_ID);

        expect(error).toBeNull();
        expect(winner).toBe("John Doe");
        expect(status).toBe(200);

        expect(mockRedisClient.hSet).toHaveBeenCalledWith(
          `room:${TEST_ROOM_ID}`,
          "winnerId",
          "0",
        );
        expect(mockRedisClient.hSet).toHaveBeenCalledWith(
          `room:${TEST_ROOM_ID}`,
          "winnerName",
          "John Doe",
        );
      });

      it("should handle a different winner", async () => {
        setupSuccessfulFindWinner(mockRedisClient, 1);
        const [error, winner, status] =
          await nomineeService.findWinner(TEST_ROOM_ID);

        expect(error).toBeNull();
        expect(winner).toBe("Jane Smith");
        expect(status).toBe(200);

        expect(mockRedisClient.hSet).toHaveBeenCalledWith(
          `room:${TEST_ROOM_ID}`,
          "winnerId",
          "1",
        );
        expect(mockRedisClient.hSet).toHaveBeenCalledWith(
          `room:${TEST_ROOM_ID}`,
          "winnerName",
          "Jane Smith",
        );
      });
    });

    describe("findWinner - unhappy paths", () => {
      it("should return error when getAllVotes fails", async () => {
        mockRedisClient.lRange.mockRejectedValueOnce(new Error("Redis error"));

        const [error, winner, status] =
          await nomineeService.findWinner(TEST_ROOM_ID);

        expect(error).toBeInstanceOf(Error);
        expect(winner).toBe("");
        expect(status).toBe(500);
      });

      it("should return error when no votes are recorded", async () => {
        mockRedisClient.lRange.mockResolvedValueOnce([]);

        const [error, winner, status] =
          await nomineeService.findWinner("room123");

        expect(error).toBeInstanceOf(Error);
        expect(winner).toBe("");
        expect(status).toBe(500);
      });

      it("should return error when nominee count is not initialized", async () => {
        mockRedisClient.lRange.mockResolvedValueOnce([
          JSON.stringify(["John Doe"]),
        ]);
        mockRedisClient.get.mockResolvedValueOnce(null);

        const [error, winner, status] =
          await nomineeService.findWinner("room123");

        expect(error).toBeInstanceOf(Error);
        expect(winner).toBe("");
        expect(status).toBe(500);
      });

      it("should return error when winner ID is not in nominee map", async () => {
        mockRedisClient.lRange.mockResolvedValueOnce(
          MOCK_VOTES.map((vote) => JSON.stringify(vote)),
        );
        mockRedisClient.get.mockResolvedValueOnce("3");
        mockRedisClient.hGetAll.mockResolvedValueOnce(MOCK_NOMINEES);

        // Mock findWinner to return an ID that doesn't exist in the nominee map
        mockFindWinner.mockReturnValueOnce(5);

        const [error, winner, status] =
          await nomineeService.findWinner("room123");

        expect(error).toBeInstanceOf(Error);
        expect(winner).toBe("");
        expect(status).toBe(500);
      });

      it("should return error when winner ID returns -1 (invalid election)", async () => {
        mockRedisClient.lRange.mockResolvedValueOnce(
          MOCK_VOTES.map((vote) => JSON.stringify(vote)),
        );
        mockRedisClient.get.mockResolvedValueOnce("3");
        mockRedisClient.hGetAll.mockResolvedValueOnce(MOCK_NOMINEES);

        // Mock findWinner to return -1 (should not happen in valid election)
        mockFindWinner.mockReturnValueOnce(-1);

        const [error, winner, status] =
          await nomineeService.findWinner("room123");

        expect(error).toBeInstanceOf(Error);
        expect(winner).toBe("");
        expect(status).toBe(500);
      });

      it("should handle Redis errors during winner storage", async () => {
        const mockVotes = [["John Doe"]];
        const mockNomineeMap = { "0": "John Doe" };

        mockRedisClient.lRange.mockResolvedValueOnce(
          mockVotes.map((vote) => JSON.stringify(vote)),
        );
        mockRedisClient.get.mockResolvedValueOnce("3");
        mockRedisClient.hGetAll.mockResolvedValueOnce(mockNomineeMap);
        mockFindWinner.mockReturnValueOnce(0);

        // Make the first hSet call fail
        mockRedisClient.hSet.mockRejectedValueOnce(
          new Error("Redis storage error"),
        );

        const [error, winner, status] =
          await nomineeService.findWinner("room123");

        expect(error).toBeInstanceOf(Error);
        expect(winner).toBe("");
        expect(status).toBe(500);
      });
    });
    describe("getWinner", () => {
      it("should get winner successfully", async () => {
        mockRedisClient.hGet.mockResolvedValueOnce("John Doe");

        const [error, winner, status] =
          await nomineeService.getWinner("room123");

        expect(error).toBeNull();
        expect(winner).toBe("John Doe");
        expect(status).toBe(200);
      });

      it("should return error when no winner is set", async () => {
        mockRedisClient.hGet.mockResolvedValueOnce(null);

        const [error, winner, status] =
          await nomineeService.getWinner("room123");

        expect(error).toBeInstanceOf(Error);
        expect(winner).toBe("");
        expect(status).toBe(401);
      });

      it("should return error when Redis fails", async () => {
        mockRedisClient.hGet.mockRejectedValueOnce(new Error("Redis error"));

        const [error, winner, status] =
          await nomineeService.getWinner("room123");

        expect(error).toBeInstanceOf(Error);
        expect(winner).toBe("");
        expect(status).toBe(500);
      });
    });
  });
});
