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
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useSocketStore } from "@/stores/socket-store";
import { useRoleStore } from "@/stores/role-store";
import UsersContainer from "./users-container";

interface SortableItemProps {
  id: number;
  name: string;
}

function SortableItem({ id, name }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="mb-2">
        <CardContent className="flex items-center p-4">
          <div
            className="cursor-grab active:cursor-grabbing mr-3 text-gray-500 hover:text-gray-700"
            {...attributes}
            {...listeners}
          >
            <GripVertical size={20} />
          </div>
          <span className="flex-1 text-sm font-medium">{name}</span>
        </CardContent>
      </Card>
    </div>
  );
}

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
        {isHost && <div>placeholder for controls</div>}
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
