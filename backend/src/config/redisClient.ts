import { createClient } from "redis";

export const redisClient = createClient({
  url: "redis://redis:6379",
});

if (process.env.NODE_ENV !== "test") {
  redisClient.connect();
}
