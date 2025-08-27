interface NominationContainerProps {
  nominations: string[];
}

export default function NominationContainer({
  nominations,
}: NominationContainerProps) {
  return (
    <>
      {nominations && nominations.length ? (
        nominations.map((nominee) => <h1 key={nominee}>{nominee}</h1>)
      ) : (
        <h1>no nominees yet</h1>
      )}
    </>
  );
}
