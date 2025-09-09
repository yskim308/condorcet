import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
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
import { useRoleStore } from "@/stores/role-store";
import UsersContainer from "./users-container";
import VotingControlPanel from "../host-controls/voting-control-panel";
import SortableItem from "./sortable-item";

export default function VotingPage() {
  const nominations = useSocketStore((state) => state.nominationMap);
  const users = useSocketStore((state) => state.users);
  const isHost = useRoleStore((state) => state.isHost);

  // Initialize ordered nominee IDs from nominations map
  const [orderedNomineeIds, setOrderedNomineeIds] = useState<number[]>(() => {
    return Object.keys(nominations).map(Number);
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
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

  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {isHost && (
          <div>
            <VotingControlPanel />
          </div>
        )}
        <div className={!isHost ? "col-span-2" : ""}>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold mb-4">Rank Nominees</h3>
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
          </div>
        </div>
        <div>
          <UsersContainer users={users} />
        </div>
      </div>
    </div>
  );
}
