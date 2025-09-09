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
import { ScrollArea } from "../ui/scroll-area";
import SortableItem from "./sortable-item";
import { Button } from "../ui/button";

export default function SortableList() {
  const nominations = useSocketStore((state) => state.nominationMap);

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
    <div>
      <h3 className="text-md font-semibold mb-4">Rank Nominees</h3>
      <ScrollArea className="h-48 lg:h-96">
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
      <Button>Submit Vote</Button>
    </div>
  );
}
