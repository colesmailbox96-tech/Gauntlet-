import { PALETTE } from '../config.js';
import { Button } from '../ui/Button.js';

const NODE_COLORS = {
  combat: '#C0392B',
  elite: '#E74C3C',
  event: '#9B59B6',
  shop: PALETTE.accent,
  rest: PALETTE.success,
  treasure: '#F1C40F',
  boss: '#FF0000',
};

const NODE_LABELS = {
  combat: '⚔',
  elite: '💀',
  event: '?',
  shop: '$',
  rest: '🔥',
  treasure: '★',
  boss: '👹',
};

/**
 * Map scene for navigating the branching node map.
 */
export class MapScene {
  /**
   * @param {import('../core/GameState.js').GameState} gameState
   * @param {import('../core/EventBus.js').EventBus} eventBus
   * @param {import('../core/SceneManager.js').SceneManager} sceneManager
   * @param {import('../map/MapGenerator.js').MapGenerator} mapGenerator
   */
  constructor(gameState, eventBus, sceneManager, mapGenerator) {
    this.gameState = gameState;
    this.eventBus = eventBus;
    this.sceneManager = sceneManager;
    this.mapGenerator = mapGenerator;
    this.scrollY = 0;
    this.nodePositions = [];
  }

  load() {
    if (!this.gameState.run) return;

    // Generate map if needed
    if (!this.gameState.run.map) {
      this.gameState.run.map = this.mapGenerator.generate(this.gameState.run.act);
    }

    this.calculateNodePositions();
    this.autoScrollToCurrentRow();
  }

  calculateNodePositions() {
    this.nodePositions = [];
    const map = this.gameState.run.map;
    if (!map) return;

    const rowSpacing = 80;
    const totalHeight = map.nodes.length * rowSpacing;

    for (let row = 0; row < map.nodes.length; row++) {
      const rowNodes = map.nodes[row];
      const y = totalHeight - row * rowSpacing;
      const colSpacing = 120;
      const rowWidth = (rowNodes.length - 1) * colSpacing;

      for (let col = 0; col < rowNodes.length; col++) {
        const x = -rowWidth / 2 + col * colSpacing;
        this.nodePositions.push({ row, col, x, y, node: rowNodes[col] });
      }
    }
  }

  autoScrollToCurrentRow() {
    const map = this.gameState.run.map;
    if (!map) return;

    // Find the first available row
    let targetRow = 0;
    for (const row of map.nodes) {
      for (const node of row) {
        if (node.available) {
          targetRow = node.row;
          break;
        }
      }
    }

    // The node y position in local coords is: totalHeight - targetRow * rowSpacing
    // We want that position to appear roughly at canvas center (h/2)
    // Rendered at: h*0.55 + scrollY + nodeY => should be ~h/2
    // scrollY = h/2 - h*0.55 - nodeY = -0.05*h - nodeY
    const totalHeight = map.nodes.length * 80;
    const nodeY = totalHeight - targetRow * 80;
    this.scrollY = -nodeY + 100;
  }

  update(dt) {}

  render(ctx) {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    const map = this.gameState.run?.map;

    // Background
    ctx.fillStyle = PALETTE.background;
    ctx.fillRect(0, 0, w, h);

    if (!map) return;

    // Header
    ctx.fillStyle = PALETTE.text;
    ctx.font = '700 28px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Act ${this.gameState.run.act} — Floor ${this.gameState.run.floor}`, w / 2, 40);

    // Player stats bar
    ctx.font = '500 16px system-ui, sans-serif';
    ctx.fillStyle = PALETTE.text;
    ctx.textAlign = 'left';
    ctx.fillText(`HP: ${this.gameState.run.playerHP}/${this.gameState.run.playerMaxHP}`, 20, 40);
    ctx.fillText(`Gold: ${this.gameState.run.gold}`, 200, 40);
    ctx.textAlign = 'center';

    ctx.save();
    ctx.translate(w / 2, h * 0.55 + this.scrollY);

    // Draw connections
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 2;
    for (const [fromRow, fromCol, toRow, toCol] of map.connections) {
      const from = this.nodePositions.find(n => n.row === fromRow && n.col === fromCol);
      const to = this.nodePositions.find(n => n.row === toRow && n.col === toCol);
      if (from && to) {
        // Highlight connection if from is visited and to is available
        if (from.node.visited && to.node.available) {
          ctx.strokeStyle = 'rgba(255,255,255,0.5)';
          ctx.lineWidth = 3;
        } else if (from.node.visited) {
          ctx.strokeStyle = 'rgba(255,255,255,0.3)';
          ctx.lineWidth = 2;
        } else {
          ctx.strokeStyle = 'rgba(255,255,255,0.1)';
          ctx.lineWidth = 1;
        }
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
      }
    }

    // Draw nodes
    for (const pos of this.nodePositions) {
      const { node, x, y } = pos;
      const radius = node.type === 'boss' ? 22 : 16;
      const color = NODE_COLORS[node.type] || '#999';

      // Node circle
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);

      if (node.visited) {
        ctx.fillStyle = 'rgba(100,100,100,0.5)';
        ctx.fill();
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (node.available) {
        ctx.fillStyle = color;
        ctx.fill();
        // Pulsing outline for available nodes
        ctx.strokeStyle = PALETTE.text;
        ctx.lineWidth = 3;
        ctx.stroke();
      } else {
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.4;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Node label
      ctx.fillStyle = node.visited ? '#999' : PALETTE.text;
      ctx.font = `${radius}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(NODE_LABELS[node.type] || '?', x, y);
    }

    ctx.restore();

    // Instructions
    ctx.fillStyle = PALETTE.textSecondary;
    ctx.font = '400 14px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Click an available node to proceed', w / 2, h - 20);
  }

  handleInput(event) {
    const map = this.gameState.run?.map;
    if (!map) return;

    if (event.type === 'click') {
      const w = event.canvasWidth || 960;
      const h = event.canvasHeight || 540;

      // Transform click to map coordinates
      const mapX = event.x - w / 2;
      const mapY = event.y - h * 0.55 - this.scrollY;

      // Find clicked node
      for (const pos of this.nodePositions) {
        const dx = mapX - pos.x;
        const dy = mapY - pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const radius = pos.node.type === 'boss' ? 22 : 16;

        if (dist <= radius + 4 && pos.node.available) {
          this.selectNode(pos.row, pos.col, pos.node);
          break;
        }
      }
    }

    if (event.type === 'wheel') {
      this.scrollY += event.deltaY * 0.5;
    }
  }

  selectNode(row, col, node) {
    this.mapGenerator.visitNode(this.gameState.run.map, row, col);
    this.gameState.run.floor = row + 1;
    this.gameState.run.currentNode = { row, col, type: node.type };

    this.eventBus.emit('nodeSelected', { row, col, type: node.type });

    switch (node.type) {
      case 'combat':
      case 'elite':
      case 'boss':
        this.sceneManager.switchTo('COMBAT', { nodeType: node.type });
        break;
      case 'rest':
        this.sceneManager.switchTo('REST');
        break;
      case 'shop':
        // For now, go back to map
        this.sceneManager.switchTo('MAP');
        break;
      case 'event':
        // For now, go back to map with gold reward
        this.gameState.run.gold += 15;
        this.sceneManager.switchTo('MAP');
        break;
      case 'treasure':
        this.gameState.run.gold += 50;
        this.sceneManager.switchTo('MAP');
        break;
    }
  }

  unload() {}
}
