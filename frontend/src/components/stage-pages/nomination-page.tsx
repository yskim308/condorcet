import { useSocketStore } from "@/stores/socket-store";
import NominationContainer from "./nominations-container";
import UsersContainer from "./users-container";
export default function NominationPage() {
  const { nominations, users } = useSocketStore();
  return (
    <>
      <h1>nominations</h1>
      <NominationContainer nominations={nominations} />
      <h1>users</h1>
      <UsersContainer users={users} />
    </>
  );
}
