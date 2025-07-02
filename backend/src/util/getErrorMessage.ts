export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  // Fallback for non-Error types (e.g., strings, numbers, plain objects)
  return String(error);
}

export function getRedisError(error: unknown): [Error, number] {
  if (error instanceof Error) {
    return [error, 500];
  }
  return [new Error(getErrorMessage(error)), 500];
}
