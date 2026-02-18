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
    ctx.fillStyle = this.disabled ? '#555' : (this.hovered ? this.lighten(this.color) : this.color);
    ctx.beginPath();
    ctx.roundRect(this.x, this.y, this.width, this.height, 8);
    ctx.fill();
    ctx.fillStyle = this.disabled ? '#999' : this.textColor;
    ctx.font = `700 ${this.fontSize}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.text, this.x + this.width / 2, this.y + this.height / 2);
    ctx.restore();
  }

  containsPoint(x, y) {
    return x >= this.x && x <= this.x + this.width && y >= this.y && y <= this.y + this.height;
  }

  lighten(hex) {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, ((num >> 16) & 0xFF) + 30);
    const g = Math.min(255, ((num >> 8) & 0xFF) + 30);
    const b = Math.min(255, (num & 0xFF) + 30);
    return `rgb(${r},${g},${b})`;
  }
}
