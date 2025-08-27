import axios from "axios";
import backendBase from "./backend-baseUrl";

const addNominee = async (roomId: string, nominee: string, hostKey: string) => {
  await axios.post(`${backendBase}/rooms/${roomId}/nomination`, {
    hostKey: hostKey,
    nominee: nominee,
  });
};
