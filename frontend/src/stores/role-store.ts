import { create } from "zustand";
import type { RoleStore } from "@/types/role-store-types";

export const useRoleStore = create<RoleStore>((set) => ({
  isHost: false,

  setHost: () => set({ isHost: true }),
}));
