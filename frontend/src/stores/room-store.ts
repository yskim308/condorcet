import { RoomStore } from "@/types/room-store-types";
import { create } from "zustand";

export const useRoomStore = create<RoomStore>((set) => ({
  userName: null,
  hostKey: null,
  roomId: null,

  setUserName: (userName: string) => set({ userName: userName }),
  setHostKey: (hostKey: string) => set({ hostKey: hostKey }),
  setRoomId: (roomId: string) => set({ roomId: roomId }),
}));
