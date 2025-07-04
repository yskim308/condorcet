import { redisClient } from "./redisClient";
import { getErrorMessage, getRedisError } from "../util/getErrorMessage";

export default class UserRoomService {
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

  // @toodo: userExists, getUsers
}
