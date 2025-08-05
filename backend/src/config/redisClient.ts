import { createClient, type RedisClientType } from "redis";

const createRedisClient = (): RedisClientType => {
  const isTest = process.env.NODE_ENV === "test";
  return createClient({
    url: "redis://redis:6379",
    database: isTest ? 1 : 0,
  });
};
const redisClient: RedisClientType = createRedisClient();
redisClient.connect();

export { redisClient };
