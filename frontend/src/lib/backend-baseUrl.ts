const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL;
if (!backendBase) {
  throw new Error("NEXT_PUBLIC_BACKEND_URL not set in environment");
}

export default backendBase;
