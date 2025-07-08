import { describe, it, expect } from 'bun:test';
import findWinner from '../../util/findWinner';

describe('findWinner', () => {
  it('should find the clear winner in a simple election', () => {
    // 0 is the clear winner, beats 1 and 2
    // 1 beats 2
    const votes = [
      ['0', '1', '2'],
      ['0', '2', '1'],
      ['1', '0', '2'],
    ];
    const nominees = 3;
    const winner = findWinner(votes, nominees);
    expect(winner).toBe(0);
  });

  it('should resolve a Condorcet paradox and find the correct winner', () => {
    // Classic paradox: A>B, B>C, C>A
    // A(0) > B(1) by 2 votes
    // B(1) > C(2) by 2 votes
    // C(2) > A(0) by 2 votes
    // Ranked pairs should lock A>B, then B>C, and skip C>A, making A the winner.
    const votes = [
      ['0', '1', '2'],
      ['0', '1', '2'],
      ['1', '2', '0'],
      ['1', '2', '0'],
      ['2', '0', '1'],
      ['2', '0', '1'],
    ];
    const nominees = 3;
    const winner = findWinner(votes, nominees);
    expect(winner).toBe(0);
  });

  it('should find the winner in a more complex election', () => {
    // This data comes from the previous rankUtil tests
    // Preferences:
    // p[0][1]=5, p[1][0]=7 -> 1 wins (margin 2)
    // p[0][2]=8, p[2][0]=4 -> 0 wins (margin 4)
    // p[1][2]=6, p[2][1]=6 -> tie (margin 0)
    // Ranked pairs: (0,2), (1,0), (1,2)
    // Lock 0->2. Lock 1->0. Check 1->2: path 2->0->1 exists, so cycle. Skip.
    // Winner should be 1
    const votes = [
      // To create the preferences above
      ...Array(5).fill(['0', '1', '2']),
      ...Array(7).fill(['1', '0', '2']),
      ...Array(8).fill(['0', '2', '1']),
      ...Array(4).fill(['2', '0', '1']),
      ...Array(6).fill(['1', '2', '0']),
      ...Array(6).fill(['2', '1', '0']),
    ];
    const nominees = 3;
    const winner = findWinner(votes, nominees);
    expect(winner).toBe(1);
  });

  it('should return the winner when there are ties in margins', () => {
    const votes = [
      ['0', '1', '2'],
      ['1', '2', '0'],
      ['2', '0', '1'],
    ];
    const nominees = 3;
    const winner = findWinner(votes, nominees);
    // All margins are 1. A>B, B>C, C>A. A>B is locked first.
    // B>C is locked second. C>A creates cycle. A is winner.
    expect(winner).toBe(0);
  });
});
