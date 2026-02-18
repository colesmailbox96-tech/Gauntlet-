const app = document.querySelector('#app');

if (app) {
  app.innerHTML = `
    <h1>Arcane Gauntlet</h1>
    <p id="run-status">Ready to begin a practice run.</p>
    <canvas id="game-canvas" aria-label="Practice combat preview"></canvas>
    <button id="start-run" type="button">Start Practice Run</button>
  `;

  const style = document.createElement('style');
  style.textContent = `
    #app { max-width: 960px; margin: 0 auto; padding: 16px; font-family: system-ui, sans-serif; }
    #game-canvas { width: 100%; max-width: 960px; aspect-ratio: 16 / 9; border: 1px solid #1f2937; border-radius: 8px; display: block; background: #0b1220; margin: 12px 0; }
    #start-run { background: #4f46e5; color: #fff; border: 0; border-radius: 6px; padding: 10px 14px; cursor: pointer; font-weight: 600; }
    #start-run:hover { background: #4338ca; }
  `;
  document.head.append(style);

  const canvas = document.querySelector('#game-canvas');
  const runStatus = document.querySelector('#run-status');
  const startRunButton = document.querySelector('#start-run');
  const context = canvas?.getContext('2d');
  const state = { started: false, floor: 1, enemyHp: 24 };

  const drawScene = () => {
    if (!canvas || !context) return;
    canvas.width = 960;
    canvas.height = 540;
    context.fillStyle = '#0b1220';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#f9fafb';
    context.font = '700 32px system-ui';
    context.fillText('Practice Arena', 32, 56);
    context.font = '500 22px system-ui';
    context.fillText(`Floor ${state.floor}`, 32, 100);
    context.fillText(`Enemy HP: ${state.enemyHp}`, 32, 134);
    context.fillStyle = '#ef4444';
    context.fillRect(32, 156, Math.max(0, state.enemyHp * 8), 24);
  };

  startRunButton?.addEventListener('click', () => {
    state.started = true;
    state.floor += 1;
    state.enemyHp = Math.max(0, state.enemyHp - 6);
    if (runStatus) {
      runStatus.textContent = `Run started — entering floor ${state.floor} with enemy HP ${state.enemyHp}.`;
    }
    drawScene();
  });

  drawScene();
}
