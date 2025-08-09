import { create } from "zustand";

interface SocketState {
  isConnected: boolean;
  nominations: string[];
  users: string[];
  state: string;
  votedUsers: string[];
  winner?: string;
  messages: string[];

  connect: () => void;
  disconnect: () => void;
  setNominations: (nominations: string[]) => void;
  setUsers: (users: string[]) => void;
  setState: (state: string) => void;
  setVotedUsers: (users: string[]) => void;
  setMessages: (messages: string[]) => void;
}

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
  setUsers: (users: string[]) => set({ users: users }),
  setState: (state: string) => set({ state: state }),
  setVotedUsers: (users: string[]) => set({ votedUsers: users }),
  setMessages: (messages: string[]) => set({ messages: messages }),
}));
