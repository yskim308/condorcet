import { redisClient } from "./redisClient";
import { getErrorMessage, getRedisError } from "../util/getErrorMessage";

class UserRoomService {
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

  async userExists(
    roomId: string,
    userName: string,
  ): Promise<[Error | null, boolean, number]> {
    try {
      const exists = await redisClient.sIsMember(
        `room:${roomId}:users`,
        userName,
      );
      if (!exists) {
        return [null, false, 200];
      } else {
        return [null, true, 200];
      }
    } catch (error: unknown) {
      console.error(
        `error checking if user ${userName} exists` + getErrorMessage(error),
      );
      const [err, code] = getRedisError(error);
      return [err, false, code];
    }
  }

  async getUsers(roomId: string): Promise<[Error | null, string[], number]> {
    try {
      const members: string[] = await redisClient.sMembers(
        `room:${roomId}:users`,
      );
      return [null, members, 200];
    } catch (error: unknown) {
      console.error(
        `error getting users for room ${roomId}` + getErrorMessage(error),
      );
      const [err, code] = getRedisError(error);
      return [err, [], 200];
    }
  }

  async setUserVoted(
    roomId: string,
    userName: string,
  ): Promise<[Error | null, number]> {
    try {
      const [err, exists, code] = await this.userExists(roomId, userName);
      if (!exists) {
        return [
          new Error(`User ${userName} does not exist in room ${roomId}`),
          404,
        ];
      }
      await redisClient.sAdd(`room:${roomId}:voted`, userName);
      return [null, 200];
    } catch (error: unknown) {
      return getRedisError(error);
    }
  }

  async checkUserVoted(
    roomId: string,
    userName: string,
  ): Promise<[Error | null, boolean, number]> {
    try {
      const exists = await redisClient.sIsMember(
        `room:${roomId}:voted`,
        userName,
      );
      if (exists) {
        return [null, true, 200];
      } else {
        return [null, false, 200];
      }
    } catch (error: unknown) {
      const [err, code] = getRedisError(error);
      return [err, false, code];
    }
  }
}

const userRoomService = new UserRoomService();
export default userRoomService;
