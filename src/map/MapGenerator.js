import { NODE_TYPE_WEIGHTS, FLOORS_PER_ACT } from '../config.js';

/**
 * Generates a procedural branching map for each act.
 */
export class MapGenerator {
  /**
   * @param {import('../utils/SeededRandom.js').SeededRandom} rng
   */
  constructor(rng) {
    this.rng = rng;
  }

  /**
   * Generate a map for one act.
   * @param {number} act
   * @returns {{ nodes: object[][], connections: [number,number,number,number][] }}
   */
  generate(act) {
    const rows = FLOORS_PER_ACT;
    const nodes = [];
    const connections = [];

    // Generate node rows
    for (let row = 0; row < rows; row++) {
      const nodeCount = this.rng.nextInt(2, 4);
      const rowNodes = [];
      for (let col = 0; col < nodeCount; col++) {
        rowNodes.push({
          row,
          col,
          type: this.assignNodeType(row, rows, act),
          visited: false,
          available: row === 0,
        });
      }
      nodes.push(rowNodes);
    }

    // Add boss node at the top
    nodes.push([{
      row: rows,
      col: 0,
      type: 'boss',
      visited: false,
      available: false,
    }]);

    // Generate connections (ensure no crossing)
    for (let row = 0; row < nodes.length - 1; row++) {
      const currentRow = nodes[row];
      const nextRow = nodes[row + 1];

      for (let i = 0; i < currentRow.length; i++) {
        // Connect to at least one node in the next row
        const minTarget = Math.max(0, Math.floor((i / currentRow.length) * nextRow.length));
        const maxTarget = Math.min(nextRow.length - 1, minTarget + 1);

        // Always connect to the proportional node
        connections.push([row, i, row + 1, minTarget]);

        // Maybe add extra connection
        if (maxTarget !== minTarget && this.rng.next() > 0.4) {
          connections.push([row, i, row + 1, maxTarget]);
        }
      }

      // Ensure all next-row nodes have at least one incoming connection
      for (let j = 0; j < nextRow.length; j++) {
        const hasIncoming = connections.some(c => c[2] === row + 1 && c[3] === j);
        if (!hasIncoming) {
          // Connect from nearest current-row node
          const nearest = Math.min(currentRow.length - 1, j);
          connections.push([row, nearest, row + 1, j]);
        }
      }
    }

    // Enforce constraints: guaranteed rest before boss, shop, elite distribution
    this.enforceConstraints(nodes, act);

    return { nodes, connections };
  }

  /**
   * Assign a node type based on position and distribution weights.
   * @param {number} row
   * @param {number} totalRows
   * @param {number} act
   * @returns {string}
   */
  assignNodeType(row, totalRows, act) {
    // Row 0 is always combat
    if (row === 0) return 'combat';

    // Pre-boss rows (last 1-2) favor rest
    if (row >= totalRows - 2 && this.rng.next() < 0.6) return 'rest';

    // No elites before floor 5
    const types = ['combat', 'event', 'shop', 'rest'];
    const weights = [
      NODE_TYPE_WEIGHTS.combat,
      NODE_TYPE_WEIGHTS.event,
      NODE_TYPE_WEIGHTS.shop,
      NODE_TYPE_WEIGHTS.rest,
    ];

    if (row >= 5) {
      types.push('elite');
      weights.push(NODE_TYPE_WEIGHTS.elite);
    }

    if (row >= 3 && this.rng.next() < 0.03) {
      return 'treasure';
    }

    return this.rng.weightedChoice(types, weights);
  }

  /**
   * Enforce map constraints.
   */
  enforceConstraints(nodes, act) {
    let hasShop = false;
    let hasRest = false;
    let hasElite = false;

    for (const row of nodes) {
      for (const node of row) {
        if (node.type === 'shop') hasShop = true;
        if (node.type === 'rest') hasRest = true;
        if (node.type === 'elite') hasElite = true;
      }
    }

    // Guarantee at least one shop between rows 4-10
    if (!hasShop && nodes.length > 6) {
      const row = nodes[this.rng.nextInt(4, Math.min(10, nodes.length - 3))];
      if (row && row.length > 0) {
        row[this.rng.nextInt(0, row.length - 1)].type = 'shop';
      }
    }

    // Guarantee at least one rest site
    if (!hasRest && nodes.length > 3) {
      const row = nodes[nodes.length - 3];
      if (row && row.length > 0) {
        row[0].type = 'rest';
      }
    }

    // Guarantee rest on second-to-last row (before boss)
    if (nodes.length > 2) {
      const preBossRow = nodes[nodes.length - 2];
      if (preBossRow && preBossRow.length > 0 && !preBossRow.some(n => n.type === 'rest')) {
        preBossRow[0].type = 'rest';
      }
    }
  }

  /**
   * Update node availability based on which node was just visited.
   * @param {{ nodes: object[][], connections: [number,number,number,number][] }} map
   * @param {number} row
   * @param {number} col
   */
  visitNode(map, row, col) {
    const node = map.nodes[row]?.[col];
    if (!node) return;
    node.visited = true;

    // Mark all nodes as unavailable first
    for (const r of map.nodes) {
      for (const n of r) {
        n.available = false;
      }
    }

    // Make connected next-row nodes available
    const nextConnections = map.connections.filter(c => c[0] === row && c[1] === col);
    for (const [, , nextRow, nextCol] of nextConnections) {
      const next = map.nodes[nextRow]?.[nextCol];
      if (next) next.available = true;
    }
  }
}
