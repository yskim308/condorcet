import { useRoomStore } from "@/stores/room-store";
import { useSocketStore } from "@/stores/socket-store";
import useVotingActions from "@/hooks/use-voting-actions";
import { useShallow } from "zustand/shallow";
import { toast } from "sonner";

import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";

export default function VotingControlPanel() {
  const { hostKey, roomId } = useRoomStore(
    useShallow((state) => ({
      hostKey: state.hostKey,
      roomId: state.roomId,
    })),
  );

  const { handleSetDone } = useVotingActions();
  const votedUsers = useSocketStore((state) => state.votedUsers);

  const handleSetDoneClick = () => {
    if (!votedUsers.length) {
      toast.error("No one has voted yet!");
      return;
    }
    if (!hostKey || !roomId) {
      toast.error("Hostkey or Room ID is not defined in global state.");
      return;
    }
    handleSetDone({
      hostKey: hostKey,
      roomId: roomId,
    });
  };

  const hasVotes = votedUsers.length > 0;

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Voting Controls</CardTitle>
        <CardDescription>
          Once enough users have submitted their votes, you can close the polls
          and count the ballots.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="text-sm text-muted-foreground p-4 bg-muted rounded-lg">
          <span className="font-bold text-lg text-foreground mr-3">
            {votedUsers.length}
          </span>{" "}
          user(s) have voted so far.
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleSetDoneClick}
          disabled={!hasVotes}
          className="w-full"
        >
          Count Ballots
        </Button>
      </CardFooter>
    </Card>
  );
}
