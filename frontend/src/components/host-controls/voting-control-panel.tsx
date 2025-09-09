import { useRoomStore } from "@/stores/room-store";
import { useShallow } from "zustand/shallow";
import { Button } from "../ui/button";
import useVotingActions from "@/hooks/use-voting-actions";
import { toast } from "sonner";
import { useSocketStore } from "@/stores/socket-store";

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
      toast.error("no one has voted yet!");
      return;
    }
    if (!hostKey || !roomId) {
      toast.error("hostkey or roomId is not defined in global state");
      return;
    }
    handleSetDone({
      hostKey: hostKey,
      roomId: roomId,
    });
  };

  return (
    <>
      <Button onClick={handleSetDoneClick} disabled={votedUsers.length === 0}>
        count ballots
      </Button>
    </>
  );
}
