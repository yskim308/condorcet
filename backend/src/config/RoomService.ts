import type { RedisClientType } from "redis";
import { getErrorMessage, getRedisError } from "../util/getErrorMessage";
import type { RoomData } from "../types/room";
import { TTL } from "./constants";

class RoomService {
  private redisClient: RedisClientType;

  constructor(redisClient: RedisClientType) {
    this.redisClient = redisClient;
  }

  async createRoom(
    roomId: string,
    roomData: RoomData,
  ): Promise<[Error | null, number]> {
    const key = `room:${roomId}`;
    try {
      await this.redisClient.hSet(key, { ...roomData });
      await this.redisClient.expire(key, TTL);
      return [null, 200];
    } catch (error: unknown) {
      console.error("error creating room: " + getErrorMessage(error));
      return getRedisError(error);
    }
  }

  async setVoting(roomId: string): Promise<[Error | null, number]> {
    try {
      await this.redisClient.hSet(`room:${roomId}`, "state", "voting");
      return [null, 200];
    } catch (error: unknown) {
      console.error("error setting state to voting: " + getErrorMessage(error));
      return getRedisError(error);
    }
  }

  async setDone(roomId: string): Promise<[Error | null, number]> {
    try {
      await this.redisClient.hSet(`room:${roomId}`, "state", "done");
      return [null, 200];
    } catch (error: unknown) {
      console.error("error setting state to done: " + getErrorMessage(error));
      return getRedisError(error);
    }
  }

  async getState(roomId: string): Promise<[Error | null, string, number]> {
    try {
      const roomState = await this.redisClient.hGet(`room:${roomId}`, "state");
      if (roomState) {
        return [null, String(roomState), 200];
      } else {
        return [null, "", 200];
      }
    } catch (error: unknown) {
      console.error("error getting room state: " + getErrorMessage(error));
      const [err, code] = getRedisError(error);
      return [err, "", code];
    }
  }

  async exists(roomId: string): Promise<[Error | null, boolean, number]> {
    try {
      const roomExists = await this.redisClient.exists(`room:${roomId}`);
      return [null, roomExists === 1, 200];
    } catch (error: unknown) {
      console.error("error getting room state: " + getErrorMessage(error));
      const [err, code] = getRedisError(error);
      return [err, false, code];
    }
  }

  async getHostKey(roomId: string): Promise<[Error | null, string, number]> {
    try {
      const hostKey = await this.redisClient.hGet(`room:${roomId}`, "hostKey");
      if (hostKey) {
        return [null, String(hostKey), 200];
      } else {
        return [new Error("no hostkey or room not found"), "", 404];
      }
    } catch (error) {
      console.error("error getting hostkey: " + getErrorMessage(error));
      const [err, code] = getRedisError(error);
      return [err, "", code];
    }
  }
}

export default RoomService;
