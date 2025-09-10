"use client";
import { ChangeEvent, useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import useVotingActions from "@/hooks/use-voting-actions";
import { useRoomStore } from "@/stores/room-store";
import { toast } from "sonner";
import { useShallow } from "zustand/shallow";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useSocketStore } from "@/stores/socket-store";

export default function NominationControlPanel() {
  const [input, setInput] = useState<string>("");

  const userName = useRoomStore((state) => state.userName);
  const setNominationMap = useSocketStore((state) => state.setNominationMap);

  const { handleAddNominee, handleSetVoting, fetchNominationMap } =
    useVotingActions();

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

  const handleSetVotingClick = () => {
    if (!roomId || !hostKey || !userName) {
      toast.error("no recorded state for this user!");
      console.error(
        "from handleSetVotingClick, no roomId, hostkey, or username",
      );
      return;
    }
    fetchNominationMap.mutate({ roomId, userName });
    handleSetVoting({ roomId, hostKey });
  };

  useEffect(() => {
    if (fetchNominationMap.data) setNominationMap(fetchNominationMap.data);
  }, [fetchNominationMap.data]);

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
