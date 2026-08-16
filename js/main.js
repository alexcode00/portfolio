const menuButton = document.querySelector('.menu-button');
const navigation = document.querySelector('.nav');
const navigationLinks = document.querySelectorAll('.nav a');

function closeMenu() {
    menuButton.setAttribute('aria-expanded', 'false');
    navigation.classList.remove('is-open');
    document.body.classList.remove('menu-open');
}

menuButton.addEventListener('click', () => {
    const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!isOpen));
    navigation.classList.toggle('is-open', !isOpen);
    document.body.classList.toggle('menu-open', !isOpen);
});

navigationLinks.forEach((link) => link.addEventListener('click', closeMenu));

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
});

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach((element, index) => {
    element.style.transitionDelay = `${Math.min(index % 4, 3) * 70}ms`;
    revealObserver.observe(element);
});

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
