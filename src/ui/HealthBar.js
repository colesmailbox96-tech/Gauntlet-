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
    
    // Background
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.roundRect(this.x, this.y, this.width, this.height, 4);
    ctx.fill();
    
    // HP fill
    const hpColor = pct > 0.5 ? PALETTE.success : pct > 0.25 ? PALETTE.warning : PALETTE.danger;
    ctx.fillStyle = hpColor;
    ctx.beginPath();
    ctx.roundRect(this.x, this.y, this.width * pct, this.height, 4);
    ctx.fill();
    
    // HP text
    ctx.fillStyle = PALETTE.text;
    ctx.font = '700 14px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${current}/${max}`, this.x + this.width / 2, this.y + this.height / 2);
    
    // Block indicator
    if (block > 0) {
      ctx.fillStyle = PALETTE.intentDefend;
      ctx.beginPath();
      ctx.arc(this.x - 14, this.y + this.height / 2, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.text;
      ctx.font = '700 11px system-ui, sans-serif';
      ctx.fillText(`${block}`, this.x - 14, this.y + this.height / 2);
    }
  }
}
