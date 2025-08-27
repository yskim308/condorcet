import { useMutation } from "@tanstack/react-query";
import {
  addNominee,
  setVoting,
  setDone,
  AddNomineePayload,
  SetVotingPayload,
  SetDonePayload,
} from "@/lib/vote-service";
import { toast } from "sonner";

export default function useVotingActions() {
  const onAddNomineeError = (error: unknown) => {
    let errorMessage = "error while adding nominee";
    if (error instanceof Error) {
      errorMessage += `: ${error.message}`;
    }
    toast.error(errorMessage);
  };

  const onStateSetError = (state: "voting" | "done", error: unknown) => {
    let errorMessage = "error while setting state to " + state;
    if (error instanceof Error) {
      errorMessage += `: ${error.message}`;
    }
    toast.error(errorMessage);
  };

  const addNomineeMutation = useMutation({
    mutationFn: addNominee,
    onError: (error, _, __) => onAddNomineeError(error),
  });

  const setVotingMutation = useMutation({
    mutationFn: setVoting,
    onError: (error, _, __) => onStateSetError("voting", error),
  });

  const setDoneMutation = useMutation({
    mutationFn: setDone,
    onError: (error, _, __) => onStateSetError("done", error),
  });

  return {
    handleAddNominee: (payload: AddNomineePayload) =>
      addNomineeMutation.mutate(payload),
    handleSetVoting: (payload: SetVotingPayload) =>
      setVotingMutation.mutate(payload),
    handleSetDone: (payload: SetDonePayload) => setDoneMutation.mutate(payload),
  };
}
