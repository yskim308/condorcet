import { describe, it, expect } from 'bun:test';
import {
  createPreferencesArray,
  rankPairs,
  lockEdges,
  hasCycle,
} from '../../util/rankUtil';

describe('rankUtil', () => {
  describe('createPreferencesArray', () => {
    it('should correctly create a preferences array from votes', () => {
      const votes = [
        ['0', '1', '2'],
        ['1', '0', '2'],
        ['2', '1', '0'],
      ];
      const nominees = 3;
      const preferences = createPreferencesArray(votes, nominees);

      const expectedPreferences = [
        [0, 1, 2],
        [2, 0, 2],
        [1, 1, 0],
      ];

      expect(preferences).toEqual(expectedPreferences);
    });

    it('should handle an empty votes array', () => {
      const votes: string[][] = [];
      const nominees = 3;
      const preferences = createPreferencesArray(votes, nominees);
      const expectedPreferences = [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ];
      expect(preferences).toEqual(expectedPreferences);
    });

    it('should ignore invalid nominee indices in votes', () => {
      const votes = [
        ['0', '1', '3'], // 3 is invalid
        ['1', '0', '2'],
      ];
      const nominees = 3;
      const preferences = createPreferencesArray(votes, nominees);

      const expectedPreferences = [
        [0, 1, 1],
        [1, 0, 1],
        [0, 0, 0],
      ];
      expect(preferences).toEqual(expectedPreferences);
    });
  });

  describe('rankPairs', () => {
    it('should correctly rank pairs based on preference margins', () => {
      const preferences = [
        [0, 5, 8],
        [7, 0, 6],
        [4, 6, 0],
      ];
      const ranked = rankPairs(preferences);

      const expected = [
        { winner: 0, loser: 2, margin: 4 },
        { winner: 1, loser: 0, margin: 2 },
        { winner: 1, loser: 2, margin: 0 },
      ];

      expect(ranked).toEqual(expected);
    });

    it('should include tied pairs with a margin of 0', () => {
      const preferences = [
        [0, 5, 5],
        [5, 0, 5],
        [5, 5, 0],
      ];
      const ranked = rankPairs(preferences);
      const expected = [
        { winner: 0, loser: 1, margin: 0 },
        { winner: 0, loser: 2, margin: 0 },
        { winner: 1, loser: 2, margin: 0 },
      ];
      expect(ranked).toEqual(expect.arrayContaining(expected));
      expect(ranked.length).toBe(expected.length);
    });

    it('should maintain order when margins are equal', () => {
      const preferences = [
        [0, 1, 2],
        [2, 0, 2],
        [1, 1, 0],
      ];
      const ranked = rankPairs(preferences);

      const expected = [
        { winner: 1, loser: 0, margin: 1 },
        { winner: 0, loser: 2, margin: 1 },
        { winner: 1, loser: 2, margin: 1 },
      ];

      expect(ranked).toEqual(expected);
    });
  });

  describe('hasCycle', () => {
    it('should detect a direct cycle', () => {
      const graph = [
        [0, 1, 0],
        [0, 0, 0],
        [0, 0, 0],
      ];
      expect(hasCycle(graph, 1, 0)).toBe(true);
    });

    it('should detect an indirect cycle', () => {
      const graph = [
        [0, 1, 0],
        [0, 0, 1],
        [0, 0, 0],
      ];
      expect(hasCycle(graph, 2, 0)).toBe(true);
    });

    it('should not detect a cycle where none exists', () => {
      const graph = [
        [0, 1, 0],
        [0, 0, 1],
        [0, 0, 0],
      ];
      expect(hasCycle(graph, 0, 2)).toBe(false);
    });
  });

  describe('lockEdges', () => {
    it('should lock edges without creating a cycle', () => {
      const rankedPairs = [
        { winner: 0, loser: 1, margin: 5 },
        { winner: 1, loser: 2, margin: 3 },
        { winner: 2, loser: 0, margin: 1 }, // This would create a cycle
      ];
      const nominees = 3;
      const graph = lockEdges(rankedPairs, nominees);

      const expectedGraph = [
        [0, 1, 0],
        [0, 0, 1],
        [0, 0, 0],
      ];

      expect(graph).toEqual(expectedGraph);
    });

    it('should correctly lock edges in a standard election', () => {
      const rankedPairs = [
        { winner: 0, loser: 2, margin: 4 },
        { winner: 1, loser: 0, margin: 2 },
        { winner: 1, loser: 2, margin: 1 },
      ];
      const nominees = 3;
      const graph = lockEdges(rankedPairs, nominees);

      const expectedGraph = [
        [0, 0, 1],
        [1, 0, 1],
        [0, 0, 0],
      ];

      expect(graph).toEqual(expectedGraph);
    });
  });
});
