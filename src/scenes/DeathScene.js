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

    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = PALETTE.danger;
    ctx.font = '700 48px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('DEFEATED', w / 2, h * 0.3);

    ctx.fillStyle = PALETTE.textSecondary;
    ctx.font = '400 18px system-ui, sans-serif';
    const run = this.gameState.run;
    if (run) {
      ctx.fillText(`Reached Act ${run.act}, Floor ${run.floor}`, w / 2, h * 0.42);
      ctx.fillText(`Gold earned: ${run.gold}`, w / 2, h * 0.48);
      ctx.fillText(`Deck size: ${run.deck.length}`, w / 2, h * 0.54);
    }

    this.retryButton.x = w / 2 - 100;
    this.retryButton.y = h * 0.7;
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
