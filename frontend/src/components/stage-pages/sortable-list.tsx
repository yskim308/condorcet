import { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSocketStore } from "@/stores/socket-store";
import { ScrollArea } from "../ui/scroll-area";
import SortableItem from "./sortable-item";
import { Button } from "../ui/button";
import { useRoomStore } from "@/stores/room-store";
import { toast } from "sonner";
import useVotingActions from "@/hooks/use-voting-actions";

export default function SortableList() {
  const nominations = useSocketStore((state) => state.nominationMap);
  const votedUsers = useSocketStore((state) => state.votedUsers);

  const [userSubmitted, setUserSubmitted] = useState<boolean>(false);
  const userName = useRoomStore((state) => state.userName);
  const roomId = useRoomStore((state) => state.roomId);

  const { fetchNominationMap } = useVotingActions();
  const { setNominationMap } = useSocketStore();

  const [orderedNomineeIds, setOrderedNomineeIds] = useState<number[]>(() => {
    return Object.keys(nominations).map(Number);
  });

  const [mapFetched, setMapFetched] = useState<boolean>(false);

  useEffect(() => {
    if (!userName) {
      toast.error("username is not set?");
      return;
    }
    if (votedUsers.includes(userName)) {
      setUserSubmitted(true);
    }
  }, [votedUsers]);

  // run once on load
  useEffect(() => {
    if (!userName || !roomId) {
      toast.error("username or roomid not set");
      return;
    }
    fetchNominationMap.mutate({ roomId, userName });
  }, []);

  // check fetch results

  useEffect(() => {
    if (fetchNominationMap.data) {
      setNominationMap(fetchNominationMap.data);
      setOrderedNomineeIds(Object.keys(fetchNominationMap.data).map(Number));
      setMapFetched(true);
    }
  }, [fetchNominationMap.data]);

  const { handleSendVote } = useVotingActions();
  const handleSubmitClick = () => {
    if (!userName || !roomId) {
      toast.error("username or roomid not set");
      return;
    }
    const votesAsStrings = orderedNomineeIds.map(String);
    handleSendVote({
      userName: userName,
      roomId: roomId,
      votes: votesAsStrings,
    });
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150, // wait 150ms before drag starts
        tolerance: 5, // movement threshold in px
      },
    }),
  );

  function handleDragEnd(event: any) {
    const { active, over } = event;

    if (active.id !== over.id) {
      setOrderedNomineeIds((items) => {
        const oldIndex = items.indexOf(active.id);
        const newIndex = items.indexOf(over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }
  return mapFetched ? (
    <div className="p-5 border-2 rounded-3xl">
      <h3 className="text-md font-semibold mb-4">Rank Nominees</h3>
      <ScrollArea className="h-96">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={orderedNomineeIds}
            strategy={verticalListSortingStrategy}
          >
            {orderedNomineeIds.map((nomineeId) => (
              <SortableItem
                key={nomineeId}
                id={nomineeId}
                name={nominations[nomineeId]}
              />
            ))}
          </SortableContext>
        </DndContext>
      </ScrollArea>
      <Button onClick={handleSubmitClick} disabled={userSubmitted}>
        Submit Vote
      </Button>
    </div>
  ) : (
    <div>loading...</div>
  );
}
