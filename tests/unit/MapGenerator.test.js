import { describe, it, expect } from 'vitest';
import { SeededRandom } from '../../src/utils/SeededRandom.js';
import { MapGenerator } from '../../src/map/MapGenerator.js';

describe('MapGenerator', () => {
  it('generates a map with correct structure', () => {
    const rng = new SeededRandom(42);
    const generator = new MapGenerator(rng);
    const map = generator.generate(1);

    expect(map.nodes.length).toBeGreaterThan(0);
    expect(map.connections.length).toBeGreaterThan(0);

    // Should have boss node at the end
    const lastRow = map.nodes[map.nodes.length - 1];
    expect(lastRow.some(n => n.type === 'boss')).toBe(true);
  });

  it('first row is always combat', () => {
    const rng = new SeededRandom(7);
    const generator = new MapGenerator(rng);
    const map = generator.generate(1);

    const firstRow = map.nodes[0];
    for (const node of firstRow) {
      expect(node.type).toBe('combat');
    }
  });

  it('first row nodes are available, others are not', () => {
    const rng = new SeededRandom(99);
    const generator = new MapGenerator(rng);
    const map = generator.generate(1);

    for (const node of map.nodes[0]) {
      expect(node.available).toBe(true);
    }
    for (let i = 1; i < map.nodes.length; i++) {
      for (const node of map.nodes[i]) {
        expect(node.available).toBe(false);
      }
    }
  });

  it('visitNode updates availability', () => {
    const rng = new SeededRandom(42);
    const generator = new MapGenerator(rng);
    const map = generator.generate(1);

    generator.visitNode(map, 0, 0);

    // The visited node should be marked
    expect(map.nodes[0][0].visited).toBe(true);

    // Some nodes in the next row should be available
    const availableInRow1 = map.nodes[1].filter(n => n.available);
    expect(availableInRow1.length).toBeGreaterThan(0);
  });

  it('guarantees a rest site before boss', () => {
    const rng = new SeededRandom(42);
    const generator = new MapGenerator(rng);
    const map = generator.generate(1);

    // Pre-boss row should contain at least one rest
    const preBossRow = map.nodes[map.nodes.length - 2];
    const hasRest = preBossRow.some(n => n.type === 'rest');
    expect(hasRest).toBe(true);
  });
});
