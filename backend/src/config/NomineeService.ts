import type { RedisClientType } from "redis";
import { getErrorMessage, getRedisError } from "../util/getErrorMessage";
import type { NomineeMap } from "../types/nominee";

export default class NomineeService {
  private redisClient: RedisClientType;

  constructor(redisClient: RedisClientType) {
    this.redisClient = redisClient;
  }
  async setNomineeCount(roomId: string): Promise<[Error | null, number]> {
    try {
      await this.redisClient.set(`room:${roomId}:nominee_count`, -1);
      return [null, 200];
    } catch (error: unknown) {
      console.error("error setting nominee count: " + getErrorMessage(error));
      return getRedisError(error);
    }
  }

  async getNomineeCount(
    roomId: string,
  ): Promise<[Error | null, number | null, number]> {
    try {
      const count = await this.redisClient.get(`room:${roomId}:nominee_count`);
      if (!count) {
        return [null, null, 200];
      }
      return [null, parseInt(count), 200];
    } catch (error: unknown) {
      console.error("error getting nominee count: " + getErrorMessage(error));
      const [err, code] = getRedisError(error);
      return [err, null, code];
    }
  }

  async addNominee(
    roomId: string,
    nominee: string,
  ): Promise<[Error | null, number]> {
    try {
      const nominee_id = await this.redisClient.incr(
        `room:${roomId}:nominee_count`,
      );
      await this.redisClient.hSet(
        `room:${roomId}:nominees`,
        nominee_id,
        nominee,
      );
      return [null, 200];
    } catch (error: unknown) {
      console.error("error adding nominee: " + getErrorMessage(error));
      return getRedisError(error);
    }
  }

  async getAllNominees(
    roomId: string,
  ): Promise<[Error | null, NomineeMap | null, number]> {
    try {
      // HGETALL returns an object where keys are fields and values are their corresponding values.
      const nominees: NomineeMap = await this.redisClient.hGetAll(
        `room:${roomId}:nominees`,
      );

      return [null, nominees, 200];
    } catch (error: unknown) {
      console.error("error getting all nominees: " + getErrorMessage(error));
      // Depending on your error handling, you might return a specific error type;
      const [err, code] = getRedisError(error);
      return [err, null, code];
    }
  }

  async saveVote(
    roomId: string,
    preferences: string[],
  ): Promise<[Error | null, number]> {
    try {
      // Serialize the array to a JSON string to preserve its structure
      const serializedPreferences = JSON.stringify(preferences);
      await this.redisClient.lPush(
        `room:${roomId}:votes`,
        serializedPreferences,
      );
      return [null, 200];
    } catch (error: unknown) {
      console.error(
        "Error saving voting preferences: " + getErrorMessage(error),
      );
      return getRedisError(error);
    }
  }

  async getAllVotes(
    roomId: string,
  ): Promise<[Error | null, string[][] | null, number]> {
    try {
      const votesAsJson = await this.redisClient.lRange(
        `room:${roomId}:votes`,
        0,
        -1,
      );
      if (!votesAsJson) {
        return [null, [], 200]; // Return empty array if no votes
      }
      // Parse each JSON string back into an array of strings
      const votes = votesAsJson.map((vote) => JSON.parse(vote));
      return [null, votes, 200];
    } catch (error: unknown) {
      console.error("error getting all votes: " + getErrorMessage(error));
      const [err, code] = getRedisError(error);
      return [err, null, code];
    }
  }
}
