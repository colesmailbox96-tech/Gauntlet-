import { PALETTE } from '../config.js';

export class HealthBar {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  render(ctx, current, max, block = 0) {
    const pct = Math.max(0, current / max);

    ctx.save();

    // Background with border
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.roundRect(this.x, this.y, this.width, this.height, 5);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // HP fill gradient
    const hpColor = pct > 0.5 ? PALETTE.success : pct > 0.25 ? PALETTE.warning : PALETTE.danger;
    const hpDark = pct > 0.5 ? PALETTE.successDark : pct > 0.25 ? PALETTE.accentDark : PALETTE.dangerDark;
    const fillW = this.width * pct;
    if (fillW > 0) {
      const grd = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
      grd.addColorStop(0, hpColor);
      grd.addColorStop(1, hpDark);
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.roundRect(this.x, this.y, fillW, this.height, 5);
      ctx.fill();

      // Shine highlight on top half
      const shine = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height / 2);
      shine.addColorStop(0, 'rgba(255,255,255,0.18)');
      shine.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = shine;
      ctx.beginPath();
      ctx.roundRect(this.x, this.y, fillW, this.height / 2, [5, 5, 0, 0]);
      ctx.fill();
    }

    // HP text
    ctx.fillStyle = PALETTE.text;
    ctx.font = `700 ${this.height - 4}px "Segoe UI", system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 2;
    ctx.fillText(`${current}/${max}`, this.x + this.width / 2, this.y + this.height / 2);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // Block indicator (shield shape)
    if (block > 0) {
      const bx = this.x - 16;
      const by = this.y + this.height / 2;
      // Shield background
      ctx.fillStyle = PALETTE.intentDefend;
      ctx.beginPath();
      ctx.arc(bx, by, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // Block value
      ctx.fillStyle = '#fff';
      ctx.font = `700 11px "Segoe UI", system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${block}`, bx, by);
    }

    ctx.restore();
  }
}
