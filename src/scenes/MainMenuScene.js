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
  }

  update(dt) {}

  render(ctx) {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    // Background
    ctx.fillStyle = PALETTE.background;
    ctx.fillRect(0, 0, w, h);

    // Subtle radial glow
    const grd = ctx.createRadialGradient(w / 2, h * 0.35, 50, w / 2, h * 0.35, w * 0.5);
    grd.addColorStop(0, 'rgba(233,69,96,0.08)');
    grd.addColorStop(1, 'transparent');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, w, h);

    // Title
    ctx.fillStyle = PALETTE.text;
    ctx.font = '700 52px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Arcane Gauntlet', w / 2, h * 0.3);

    // Subtitle
    ctx.fillStyle = PALETTE.textSecondary;
    ctx.font = '400 20px system-ui, sans-serif';
    ctx.fillText('A Roguelike Deck-Builder', w / 2, h * 0.38);

    // Position and render buttons
    this.startButton.x = w / 2 - 130;
    this.startButton.y = h * 0.52;
    this.startButton.render(ctx);

    // Version info
    ctx.fillStyle = PALETTE.textSecondary;
    ctx.font = '400 14px system-ui, sans-serif';
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
