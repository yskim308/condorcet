import { createClient, type RedisClientType } from "redis";

export const redisClient: RedisClientType = createClient({
  url: "redis://redis:6379",
});

if (process.env.NODE_ENV !== "test") {
  redisClient.connect();
}
