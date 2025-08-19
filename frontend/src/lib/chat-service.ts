import { Message } from "@/types/socket-store-types";
import axios from "axios";

const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL;
if (!backendBase) {
  throw new Error("NEXT_PUBLIC_BACKEND_BASE not set in .env");
}

export interface SendMessagePayload {
  roomId: string;
  userName: string;
  message: string;
}
export const sendMessage = async ({
  roomId,
  userName,
  message,
}: SendMessagePayload) => {
  await axios.post(`${backendBase}/rooms/${roomId}/message/sendMessage`, {
    userName: userName,
    message: message,
  });
};

export const getALlMessages = async (roomId: string) => {
  const response = await axios.get<Message[]>(
    `${backendBase}/rooms/${roomId}/message/getAll`,
  );
  return response.data;
};
