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
  addNominee: (nominee: string) => void;
  setUsers: (users: string[]) => void;
  addUser: (user: string) => void;
  setState: (state: string) => void;
  setVotedUsers: (users: string[]) => void;
  addVotedUser: (user: string) => void;
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
  setMessages: (messages: string[]) => set({ messages: messages }),
}));
