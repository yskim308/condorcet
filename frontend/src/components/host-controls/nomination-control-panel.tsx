"use client";
import { ChangeEvent, useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import useVotingActions from "@/hooks/use-voting-actions";
import { useRoomStore } from "@/stores/room-store";
import { toast } from "sonner";
import { useShallow } from "zustand/shallow";

export default function NominationControlPanel() {
  const [input, setInput] = useState<string>("");

  const { handleAddNominee, handleSetVoting } = useVotingActions();

  const { hostKey, roomId } = useRoomStore(
    useShallow((state) => ({
      hostKey: state.hostKey,
      roomId: state.roomId,
    })),
  );

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleAddNomineeAndClear = () => {
    if (!roomId || !hostKey) {
      toast.error("hostKey or roomId is not defined!");
      return;
    }
    handleAddNominee({ roomId, nominee: input, hostKey });
    setInput("");
  };

  const handleSetVotingClick = () => {
    if (!roomId || !hostKey) {
      toast.error("hostKey or roomId is not defined!");
      return;
    }
    handleSetVoting({ roomId, hostKey });
  };

  return (
    <>
      <h1 className="text-5xl text-red-400">
        ok checking, should only show on host
      </h1>
      <Input value={input} onChange={handleInputChange} />
      <Button onClick={handleAddNomineeAndClear}>Add Nominee</Button>
      <Button onClick={handleSetVotingClick}>Start Vote</Button>
    </>
  );
}
