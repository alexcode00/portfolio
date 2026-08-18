document.documentElement.classList.add('js');

const menuButton = document.querySelector('.menu-button');
const navigation = document.querySelector('.nav');
const navigationLinks = document.querySelectorAll('.nav a');
const header = document.querySelector('.header');

function updateHeaderState() {
    header.classList.toggle('is-scrolled', window.scrollY > 24);
}

updateHeaderState();
window.addEventListener('scroll', updateHeaderState, { passive: true });

function closeMenu() {
    menuButton.setAttribute('aria-expanded', 'false');
    navigation.classList.remove('is-open');
}

menuButton.addEventListener('click', () => {
    const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!isOpen));
    navigation.classList.toggle('is-open', !isOpen);
});

navigationLinks.forEach((link) => link.addEventListener('click', closeMenu));

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
});

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const revealElements = document.querySelectorAll('.reveal');

if ('IntersectionObserver' in window && !reducedMotion) {
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });

    revealElements.forEach((element, index) => {
        element.style.transitionDelay = `${Math.min(index % 4, 3) * 70}ms`;
        revealObserver.observe(element);
    });
} else {
    revealElements.forEach((element) => element.classList.add('is-visible'));
}

const codeElement = document.querySelector('.hero__code-text');

if (codeElement) {
    const sourceCode = codeElement.textContent.trim();
    const escapeCode = (value) => value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;');

    const highlightCode = (value) => {
        const tokenPattern = /("(?:\\.|[^"\\])*"|\b(?:from|import|async|def|return)\b|\b(?:FastAPI|project)\b)/g;
        let highlighted = '';
        let lastIndex = 0;

        for (const match of value.matchAll(tokenPattern)) {
            highlighted += escapeCode(value.slice(lastIndex, match.index));
            const token = match[0];
            const className = token.startsWith('"')
                ? 'code-string'
                : /^(from|import|async|def|return)$/.test(token)
                    ? 'code-keyword'
                    : 'code-name';
            highlighted += `<span class="${className}">${escapeCode(token)}</span>`;
            lastIndex = match.index + token.length;
        }

        return highlighted + escapeCode(value.slice(lastIndex));
    };

    if (reducedMotion) {
        codeElement.innerHTML = highlightCode(sourceCode);
    } else {
        let characterIndex = 0;
        codeElement.textContent = '';

        const typeCharacter = () => {
            codeElement.innerHTML = highlightCode(sourceCode.slice(0, characterIndex));
            characterIndex += 1;
            if (characterIndex <= sourceCode.length) window.setTimeout(typeCharacter, 28);
        };

        window.setTimeout(typeCharacter, 650);
    }
}

const slider = document.querySelector('.projects-slider');

if (slider) {
    const viewport = slider.querySelector('.projects-slider__viewport');
    const track = slider.querySelector('.projects-slider__track');
    const slides = [...slider.querySelectorAll('.project-slide')];
    const previousButton = slider.querySelector('.slider-arrow--prev');
    const nextButton = slider.querySelector('.slider-arrow--next');
    const dotsContainer = slider.querySelector('.projects-slider__dots');
    const counter = slider.querySelector('.projects-slider__counter');
    let activeIndex = 0;
    let touchStartX = 0;

    viewport.tabIndex = 0;
    viewport.setAttribute('aria-label', 'Кейсы. Используйте стрелки влево и вправо для перелистывания');

    const dots = slides.map((slide, index) => {
        const dot = document.createElement('button');
        dot.className = 'slider-dot';
        dot.type = 'button';
        dot.setAttribute('aria-label', `Показать проект ${index + 1}`);
        dot.addEventListener('click', () => showSlide(index));
        dotsContainer.append(dot);
        return dot;
    });

    function showSlide(index) {
        activeIndex = (index + slides.length) % slides.length;
        track.style.transform = `translateX(-${activeIndex * 100}%)`;

        slides.forEach((slide, slideIndex) => {
            const isActive = slideIndex === activeIndex;
            slide.setAttribute('aria-hidden', String(!isActive));
            slide.querySelector('a').tabIndex = isActive ? 0 : -1;
        });

        dots.forEach((dot, dotIndex) => {
            const isActive = dotIndex === activeIndex;
            dot.classList.toggle('is-active', isActive);
            dot.setAttribute('aria-current', isActive ? 'true' : 'false');
        });

        counter.innerHTML = `<span>${String(activeIndex + 1).padStart(2, '0')}</span> / ${String(slides.length).padStart(2, '0')}`;
    }

    previousButton.addEventListener('click', () => showSlide(activeIndex - 1));
    nextButton.addEventListener('click', () => showSlide(activeIndex + 1));

    viewport.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowLeft') showSlide(activeIndex - 1);
        if (event.key === 'ArrowRight') showSlide(activeIndex + 1);
    });

    viewport.addEventListener('touchstart', (event) => {
        touchStartX = event.changedTouches[0].clientX;
    }, { passive: true });

    viewport.addEventListener('touchend', (event) => {
        const distance = event.changedTouches[0].clientX - touchStartX;
        if (Math.abs(distance) < 50) return;
        showSlide(activeIndex + (distance < 0 ? 1 : -1));
    }, { passive: true });

    if (slides.length < 2) {
        previousButton.disabled = true;
        nextButton.disabled = true;
    }

    showSlide(0);
}

document.getElementById('year').textContent = new Date().getFullYear();
