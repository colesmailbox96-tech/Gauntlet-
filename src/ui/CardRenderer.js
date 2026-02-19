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

const TYPE_COLORS_LIGHT = {
  attack: PALETTE.cardAttackLight,
  skill: PALETTE.cardSkillLight,
  power: PALETTE.cardPowerLight,
  curse: PALETTE.cardCurseLight,
  status: PALETTE.cardStatusLight,
};

const RARITY_COLORS = {
  starter: null,
  common: PALETTE.rarityCommon,
  uncommon: PALETTE.rarityUncommon,
  rare: PALETTE.rarityRare,
  curse: PALETTE.rarityCurse,
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
      ctx.shadowColor = selected ? PALETTE.accent : 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = selected ? 18 : 14;
      ctx.shadowOffsetY = selected ? 6 : 4;
    } else {
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetY = 2;
    }
    
    // Card background gradient
    const bgGrd = ctx.createLinearGradient(x, drawY, x, drawY + h);
    bgGrd.addColorStop(0, playable ? PALETTE.surfaceLight : '#1a1a1a');
    bgGrd.addColorStop(1, playable ? PALETTE.surface : '#111');
    ctx.fillStyle = bgGrd;
    ctx.beginPath();
    ctx.roundRect(x, drawY, w, h, 10);
    ctx.fill();
    
    // Reset shadow for remaining elements
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    
    // Card border (type color) with gradient
    const borderColor = TYPE_COLORS[card.type] || PALETTE.text;
    const borderLight = TYPE_COLORS_LIGHT[card.type] || PALETTE.text;
    const borderGrd = ctx.createLinearGradient(x, drawY, x, drawY + h);
    borderGrd.addColorStop(0, selected ? PALETTE.accent : borderLight);
    borderGrd.addColorStop(1, selected ? PALETTE.accentDark : borderColor);
    ctx.strokeStyle = borderGrd;
    ctx.lineWidth = selected ? 3 : 2;
    ctx.stroke();
    
    // Inner border (subtle highlight)
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x + 1, drawY + 1, w - 2, h - 2, 9);
    ctx.stroke();
    
    // Card art area with subtle pattern
    const artY = drawY + 36;
    const artH = h * 0.35;
    ctx.fillStyle = borderColor;
    ctx.globalAlpha = 0.15;
    ctx.fillRect(x + 8, artY, w - 16, artH);
    ctx.globalAlpha = 1;
    
    // Art area gradient overlay (vignette)
    const artGrd = ctx.createLinearGradient(x + 8, artY, x + 8, artY + artH);
    artGrd.addColorStop(0, 'rgba(255,255,255,0.06)');
    artGrd.addColorStop(0.5, 'transparent');
    artGrd.addColorStop(1, 'rgba(0,0,0,0.08)');
    ctx.fillStyle = artGrd;
    ctx.fillRect(x + 8, artY, w - 16, artH);
    
    // Art area decorative lines (cross-hatch pattern)
    ctx.strokeStyle = borderColor;
    ctx.globalAlpha = 0.06;
    ctx.lineWidth = 1;
    for (let i = 0; i < w; i += 12) {
      ctx.beginPath();
      ctx.moveTo(x + 8 + i, artY);
      ctx.lineTo(x + 8 + i - artH * 0.5, artY + artH);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    
    // Energy cost orb with gradient
    const orbX = x + 18;
    const orbY = drawY + 18;
    const orbR = 14;
    const orbGrd = ctx.createRadialGradient(orbX - 3, orbY - 3, 2, orbX, orbY, orbR);
    orbGrd.addColorStop(0, card.energyCost <= 0 ? '#5CDB5C' : '#FFD700');
    orbGrd.addColorStop(1, card.energyCost <= 0 ? PALETTE.success : PALETTE.accentDark);
    ctx.fillStyle = orbGrd;
    ctx.beginPath();
    ctx.arc(orbX, orbY, orbR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Orb text
    ctx.fillStyle = '#000';
    ctx.font = `700 14px "Segoe UI", system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${card.energyCost}`, orbX, orbY);
    
    // Card name
    ctx.fillStyle = PALETTE.text;
    ctx.font = `700 ${Math.floor(w / 10)}px "Segoe UI", system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(card.name, x + w / 2, drawY + h * 0.58);
    
    // Separator line with gradient
    const sepY = drawY + h * 0.63;
    const sepGrd = ctx.createLinearGradient(x + 12, sepY, x + w - 12, sepY);
    sepGrd.addColorStop(0, 'transparent');
    sepGrd.addColorStop(0.3, borderColor);
    sepGrd.addColorStop(0.7, borderColor);
    sepGrd.addColorStop(1, 'transparent');
    ctx.strokeStyle = sepGrd;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 12, sepY);
    ctx.lineTo(x + w - 12, sepY);
    ctx.stroke();
    
    // Card description
    ctx.fillStyle = PALETTE.textSecondary;
    ctx.font = `400 ${Math.floor(w / 13)}px "Segoe UI", system-ui, sans-serif`;
    const descText = CardRenderer.formatDescription(card);
    CardRenderer.wrapText(ctx, descText, x + w / 2, drawY + h * 0.72, w - 20, Math.floor(w / 11));
    
    // Rarity gem indicator (bottom center)
    const rarityColor = RARITY_COLORS[card.rarity];
    if (rarityColor) {
      const gemX = x + w / 2;
      const gemY = drawY + h - 10;
      ctx.fillStyle = rarityColor;
      ctx.beginPath();
      // Small diamond shape
      ctx.moveTo(gemX, gemY - 5);
      ctx.lineTo(gemX + 4, gemY);
      ctx.lineTo(gemX, gemY + 5);
      ctx.lineTo(gemX - 4, gemY);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
    
    // Upgraded shimmer (golden inner border)
    if (card.upgraded) {
      ctx.strokeStyle = PALETTE.accent;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.roundRect(x + 2, drawY + 2, w - 4, h - 4, 9);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    
    // Hover glow effect
    if (hovered && playable) {
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(x - 1, drawY - 1, w + 2, h + 2, 11);
      ctx.stroke();
    }
    
    // Dimmed overlay if not playable
    if (!playable) {
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath();
      ctx.roundRect(x, drawY, w, h, 10);
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
