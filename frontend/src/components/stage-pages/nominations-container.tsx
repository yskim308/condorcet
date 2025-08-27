interface NominationContainerProps {
  nominations: string[];
}

export default function NominationContainer({
  nominations,
}: NominationContainerProps) {
  return (
    <>
      {nominations.map((nominee) => (
        <h1 key={nominee}>{nominee}</h1>
      ))}
    </>
  );
}
