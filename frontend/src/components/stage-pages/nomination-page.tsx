import { useSocketStore } from "@/stores/socket-store";
import NominationContainer from "./nominations-container";
import UsersContainer from "./users-container";
import { useRoleStore } from "@/stores/role-store";
import NominationControlPanel from "../host-controls/nomination-control-panel";

export default function NominationPage() {
  const nominations = useSocketStore((state) => state.nominationlist);
  const users = useSocketStore((state) => state.users);
  const isHost = useRoleStore((state) => state.isHost);

  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {isHost && (
          <div>
            <NominationControlPanel />
          </div>
        )}
        <div className="md:col">
          <NominationContainer nominations={nominations} />
        </div>
        <div>
          <UsersContainer users={users} />
        </div>
      </div>
    </div>
  );
}
