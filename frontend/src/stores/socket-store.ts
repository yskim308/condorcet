import { create } from "zustand";
import type { SocketState, Message } from "@/types/socket-store-types";

export const useSocketStore = create<SocketState>((set) => ({
  isConnected: false,
  nominations: [],
  users: [],
  state: "",
  votedUsers: [],
  messages: [],

  connect: () => set({ isConnected: true }),
  disconnect: () => set({ isConnected: false }),
  setNominations: (nominations: string[]) => set({ nominations: nominations }),
  addNominee: (nominee: string) =>
    set((state) => ({
      nominations: [...state.nominations, nominee],
    })),
  setUsers: (users: string[]) => set({ users: users }),
  addUser: (user: string) =>
    set((state) => ({ users: [...state.users, user] })),
  setState: (state: string) => set({ state: state }),
  setVotedUsers: (users: string[]) => set({ votedUsers: users }),
  addVotedUser: (user: string) =>
    set((state) => ({ votedUsers: [...state.votedUsers, user] })),
  setMessages: (messages: Message[]) => set({ messages: messages }),
  addMessage: (message: Message) =>
    set((state) => ({ messages: { ...state.messages, message } })),
}));
