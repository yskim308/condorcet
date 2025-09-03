import { create } from "zustand";
import type {
  SocketState,
  Message,
  NominationsMap,
} from "@/types/socket-store-types";

export const useSocketStore = create<SocketState>((set) => ({
  isConnected: false,
  nominationMap: {},
  nominationlist: [],
  users: [],
  state: "",
  votedUsers: [],
  messages: [],

  connect: () => set({ isConnected: true }),
  disconnect: () => set({ isConnected: false }),

  setNominationMap: (nominations: NominationsMap) => {
    set({ nominationMap: nominations });
  },

  setNominationList: (nominations: NominationsMap) => {
    const nominationArray = Object.values(nominations);
    set({ nominationlist: nominationArray });
  },

  addToNominationList: (nominee: string) => {
    set((state) => ({ nominationlist: [...state.nominationlist, nominee] }));
  },

  setUsers: (users: string[]) => set({ users: users }),
  addUser: (user: string) =>
    set((state) => ({ users: [...state.users, user] })),

  setState: (state: string) => set({ state: state }),

  setVotedUsers: (users: string[]) => set({ votedUsers: users }),
  addVotedUser: (user: string) =>
    set((state) => ({ votedUsers: [...state.votedUsers, user] })),

  setMessages: (messages: Message[]) => set({ messages: messages }),
  addMessage: (message: Message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  setWinner: (winner: string) => set({ winner: winner }),
}));
