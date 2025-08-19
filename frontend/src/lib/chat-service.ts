import { Message } from "@/types/socket-store-types";
import axios from "axios";

const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL;
if (!backendBase) {
  throw new Error("NEXT_PUBLIC_BACKEND_BASE not set in .env");
}

export const sendMessage = async (roomId: string, message: Message) => {
  await axios.post(`${backendBase}/rooms/${roomId}/message/sendMessage`, {
    userName: message.userName,
    message: message.message,
  });
};

export const getALlMessages = async (roomId: string) => {
  const response = await axios.get<Message[]>(
    `${backendBase}/rooms/${roomId}/message/getAll`,
  );
  return response.data;
};
