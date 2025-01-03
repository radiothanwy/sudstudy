// Language switching
const languageToggle = document.getElementById('languageToggle');
const body = document.body;

languageToggle.addEventListener('click', () => {
    body.classList.toggle('rtl');
    const isRTL = body.classList.contains('rtl');
    languageToggle.textContent = isRTL ? 'English' : 'عربي';
    
    document.querySelectorAll('[data-en][data-ar]').forEach(element => {
        element.textContent = isRTL ? element.dataset.ar : element.dataset.en;
    });

    document.documentElement.lang = isRTL ? 'ar' : 'en';
});
// Particle system
const canvas = document.getElementById('particle-canvas');
const ctx = canvas.getContext('2d');
let particles = [];

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 5 + 1;
        this.speedX = Math.random() * 3 - 1.5;
        this.speedY = Math.random() * 3 - 1.5;
        this.color = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.7)`;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.size > 0.2) this.size -= 0.1;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function createParticles(e) {
    const xPos = e.x;
    const yPos = e.y;
    for (let i = 0; i < 5; i++) {
        particles.push(new Particle(xPos, yPos));
    }
}

function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();

        if (particles[i].size <= 0.2) {
            particles.splice(i, 1);
            i--;
        }
    }
    requestAnimationFrame(animateParticles);
}

window.addEventListener('resize', resizeCanvas);
window.addEventListener('mousemove', createParticles);

resizeCanvas();
animateParticles();

// SVG Morph Animation
gsap.registerPlugin(MotionPathPlugin);

const morphSVG = document.getElementById('morph-path');
const morphShapes = [
    "M300,300 L300,300 L300,300 L300,300 Z",
    "M100,100 L500,100 L500,500 L100,500 Z",
    "M300,100 C400,100 500,100 500,500 C400,500 300,500 300,300 C300,100 200,100 100,100 Z",
    "M150,150 Q300,50 450,150 T150,450 Z",
    "M300,100 L500,300 L300,500 L100,300 Z"
];

let currentShapeIndex = 0;

function morphToNextShape() {
    currentShapeIndex = (currentShapeIndex + 1) % morphShapes.length;
    gsap.to(morphSVG, {
        duration: 2,
        attr: { d: morphShapes[currentShapeIndex] },
        ease: "power2.inOut",
        onComplete: morphToNextShape
    });
}

morphToNextShape();

// Hero content animation
gsap.from('.hero-content', {
    opacity: 0,
    y: 50,
    duration: 1.5,
    ease: "power3.out",
    delay: 0.5
});

// Scroll animations
gsap.registerPlugin(ScrollTrigger);

gsap.utils.toArray('.feature').forEach(feature => {
    gsap.from(feature, {
        opacity: 0,
        y: 50,
        duration: 1,
        scrollTrigger: {
            trigger: feature,
            start: "top 80%",
            end: "bottom 20%",
            toggleActions: "play none none reverse"
        }
    });
});

gsap.from('.cta', {
    opacity: 0,
    y: 100,
    duration: 1.5,
    scrollTrigger: {
        trigger: '.cta',
        start: "top 80%",
        end: "bottom 20%",
        toggleActions: "play none none reverse"
    }
});

// Responsive design
function handleResize() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
    resizeCanvas();
}

window.addEventListener('resize', handleResize);
handleResize();


