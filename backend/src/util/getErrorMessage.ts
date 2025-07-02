export default function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  // Fallback for non-Error types (e.g., strings, numbers, plain objects)
  return String(error);
}
