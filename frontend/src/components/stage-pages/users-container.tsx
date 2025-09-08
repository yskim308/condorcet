import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface UsersContainerProps {
  users: string[];
}

export default function UsersContainer({ users }: UsersContainerProps) {
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
                <li key={index} className="text-lg">
                  {user}
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

