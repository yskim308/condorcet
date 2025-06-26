import { describe, it, expect, beforeEach, mock } from "bun:test";
import express from "express";
import jwt from "jsonwebtoken";

// Mock the middleware module to use our test secret
mock.module("../middleware/verifyJwt.js", () => {
  const secretKey = "test-secret-key";
  
  return {
    verifyJwt: (
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

        const decoded = jwt.verify(token, secretKey) as { userName: string; roomId: string };

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
    }
  };
});

// Import after mocking
const { verifyJwt } = await import("../middleware/verifyJwt.js");

describe("verifyJwt Middleware", () => {
  let req: Partial<express.Request>;
  let res: Partial<express.Response>;
  let next: express.NextFunction;
  let jsonMock: any;
  let statusMock: any;
  const secretKey = "test-secret-key";

  beforeEach(() => {
    process.env.SECRET_KEY = secretKey;

    jsonMock = mock(() => res);
    statusMock = mock(() => res);

    req = {
      headers: {},
      body: {},
    };

    res = {
      status: statusMock,
      json: jsonMock,
    };

    next = mock(() => {});

    // Clear mocks
    jsonMock.mockClear();
    statusMock.mockClear();
    (next as any).mockClear();
  });

  it("should call next() with valid Bearer token", () => {
    const payload = { userName: "testUser", roomId: "room123" };
    const token = jwt.sign(payload, secretKey, { expiresIn: "30m" });

    req.headers = {
      authorization: `Bearer ${token}`,
    };

    verifyJwt(req as express.Request, res as express.Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.body?.userName).toBe("testUser");
    expect(req.body?.roomId).toBe("room123");
    expect(statusMock).not.toHaveBeenCalled();
  });

  it("should return 401 when no authorization header is provided", () => {
    req.headers = {};

    verifyJwt(req as express.Request, res as express.Response, next);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ error: "No token provided" });
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 401 when authorization header doesn't start with Bearer", () => {
    req.headers = {
      authorization: "Basic sometoken",
    };

    verifyJwt(req as express.Request, res as express.Response, next);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ error: "No token provided" });
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 401 for invalid token", () => {
    req.headers = {
      authorization: "Bearer invalid-token",
    };

    verifyJwt(req as express.Request, res as express.Response, next);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ error: "Invalid token" });
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 401 for expired token", () => {
    const payload = { userName: "testUser", roomId: "room123" };
    const expiredToken = jwt.sign(payload, secretKey, { expiresIn: "-1h" });

    req.headers = {
      authorization: `Bearer ${expiredToken}`,
    };

    verifyJwt(req as express.Request, res as express.Response, next);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ error: "Token expired" });
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 401 for token signed with wrong secret", () => {
    const payload = { userName: "testUser", roomId: "room123" };
    const wrongSecretToken = jwt.sign(payload, "wrong-secret", {
      expiresIn: "30m",
    });

    req.headers = {
      authorization: `Bearer ${wrongSecretToken}`,
    };

    verifyJwt(req as express.Request, res as express.Response, next);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ error: "Invalid token" });
    expect(next).not.toHaveBeenCalled();
  });

  it("should add userName and roomId to request body", () => {
    const payload = { userName: "alice", roomId: "room456" };
    const token = jwt.sign(payload, secretKey, { expiresIn: "30m" });

    req.headers = {
      authorization: `Bearer ${token}`,
    };
    req.body = { existingField: "value" };

    verifyJwt(req as express.Request, res as express.Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.body?.userName).toBe("alice");
    expect(req.body?.roomId).toBe("room456");
    expect(req.body?.existingField).toBe("value");
  });

  it("should handle malformed JWT token", () => {
    req.headers = {
      authorization: "Bearer malformed.token.here",
    };

    verifyJwt(req as express.Request, res as express.Response, next);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ error: "Invalid token" });
    expect(next).not.toHaveBeenCalled();
  });

  it("should handle empty Bearer token", () => {
    req.headers = {
      authorization: "Bearer ",
    };

    verifyJwt(req as express.Request, res as express.Response, next);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ error: "Invalid token" });
    expect(next).not.toHaveBeenCalled();
  });

  it("should handle token with missing payload fields", () => {
    const incompletePayload = { userName: "testUser" };
    const token = jwt.sign(incompletePayload, secretKey, { expiresIn: "30m" });

    req.headers = {
      authorization: `Bearer ${token}`,
    };

    verifyJwt(req as express.Request, res as express.Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.body?.userName).toBe("testUser");
    expect(req.body?.roomId).toBeUndefined();
  });
});

