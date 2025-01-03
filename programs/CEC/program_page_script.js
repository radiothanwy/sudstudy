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

// Modern and dynamic puzzle-piece animation
const puzzleContainer = document.getElementById('puzzle-container');
const puzzlePieces = [];
const numPieces = 20;
const colors = ['#6e8efb', '#a777e3', '#5d7ce0', '#9966cc'];

function createPuzzlePieces() {
    for (let i = 0; i < numPieces; i++) {
        const piece = document.createElement('div');
        piece.classList.add('puzzle-piece');
        piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        puzzleContainer.appendChild(piece);
        puzzlePieces.push(piece);
    }
}

function animatePuzzlePieces() {
    puzzlePieces.forEach((piece, index) => {
        const delay = index * 0.1;
        const duration = 2 + Math.random() * 2;

        gsap.set(piece, {
            x: Math.random() * window.innerWidth,
            y: -100,
            rotation: Math.random() * 360,
            scale: 0
        });

        gsap.to(piece, {
            duration: duration,
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            rotation: Math.random() * 360,
            scale: 0.5 + Math.random() * 0.5,
            ease: "power1.out",
            delay: delay,
            repeat: -1,
            yoyo: true,
            repeatRefresh: true
        });
    });
}

createPuzzlePieces();
animatePuzzlePieces();

// Mouse interaction
document.addEventListener('mousemove', (e) => {
    const { clientX, clientY } = e;
    puzzlePieces.forEach((piece) => {
        const dx = clientX - piece._gsap.x - piece.offsetWidth / 2;
        const dy = clientY - piece._gsap.y - piece.offsetHeight / 2;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = 200;

        if (distance < maxDistance) {
            gsap.to(piece, {
                duration: 0.5,
                x: piece._gsap.x + dx * 0.1,
                y: piece._gsap.y + dy * 0.1,
                ease: "power2.out"
            });
        }
    });
});

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
    
    puzzlePieces.forEach((piece) => {
        gsap.to(piece, {
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            duration: 1,
            ease: "power2.out"
        });
    });
}

window.addEventListener('resize', handleResize);
handleResize();



