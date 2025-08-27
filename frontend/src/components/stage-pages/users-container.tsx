interface UsersContainerProps {
  users: string[];
}

export default function UsersContainer({ users }: UsersContainerProps) {
  return (
    <>
      {users && users.length ? (
        users.map((user) => <h1 key={user}>{user}</h1>)
      ) : (
        <h1>no users yet</h1>
      )}
    </>
  );
}
