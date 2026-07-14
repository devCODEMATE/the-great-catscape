// game.js
// Entry point: owns the canvas context, the game loop, input handling,
// and the current game state. Loaded last so it can use everything above it.

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false; // keeps pixel-art sprites crisp when scaled

let gameState = GAME_STATE.START;
let lastTimestamp = 0;
let gameOverIsNewHighScore = false;
let leaderboardEntries = [];

// Small helper used by the polished start/game-over panels
function drawRoundedRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawClouds() {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.beginPath();
  ctx.ellipse(220, 80, 85, 30, 0, 0, Math.PI * 2);
  ctx.ellipse(285, 68, 60, 24, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(820, 115, 100, 34, 0, 0, Math.PI * 2);
  ctx.ellipse(890, 100, 65, 26, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawBackground() {
  ctx.fillStyle = COLORS.purple;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  drawClouds();

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

  ctx.textAlign = 'center';
  const promptWidth = 420;
  drawRoundedRect(CANVAS_WIDTH / 2 - promptWidth / 2, CANVAS_HEIGHT / 2 - 34, promptWidth, 68, 14);
  ctx.fillStyle = 'rgba(7, 59, 76, 0.6)';
  ctx.fill();
  ctx.strokeStyle = COLORS.yellow;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = COLORS.white;
  ctx.font = '25px monospace';
  ctx.fillText('Press SPACE or tap to start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 9);
}

function drawGameOverOverlay() {
  ctx.fillStyle = 'rgba(7, 59, 76, 0.78)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.textAlign = 'center';

  // Main info card
  const cardWidth = 420;
  const cardX = CANVAS_WIDTH / 2 - cardWidth / 2;
  drawRoundedRect(cardX, 26, cardWidth, 108, 14);
  ctx.fillStyle = 'rgba(90, 82, 122, 0.55)';
  ctx.fill();
  ctx.strokeStyle = COLORS.yellow;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = COLORS.white;
  ctx.font = 'bold 32px monospace';
  ctx.fillText('Game Over', CANVAS_WIDTH / 2, 66);

  ctx.fillStyle = COLORS.yellow;
  ctx.font = '22px monospace';
  ctx.fillText(`Score: ${getDisplayScore()}`, CANVAS_WIDTH / 2, 98);

  if (gameOverIsNewHighScore) {
    ctx.fillStyle = COLORS.teal;
    ctx.font = 'bold 16px monospace';
    ctx.fillText('New High Score!', CANVAS_WIDTH / 2, 122);
  }

  // Leaderboard card
  const boardWidth = 260;
  const boardX = CANVAS_WIDTH / 2 - boardWidth / 2;
  const boardY = 150;
  const boardHeight = 40 + leaderboardEntries.length * 22 + 12;
  drawRoundedRect(boardX, boardY, boardWidth, boardHeight, 12);
  ctx.fillStyle = 'rgba(7, 59, 76, 0.55)';
  ctx.fill();
  ctx.strokeStyle = COLORS.teal;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = COLORS.white;
  ctx.font = 'bold 16px monospace';
  ctx.fillText('Top Scores', CANVAS_WIDTH / 2, boardY + 24);

  leaderboardEntries.forEach((entry, index) => {
    ctx.fillStyle = index === 0 ? COLORS.yellow : COLORS.white;
    ctx.font = '15px monospace';
    ctx.fillText(`${index + 1}. ${entry.score}`, CANVAS_WIDTH / 2, boardY + 48 + index * 22);
  });

  // Retry prompt
  ctx.fillStyle = COLORS.white;
  ctx.font = '18px monospace';
  ctx.fillText('Press SPACE to try again', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 22);
}

function drawHUD() {
  ctx.fillStyle = COLORS.white;
  ctx.font = '18px monospace';
  ctx.textAlign = 'right';
  ctx.fillText(`Score: ${getDisplayScore()}`, CANVAS_WIDTH - 20, 30);

  const seconds = Math.floor(survivalTime / 1000);
  ctx.fillText(`Level ${getCurrentLevelNumber()} · ${seconds}s`, CANVAS_WIDTH - 20, 54);
}

function update(delta) {
  if (gameState !== GAME_STATE.PLAYING) return;

  updatePlayer(delta);
  updateObstacles(delta);
  updateRunes(delta);
  addScoreFromTime(delta);

  if (checkAllCollisions()) {
    setPlayerHurt();
    const finalScore = getDisplayScore();
    gameOverIsNewHighScore = isNewHighScore(finalScore);
    leaderboardEntries = submitScore(finalScore);
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
    event.preventDefault();
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