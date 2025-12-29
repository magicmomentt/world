/* --- CONFIGURATION --- */
const CORRECT_COMBINATION = [5, 2, 9];
const MSG_ERROR = "Try again, my love";
const MSG_SUCCESS = "Welcome to our universe";

/* --- STATE MANAGEMENT --- */
let currentCombination = [0, 0, 0];
let currentScene = 1;
let totalScenes = 10;
let isUnlocked = false;

/* --- DOM ELEMENTS --- */
const tumblers = [
    document.getElementById('tumbler-0'),
    document.getElementById('tumbler-1'),
    document.getElementById('tumbler-2')
];
const statusMsg = document.getElementById('status-msg');
const audio = document.getElementById('bg-music');
const canvas = document.getElementById('main-canvas');
const ctx = canvas.getContext('2d');
const nextBtn = document.getElementById('next-btn');

/* --- LOCK FUNCTIONALITY --- */
function rotateTumbler(index, direction) {
    if (isUnlocked) return;
    let val = currentCombination[index];
    val += direction;
    if (val > 9) val = 0; if (val < 0) val = 9;
    currentCombination[index] = val;
    tumblers[index].innerText = val;
    checkCombination();
}

function checkCombination() {
    const isMatch = currentCombination.every((val, i) => val === CORRECT_COMBINATION[i]);
    if (isMatch) {
        unlockPhase();
    } else {
        statusMsg.innerText = MSG_ERROR;
        statusMsg.style.color = '#ff6b6b';
    }
}

function unlockPhase() {
    isUnlocked = true;
    statusMsg.innerText = MSG_SUCCESS;
    statusMsg.style.color = '#4fa3ff';
    document.querySelector('.lock-wrapper').classList.add('unlock-anim');

    // Attempt Audio
    audio.volume = 0.5;
    audio.play().catch(e => console.log("Audio requires interaction first"));

    setTimeout(() => {
        nextScene();
        showNav();
    }, 1500);
}

/* --- SCENE MANAGER --- */
function nextScene() {
    // Hide current
    const currEl = document.getElementById(`scene-${currentScene}`);
    if (currEl) {
        currEl.classList.remove('active');
        currEl.classList.add('hidden');
    }

    currentScene++;

    // Total scenes is now 9 (Galaxy -> Planets -> Earth -> Continents -> Countries -> People -> FinalText -> Calendar)
    // Wait, let's count:
    // 1: Lock
    // 2: Galaxy
    // 3: Planets
    // 4: Earth
    // 5: Continents
    // 6: Countries
    // 7: People
    // 8: Final Text ("I chose you")
    // 9: Calendar

    if (currentScene > 9) return;

    const nextEl = document.getElementById(`scene-${currentScene}`);
    if (nextEl) {
        nextEl.classList.remove('hidden');
        // Force reflow
        void nextEl.offsetWidth;
        nextEl.classList.add('active');
    }

    handleSceneLogic(currentScene);
}

function showNav() {
    document.getElementById('nav-controls').classList.remove('hidden');
}

document.getElementById('next-btn').addEventListener('click', nextScene);

function handleSceneLogic(sceneIdx) {
    // Logic for specific scenes

    // Scene 8: Final Text - maybe show particles/canvas gently?
    if (sceneIdx === 8) {
        canvas.classList.add('active');
        // We can use the 'wander' particles for a nice background effect
        initParticles('wander');
        animateParticles();
    }

    // Scene 9: Calendar
    if (sceneIdx === 9) {
        // Keep canvas active
    }
}


/* --- PARTICLE SYSTEM --- */
let particles = [];
let width, height;
let particleMode = 'wander'; // 'wander' or 'heart'

function resizeCanvas() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}

// Debounced resize handler for better performance
let resizeTimeout;
window.addEventListener('resize', () => {
    resizeCanvas();
    // Reinitialize particles on significant resize (e.g., orientation change)
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        if (particles.length > 0) {
            initParticles();
        }
    }, 300);
});
resizeCanvas();

function getHeartPoint(t, scale) {
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    return {
        x: x * scale + width / 2,
        y: -y * scale + height / 2
    };
}

class Particle {
    constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 1; // Slow wander
        this.vy = (Math.random() - 0.5) * 1;
        this.size = Math.random() * 2 + 1;
        this.color = `rgba(255, 255, 255, ${Math.random() * 0.5 + 0.2})`;

        // Heart target
        this.targetX = 0;
        this.targetY = 0;
        // Assign a fixed 't' for heart shape
        this.t = Math.random() * Math.PI * 2;
    }

    update() {
        if (particleMode === 'wander') {
            // Human-like wandering
            this.x += this.vx;
            this.y += this.vy;

            // Bounce off edges
            if (this.x < 0 || this.x > width) this.vx *= -1;
            if (this.y < 0 || this.y > height) this.vy *= -1;

            // Randomly change direction slightly (brownian-ish)
            if (Math.random() < 0.01) {
                this.vx += (Math.random() - 0.5) * 0.5;
                this.vy += (Math.random() - 0.5) * 0.5;
            }
        } else if (particleMode === 'heart') {
            // Calculate target
            const minDim = Math.min(width, height);
            const scale = minDim / 40;
            const pos = getHeartPoint(this.t, scale);

            const dx = pos.x - this.x;
            const dy = pos.y - this.y;

            this.vx += dx * 0.03; // Smooth ease
            this.vy += dy * 0.03;
            this.vx *= 0.9; // Friction
            this.vy *= 0.9;

            this.x += this.vx;
            this.y += this.vy;

            // Color shift to Red/Pink
            this.color = `rgba(255, 100, 150, 0.8)`;
        }
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function initParticles() {
    particles = [];
    // Responsive particle count based on screen size
    const isMobile = window.innerWidth < 768;
    const count = isMobile ? 75 : 150; // Fewer particles on mobile for better performance
    for (let i = 0; i < count; i++) particles.push(new Particle());
}

function animateParticles() {
    ctx.clearRect(0, 0, width, height);
    particles.forEach(p => {
        p.update();
        p.draw();
    });
    requestAnimationFrame(animateParticles);
}
