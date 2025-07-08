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

export { setVote, createPreferencesArray, rankPairs };
export type { RankedPair };
