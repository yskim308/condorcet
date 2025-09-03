export interface Message {
  userName: string;
  message: string;
}

export interface NominationsMap {
  [key: number]: string;
}

export interface SocketState {
  isConnected: boolean;
  nominationMap: NominationsMap;
  nominationlist: string[];
  users: string[];
  state: string;
  votedUsers: string[];
  winner?: string;
  messages: Message[];

  connect: () => void;
  disconnect: () => void;

  setNominationMap: (nominations: NominationsMap) => void;
  setNominationList: () => void;

  addToNominationList: (nominee: string) => void;

  setUsers: (users: string[]) => void;
  addUser: (user: string) => void;

  setState: (state: string) => void;

  setVotedUsers: (users: string[]) => void;
  addVotedUser: (user: string) => void;

  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;

  setWinner: (winner: string) => void;
}
