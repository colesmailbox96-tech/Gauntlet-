import { PALETTE } from '../config.js';

const CARD_WIDTH = 140;
const CARD_HEIGHT = 196;

const TYPE_COLORS = {
  attack: PALETTE.cardAttack,
  skill: PALETTE.cardSkill,
  power: PALETTE.cardPower,
  curse: PALETTE.cardCurse,
  status: PALETTE.cardStatus,
};

export class CardRenderer {
  static render(ctx, card, x, y, options = {}) {
    const w = options.width || CARD_WIDTH;
    const h = options.height || CARD_HEIGHT;
    const selected = options.selected || false;
    const playable = options.playable !== undefined ? options.playable : true;
    const hovered = options.hovered || false;
    
    ctx.save();
    
    const drawY = hovered ? y - 20 : y;
    
    // Card shadow
    if (hovered || selected) {
      ctx.shadowColor = selected ? PALETTE.accent : 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 4;
    }
    
    // Card background
    ctx.fillStyle = playable ? PALETTE.surface : '#1a1a1a';
    ctx.beginPath();
    ctx.roundRect(x, drawY, w, h, 8);
    ctx.fill();
    
    // Card border (type color)
    const borderColor = TYPE_COLORS[card.type] || PALETTE.text;
    ctx.strokeStyle = selected ? PALETTE.accent : borderColor;
    ctx.lineWidth = selected ? 3 : 2;
    ctx.stroke();
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    
    // Energy cost orb
    ctx.fillStyle = card.energyCost <= 0 ? PALETTE.success : PALETTE.accent;
    ctx.beginPath();
    ctx.arc(x + 18, drawY + 18, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.font = '700 14px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${card.energyCost}`, x + 18, drawY + 18);
    
    // Card art area (placeholder colored rectangle)
    ctx.fillStyle = borderColor;
    ctx.globalAlpha = 0.2;
    ctx.fillRect(x + 8, drawY + 36, w - 16, h * 0.35);
    ctx.globalAlpha = 1;
    
    // Card name
    ctx.fillStyle = PALETTE.text;
    ctx.font = `700 ${Math.floor(w / 10)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(card.name, x + w / 2, drawY + h * 0.58);
    
    // Separator line
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 12, drawY + h * 0.63);
    ctx.lineTo(x + w - 12, drawY + h * 0.63);
    ctx.stroke();
    
    // Card description (simple word wrap)
    ctx.fillStyle = PALETTE.textSecondary;
    ctx.font = `400 ${Math.floor(w / 13)}px system-ui, sans-serif`;
    const descText = CardRenderer.formatDescription(card);
    CardRenderer.wrapText(ctx, descText, x + w / 2, drawY + h * 0.72, w - 20, Math.floor(w / 11));
    
    // Upgraded shimmer
    if (card.upgraded) {
      ctx.strokeStyle = PALETTE.accent;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.roundRect(x + 2, drawY + 2, w - 4, h - 4, 7);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    
    // Dimmed overlay if not playable
    if (!playable) {
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath();
      ctx.roundRect(x, drawY, w, h, 8);
      ctx.fill();
    }
    
    ctx.restore();
  }
  
  static formatDescription(card) {
    let desc = card.description || '';
    for (const effect of card.effects || []) {
      if (effect.type === 'damage') {
        desc = desc.replace('{damage}', effect.value);
      } else if (effect.type === 'block') {
        desc = desc.replace('{block}', effect.value);
      }
    }
    return desc;
  }
  
  static wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let testY = y;
    
    for (const word of words) {
      const testLine = line ? `${line} ${word}` : word;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && line) {
        ctx.fillText(line, x, testY);
        line = word;
        testY += lineHeight;
      } else {
        line = testLine;
      }
    }
    if (line) {
      ctx.fillText(line, x, testY);
    }
  }
}

export { CARD_WIDTH, CARD_HEIGHT };
