// runes.js
// The Spirit Bear power-up: a collectible rune (a nod to Dota 2's runes and
// Lone Druid's ultimate) that floats above the ground — Naga has to jump to
// grab it — and grants a few seconds of invincibility when collected.

let runes = [];
let nextRuneSpawnInMs = 0;

const runeSprite = new Image();
runeSprite.src = RUNE_SPRITE_SRC;

// Invincibility state lives here since it's directly tied to picking up a rune
let invincibleMsRemaining = 0;

function resetRunes() {
  runes = [];
  nextRuneSpawnInMs = randomRuneSpawnInterval();
  invincibleMsRemaining = 0;
}

function randomRuneSpawnInterval() {
  return Math.random() * (RUNE_SPAWN_MAX_MS - RUNE_SPAWN_MIN_MS) + RUNE_SPAWN_MIN_MS;
}

function spawnRune() {
  const heightAboveGround =
    Math.random() * (RUNE_MAX_HEIGHT_ABOVE_GROUND - RUNE_MIN_HEIGHT_ABOVE_GROUND) +
    RUNE_MIN_HEIGHT_ABOVE_GROUND;

  runes.push({
    x: CANVAS_WIDTH,
    y: GROUND_Y - heightAboveGround - RUNE_HEIGHT,
    width: RUNE_WIDTH,
    height: RUNE_HEIGHT,
  });
}

function updateRunes(delta) {
  const level = getCurrentLevel();

  // Spawn timing, independent from the obstacle spawn timer
  nextRuneSpawnInMs -= delta;
  if (nextRuneSpawnInMs <= 0) {
    spawnRune();
    nextRuneSpawnInMs = randomRuneSpawnInterval();
  }

  // Move at the same speed as obstacles so everything scrolls together
  const moveAmount = level.speed * (delta / 1000);
  runes.forEach((rune) => {
    rune.x -= moveAmount;
  });
  runes = runes.filter((rune) => rune.x + rune.width > 0);

  // Pickup collision — deliberately generous (no hitbox padding), since
  // grabbing a rune should feel rewarding rather than fiddly
  runes = runes.filter((rune) => {
    const collided =
      player.x + player.width > rune.x &&
      player.x < rune.x + rune.width &&
      player.y - player.height < rune.y + rune.height &&
      player.y > rune.y;

    if (collided) {
      addScoreBonus(RUNE_SCORE_BONUS);
      invincibleMsRemaining = INVINCIBILITY_DURATION_MS;
      return false; // remove the collected rune
    }
    return true;
  });

  // Count down invincibility
  if (invincibleMsRemaining > 0) {
    invincibleMsRemaining -= delta;
    if (invincibleMsRemaining < 0) invincibleMsRemaining = 0;
  }
}

function isPlayerInvincible() {
  return invincibleMsRemaining > 0;
}

function drawRunes(ctx) {
  runes.forEach((rune) => drawRuneShape(ctx, rune));
}

// Placeholder rune shape: a little chick (pollito), evoking Dota's glowing
// rune pickups but keeping it cute and on-brand. Swappable for pixel art
// later without touching any other logic.
function drawRuneShape(ctx, rune) {
  const centerX = rune.x + rune.width / 2;
  const centerY = rune.y + rune.height / 2;
  const radius = rune.width / 2;

  // Soft outer glow (kept even once the real sprite is in, for that
  // "collectible" sparkle feel)
  ctx.fillStyle = 'rgba(255, 209, 102, 0.35)';
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius * 1.6, 0, Math.PI * 2);
  ctx.fill();

  if (runeSprite.complete && runeSprite.naturalWidth > 0) {
    ctx.drawImage(runeSprite, rune.x, rune.y, rune.width, rune.height);
    return;
  }

  ctx.fillStyle = COLORS.yellow;
  ctx.strokeStyle = COLORS.navy;
  ctx.lineWidth = 2;

  // Body
  const bodyRadiusX = radius * 0.8;
  const bodyRadiusY = radius * 0.7;
  const bodyCenterY = centerY + radius * 0.2;
  ctx.beginPath();
  ctx.ellipse(centerX, bodyCenterY, bodyRadiusX, bodyRadiusY, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Head
  const headRadius = radius * 0.55;
  const headCenterY = bodyCenterY - bodyRadiusY - headRadius * 0.5;
  ctx.beginPath();
  ctx.arc(centerX, headCenterY, headRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Beak
  ctx.fillStyle = COLORS.navy;
  ctx.beginPath();
  ctx.moveTo(centerX + headRadius * 0.5, headCenterY);
  ctx.lineTo(centerX + headRadius * 1.2, headCenterY - 2);
  ctx.lineTo(centerX + headRadius * 0.5, headCenterY + 3);
  ctx.closePath();
  ctx.fill();

  // Eye
  ctx.beginPath();
  ctx.arc(centerX - headRadius * 0.1, headCenterY - headRadius * 0.2, 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Little feet
  ctx.strokeStyle = COLORS.navy;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(centerX - bodyRadiusX * 0.3, bodyCenterY + bodyRadiusY);
  ctx.lineTo(centerX - bodyRadiusX * 0.3, bodyCenterY + bodyRadiusY + 5);
  ctx.moveTo(centerX + bodyRadiusX * 0.3, bodyCenterY + bodyRadiusY);
  ctx.lineTo(centerX + bodyRadiusX * 0.3, bodyCenterY + bodyRadiusY + 5);
  ctx.stroke();
}

// A pulsing aura drawn behind Naga while the Spirit Bear invincibility is active
function drawInvincibilityAura(ctx) {
  if (!isPlayerInvincible()) return;

  const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 100);
  const centerX = player.x + player.width / 2;
  const centerY = player.y - player.height / 2;
  const radius = player.width / 2 + 6 + pulse * 6;

  ctx.fillStyle = `rgba(255, 209, 102, ${0.25 + pulse * 0.15})`;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();
}