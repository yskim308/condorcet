import axios from "axios";
import backendBase from "./backend-baseUrl";

export interface AddNomineePayload {
  roomId: string;
  nominee: string;
  hostKey: string;
}
export const addNominee = async ({
  roomId,
  nominee,
  hostKey,
}: AddNomineePayload) => {
  await axios.post(`${backendBase}/rooms/${roomId}/nomination`, {
    hostKey: hostKey,
    nominee: nominee,
  });
};

export interface SetVotingPayload {
  roomId: string;
  hostKey: string;
}
export const setVoting = async ({ roomId, hostKey }: SetVotingPayload) => {
  await axios.post(`${backendBase}/rooms/${roomId}/setVoting`, {
    hostKey: hostKey,
  });
};

export interface SetDonePayload {
  roomId: string;
  hostKey: string;
}
export const setDone = async ({ roomId, hostKey }: SetDonePayload) => {
  await axios.post(`${backendBase}/rooms/${roomId}/setDone`, {
    hostKey: hostKey,
  });
};
