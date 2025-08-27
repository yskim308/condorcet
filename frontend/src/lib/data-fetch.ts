import axios from "axios";
import backendBase from "./backend-baseUrl";

interface RoomData {
  role: string;
  users: string[];
  state: string;
  nominations: string[];
  votedUsers?: string[];
  winner?: string;
}

export async function fetchRoomData(
  roomId: string,
  userName: string,
): Promise<RoomData> {
  const response = await axios.post<RoomData>(
    `${backendBase}/room/${roomId}/getRoomData`,
    {
      userName,
    },
  );
  return response.data;
}
