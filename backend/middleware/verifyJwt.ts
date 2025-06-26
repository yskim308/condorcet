import express from "express";
import jwt from "jsonwebtoken";

const secretKey = process.env.SECRET_KEY;
if (!secretKey) {
  throw new Error("SECRET_KEY not defined in .env");
}

interface JwtPayload {
  userName: string;
  roomId: string;
}

export const verifyJwt = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "No token provided" });
      return;
    }

    const token = authHeader.substring(7);

    const decoded = jwt.verify(token, secretKey) as JwtPayload;

    req.body.userName = decoded.userName;
    req.body.roomId = decoded.roomId;

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: "Token expired" });
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: "Invalid token" });
      return;
    }
    res.status(500).json({ error: "Token verification failed" });
    return;
  }
};
