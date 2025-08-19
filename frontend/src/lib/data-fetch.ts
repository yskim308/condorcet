import axios from "axios";

interface RoomData {
  role: string;
  users: string[];
  state: string;
  nominations: string[];
  votedUsers?: string[];
  winner: string;
}

export async function fetchRoomData(roomId: string): Promise<RoomData | void> {
  const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!backendBase) throw new Error("NEXT_PUBLIC_BACKEND_URL not set in .env");
  const response = await axios.post<RoomData>(
    `${backendBase}/${roomId}/getRoomdData`,
  );
  return response.data;
}
