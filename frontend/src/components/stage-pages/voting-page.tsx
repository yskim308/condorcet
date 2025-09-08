import { useSocketStore } from "@/stores/socket-store";
import { useRoleStore } from "@/stores/role-store";
import UsersContainer from "./users-container";

export default function VotingPage() {
  const nominations = useSocketStore((state) => state.nominationlist);
  const users = useSocketStore((state) => state.users);
  const isHost = useRoleStore((state) => state.isHost);
  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {isHost && <div>placeholder for controls</div>}
        <div className={!isHost ? "col-span-2" : ""}>
          placeholder for drag and drop
        </div>
        <div>
          <UsersContainer users={users} />
        </div>
      </div>
    </div>
  );
}
