// score.js
// Tracks the player's score for the current run: a base amount per second
// survived, plus bonus points for collecting Spirit Bear runes.

let score = 0;

function resetScore() {
  score = 0;
}

function addScoreFromTime(delta) {
  score += SCORE_PER_SECOND * (delta / 1000);
}

function addScoreBonus(amount) {
  score += amount;
}

function getDisplayScore() {
  return Math.floor(score);
}