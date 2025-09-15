import { createPreferencesArray, rankPairs, lockEdges } from "./rankUtil";
import type { RankedPair } from "./rankUtil";

export default function findWinner(
  votes: string[][],
  nominees: number,
): number {
  const preferences: number[][] = createPreferencesArray(votes, nominees);
  const rankedPairs: RankedPair[] = rankPairs(preferences);
  const graph: number[][] = lockEdges(rankedPairs, nominees);

  for (let j = 0; j < nominees; j++) {
    let hasIncomingEdge = false;
    for (let i = 0; i < nominees; i++) {
      if (graph[i][j] === 1) {
        hasIncomingEdge = true;
        break;
      }
    }
    if (!hasIncomingEdge) {
      return j; // This is the winner
    }
  }

  return -1; // Should not be reached in a valid election
}
