import { Card, CardContent } from "@/components/ui/card";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

interface SortableItemProps {
  id: number;
  name: string;
}

export default function SortableItem({ id, name }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="mb-2">
        <CardContent className="flex items-center">
          <div
            className="cursor-grab active:cursor-grabbing mr-3 text-gray-500"
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
