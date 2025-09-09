import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, X } from "lucide-react";
import { useSocketStore } from "@/stores/socket-store";

interface UsersContainerProps {
  users: string[];
}

export default function UsersContainer({ users }: UsersContainerProps) {
  const votedUsers = useSocketStore((state) => state.votedUsers);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Users</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-48 lg:h-96">
          {users && users.length ? (
            <ul className="space-y-2">
              {users.map((user, index) => (
                <li
                  key={index}
                  className="text-lg flex items-center justify-between"
                >
                  <span>{user}</span>
                  <div>
                    <h1 className="text-sm mr-2 text-muted-foreground">
                      voted:{" "}
                    </h1>
                    {votedUsers.includes(user) ? (
                      <Check className="h-5 w-5 text-green-600" />
                    ) : (
                      <X className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-gray-500">No users in the room</p>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
