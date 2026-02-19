import { describe, it, expect } from 'vitest';
import { SeededRandom } from '../../src/utils/SeededRandom.js';

describe('SeededRandom', () => {
  it('produces deterministic results for the same seed', () => {
    const rng1 = new SeededRandom(42);
    const rng2 = new SeededRandom(42);
    for (let i = 0; i < 10; i++) {
      expect(rng1.next()).toBe(rng2.next());
    }
  });

  it('produces values in [0, 1)', () => {
    const rng = new SeededRandom(123);
    for (let i = 0; i < 100; i++) {
      const val = rng.next();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    }
  });

  it('nextInt returns integers within range', () => {
    const rng = new SeededRandom(99);
    for (let i = 0; i < 50; i++) {
      const val = rng.nextInt(5, 10);
      expect(val).toBeGreaterThanOrEqual(5);
      expect(val).toBeLessThanOrEqual(10);
      expect(Number.isInteger(val)).toBe(true);
    }
  });

  it('shuffle preserves elements', () => {
    const rng = new SeededRandom(7);
    const arr = [1, 2, 3, 4, 5];
    const shuffled = rng.shuffle(arr);
    expect(shuffled.sort()).toEqual([1, 2, 3, 4, 5]);
    expect(arr).toEqual([1, 2, 3, 4, 5]); // original unchanged
  });

  it('weightedChoice respects weights', () => {
    const rng = new SeededRandom(1);
    const counts = { a: 0, b: 0 };
    for (let i = 0; i < 1000; i++) {
      const choice = rng.weightedChoice(['a', 'b'], [90, 10]);
      counts[choice]++;
    }
    expect(counts.a).toBeGreaterThan(counts.b);
  });
});
