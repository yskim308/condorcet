import { useMutation } from "@tanstack/react-query";
import {
  addNominee,
  setVoting,
  setDone,
  AddNomineePayload,
  SetVotingPayload,
  SetDonePayload,
  sendVote,
  SendVotePayload,
} from "@/lib/vote-service";
import { toast } from "sonner";
import { getNominationMap, GetNominationMapPayload } from "@/lib/data-fetch";
import axios from "axios";
import { NominationsMap } from "@/types/socket-store-types";
import { useSocketStore } from "@/stores/socket-store";

export default function useVotingActions() {
  const onVotingActionError = (
    action: "add" | "vote" | "done" | "ballot" | "update",
    error: unknown,
  ) => {
    let errorMessage = "error while ";

    if (action === "add") {
      errorMessage += "adding nominee: ";
    } else if (action === "vote") {
      errorMessage += "setting state to vote: ";
    } else if (action === "done") {
      errorMessage += "setting state to done: ";
    } else if (action === "ballot") {
      errorMessage += "sending ballot: ";
    } else if (action === "update") {
      errorMessage += "updating nomination map: ";
    }

    if (axios.isAxiosError(error)) {
      const serverMessage = error.response?.data?.error;
      if (serverMessage) {
        errorMessage += serverMessage;
      }
    }
    if (error instanceof Error) {
      errorMessage += error.message;
    }

    console.error(errorMessage);
    toast.error(errorMessage);
  };

  const onUpdateNominationMapSuccess = (map: NominationsMap) => {
    const setNominationMap = useSocketStore((state) => state.setNominationMap);
    setNominationMap(map);
  };

  const sendVoteMutation = useMutation({
    mutationFn: sendVote,
    onError: (error, _, __) => onVotingActionError("ballot", error),
  });

  const addNomineeMutation = useMutation({
    mutationFn: addNominee,
    onError: (error, _, __) => onVotingActionError("add", error),
  });

  const setVotingMutation = useMutation({
    mutationFn: setVoting,
    onError: (error, _, __) => onVotingActionError("vote", error),
  });

  const setDoneMutation = useMutation({
    mutationFn: setDone,
    onError: (error, _, __) => onVotingActionError("done", error),
  });

  const updateNominationMap = useMutation({
    mutationFn: getNominationMap,
    onError: (error, _, __) => onVotingActionError("update", error),
    onSuccess: (data: NominationsMap, _, __) =>
      onUpdateNominationMapSuccess(data),
  });

  return {
    handleAddNominee: (payload: AddNomineePayload) =>
      addNomineeMutation.mutate(payload),
    handleSetVoting: (payload: SetVotingPayload) =>
      setVotingMutation.mutate(payload),
    handleSetDone: (payload: SetDonePayload) => setDoneMutation.mutate(payload),
    handleSendVote: (payload: SendVotePayload) =>
      sendVoteMutation.mutate(payload),
    updateNominationMap: (payload: GetNominationMapPayload) =>
      updateNominationMap.mutate(payload),
  };
}
