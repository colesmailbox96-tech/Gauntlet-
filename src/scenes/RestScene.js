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
    this.particles = [];
    this.time = 0;
  }

  load() {
    this.healed = false;
    this.time = 0;

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

    // Fire particles
    this.particles = [];
    for (let i = 0; i < 20; i++) {
      this.particles.push(this._createFireParticle(960, 540));
    }
  }

  _createFireParticle(w, h) {
    const cx = w / 2;
    const cy = h * 0.38;
    return {
      x: cx + (Math.random() - 0.5) * 30,
      y: cy,
      vx: (Math.random() - 0.5) * 15,
      vy: -(15 + Math.random() * 30),
      life: 0.5 + Math.random() * 1.0,
      maxLife: 0.5 + Math.random() * 1.0,
      size: 2 + Math.random() * 3,
    };
  }

  update(dt) {
    this.time += dt;
    const w = 960;
    const h = 540;
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) {
        Object.assign(p, this._createFireParticle(w, h));
      }
    }
  }

  render(ctx) {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    ctx.fillStyle = PALETTE.background;
    ctx.fillRect(0, 0, w, h);

    // Campfire glow (warm vignette)
    const grd = ctx.createRadialGradient(w / 2, h * 0.38, 15, w / 2, h * 0.38, 220);
    grd.addColorStop(0, 'rgba(243,156,18,0.2)');
    grd.addColorStop(0.4, 'rgba(243,100,18,0.08)');
    grd.addColorStop(1, 'transparent');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, w, h);

    // Fire particles
    for (const p of this.particles) {
      const lifeRatio = p.life / p.maxLife;
      ctx.globalAlpha = lifeRatio * 0.7;
      // Color transitions from yellow to red to transparent
      const r = 255;
      const g = Math.floor(200 * lifeRatio);
      const b = 0;
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * lifeRatio, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Title with glow
    ctx.fillStyle = 'rgba(243,156,18,0.15)';
    ctx.font = '700 38px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🔥 Rest Site', w / 2 + 1, h * 0.22 + 1);
    ctx.fillStyle = PALETTE.accent;
    ctx.fillText('🔥 Rest Site', w / 2, h * 0.22);

    // HP display
    const hpPct = this.gameState.run.playerHP / this.gameState.run.playerMaxHP;
    const hpCol = hpPct > 0.5 ? PALETTE.success : hpPct > 0.25 ? PALETTE.warning : PALETTE.danger;
    ctx.fillStyle = hpCol;
    ctx.font = '600 20px "Segoe UI", system-ui, sans-serif';
    ctx.fillText(`♥ ${this.gameState.run.playerHP} / ${this.gameState.run.playerMaxHP}`, w / 2, h * 0.33);

    if (this.healed) {
      ctx.fillStyle = PALETTE.success;
      ctx.font = '600 22px "Segoe UI", system-ui, sans-serif';
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
