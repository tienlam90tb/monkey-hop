// ============================================
//  MONKEY SWING 🐒🍌
//  Flappy Bird style - Con khỉ nhảy ăn chuối
// ============================================

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Responsive canvas
const GAME_WIDTH = 400;
const GAME_HEIGHT = 700;
canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;

// ============== GAME STATE ==============
let gameState = 'menu'; // menu, playing, gameover
let score = 0;
let highScore = parseInt(localStorage.getItem('monkeySwingHighScore') || '0');
let frameCount = 0;
let speed = 3;
let bananaCount = 0;

// ============== COLORS & THEME ==============
const COLORS = {
    sky1: '#87CEEB',
    sky2: '#E0F7FA',
    jungle1: '#2E7D32',
    jungle2: '#1B5E20',
    trunk: '#5D4037',
    trunkDark: '#3E2723',
    leaf: '#4CAF50',
    leafLight: '#81C784',
    banana: '#FFD600',
    bananaDark: '#F9A825',
    monkey: '#8D6E63',
    monkeyLight: '#A1887F',
    monkeyDark: '#5D4037',
    monkeyBelly: '#D7CCC8',
    ground: '#33691E',
    groundDark: '#1B5E20',
    text: '#FFFFFF',
    textShadow: '#1a1a2e',
    danger: '#F44336',
};

// ============== MONKEY (PLAYER) ==============
const monkey = {
    x: 80,
    y: GAME_HEIGHT / 2,
    width: 40,
    height: 40,
    velocity: 0,
    gravity: 0.45,
    jump: -8,
    rotation: 0,
};

// ============== OBSTACLES ==============
let obstacles = [];
const OBSTACLE_GAP = 160;
const OBSTACLE_WIDTH = 60;
const OBSTACLE_SPEED_BASE = 3;
let obstacleTimer = 0;
const OBSTACLE_INTERVAL = 100;

// ============== BANANAS ==============
let bananas = [];

// ============== PARTICLES ==============
let particles = [];

// ============== CLOUDS ==============
let clouds = [];
for (let i = 0; i < 5; i++) {
    clouds.push({
        x: Math.random() * GAME_WIDTH,
        y: Math.random() * 200,
        w: 60 + Math.random() * 80,
        speed: 0.3 + Math.random() * 0.5,
    });
}

// ============== GROUND ==============
let groundX = 0;

// ============== DRAW FUNCTIONS ==============

function drawSky() {
    const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    gradient.addColorStop(0, COLORS.sky1);
    gradient.addColorStop(1, COLORS.sky2);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
}

function drawClouds() {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    clouds.forEach(c => {
        ctx.beginPath();
        ctx.ellipse(c.x, c.y, c.w / 2, 20, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(c.x - c.w / 4, c.y - 10, c.w / 3, 15, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(c.x + c.w / 4, c.y - 5, c.w / 3, 18, 0, 0, Math.PI * 2);
        ctx.fill();
    });
}

function drawGround() {
    // Ground
    ctx.fillStyle = COLORS.ground;
    ctx.fillRect(0, GAME_HEIGHT - 60, GAME_WIDTH, 60);

    // Grass pattern
    ctx.fillStyle = COLORS.groundDark;
    for (let i = 0; i < GAME_WIDTH + 20; i += 20) {
        const gx = ((i - groundX) % (GAME_WIDTH + 20) + GAME_WIDTH + 20) % (GAME_WIDTH + 20) - 10;
        ctx.beginPath();
        ctx.moveTo(gx, GAME_HEIGHT - 60);
        ctx.lineTo(gx + 10, GAME_HEIGHT - 72);
        ctx.lineTo(gx + 20, GAME_HEIGHT - 60);
        ctx.fill();
    }

    // Dirt line
    ctx.fillStyle = '#4E342E';
    ctx.fillRect(0, GAME_HEIGHT - 60, GAME_WIDTH, 3);
}

function drawTree(x, topHeight, bottomY) {
    // Top tree (hanging down)
    // Trunk
    ctx.fillStyle = COLORS.trunk;
    ctx.fillRect(x, 0, OBSTACLE_WIDTH, topHeight);

    // Trunk texture
    ctx.fillStyle = COLORS.trunkDark;
    for (let ty = 10; ty < topHeight; ty += 25) {
        ctx.fillRect(x + 5, ty, OBSTACLE_WIDTH - 10, 3);
    }

    // Leaves at bottom of top trunk
    ctx.fillStyle = COLORS.leaf;
    ctx.beginPath();
    ctx.ellipse(x + OBSTACLE_WIDTH / 2, topHeight, OBSTACLE_WIDTH / 2 + 10, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.leafLight;
    ctx.beginPath();
    ctx.ellipse(x + OBSTACLE_WIDTH / 2 - 5, topHeight - 5, OBSTACLE_WIDTH / 2, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Vine hanging
    ctx.strokeStyle = '#2E7D32';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + OBSTACLE_WIDTH / 2, topHeight);
    ctx.quadraticCurveTo(x + OBSTACLE_WIDTH / 2 + 15, topHeight + 20, x + OBSTACLE_WIDTH / 2, topHeight + 30);
    ctx.stroke();

    // Bottom tree (growing up)
    ctx.fillStyle = COLORS.trunk;
    ctx.fillRect(x, bottomY, OBSTACLE_WIDTH, GAME_HEIGHT - 60 - bottomY);

    // Trunk texture
    ctx.fillStyle = COLORS.trunkDark;
    for (let ty = bottomY + 10; ty < GAME_HEIGHT - 60; ty += 25) {
        ctx.fillRect(x + 5, ty, OBSTACLE_WIDTH - 10, 3);
    }

    // Leaves at top of bottom trunk
    ctx.fillStyle = COLORS.leaf;
    ctx.beginPath();
    ctx.ellipse(x + OBSTACLE_WIDTH / 2, bottomY, OBSTACLE_WIDTH / 2 + 10, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.leafLight;
    ctx.beginPath();
    ctx.ellipse(x + OBSTACLE_WIDTH / 2 + 5, bottomY + 5, OBSTACLE_WIDTH / 2, 12, 0, 0, Math.PI * 2);
    ctx.fill();
}

function drawMonkey() {
    ctx.save();
    ctx.translate(monkey.x + monkey.width / 2, monkey.y + monkey.height / 2);

    // Rotation based on velocity
    monkey.rotation = Math.min(Math.max(monkey.velocity * 3, -30), 60);
    ctx.rotate(monkey.rotation * Math.PI / 180);

    const mx = -monkey.width / 2;
    const my = -monkey.height / 2;

    // Tail
    ctx.strokeStyle = COLORS.monkeyDark;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(mx, my + monkey.height / 2);
    const tailWave = Math.sin(frameCount * 0.1) * 5;
    ctx.quadraticCurveTo(mx - 15, my + tailWave, mx - 20, my - 10 + tailWave);
    ctx.stroke();

    // Body
    ctx.fillStyle = COLORS.monkey;
    ctx.beginPath();
    ctx.ellipse(mx + monkey.width / 2, my + monkey.height / 2 + 3, 16, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    // Belly
    ctx.fillStyle = COLORS.monkeyBelly;
    ctx.beginPath();
    ctx.ellipse(mx + monkey.width / 2 + 2, my + monkey.height / 2 + 5, 10, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = COLORS.monkey;
    ctx.beginPath();
    ctx.ellipse(mx + monkey.width / 2 + 5, my + 12, 14, 13, 0, 0, Math.PI * 2);
    ctx.fill();

    // Face
    ctx.fillStyle = COLORS.monkeyBelly;
    ctx.beginPath();
    ctx.ellipse(mx + monkey.width / 2 + 8, my + 14, 9, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#212121';
    ctx.beginPath();
    ctx.arc(mx + monkey.width / 2 + 6, my + 10, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(mx + monkey.width / 2 + 14, my + 10, 3, 0, Math.PI * 2);
    ctx.fill();

    // Eye shine
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(mx + monkey.width / 2 + 7, my + 9, 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(mx + monkey.width / 2 + 15, my + 9, 1, 0, Math.PI * 2);
    ctx.fill();

    // Mouth (smile)
    ctx.strokeStyle = '#5D4037';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(mx + monkey.width / 2 + 10, my + 16, 4, 0, Math.PI);
    ctx.stroke();

    // Ears
    ctx.fillStyle = COLORS.monkeyLight;
    ctx.beginPath();
    ctx.ellipse(mx + monkey.width / 2 - 5, my + 6, 5, 6, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(mx + monkey.width / 2 + 18, my + 6, 5, 6, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Inner ears
    ctx.fillStyle = '#FFAB91';
    ctx.beginPath();
    ctx.ellipse(mx + monkey.width / 2 - 5, my + 6, 3, 4, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(mx + monkey.width / 2 + 18, my + 6, 3, 4, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Arms
    ctx.strokeStyle = COLORS.monkey;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    const armWave = Math.sin(frameCount * 0.15) * 8;
    // Left arm
    ctx.beginPath();
    ctx.moveTo(mx + 5, my + monkey.height / 2);
    ctx.lineTo(mx - 5, my + monkey.height / 2 - 10 + armWave);
    ctx.stroke();
    // Right arm
    ctx.beginPath();
    ctx.moveTo(mx + monkey.width - 5, my + monkey.height / 2);
    ctx.lineTo(mx + monkey.width + 5, my + monkey.height / 2 - 10 - armWave);
    ctx.stroke();

    // Hands
    ctx.fillStyle = COLORS.monkeyBelly;
    ctx.beginPath();
    ctx.arc(mx - 5, my + monkey.height / 2 - 10 + armWave, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(mx + monkey.width + 5, my + monkey.height / 2 - 10 - armWave, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

function drawBanana(x, y, size) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.sin(frameCount * 0.05 + x) * 0.3);

    // Banana body
    ctx.fillStyle = COLORS.banana;
    ctx.beginPath();
    ctx.moveTo(-size / 2, 0);
    ctx.quadraticCurveTo(-size / 2, -size, 0, -size);
    ctx.quadraticCurveTo(size / 2, -size, size / 2, 0);
    ctx.quadraticCurveTo(size / 3, size / 3, 0, size / 4);
    ctx.quadraticCurveTo(-size / 3, size / 3, -size / 2, 0);
    ctx.fill();

    // Banana highlight
    ctx.fillStyle = COLORS.bananaDark;
    ctx.beginPath();
    ctx.moveTo(-size / 4, -size / 4);
    ctx.quadraticCurveTo(0, -size * 0.8, size / 4, -size / 4);
    ctx.quadraticCurveTo(0, -size * 0.5, -size / 4, -size / 4);
    ctx.fill();

    // Tip
    ctx.fillStyle = '#795548';
    ctx.beginPath();
    ctx.arc(0, -size + 2, 3, 0, Math.PI * 2);
    ctx.fill();

    // Shine
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    ctx.ellipse(-size / 6, -size / 2, 2, 6, -0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

function drawParticles() {
    particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;
        p.vy += 0.1;

        if (p.life <= 0) {
            particles.splice(i, 1);
            return;
        }

        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    });
}

function drawScore() {
    // Score
    ctx.fillStyle = COLORS.textShadow;
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(score, GAME_WIDTH / 2 + 2, 72);
    ctx.fillStyle = COLORS.text;
    ctx.fillText(score, GAME_WIDTH / 2, 70);

    // Banana count
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'left';
    ctx.fillStyle = COLORS.banana;
    ctx.fillText('🍌 ' + bananaCount, 15, 35);
}

function drawMenu() {
    drawSky();
    drawClouds();
    drawGround();

    // Title
    ctx.fillStyle = COLORS.textShadow;
    ctx.font = 'bold 42px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('MONKEY', GAME_WIDTH / 2 + 2, 182);
    ctx.fillText('SWING', GAME_WIDTH / 2 + 2, 232);
    ctx.fillStyle = '#FFD600';
    ctx.fillText('MONKEY', GAME_WIDTH / 2, 180);
    ctx.fillStyle = '#4CAF50';
    ctx.fillText('SWING', GAME_WIDTH / 2, 230);

    // Monkey preview
    const prevMonkey = { ...monkey, x: GAME_WIDTH / 2 - 30, y: 280 };
    const origMonkey = { ...monkey };
    Object.assign(monkey, prevMonkey);
    monkey.velocity = 0;
    drawMonkey();
    Object.assign(monkey, origMonkey);

    // Banana
    drawBanana(GAME_WIDTH / 2 + 40, 300, 20);
    drawBanana(GAME_WIDTH / 2 - 50, 320, 15);

    // Play button
    const btnY = 420;
    ctx.fillStyle = '#4CAF50';
    ctx.beginPath();
    ctx.roundRect(GAME_WIDTH / 2 - 80, btnY, 160, 55, 12);
    ctx.fill();
    ctx.fillStyle = '#388E3C';
    ctx.beginPath();
    ctx.roundRect(GAME_WIDTH / 2 - 80, btnY + 3, 160, 55, 12);
    ctx.fill();
    ctx.fillStyle = '#4CAF50';
    ctx.beginPath();
    ctx.roundRect(GAME_WIDTH / 2 - 80, btnY, 160, 52, 12);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('CHƠI NGAY', GAME_WIDTH / 2, btnY + 34);

    // High score
    ctx.fillStyle = '#FFF';
    ctx.font = '18px Arial';
    ctx.fillText(`🏆 Kỷ lục: ${highScore}`, GAME_WIDTH / 2, 520);

    // Tap hint
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '14px Arial';
    ctx.fillText('Chạm để chơi', GAME_WIDTH / 2, 560);
}

function drawGameOver() {
    // Dark overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Panel
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.roundRect(GAME_WIDTH / 2 - 120, 180, 240, 300, 16);
    ctx.fill();

    ctx.fillStyle = '#F5F5F5';
    ctx.beginPath();
    ctx.roundRect(GAME_WIDTH / 2 - 110, 240, 220, 100, 10);
    ctx.fill();

    // Game Over text
    ctx.fillStyle = '#F44336';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', GAME_WIDTH / 2, 225);

    // Score
    ctx.fillStyle = '#333';
    ctx.font = '16px Arial';
    ctx.fillText('Điểm số', GAME_WIDTH / 2, 270);
    ctx.font = 'bold 36px Arial';
    ctx.fillStyle = '#FF9800';
    ctx.fillText(score, GAME_WIDTH / 2, 310);

    // High score
    ctx.font = '16px Arial';
    ctx.fillStyle = '#333';
    ctx.fillText('Kỷ lục', GAME_WIDTH / 2, 360);
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = '#4CAF50';
    ctx.fillText(highScore, GAME_WIDTH / 2, 390);

    // New record
    if (score >= highScore && score > 0) {
        ctx.fillStyle = '#F44336';
        ctx.font = 'bold 16px Arial';
        ctx.fillText('🎉 KỶ LỤC MỚI! 🎉', GAME_WIDTH / 2, 420);
    }

    // Retry button
    ctx.fillStyle = '#4CAF50';
    ctx.beginPath();
    ctx.roundRect(GAME_WIDTH / 2 - 70, 430, 140, 40, 8);
    ctx.fill();
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 18px Arial';
    ctx.fillText('CHƠI LẠI', GAME_WIDTH / 2, 456);
}

// ============== GAME LOGIC ==============

function spawnObstacle() {
    const minTop = 80;
    const maxTop = GAME_HEIGHT - 60 - OBSTACLE_GAP - 80;
    const topHeight = Math.floor(Math.random() * (maxTop - minTop)) + minTop;
    const bottomY = topHeight + OBSTACLE_GAP;

    obstacles.push({
        x: GAME_WIDTH,
        topHeight: topHeight,
        bottomY: bottomY,
        scored: false,
    });

    // Spawn banana in the gap
    bananas.push({
        x: GAME_WIDTH + OBSTACLE_WIDTH / 2,
        y: topHeight + OBSTACLE_GAP / 2,
        size: 18,
        collected: false,
    });
}

function spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            size: Math.random() * 4 + 2,
            life: 1,
            color: color,
        });
    }
}

function checkCollision() {
    const mx = monkey.x + 5;
    const my = monkey.y + 5;
    const mw = monkey.width - 10;
    const mh = monkey.height - 10;

    // Ground/ceiling
    if (my + mh >= GAME_HEIGHT - 60 || my <= 0) {
        return true;
    }

    // Obstacles
    for (const obs of obstacles) {
        // Top obstacle
        if (mx + mw > obs.x && mx < obs.x + OBSTACLE_WIDTH) {
            if (my < obs.topHeight || my + mh > obs.bottomY) {
                return true;
            }
        }
    }

    return false;
}

function checkBananaCollection() {
    bananas.forEach(b => {
        if (b.collected) return;

        const dx = (monkey.x + monkey.width / 2) - b.x;
        const dy = (monkey.y + monkey.height / 2) - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 30) {
            b.collected = true;
            bananaCount++;
            spawnParticles(b.x, b.y, COLORS.banana, 8);
        }
    });
}

function resetGame() {
    monkey.y = GAME_HEIGHT / 2;
    monkey.velocity = 0;
    monkey.rotation = 0;
    obstacles = [];
    bananas = [];
    particles = [];
    score = 0;
    bananaCount = 0;
    speed = OBSTACLE_SPEED_BASE;
    obstacleTimer = 0;
    frameCount = 0;
}

function jump() {
    if (gameState === 'menu') {
        gameState = 'playing';
        resetGame();
        return;
    }

    if (gameState === 'playing') {
        monkey.velocity = monkey.jump;
        spawnParticles(monkey.x, monkey.y + monkey.height, 'rgba(255,255,255,0.5)', 3);
    }

    if (gameState === 'gameover') {
        gameState = 'menu';
    }
}

// ============== UPDATE ==============

function update() {
    if (gameState !== 'playing') return;

    frameCount++;

    // Monkey physics
    monkey.velocity += monkey.gravity;
    monkey.y += monkey.velocity;

    // Speed increase
    speed = OBSTACLE_SPEED_BASE + Math.floor(score / 5) * 0.3;
    speed = Math.min(speed, 7);

    // Obstacles
    obstacleTimer++;
    if (obstacleTimer >= OBSTACLE_INTERVAL - Math.min(score * 2, 30)) {
        spawnObstacle();
        obstacleTimer = 0;
    }

    obstacles.forEach(obs => {
        obs.x -= speed;

        // Score
        if (!obs.scored && obs.x + OBSTACLE_WIDTH < monkey.x) {
            obs.scored = true;
            score++;
        }
    });

    // Remove off-screen
    obstacles = obstacles.filter(o => o.x > -OBSTACLE_WIDTH);
    bananas = bananas.filter(b => b.x > -30);

    // Move bananas
    bananas.forEach(b => {
        b.x -= speed;
    });

    // Clouds
    clouds.forEach(c => {
        c.x -= c.speed;
        if (c.x < -c.w) c.x = GAME_WIDTH + c.w;
    });

    // Ground scroll
    groundX = (groundX + speed) % 20;

    // Check banana collection
    checkBananaCollection();

    // Check collision
    if (checkCollision()) {
        gameState = 'gameover';
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('monkeySwingHighScore', highScore.toString());
        }
        spawnParticles(monkey.x + monkey.width / 2, monkey.y + monkey.height / 2, '#F44336', 15);
    }
}

// ============== RENDER ==============

function render() {
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    if (gameState === 'menu') {
        drawMenu();
        return;
    }

    drawSky();
    drawClouds();

    // Obstacles
    obstacles.forEach(obs => {
        drawTree(obs.x, obs.topHeight, obs.bottomY);
    });

    // Bananas
    bananas.forEach(b => {
        if (!b.collected) {
            drawBanana(b.x, b.y, b.size);
        }
    });

    drawGround();
    drawMonkey();
    drawParticles();
    drawScore();

    if (gameState === 'gameover') {
        drawGameOver();
    }
}

// ============== GAME LOOP ==============

function gameLoop() {
    update();
    render();
    requestAnimationFrame(gameLoop);
}

// ============== INPUT ==============

canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    jump();
});

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        jump();
    }
});

// ============== START ==============

// Scale canvas for high DPI
function resizeCanvas() {
    const ratio = Math.min(window.innerWidth / GAME_WIDTH, window.innerHeight / GAME_HEIGHT);
    canvas.style.width = GAME_WIDTH * ratio + 'px';
    canvas.style.height = GAME_HEIGHT * ratio + 'px';
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

gameLoop();
