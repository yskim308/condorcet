import axios from "axios";
import backendBase from "./backend-baseUrl";

export const addNominee = async (
  roomId: string,
  nominee: string,
  hostKey: string,
) => {
  await axios.post(`${backendBase}/rooms/${roomId}/nomination`, {
    hostKey: hostKey,
    nominee: nominee,
  });
};

export const setVoting = async (roomId: string, hostKey: string) => {
  await axios.post(`${backendBase}/rooms/${roomId}/setVoting`, {
    hostKey: hostKey,
  });
};

export const setDone = async (roomId: string, hostKey: string) => {
  await axios.post(`${backendBase}/rooms/${roomId}/setDone`, {
    hostKey: hostKey,
  });
};
