"use client";
import { ChangeEvent, useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import useVotingActions from "@/hooks/use-voting-actions";
import { useRoomStore } from "@/stores/room-store";
import { toast } from "sonner";
import { useShallow } from "zustand/shallow";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

export default function NominationControlPanel() {
  const [input, setInput] = useState<string>("");

  const userName = useRoomStore((state) => state.userName);

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
    if (!input.trim()) {
      toast.error("Nominee cannot be empty.");
      return;
    }
    handleAddNominee({ roomId, nominee: input, hostKey });
    setInput("");
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAddNomineeAndClear();
    }
  };

  const handleSetVotingClick = () => {
    if (!roomId || !hostKey || !userName) {
      toast.error("no recorded state for this user!");
      console.error(
        "from handleSetVotingClick, no roomId, hostkey, or username",
      );
      return;
    }
    handleSetVoting({ roomId, hostKey });
  };

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="nominee-input" className="text-sm font-medium">
            Add Nominee
          </label>
          <div className="flex space-x-2">
            <Input
              id="nominee-input"
              value={input}
              onKeyDown={handleKeyPress}
              onChange={handleInputChange}
              placeholder="Enter nominee name"
            />
            <Button variant="secondary" onClick={handleAddNomineeAndClear}>
              Add
            </Button>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSetVotingClick} className="w-full">
          Start Vote
        </Button>
      </CardFooter>
    </Card>
  );
}
