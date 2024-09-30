const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas dimensions
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Load images
const playerImg = new Image();
playerImg.src = 'images/0012.png';

const enemyImg = new Image();
enemyImg.src = 'images/0001.png';

const bgImg = new Image();
bgImg.src = 'images/0002.png';

const lifeImg = new Image();
lifeImg.src = 'images/life.png'; // Place your life power-up image here

// Player object
const player = {
    x: canvas.width / 2 - 25,
    y: canvas.height - 100,
    width: 50,
    height: 50,
    speed: 5,
    bullets: [],
    lives: 3,
    score: 0
};

// Enemy array
let enemies = [];

// Life power-ups array
let lifePowerUps = [];

// Bullet object
function Bullet(x, y, direction = 'up') {
    this.x = x;
    this.y = y;
    this.width = 5;
    this.height = 10;
    this.speed = 7;
    this.direction = direction;
}

// Enemy object
function Enemy(x, y) {
    this.x = x;
    this.y = y;
    this.width = 50;
    this.height = 50;
    this.speed = 2;
    this.bullets = [];
}

// Life power-up object
function LifePowerUp(x, y) {
    this.x = x;
    this.y = y;
    this.width = 30;
    this.height = 30;
    this.speed = 2;
}

// Scrolling background
let bgY = 0;

// Handle player movement
const keys = {};
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});
document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// On-screen controls
const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');
const upBtn = document.getElementById('upBtn');
const downBtn = document.getElementById('downBtn');

leftBtn.addEventListener('touchstart', () => keys['ArrowLeft'] = true);
leftBtn.addEventListener('touchend', () => keys['ArrowLeft'] = false);

rightBtn.addEventListener('touchstart', () => keys['ArrowRight'] = true);
rightBtn.addEventListener('touchend', () => keys['ArrowRight'] = false);

upBtn.addEventListener('touchstart', () => keys['ArrowUp'] = true);
upBtn.addEventListener('touchend', () => keys['ArrowUp'] = false);

downBtn.addEventListener('touchstart', () => keys['ArrowDown'] = true);
downBtn.addEventListener('touchend', () => keys['ArrowDown'] = false);

// Game UI elements
const livesDisplay = document.getElementById('lives');
const scoreDisplay = document.getElementById('score');
const restartBtn = document.getElementById('restartBtn');

restartBtn.addEventListener('click', () => {
    // Reset game state
    player.lives = 3;
    player.score = 0;
    player.x = canvas.width / 2 - 25;
    player.y = canvas.height - 100;
    enemies = [];
    player.bullets = [];
    lifePowerUps = [];
    gameOver = false;
    restartBtn.style.display = 'none';
    updateLivesDisplay();
    updateScoreDisplay();
    gameLoop();
});

// Game over flag
let gameOver = false;

// Game loop
function gameLoop() {
    if (gameOver) return;
    requestAnimationFrame(gameLoop);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Scroll background
    bgY += 2;
    if (bgY >= canvas.height) bgY = 0;
    ctx.drawImage(bgImg, 0, bgY - canvas.height, canvas.width, canvas.height);
    ctx.drawImage(bgImg, 0, bgY, canvas.width, canvas.height);

    // Move player
    if (keys['ArrowLeft'] && player.x > 0) player.x -= player.speed;
    if (keys['ArrowRight'] && player.x + player.width < canvas.width) player.x += player.speed;
    if (keys['ArrowUp'] && player.y > 0) player.y -= player.speed;
    if (keys['ArrowDown'] && player.y + player.height < canvas.height) player.y += player.speed;

    // Draw player
    ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);

    // Player shooting
    if (gameFrame % 10 === 0) {
        player.bullets.push(new Bullet(player.x + player.width / 2 - 2.5, player.y));
    }

    // Update and draw player bullets
    player.bullets.forEach((bullet, index) => {
        bullet.y -= bullet.speed;
        ctx.fillStyle = 'yellow';
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);

        // Remove off-screen bullets
        if (bullet.y + bullet.height < 0) {
            player.bullets.splice(index, 1);
        }
    });

    // Generate enemies
    if (gameFrame % 100 === 0) {
        const xPosition = Math.random() * (canvas.width - 50);
        enemies.push(new Enemy(xPosition, -50));
    }

    // Generate life power-ups
    if (gameFrame % 1000 === 0) { // 10 times less frequent than enemies
        const xPosition = Math.random() * (canvas.width - 30);
        lifePowerUps.push(new LifePowerUp(xPosition, -30));
    }

    // Update and draw enemies
    enemies.forEach((enemy, enemyIndex) => {
        enemy.y += enemy.speed;
        ctx.drawImage(enemyImg, enemy.x, enemy.y, enemy.width, enemy.height);

        // Enemy shooting
        if (gameFrame % 150 === 0) {
            enemy.bullets.push(new Bullet(enemy.x + enemy.width / 2 - 2.5, enemy.y + enemy.height, 'down'));
        }

        // Update and draw enemy bullets
        enemy.bullets.forEach((bullet, bulletIndex) => {
            bullet.y += bullet.speed;
            ctx.fillStyle = 'red';
            ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);

            // Check collision with player
            if (collision(bullet, player)) {
                enemy.bullets.splice(bulletIndex, 1);
                player.lives--;
                updateLivesDisplay();
                if (player.lives <= 0) {
                    endGame();
                }
            }

            // Remove off-screen bullets
            if (bullet.y > canvas.height) {
                enemy.bullets.splice(bulletIndex, 1);
            }
        });

        // Check collision with player bullets
        player.bullets.forEach((pBullet, pBulletIndex) => {
            if (collision(pBullet, enemy)) {
                // Remove enemy and bullet
                enemies.splice(enemyIndex, 1);
                player.bullets.splice(pBulletIndex, 1);
                player.score += 100;
                updateScoreDisplay();
            }
        });

        // Remove off-screen enemies
        if (enemy.y > canvas.height) {
            enemies.splice(enemyIndex, 1);
        }

        // Check collision with player
        if (collision(enemy, player)) {
            enemies.splice(enemyIndex, 1);
            player.lives--;
            updateLivesDisplay();
            if (player.lives <= 0) {
                endGame();
            }
        }
    });

    // Update and draw life power-ups
    lifePowerUps.forEach((life, lifeIndex) => {
        life.y += life.speed;
        ctx.drawImage(lifeImg, life.x, life.y, life.width, life.height);

        // Check collision with player
        if (collision(life, player)) {
            lifePowerUps.splice(lifeIndex, 1);
            if (player.lives < 3) {
                player.lives++;
                updateLivesDisplay();
            }
            player.score += 50; // Optional: add score for collecting life
            updateScoreDisplay();
        }

        // Remove off-screen life power-ups
        if (life.y > canvas.height) {
            lifePowerUps.splice(lifeIndex, 1);
        }
    });

    gameFrame++;
}

// Collision detection
function collision(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width && rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height && rect1.y + rect1.height > rect2.y
    );
}

// Handle window resize
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

function updateLivesDisplay() {
    livesDisplay.textContent = 'Lives: ' + player.lives;
}

function updateScoreDisplay() {
    scoreDisplay.textContent = 'Score: ' + player.score;
}

function endGame() {
    gameOver = true;
    restartBtn.style.display = 'block';
}

let gameFrame = 0;
updateLivesDisplay();
updateScoreDisplay();
gameLoop();
