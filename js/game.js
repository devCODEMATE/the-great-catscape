// game.js
// Entry point: owns the canvas context, the game loop, input handling,
// and the current game state. Loaded last so it can use everything above it.

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

let gameState = GAME_STATE.START;
let lastTimestamp = 0;

function drawBackground() {
  ctx.fillStyle = COLORS.purple;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Ground line
  ctx.strokeStyle = COLORS.teal;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  ctx.lineTo(CANVAS_WIDTH, GROUND_Y);
  ctx.stroke();
}

function drawStartScreen() {
  drawBackground();
  drawPlayer(ctx);

  ctx.fillStyle = COLORS.white;
  ctx.font = '20px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('Press SPACE or tap to start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
}

function drawGameOverOverlay() {
  ctx.fillStyle = 'rgba(7, 59, 76, 0.7)'; // translucent navy over the frozen scene
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.fillStyle = COLORS.white;
  ctx.font = '26px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('Game Over', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);

  ctx.fillStyle = COLORS.yellow;
  ctx.font = '18px monospace';
  ctx.fillText(`Score: ${getDisplayScore()}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

  ctx.fillStyle = COLORS.white;
  ctx.font = '16px monospace';
  ctx.fillText('Press SPACE to try again', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
}

function drawHUD() {
  ctx.fillStyle = COLORS.white;
  ctx.font = '14px monospace';
  ctx.textAlign = 'right';
  ctx.fillText(`Score: ${getDisplayScore()}`, CANVAS_WIDTH - 16, 24);

  const seconds = Math.floor(survivalTime / 1000);
  ctx.fillText(`Level ${getCurrentLevelNumber()} · ${seconds}s`, CANVAS_WIDTH - 16, 44);
}

function update(delta) {
  if (gameState !== GAME_STATE.PLAYING) return;

  updatePlayer(delta);
  updateObstacles(delta);
  updateRunes(delta);
  addScoreFromTime(delta);

  if (checkAllCollisions()) {
    setPlayerHurt();
    gameState = GAME_STATE.GAME_OVER;
  }
}

function draw() {
  drawBackground();
  drawObstacles(ctx);
  drawRunes(ctx);
  drawInvincibilityAura(ctx);
  drawPlayer(ctx);

  if (gameState === GAME_STATE.PLAYING) {
    drawHUD();
  }

  if (gameState === GAME_STATE.GAME_OVER) {
    drawGameOverOverlay();
  }
}

function gameLoop(timestamp) {
  const delta = timestamp - lastTimestamp;
  lastTimestamp = timestamp;

  if (gameState === GAME_STATE.START) {
    drawStartScreen();
  } else {
    update(delta);
    draw();
  }

  requestAnimationFrame(gameLoop);
}

function startGame() {
  gameState = GAME_STATE.PLAYING;
  resetPlayer();
  resetObstacles();
  resetRunes();
  resetScore();
}

function handleJumpInput() {
  if (gameState === GAME_STATE.START) {
    startGame();
    return;
  }
  if (gameState === GAME_STATE.PLAYING) {
    jump();
    return;
  }
  if (gameState === GAME_STATE.GAME_OVER) {
    startGame();
  }
}

// Keyboard input
window.addEventListener('keydown', (event) => {
  if (event.code === 'Space' || event.code === 'ArrowUp') {
    event.preventDefault(); // stop the page from scrolling on Space
    handleJumpInput();
  }
});

// Touch input (mobile)
canvas.addEventListener('touchstart', (event) => {
  event.preventDefault();
  handleJumpInput();
});

// Kick off the loop
requestAnimationFrame(gameLoop);