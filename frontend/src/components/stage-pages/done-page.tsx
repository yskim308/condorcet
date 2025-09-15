import { useSocketStore } from "@/stores/socket-store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function DonePage() {
  const winner = useSocketStore((state) => state.winner);

  return (
    <div className="flex items-center justify-center h-screen">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-2xl">Voting Complete!</CardTitle>
          <CardDescription>
            Using the ranked-choiced, tideman algorithm, a condorcet winner has
            been found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {winner ? (
            <div>
              <p className="text-lg text-muted-foreground">The winner is:</p>
              <h2 className="text-4xl font-bold tracking-tighter">{winner}</h2>
            </div>
          ) : (
            <div>
              <p className="text-lg animate-pulse">
                Calculating the results...
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
