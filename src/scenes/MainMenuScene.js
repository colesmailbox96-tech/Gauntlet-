import { PALETTE } from '../config.js';
import { Button } from '../ui/Button.js';

/**
 * Main menu scene with title and start button.
 */
export class MainMenuScene {
  /**
   * @param {import('../core/GameState.js').GameState} gameState
   * @param {import('../core/EventBus.js').EventBus} eventBus
   * @param {import('../core/SceneManager.js').SceneManager} sceneManager
   */
  constructor(gameState, eventBus, sceneManager) {
    this.gameState = gameState;
    this.eventBus = eventBus;
    this.sceneManager = sceneManager;
    this.startButton = null;
    this.continueButton = null;
    this.particles = [];
    this.time = 0;
  }

  load() {
    this.startButton = new Button(0, 0, 260, 56, 'New Run', {
      color: PALETTE.primary,
      fontSize: 20,
      onClick: () => {
        this.gameState.startRun(Date.now());
        this.eventBus.emit('newRunStarted');
        this.sceneManager.switchTo('MAP');
      },
    });

    // Initialize floating particles
    this.particles = [];
    for (let i = 0; i < 30; i++) {
      this.particles.push(this._createParticle(960, 540, true));
    }
    this.time = 0;
  }

  _createParticle(w, h, randomY) {
    return {
      x: Math.random() * w,
      y: randomY ? Math.random() * h : h + 10,
      size: 1 + Math.random() * 2.5,
      speed: 10 + Math.random() * 25,
      alpha: 0.15 + Math.random() * 0.35,
      drift: (Math.random() - 0.5) * 15,
    };
  }

  update(dt) {
    this.time += dt;
    const w = 960;
    const h = 540;
    for (const p of this.particles) {
      p.y -= p.speed * dt;
      p.x += p.drift * dt;
      if (p.y < -10 || p.x < -10 || p.x > w + 10) {
        Object.assign(p, this._createParticle(w, h, false));
      }
    }
  }

  render(ctx) {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    // Background
    ctx.fillStyle = PALETTE.background;
    ctx.fillRect(0, 0, w, h);

    // Subtle radial glow (primary)
    const grd = ctx.createRadialGradient(w / 2, h * 0.32, 30, w / 2, h * 0.32, w * 0.55);
    grd.addColorStop(0, 'rgba(233,69,96,0.1)');
    grd.addColorStop(0.5, 'rgba(15,52,96,0.06)');
    grd.addColorStop(1, 'transparent');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, w, h);

    // Second glow (accent)
    const grd2 = ctx.createRadialGradient(w / 2, h * 0.5, 10, w / 2, h * 0.5, w * 0.3);
    grd2.addColorStop(0, 'rgba(243,156,18,0.04)');
    grd2.addColorStop(1, 'transparent');
    ctx.fillStyle = grd2;
    ctx.fillRect(0, 0, w, h);

    // Floating particles
    for (const p of this.particles) {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = PALETTE.accent;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Title shadow
    ctx.fillStyle = 'rgba(233,69,96,0.15)';
    ctx.font = '700 54px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Arcane Gauntlet', w / 2 + 2, h * 0.3 + 2);

    // Title
    ctx.fillStyle = PALETTE.text;
    ctx.font = '700 54px "Segoe UI", system-ui, sans-serif';
    ctx.fillText('Arcane Gauntlet', w / 2, h * 0.3);

    // Decorative line under title
    const lineY = h * 0.35;
    const lineGrd = ctx.createLinearGradient(w * 0.3, lineY, w * 0.7, lineY);
    lineGrd.addColorStop(0, 'transparent');
    lineGrd.addColorStop(0.2, PALETTE.primary);
    lineGrd.addColorStop(0.5, PALETTE.accent);
    lineGrd.addColorStop(0.8, PALETTE.primary);
    lineGrd.addColorStop(1, 'transparent');
    ctx.strokeStyle = lineGrd;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(w * 0.3, lineY);
    ctx.lineTo(w * 0.7, lineY);
    ctx.stroke();

    // Subtitle
    ctx.fillStyle = PALETTE.textSecondary;
    ctx.font = '400 20px "Segoe UI", system-ui, sans-serif';
    ctx.fillText('A Roguelike Deck-Builder', w / 2, h * 0.40);

    // Position and render buttons
    this.startButton.x = w / 2 - 130;
    this.startButton.y = h * 0.52;
    this.startButton.render(ctx);

    // Version info
    ctx.fillStyle = PALETTE.textDim;
    ctx.font = '400 13px "Segoe UI", system-ui, sans-serif';
    ctx.fillText('v1.0.0-dev', w / 2, h * 0.92);
  }

  handleInput(event) {
    if (event.type === 'click') {
      if (this.startButton && this.startButton.containsPoint(event.x, event.y)) {
        if (this.startButton.onClick) this.startButton.onClick();
      }
    }
    if (event.type === 'mousemove') {
      if (this.startButton) {
        this.startButton.hovered = this.startButton.containsPoint(event.x, event.y);
      }
    }
  }

  unload() {}
}
