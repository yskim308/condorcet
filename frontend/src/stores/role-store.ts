import { create } from "zustand";
import type { RoleStore } from "@/types/role-store-types";

export const useRoleStore = create<RoleStore>((set) => ({
  role: "user",

  setRole: (role: "user" | "host") => set({ role: role }),
}));
