// player.js
// Everything related to Naga: position, physics, jump state, and sprite rendering.

const SPRITE_SHEET_SRC = 'assets/naga-spritesheet.png?v=1';

const nagaSprite = new Image();
nagaSprite.src = SPRITE_SHEET_SRC;

const player = {
  x: 70,
  y: GROUND_Y,
  width: 120,
  height: 66, // keeps the sprite sheet's 160:88 aspect ratio at a game-friendly size
  velocityY: 0,
  isJumping: false,
  state: 'running', // 'running' | 'jumping' | 'hurt'
};

// Run-cycle animation state (alternates Run 1 <-> Run 2 while grounded)
let runFrameToggle = 0;
let runAnimationTimer = 0;

function resetPlayer() {
  player.y = GROUND_Y;
  player.velocityY = 0;
  player.isJumping = false;
  player.state = 'running';
  runFrameToggle = 0;
  runAnimationTimer = 0;
}

function jump() {
  // Only allow jumping when grounded — no double jumps (yet)
  if (!player.isJumping) {
    player.velocityY = JUMP_FORCE;
    player.isJumping = true;
    player.state = 'jumping';
  }
}

// Called from collision logic in a later step — swaps to the crouched/hurt frame
function setPlayerHurt() {
  player.state = 'hurt';
}

function updatePlayer(delta) {
  const dtSeconds = delta / 1000;

  // Apply gravity, scaled to real elapsed time
  player.velocityY += GRAVITY * dtSeconds;
  player.y += player.velocityY * dtSeconds;

  // Landed back on the ground
  if (player.y >= GROUND_Y) {
    player.y = GROUND_Y;
    player.velocityY = 0;
    player.isJumping = false;
    if (player.state !== 'hurt') {
      player.state = 'running';
    }
  }

  // Advance the run-cycle animation only while actually running on the ground
  if (player.state === 'running') {
    runAnimationTimer += delta;
    if (runAnimationTimer >= RUN_ANIMATION_SPEED) {
      runAnimationTimer = 0;
      runFrameToggle = runFrameToggle === 0 ? 1 : 0;
    }
  }
}

function getFrameIndex() {
  if (player.state === 'jumping') return FRAME_JUMP;
  if (player.state === 'hurt') return FRAME_HURT;
  return runFrameToggle === 0 ? FRAME_RUN_1 : FRAME_RUN_2;
}

function drawPlayer(ctx) {
  const frameIndex = getFrameIndex();
  const sourceX = frameIndex * SPRITE_FRAME_WIDTH;
  const destY = player.y - player.height;

  if (nagaSprite.complete && nagaSprite.naturalWidth > 0) {
    ctx.drawImage(
      nagaSprite,
      sourceX, 0, SPRITE_FRAME_WIDTH, SPRITE_FRAME_HEIGHT,
      player.x, destY, player.width, player.height
    );
  } else {
    ctx.fillStyle = COLORS.yellow;
    ctx.fillRect(player.x, destY, player.width, player.height);
  }
}