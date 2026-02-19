import { PALETTE } from '../config.js';
import { Button } from '../ui/Button.js';

/**
 * Rest site scene — heal or upgrade.
 */
export class RestScene {
  constructor(gameState, eventBus, sceneManager) {
    this.gameState = gameState;
    this.eventBus = eventBus;
    this.sceneManager = sceneManager;
    this.healButton = null;
    this.continueButton = null;
    this.healed = false;
  }

  load() {
    this.healed = false;

    const healAmount = Math.floor(this.gameState.run.playerMaxHP * 0.3);

    this.healButton = new Button(0, 0, 240, 52, `Rest (Heal ${healAmount} HP)`, {
      color: PALETTE.success,
      fontSize: 16,
      onClick: () => {
        if (!this.healed) {
          this.healed = true;
          this.gameState.run.playerHP = Math.min(
            this.gameState.run.playerMaxHP,
            this.gameState.run.playerHP + healAmount
          );
          this.eventBus.emit('playerHealed', { amount: healAmount });
        }
      },
    });

    this.continueButton = new Button(0, 0, 200, 48, 'Continue', {
      color: PALETTE.secondary,
      fontSize: 16,
      onClick: () => {
        this.sceneManager.switchTo('MAP');
      },
    });
  }

  update(dt) {}

  render(ctx) {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    ctx.fillStyle = PALETTE.background;
    ctx.fillRect(0, 0, w, h);

    // Campfire glow
    const grd = ctx.createRadialGradient(w / 2, h * 0.4, 20, w / 2, h * 0.4, 200);
    grd.addColorStop(0, 'rgba(243,156,18,0.15)');
    grd.addColorStop(1, 'transparent');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, w, h);

    // Title
    ctx.fillStyle = PALETTE.accent;
    ctx.font = '700 36px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🔥 Rest Site', w / 2, h * 0.25);

    // HP display
    ctx.fillStyle = PALETTE.text;
    ctx.font = '500 20px system-ui, sans-serif';
    ctx.fillText(`HP: ${this.gameState.run.playerHP} / ${this.gameState.run.playerMaxHP}`, w / 2, h * 0.35);

    if (this.healed) {
      ctx.fillStyle = PALETTE.success;
      ctx.font = '600 22px system-ui, sans-serif';
      ctx.fillText('You feel refreshed.', w / 2, h * 0.48);
    }

    // Buttons
    if (!this.healed) {
      this.healButton.x = w / 2 - 120;
      this.healButton.y = h * 0.5;
      this.healButton.render(ctx);
    }

    this.continueButton.x = w / 2 - 100;
    this.continueButton.y = h * 0.7;
    this.continueButton.render(ctx);
  }

  handleInput(event) {
    if (event.type === 'click') {
      if (!this.healed && this.healButton?.containsPoint(event.x, event.y)) {
        this.healButton.onClick();
      }
      if (this.continueButton?.containsPoint(event.x, event.y)) {
        this.continueButton.onClick();
      }
    }
    if (event.type === 'mousemove') {
      if (this.healButton) this.healButton.hovered = this.healButton.containsPoint(event.x, event.y);
      if (this.continueButton) this.continueButton.hovered = this.continueButton.containsPoint(event.x, event.y);
    }
  }

  unload() {}
}
