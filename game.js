const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 607.5;
canvas.height = 1080;

const shipImg = new Image();
const projectileImg = new Image();
const enemyImg = new Image();
shipImg.src = 'assets/ship.png';
projectileImg.src = 'assets/projectile.png';
enemyImg.src = 'assets/enemy.png';

const ship = { x: canvas.width / 2, y: canvas.height - 150, speed: 420, width: 0, height: 0, tiltSpeed: 0 };
let projectiles = [];
let enemies = [];
let level = 1;
let score = 0;
let gameState = "menu";
let enemySpawnTimer = 0;

// Mobile tilt data
let tiltX = 0;

shipImg.onload = () => {
  ship.width = shipImg.width * 0.25;
  ship.height = shipImg.height * 0.25;
};

function resetGame() {
  level = 1;
  score = 0;
  enemies = [];
  projectiles = [];
}

function spawnEnemies(deltaTime) {
  enemySpawnTimer += deltaTime;
  const spawnInterval = 1.5 / level;
  if (enemySpawnTimer >= spawnInterval) {
    enemySpawnTimer = 0;
    enemies.push({
      x: Math.random() * (canvas.width - 50),
      y: -50,
      speed: 50 + level * 10,
      width: 100,
      height: 100,
    });
  }
}

function update(deltaTime) {
  if (gameState === "playing") {
    if (keys["Escape"]) gameState = "gameOver";

    // PC movement
    if (keys["ArrowLeft"]) ship.x = Math.max(-30, ship.x - ship.speed * deltaTime);
    if (keys["ArrowRight"]) ship.x = Math.min(canvas.width - ship.width + 60, ship.x + ship.speed * deltaTime);

    // Mobile tilt movement
    ship.x += tiltX * ship.speed * deltaTime;
    ship.x = Math.max(-30, Math.min(canvas.width - ship.width + 60, ship.x)); // Boundaries

    // Projectiles
    projectiles = projectiles.filter(proj => proj.y > -proj.height);
    projectiles.forEach(proj => proj.y -= proj.speed * deltaTime);

    // Enemies
    enemies.forEach(enemy => enemy.y += enemy.speed * deltaTime);
    enemies = enemies.filter(enemy => {
      if (enemy.y > canvas.height) {
        gameState = "gameOver";
        return false;
      }
      return true;
    });

    // Collision detection
    projectiles.forEach((proj, i) => {
      enemies.forEach((enemy, j) => {
        if (
          proj.x < enemy.x + enemy.width &&
          proj.x + proj.width > enemy.x &&
          proj.y < enemy.y + enemy.height &&
          proj.y + proj.height > enemy.y
        ) {
          projectiles.splice(i, 1);
          enemies.splice(j, 1);
          score += 1;
        }
      });
    });

    // Level progression
    if (score >= level * 10) {
      level++;
    }

    spawnEnemies(deltaTime);
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (gameState === "menu") {
    ctx.fillStyle = "white";
    ctx.font = "30px Arial";
    ctx.fillText("Press Enter or Tap to Start", canvas.width / 2 - 180, canvas.height / 2);
  } else if (gameState === "playing") {
    ctx.drawImage(shipImg, ship.x, ship.y, ship.width, ship.height);

    projectiles.forEach(proj => ctx.drawImage(projectileImg, proj.x, proj.y, proj.width, proj.height));
    enemies.forEach(enemy => ctx.drawImage(enemyImg, enemy.x, enemy.y, 50, 50));

    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Level: ${level}`, 10, 50);
  } else if (gameState === "gameOver") {
    ctx.fillStyle = "white";
    ctx.font = "30px Arial";
    ctx.fillText("Game Over!", canvas.width / 2 - 90, canvas.height / 2 - 50);
    ctx.fillText(`Final Score: ${score}`, canvas.width / 2 - 100, canvas.height / 2 + 100);
    ctx.fillText(`Final Level: ${level}`, canvas.width / 2 - 100, canvas.height / 2 + 150);
    ctx.fillText(`Press Enter or Tap to Restart`, canvas.width / 2 - 180, canvas.height / 2 + 250);
  }
}

const keys = {};
document.addEventListener("keydown", e => {
  keys[e.key] = true;
  if (e.key === "Enter") {
    if (gameState === "menu") {
      gameState = "playing";
      resetGame();
    } else if (gameState === "gameOver") {
      gameState = "menu";
    }
  }
  if (e.key === " ") {
    shootProjectile();
  }
});
document.addEventListener("keyup", e => (keys[e.key] = false));

// Mobile touch to shoot
canvas.addEventListener("touchstart", () => {
  if (gameState === "menu") {
    gameState = "playing";
    resetGame();
  } else if (gameState === "playing") {
    shootProjectile();
  }
});
canvas.addEventListener("touchend", () => {});

// Mobile tilt control
if (window.DeviceOrientationEvent) {
  window.addEventListener("deviceorientation", event => {
    tiltX = event.gamma / 30; // Normalize tilt
  });
}

function shootProjectile() {
  if (gameState === "playing") {
    projectiles.push({
      x: ship.x + ship.width / 2 - 42,
      y: ship.y - ship.height / 2,
      width: 60,
      height: 120,
      speed: 750,
    });
  }
}

let lastTime = 0;
function gameLoop(timestamp) {
  const deltaTime = (timestamp - lastTime) / 1000;
  lastTime = timestamp;

  update(deltaTime);
  draw();

  requestAnimationFrame(gameLoop);
}
gameLoop();
