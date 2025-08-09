import { io } from "socket.io-client";

const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;
if (!backendURL) {
  throw new Error("error, backend url not set in .env");
}
const socket = io(backendURL);

export default socket;
