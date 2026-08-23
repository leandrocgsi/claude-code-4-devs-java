// ===== Theme Toggle =====
const themeToggle = document.getElementById('themeToggle');
const htmlElement = document.documentElement;

// Restore theme preference from localStorage
function restoreTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggle.textContent = '🌙';
    } else {
        document.body.classList.remove('dark-mode');
        themeToggle.textContent = '☀️';
    }
}

// Toggle theme
themeToggle.addEventListener('click', () => {
    const isDarkMode = document.body.classList.toggle('dark-mode');
    const newTheme = isDarkMode ? 'dark' : 'light';

    // Update button icon
    themeToggle.textContent = isDarkMode ? '🌙' : '☀️';

    // Save preference
    localStorage.setItem('theme', newTheme);
});

// Restore theme on page load
restoreTheme();

// ===== Back to Top =====
const backToTopButton = document.getElementById('backToTop');
const SCROLL_THRESHOLD = 400;

function toggleBackToTopVisibility() {
    backToTopButton.classList.toggle('visible', window.scrollY > SCROLL_THRESHOLD);
}

window.addEventListener('scroll', toggleBackToTopVisibility);
toggleBackToTopVisibility(); // estado inicial correto se a página carregar já rolada

backToTopButton.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ===== Smooth Navigation =====
document.querySelectorAll('nav a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// ===== Section Animation =====
const sections = document.querySelectorAll('section');
const observerOptions = {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

sections.forEach(section => {
    section.style.opacity = '0';
    section.style.transform = 'translateY(20px)';
    section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(section);
});
