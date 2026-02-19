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

const LEGEND_ITEMS = [
  { type: 'combat', label: 'Fight' },
  { type: 'elite', label: 'Elite' },
  { type: 'event', label: 'Event' },
  { type: 'shop', label: 'Shop' },
  { type: 'rest', label: 'Rest' },
  { type: 'treasure', label: 'Loot' },
];

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
    this.time = 0;
  }

  load() {
    if (!this.gameState.run) return;

    // Generate map if needed
    if (!this.gameState.run.map) {
      this.gameState.run.map = this.mapGenerator.generate(this.gameState.run.act);
    }

    this.calculateNodePositions();
    this.autoScrollToCurrentRow();
    this.time = 0;
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

    let targetRow = 0;
    for (const row of map.nodes) {
      for (const node of row) {
        if (node.available) {
          targetRow = node.row;
          break;
        }
      }
    }

    const totalHeight = map.nodes.length * 80;
    const nodeY = totalHeight - targetRow * 80;
    this.scrollY = -nodeY + 100;
  }

  update(dt) {
    this.time += dt;
  }

  render(ctx) {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    const map = this.gameState.run?.map;

    // Background
    ctx.fillStyle = PALETTE.background;
    ctx.fillRect(0, 0, w, h);

    if (!map) return;

    // Header panel
    ctx.fillStyle = PALETTE.surface;
    ctx.fillRect(0, 0, w, 56);
    // Header bottom border
    const hdrGrd = ctx.createLinearGradient(0, 56, w, 56);
    hdrGrd.addColorStop(0, 'transparent');
    hdrGrd.addColorStop(0.5, 'rgba(233,69,96,0.3)');
    hdrGrd.addColorStop(1, 'transparent');
    ctx.strokeStyle = hdrGrd;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 56);
    ctx.lineTo(w, 56);
    ctx.stroke();

    // Header text
    ctx.fillStyle = PALETTE.text;
    ctx.font = '700 26px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Act ${this.gameState.run.act} — Floor ${this.gameState.run.floor}`, w / 2, 28);

    // Player stats
    ctx.font = '600 15px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'left';
    // HP pill
    const hpPct = this.gameState.run.playerHP / this.gameState.run.playerMaxHP;
    const hpCol = hpPct > 0.5 ? PALETTE.success : hpPct > 0.25 ? PALETTE.warning : PALETTE.danger;
    ctx.fillStyle = hpCol;
    ctx.fillText(`♥ ${this.gameState.run.playerHP}/${this.gameState.run.playerMaxHP}`, 16, 28);
    // Gold
    ctx.fillStyle = PALETTE.accent;
    ctx.fillText(`⬥ ${this.gameState.run.gold}`, 170, 28);
    ctx.textAlign = 'center';

    ctx.save();
    ctx.translate(w / 2, h * 0.55 + this.scrollY);

    // Draw connections as bezier curves
    for (const [fromRow, fromCol, toRow, toCol] of map.connections) {
      const from = this.nodePositions.find(n => n.row === fromRow && n.col === fromCol);
      const to = this.nodePositions.find(n => n.row === toRow && n.col === toCol);
      if (from && to) {
        if (from.node.visited && to.node.available) {
          ctx.strokeStyle = 'rgba(233,69,96,0.5)';
          ctx.lineWidth = 3;
        } else if (from.node.visited) {
          ctx.strokeStyle = 'rgba(255,255,255,0.25)';
          ctx.lineWidth = 2;
        } else {
          ctx.strokeStyle = 'rgba(255,255,255,0.08)';
          ctx.lineWidth = 1;
        }
        // Bezier curve
        const midY = (from.y + to.y) / 2;
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.bezierCurveTo(from.x, midY, to.x, midY, to.x, to.y);
        ctx.stroke();
      }
    }

    // Draw nodes
    const pulse = Math.sin(this.time * 3) * 0.3 + 0.7;
    for (const pos of this.nodePositions) {
      const { node, x, y } = pos;
      const radius = node.type === 'boss' ? 22 : 16;
      const color = NODE_COLORS[node.type] || '#999';

      if (node.available) {
        // Pulsing outer glow for available nodes
        ctx.save();
        ctx.globalAlpha = 0.25 * pulse;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, radius + 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Node circle
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);

      if (node.visited) {
        ctx.fillStyle = 'rgba(80,80,80,0.5)';
        ctx.fill();
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else if (node.available) {
        // Gradient fill for available nodes
        const nGrd = ctx.createRadialGradient(x - 3, y - 3, 2, x, y, radius);
        nGrd.addColorStop(0, '#fff');
        nGrd.addColorStop(0.3, color);
        nGrd.addColorStop(1, color);
        ctx.fillStyle = nGrd;
        ctx.fill();
        ctx.strokeStyle = PALETTE.text;
        ctx.lineWidth = 2.5;
        ctx.stroke();
      } else {
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.3;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Node label
      ctx.fillStyle = node.visited ? '#777' : '#fff';
      ctx.font = `${radius}px "Segoe UI", system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(NODE_LABELS[node.type] || '?', x, y);
    }

    ctx.restore();

    // Legend (bottom-left)
    ctx.save();
    ctx.font = '500 11px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    let lx = 12;
    const ly = h - 16;
    for (const item of LEGEND_ITEMS) {
      ctx.fillStyle = NODE_COLORS[item.type];
      ctx.beginPath();
      ctx.arc(lx + 5, ly, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.textDim;
      ctx.fillText(item.label, lx + 12, ly);
      lx += ctx.measureText(item.label).width + 22;
    }
    ctx.restore();

    // Instructions
    ctx.fillStyle = PALETTE.textDim;
    ctx.font = '400 13px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Click an available node to proceed  •  Scroll to navigate', w / 2, h - 14);
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
