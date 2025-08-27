import { RoomStore } from "@/types/room-store-types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useRoomStore = create<RoomStore>()(
  persist(
    (set) => ({
      userName: null,
      hostKey: null,
      roomId: null,

      setUserName: (userName: string) => set({ userName: userName }),
      setHostKey: (hostKey: string) => set({ hostKey: hostKey }),
      setRoomId: (roomId: string) => set({ roomId: roomId }),
    }),
    {
      name: "room-storage",
    },
  ),
);
