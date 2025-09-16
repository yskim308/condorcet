import { useRoomStore } from "@/stores/room-store";
import { useSocketStore } from "@/stores/socket-store";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Vote, Hash, Info } from "lucide-react";

export default function RoomInfoCollapsable() {
  const roomId = useRoomStore((state) => state.roomId);
  const votingStage = useSocketStore((state) => state.state);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="h-9 w-9 mx-2">
          <Info className="h-4 w-4" />
          <span className="sr-only">Room Details</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Room Details</DialogTitle>
        </DialogHeader>
        <Card className="w-full">
          <CardContent className="space-y-1 text-sm px-3">
            <div className="flex items-center gap-x-3">
              <Vote className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium text-muted-foreground">Status:</span>
              <Badge variant="default" className="capitalize">
                {votingStage || "Waiting..."}
              </Badge>
            </div>
            <div className="flex items-center gap-x-3">
              <Hash className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
              <span className="font-medium text-muted-foreground">
                Room ID:
              </span>
              <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono font-semibold">
                {roomId || "N/A"}
              </code>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
