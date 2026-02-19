import { PALETTE } from '../config.js';
import { Button } from '../ui/Button.js';

/**
 * Death scene — run failed with stats.
 */
export class DeathScene {
  constructor(gameState, eventBus, sceneManager) {
    this.gameState = gameState;
    this.eventBus = eventBus;
    this.sceneManager = sceneManager;
    this.retryButton = null;
  }

  load() {
    this.retryButton = new Button(0, 0, 200, 48, 'Return to Menu', {
      color: PALETTE.primary,
      fontSize: 16,
      onClick: () => {
        this.gameState.reset();
        this.sceneManager.switchTo('MAIN_MENU');
      },
    });
  }

  update(dt) {}

  render(ctx) {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    // Dark background
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, w, h);

    // Vignette
    const vig = ctx.createRadialGradient(w / 2, h / 2, 50, w / 2, h / 2, w * 0.6);
    vig.addColorStop(0, 'transparent');
    vig.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, w, h);

    // Red glow behind title
    const grd = ctx.createRadialGradient(w / 2, h * 0.28, 10, w / 2, h * 0.28, 180);
    grd.addColorStop(0, 'rgba(231,76,60,0.12)');
    grd.addColorStop(1, 'transparent');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, w, h);

    // Title shadow
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.font = '700 50px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('DEFEATED', w / 2 + 2, h * 0.28 + 2);

    // Title
    ctx.fillStyle = PALETTE.danger;
    ctx.font = '700 50px "Segoe UI", system-ui, sans-serif';
    ctx.fillText('DEFEATED', w / 2, h * 0.28);

    // Decorative line
    const lineGrd = ctx.createLinearGradient(w * 0.3, h * 0.34, w * 0.7, h * 0.34);
    lineGrd.addColorStop(0, 'transparent');
    lineGrd.addColorStop(0.5, PALETTE.danger);
    lineGrd.addColorStop(1, 'transparent');
    ctx.strokeStyle = lineGrd;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(w * 0.3, h * 0.34);
    ctx.lineTo(w * 0.7, h * 0.34);
    ctx.stroke();

    // Stats panel
    const run = this.gameState.run;
    if (run) {
      const panelW = 280;
      const panelH = 120;
      const panelX = w / 2 - panelW / 2;
      const panelY = h * 0.39;

      // Panel background
      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      ctx.beginPath();
      ctx.roundRect(panelX, panelY, panelW, panelH, 10);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Stats
      ctx.fillStyle = PALETTE.textSecondary;
      ctx.font = '500 17px "Segoe UI", system-ui, sans-serif';
      const statY = panelY + 28;
      const lineH = 30;
      ctx.fillText(`Reached Act ${run.act}, Floor ${run.floor}`, w / 2, statY);
      ctx.fillStyle = PALETTE.accent;
      ctx.fillText(`⬥ Gold earned: ${run.gold}`, w / 2, statY + lineH);
      ctx.fillStyle = PALETTE.textSecondary;
      ctx.fillText(`Deck size: ${run.deck.length}`, w / 2, statY + lineH * 2);
    }

    this.retryButton.x = w / 2 - 100;
    this.retryButton.y = h * 0.72;
    this.retryButton.render(ctx);
  }

  handleInput(event) {
    if (event.type === 'click') {
      if (this.retryButton?.containsPoint(event.x, event.y)) {
        this.retryButton.onClick();
      }
    }
    if (event.type === 'mousemove') {
      if (this.retryButton) this.retryButton.hovered = this.retryButton.containsPoint(event.x, event.y);
    }
  }

  unload() {}
}
