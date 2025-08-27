import { Message } from "@/types/socket-store-types";
import axios from "axios";
import backendBase from "./backend-baseUrl";

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
