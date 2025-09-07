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
    <>
      <h1>nominations</h1>
      <NominationContainer nominations={nominations} />
      <h1>users</h1>
      <UsersContainer users={users} />
      {isHost && <NominationControlPanel />}
    </>
  );
}
