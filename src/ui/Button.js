import { PALETTE } from '../config.js';

export class Button {
  constructor(x, y, width, height, text, options = {}) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.text = text;
    this.color = options.color || PALETTE.primary;
    this.textColor = options.textColor || PALETTE.text;
    this.hovered = false;
    this.disabled = options.disabled || false;
    this.onClick = options.onClick || null;
    this.fontSize = options.fontSize || 16;
  }

  render(ctx) {
    ctx.save();

    const r = 10;

    // Shadow
    if (!this.disabled) {
      ctx.shadowColor = 'rgba(0,0,0,0.35)';
      ctx.shadowBlur = this.hovered ? 14 : 8;
      ctx.shadowOffsetY = this.hovered ? 4 : 2;
    }

    // Gradient fill
    const baseColor = this.disabled ? '#444' : this.color;
    const grd = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
    grd.addColorStop(0, this.disabled ? '#555' : this.lighten(baseColor, this.hovered ? 40 : 18));
    grd.addColorStop(1, this.disabled ? '#333' : this.darken(baseColor, 15));
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.roundRect(this.x, this.y, this.width, this.height, r);
    ctx.fill();

    // Reset shadow before border
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // Border
    ctx.strokeStyle = this.disabled ? '#555' : this.lighten(baseColor, 30);
    ctx.lineWidth = 1;
    ctx.stroke();

    // Highlight line across top
    if (!this.disabled) {
      const hl = ctx.createLinearGradient(this.x + r, this.y, this.x + this.width - r, this.y);
      hl.addColorStop(0, 'rgba(255,255,255,0)');
      hl.addColorStop(0.5, 'rgba(255,255,255,0.15)');
      hl.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.strokeStyle = hl;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(this.x + r, this.y + 1);
      ctx.lineTo(this.x + this.width - r, this.y + 1);
      ctx.stroke();
    }

    // Text
    ctx.fillStyle = this.disabled ? '#888' : this.textColor;
    ctx.font = `700 ${this.fontSize}px "Segoe UI", system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.text, this.x + this.width / 2, this.y + this.height / 2 + 1);

    ctx.restore();
  }

  containsPoint(x, y) {
    return x >= this.x && x <= this.x + this.width && y >= this.y && y <= this.y + this.height;
  }

  lighten(hex, amount = 30) {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, ((num >> 16) & 0xFF) + amount);
    const g = Math.min(255, ((num >> 8) & 0xFF) + amount);
    const b = Math.min(255, (num & 0xFF) + amount);
    return `rgb(${r},${g},${b})`;
  }

  darken(hex, amount = 30) {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, ((num >> 16) & 0xFF) - amount);
    const g = Math.max(0, ((num >> 8) & 0xFF) - amount);
    const b = Math.max(0, (num & 0xFF) - amount);
    return `rgb(${r},${g},${b})`;
  }
}
