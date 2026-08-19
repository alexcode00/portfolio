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
    if (event.key === 'Escape' && navigation.classList.contains('is-open')) {
        closeMenu();
        menuButton.focus();
    }
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

            const projectPreview = slide.querySelector('[data-project-preview]');
            if (projectPreview) {
                projectPreview.dispatchEvent(new Event('project-preview-reset'));
                projectPreview.scrollTop = 0;
                projectPreview.closest('.project-preview')?.style.setProperty('--preview-progress-offset', '0%');
            }
        });

        dots.forEach((dot, dotIndex) => {
            const isActive = dotIndex === activeIndex;
            dot.classList.toggle('is-active', isActive);
            dot.setAttribute('aria-pressed', String(isActive));
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

const desktopPreviewQuery = window.matchMedia('(hover: hover) and (pointer: fine)');

if (desktopPreviewQuery.matches) {
    document.querySelectorAll('[data-project-preview]').forEach((viewport) => {
        const preview = viewport.closest('.project-preview');
        let animationFrame = 0;
        let isAutoScrolling = false;
        let animationStartedAt = 0;
        let animationStartScroll = 0;
        let animationDistance = 0;
        const autoScrollDuration = 2000;

        const updateProgress = () => {
            const scrollRange = viewport.scrollHeight - viewport.clientHeight;
            const progress = scrollRange > 0 ? viewport.scrollTop / scrollRange : 0;
            preview.style.setProperty('--preview-progress-offset', `${progress * 75}%`);

            if (!isAutoScrolling && viewport.scrollTop > 2) {
                viewport.dataset.interacted = 'true';
            }
        };

        const stopAutoScroll = () => {
            if (animationFrame) window.cancelAnimationFrame(animationFrame);
            animationFrame = 0;
            isAutoScrolling = false;
        };

        const animateAutoScroll = (timestamp) => {
            if (!isAutoScrolling) return;
            if (!animationStartedAt) animationStartedAt = timestamp;

            const elapsed = Math.min((timestamp - animationStartedAt) / autoScrollDuration, 1);
            const easedProgress = 0.5 - Math.cos(Math.PI * elapsed) / 2;
            viewport.scrollTop = animationStartScroll + animationDistance * easedProgress;

            if (elapsed < 1) {
                animationFrame = window.requestAnimationFrame(animateAutoScroll);
            } else {
                animationFrame = 0;
                isAutoScrolling = false;
            }
        };

        const startAutoScroll = () => {
            if (
                reducedMotion ||
                viewport.dataset.autoHintShown === 'true' ||
                viewport.dataset.interacted === 'true' ||
                viewport.scrollTop > 2
            ) return;

            const scrollRange = viewport.scrollHeight - viewport.clientHeight;
            if (scrollRange <= 0) return;

            viewport.dataset.autoHintShown = 'true';
            animationStartScroll = viewport.scrollTop;
            animationDistance = Math.min(150, scrollRange - animationStartScroll);
            if (animationDistance <= 0) return;

            animationStartedAt = 0;
            isAutoScrolling = true;
            animationFrame = window.requestAnimationFrame(animateAutoScroll);
        };

        const takeManualControl = () => {
            stopAutoScroll();
            viewport.dataset.interacted = 'true';
        };

        viewport.addEventListener('pointerenter', startAutoScroll);
        viewport.addEventListener('wheel', takeManualControl, { passive: true });
        viewport.addEventListener('pointerdown', takeManualControl);
        viewport.addEventListener('click', takeManualControl);
        viewport.addEventListener('dragstart', takeManualControl);

        viewport.addEventListener('pointerleave', () => {
            stopAutoScroll();
        });

        viewport.addEventListener('project-preview-reset', stopAutoScroll);
        viewport.addEventListener('scroll', updateProgress, { passive: true });
        updateProgress();
    });
}

const contactSection = document.querySelector('.contact');
const cursorMotionQuery = window.matchMedia('(hover: hover) and (pointer: fine)');

if (contactSection && cursorMotionQuery.matches && !reducedMotion) {
    const ornament = contactSection.querySelector('.contact__ornament');
    const primaryContactButton = contactSection.querySelector('.button--light');

    const createSmoothTransform = (element, smoothing = 0.14) => {
        let currentX = 0;
        let currentY = 0;
        let targetX = 0;
        let targetY = 0;
        let animationFrame = 0;

        const animate = () => {
            currentX += (targetX - currentX) * smoothing;
            currentY += (targetY - currentY) * smoothing;
            element.style.transform = `translate3d(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px, 0)`;

            if (Math.abs(targetX - currentX) > 0.05 || Math.abs(targetY - currentY) > 0.05) {
                animationFrame = window.requestAnimationFrame(animate);
            } else {
                currentX = targetX;
                currentY = targetY;
                element.style.transform = `translate3d(${targetX}px, ${targetY}px, 0)`;
                animationFrame = 0;
            }
        };

        return (x, y) => {
            targetX = x;
            targetY = y;
            if (!animationFrame) animationFrame = window.requestAnimationFrame(animate);
        };
    };

    if (ornament) {
        const moveOrnament = createSmoothTransform(ornament, 0.1);

        contactSection.addEventListener('pointermove', (event) => {
            const bounds = contactSection.getBoundingClientRect();
            const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
            const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
            moveOrnament(-x * 11, -y * 11);
        }, { passive: true });

        contactSection.addEventListener('pointerleave', () => moveOrnament(0, 0));
    }

    if (primaryContactButton) {
        const movePrimaryButton = createSmoothTransform(primaryContactButton, 0.18);

        primaryContactButton.addEventListener('pointermove', (event) => {
            const bounds = primaryContactButton.getBoundingClientRect();
            const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
            const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
            movePrimaryButton(x * 4, y * 4);
        }, { passive: true });

        primaryContactButton.addEventListener('pointerleave', () => movePrimaryButton(0, 0));
    }
}

document.getElementById('year').textContent = new Date().getFullYear();
