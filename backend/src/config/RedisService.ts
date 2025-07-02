import { redisClient } from "./redisClient";
import { getErrorMessage, getRedisError } from "../util/getErrorMessage";

interface RoomData {
  name: string;
  state: "nominating" | "voting" | "done";
  host: string;
  hostKey: string;
}
export class RedisService {
  async createRoom(
    roomId: string,
    roomData: RoomData,
  ): Promise<[Error | null, number]> {
    try {
      await redisClient.hset(`room:${roomId}`, roomData);
      return [null, 200];
    } catch (error: unknown) {
      console.error("error creating room: " + getErrorMessage(error));
      return getRedisError(error);
    }
  }

  async enrollUser(
    roomId: string,
    userName: string,
  ): Promise<[Error | null, number]> {
    try {
      await redisClient.sAdd(`room:${roomId}:users`, userName);
      return [null, 200];
    } catch (error: unknown) {
      console.error("error adding user to room: " + getErrorMessage(error));
      return getRedisError(error);
    }
  }

  async setNomineeCount(roomId: string): Promise<[Error | null, number]> {
    try {
      await redisClient.set(`room:${roomId}:nominee_count`, -1);
      return [null, 200];
    } catch (error: unknown) {
      console.error("error setting nominee count: " + getErrorMessage(error));
      return getRedisError(error);
    }
  }
}
