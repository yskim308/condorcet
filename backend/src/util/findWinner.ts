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
