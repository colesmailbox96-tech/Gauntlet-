import { CARD_WIDTH, CARD_HEIGHT } from './CardRenderer.js';

export class HandLayout {
  static getCardPositions(handSize, canvasWidth, canvasHeight) {
    const positions = [];
    const maxHandWidth = Math.min(canvasWidth - 40, handSize * (CARD_WIDTH + 8));
    const spacing = handSize > 1 ? maxHandWidth / (handSize - 1) : 0;
    const startX = (canvasWidth - maxHandWidth) / 2;
    const baseY = canvasHeight - CARD_HEIGHT - 20;
    
    for (let i = 0; i < handSize; i++) {
      const x = handSize > 1 ? startX + i * spacing : (canvasWidth - CARD_WIDTH) / 2;
      positions.push({ x, y: baseY });
    }
    
    return positions;
  }
  
  static getCardAtPoint(positions, px, py) {
    // Check in reverse order (topmost card first)
    for (let i = positions.length - 1; i >= 0; i--) {
      const pos = positions[i];
      if (px >= pos.x && px <= pos.x + CARD_WIDTH && py >= pos.y && py <= pos.y + CARD_HEIGHT) {
        return i;
      }
    }
    return -1;
  }
}
