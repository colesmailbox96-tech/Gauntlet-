/**
 * Mulberry32 PRNG for deterministic seeded random number generation.
 */
export class SeededRandom {
  /** @param {number} seed */
  constructor(seed) {
    this.state = seed;
  }

  /** @returns {number} float in [0, 1) */
  next() {
    this.state |= 0;
    this.state = (this.state + 0x6D2B79F5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * @param {number} min
   * @param {number} max
   * @returns {number} integer in [min, max]
   */
  nextInt(min, max) {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * @param {number} min
   * @param {number} max
   * @returns {number} float in [min, max)
   */
  nextFloat(min, max) {
    return this.next() * (max - min) + min;
  }

  /**
   * @template T
   * @param {T[]} array
   * @returns {T[]}
   */
  shuffle(array) {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  /**
   * @template T
   * @param {T[]} items
   * @param {number[]} weights
   * @returns {T}
   */
  weightedChoice(items, weights) {
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let roll = this.next() * totalWeight;
    for (let i = 0; i < items.length; i++) {
      roll -= weights[i];
      if (roll <= 0) return items[i];
    }
    return items[items.length - 1];
  }
}
