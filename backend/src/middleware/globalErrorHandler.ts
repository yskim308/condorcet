import express from "express";

export default function globalErrorHandler(
  err: unknown,
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) {
  console.error(err);
  if (err instanceof Error) {
    res.status(500).json({ error: err.message });
  } else {
    res.status(500).json({ error: "internal server error" });
  }
}
