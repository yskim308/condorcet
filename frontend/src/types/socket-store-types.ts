export interface Message {
  userName: string;
  message: string;
}

export interface SocketState {
  isConnected: boolean;
  nominations: string[];
  users: string[];
  state: string;
  votedUsers: string[];
  winner?: string;
  messages: Message[];

  connect: () => void;
  disconnect: () => void;
  setNominations: (nominations: string[]) => void;
  addNominee: (nominee: string) => void;
  setUsers: (users: string[]) => void;
  addUser: (user: string) => void;
  setState: (state: string) => void;
  setVotedUsers: (users: string[]) => void;
  addVotedUser: (user: string) => void;
  setMessages: (messages: Message[]) => void;
}
