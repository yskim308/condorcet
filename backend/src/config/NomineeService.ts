import { redisClient } from "./redisClient";
import { getErrorMessage, getRedisError } from "../util/getErrorMessage";

export class NomineeService {
  async setNomineeCount(roomId: string): Promise<[Error | null, number]> {
    try {
      await redisClient.set(`room:${roomId}:nominee_count`, -1);
      return [null, 200];
    } catch (error: unknown) {
      console.error("error setting nominee count: " + getErrorMessage(error));
      return getRedisError(error);
    }
  }

  async addNominee(
    roomId: string,
    nominee: string,
  ): Promise<[Error | null, number]> {
    try {
      const nominee_id = await redisClient.incr(`room:${roomId}:nominee_count`);
      await redisClient.hset(`room:${roomId}:nominees`, nominee_id, nominee);
      return [null, 200];
    } catch (error: unknown) {
      console.error("error adding nominee: " + getErrorMessage(error));
      return getRedisError(error);
    }
  }
}
