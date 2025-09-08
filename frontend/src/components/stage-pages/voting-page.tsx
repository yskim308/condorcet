import { useSocketStore } from "@/stores/socket-store";
import { useRoleStore } from "@/stores/role-store";
import UsersContainer from "./users-container";

import { useState } from "react";
import { DndContext, closestCenter, DragEndEvent } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";

function SortableItem({ id, name }: { id: number; name: string }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="mb-2 cursor-grab rounded-2xl shadow-md"
    >
      <CardContent className="p-4 flex justify-between">
        <span className="font-semibold">#{id}</span>
        <span>{name}</span>
      </CardContent>
    </Card>
  );
}

export default function VotingPage() {
  const nominations = useSocketStore((state) => state.nominationMap);
  const users = useSocketStore((state) => state.users);
  const isHost = useRoleStore((state) => state.isHost);

  // state holding the current order of nominee IDs
  const [order, setOrder] = useState<number[]>(
    Object.keys(nominations).map((id) => Number(id)),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setOrder((items) => {
        const oldIndex = items.indexOf(Number(active.id));
        const newIndex = items.indexOf(Number(over.id));
        return arrayMove(items, oldIndex, newIndex);
      });
      console.log(order);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {isHost && <div>placeholder for controls</div>}
        <div className={!isHost ? "col-span-2" : ""}>
          <DndContext
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={order}
              strategy={verticalListSortingStrategy}
            >
              {order.map((id) => (
                <SortableItem key={id} id={id} name={nominations[id]} />
              ))}
            </SortableContext>
          </DndContext>
        </div>
        <div>
          <UsersContainer users={users} />
        </div>
      </div>
    </div>
  );
}
