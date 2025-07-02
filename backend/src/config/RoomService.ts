import { redisClient } from "./redisClient";
import { getErrorMessage, getRedisError } from "../util/getErrorMessage";

interface RoomData {
  name: string;
  state: "nominating" | "voting" | "done";
  host: string;
  hostKey: string;
}

export class RoomService {
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

  async updateState(
    roomId: string,
    state: "nominating" | "voting" | "done",
  ): Promise<[Error | null, number]> {
    try {
      await redisClient.hset(`room:${roomId}`, "state", state);
      return [null, 200];
    } catch (error: unknown) {
      console.error("error updating room state: " + getErrorMessage(error));
      return getRedisError(error);
    }
  }

  async getState(roomId: string): Promise<[Error | null, string, number]> {
    try {
      const roomState = await redisClient.hget(`room:${roomId}`, "state");
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
  // @todo: exists
}
