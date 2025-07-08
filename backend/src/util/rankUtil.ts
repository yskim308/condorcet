function setVote(vote: string[], nominees: number, preferences: number[][]) {
  for (let i = 0; i < vote.length; i++) {
    for (let j = i + 1; j < vote.length; j++) {
      const preferredIndex = parseInt(vote[i], 10);
      const otherIndex = parseInt(vote[j], 10);

      if (
        isNaN(preferredIndex) ||
        isNaN(otherIndex) ||
        preferredIndex < 0 ||
        preferredIndex >= nominees ||
        otherIndex < 0 ||
        otherIndex >= nominees
      ) {
        continue;
      }

      preferences[preferredIndex][otherIndex]++;
    }
  }
}

function createPreferencesArray(
  votes: string[][],
  nominees: number,
): number[][] {
  const preferences: number[][] = Array(nominees)
    .fill(0)
    .map(() => Array(nominees).fill(0));

  for (const vote of votes) {
    setVote(vote, nominees, preferences);
  }

  return preferences;
}

interface RankedPair {
  winner: number;
  loser: number;
  margin: number;
}

function rankPairs(preferences: number[][]): RankedPair[] {
  const rankedPairs = [];
  const nominees = preferences.length;

  for (let i = 0; i < nominees; i++) {
    for (let j = i + 1; j < nominees; j++) {
      const votesForI = preferences[i][j];
      const votesForJ = preferences[j][i];

      if (votesForI > votesForJ) {
        rankedPairs.push({
          winner: i,
          loser: j,
          margin: votesForI - votesForJ,
        });
      } else if (votesForJ > votesForI) {
        rankedPairs.push({
          winner: j,
          loser: i,
          margin: votesForJ - votesForI,
        });
      } else {
        rankedPairs.push({ winner: i, loser: j, margin: 0 });
      }
    }
  }

  return rankedPairs.sort((a, b) => b.margin - a.margin);
}

function hasCycle(graph: number[][], startNode: number, endNode: number): boolean {
  const visited = new Set<number>();

  function dfs(currentNode: number): boolean {
    visited.add(currentNode);

    for (let neighbor = 0; neighbor < graph.length; neighbor++) {
      if (graph[currentNode][neighbor] === 1) {
        if (neighbor === startNode) {
          return true; // Cycle detected
        }
        if (!visited.has(neighbor)) {
          if (dfs(neighbor)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  return dfs(endNode);
}

function lockEdges(rankedPairs: RankedPair[], nominees: number): number[][] {
  const graph: number[][] = Array(nominees)
    .fill(0)
    .map(() => Array(nominees).fill(0));

  for (const { winner, loser } of rankedPairs) {
    if (!hasCycle(graph, winner, loser)) {
      graph[winner][loser] = 1;
    }
  }

  return graph;
}

export { setVote, createPreferencesArray, rankPairs, lockEdges, hasCycle };
export type { RankedPair };
