import express from "express";
import { redisClient } from "../config/redisClient";

export const verifyHost = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) => {
  try {
    const { roomId } = req.params;
    const { hostKey } = req.body;

    if (!hostKey) {
      res.status(401).json({ error: "no host key provided" });
      return;
    }

    const roomHostKey = await redisClient.hGet(`room:${roomId}`, "hostKey");
    if (hostKey !== roomHostKey) {
      res.status(403).json({ error: "invalid host key" });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({ error: "host key verification failed" });
    return;
  }
};
