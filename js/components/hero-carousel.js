/**
 * Hero Carousel Component - Auto-rotating, keyboard/gamepad accessible
 */

import { createEl, $, $$, onReady, prefersReducedMotion } from '../utils/dom.js';
import { navigate } from '../router.js';

const carousels = new Map();

export function init(container, options = {}) {
  const {
    slides = [],
    autoRotate = true,
    interval = 5000,
    pauseOnHover = true,
    showIndicators = true,
    showArrows = true,
    onSlideChange = null,
  } = options;

  const carousel = createCarousel(slides, options);
  container.appendChild(carousel);

  const instance = {
    element: carousel,
    currentIndex: 0,
    intervalId: null,
    isPaused: false,
    options,
  };

  carousels.set(container, instance);

  if (autoRotate && !prefersReducedMotion()) {
    startAutoRotate(instance);
  }

  bindEvents(instance);
  setupKeyboardNav(instance);

  return instance;
}

function createCarousel(slides, options) {
  const carousel = createEl('div', { class: 'hero-carousel', role: 'region', 'aria-label': 'Destaques' });

  // Slides container
  const slidesContainer = createEl('div', { class: 'hero-carousel__slides' });

  slides.forEach((slide, index) => {
    const slideEl = createSlide(slide, index === 0);
    slidesContainer.appendChild(slideEl);
  });

  carousel.appendChild(slidesContainer);

  // Indicators
  if (options.showIndicators && slides.length > 1) {
    const indicators = createEl('div', { class: 'hero-carousel__indicators', role: 'tablist', 'aria-label': 'Slides' });
    slides.forEach((_, index) => {
      const btn = createEl('button', {
        class: `hero-carousel__indicator ${index === 0 ? 'hero-carousel__indicator--active' : ''}`,
        role: 'tab',
        'aria-selected': index === 0,
        'aria-label': `Ir para slide ${index + 1}`,
        onclick: () => goToSlide(carousel, index),
      });
      indicators.appendChild(btn);
    });
    carousel.appendChild(indicators);
  }

  // Navigation arrows
  if (options.showArrows && slides.length > 1) {
    const prevBtn = createEl('button', {
      class: 'hero-carousel__btn hero-carousel__btn--prev',
      'aria-label': 'Slide anterior',
      onclick: () => prevSlide(carousel),
    }, createEl('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', width: '24', height: '24', 'aria-hidden': 'true' }, [
      createEl('polyline', { points: '15 18 9 12 15 6' }),
    ]));

    const nextBtn = createEl('button', {
      class: 'hero-carousel__btn hero-carousel__btn--next',
      'aria-label': 'Próximo slide',
      onclick: () => nextSlide(carousel),
    }, createEl('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', width: '24', height: '24', 'aria-hidden': 'true' }, [
      createEl('polyline', { points: '9 18 15 12 9 6' }),
    ]));

    carousel.append(prevBtn, nextBtn);
  }

  return carousel;
}

function createSlide(slide, isActive) {
  const classes = ['hero-carousel__slide'];
  if (isActive) classes.push('hero-carousel__slide--active');

  return createEl('div', { class: classes.join(' '), role: 'tabpanel', 'aria-hidden': !isActive }, [
    createEl('img', {
      class: 'hero-carousel__image',
      src: slide.image,
      alt: slide.alt || '',
      loading: isActive ? 'eager' : 'lazy',
      width: 1920,
      height: 1080,
    }),
    createEl('div', { class: 'hero-carousel__overlay' }),
    createEl('div', { class: 'hero-carousel__content' }, [
      slide.badge && createEl('span', { class: 'hero-carousel__badge badge badge--featured' }, slide.badge),
      slide.title && createEl('h2', { class: 'hero-carousel__title' }, slide.title),
      slide.description && createEl('p', { class: 'hero-carousel__description' }, slide.description),
      slide.actions && createEl('div', { class: 'hero-carousel__actions' }, slide.actions.map(action =>
        createEl('button', {
          class: `btn btn--${action.variant || 'primary'} btn--lg`,
          onclick: action.onClick || (() => action.href ? navigate(action.href) : {}),
        }, action.label)
      )),
    ]),
  ]);
}

function bindEvents(instance) {
  const { element, options } = instance;

  // Pause on hover
  if (options.pauseOnHover) {
    element.addEventListener('mouseenter', () => pause(instance));
    element.addEventListener('mouseleave', () => resume(instance));
  }

  // Touch swipe
  let touchStartX = 0;
  let touchEndX = 0;

  element.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  element.addEventListener('touchend', e => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe(instance, touchStartX, touchEndX);
  }, { passive: true });

  // Focus pause
  element.addEventListener('focusin', () => pause(instance));
  element.addEventListener('focusout', () => resume(instance));
}

function handleSwipe(instance, startX, endX) {
  const diff = startX - endX;
  if (Math.abs(diff) > 50) {
    if (diff > 0) nextSlide(instance.element);
    else prevSlide(instance.element);
  }
}

function setupKeyboardNav(instance) {
  const { element } = instance;

  element.addEventListener('keydown', e => {
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        nextSlide(element);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        prevSlide(element);
        break;
      case 'Home':
        e.preventDefault();
        goToSlide(element, 0);
        break;
      case 'End':
        e.preventDefault();
        const slides = element.querySelectorAll('.hero-carousel__slide');
        goToSlide(element, slides.length - 1);
        break;
    }
  });
}

function goToSlide(carousel, index) {
  const instance = carousels.get(carousel.parentElement) || carousels.get(carousel);
  if (!instance) return;

  const slides = carousel.querySelectorAll('.hero-carousel__slide');
  const indicators = carousel.querySelectorAll('.hero-carousel__indicator');

  if (index < 0 || index >= slides.length) return;

  // Deactivate current
  slides[instance.currentIndex].classList.remove('hero-carousel__slide--active');
  slides[instance.currentIndex].setAttribute('aria-hidden', 'true');
  indicators[instance.currentIndex]?.classList.remove('hero-carousel__indicator--active');
  indicators[instance.currentIndex]?.setAttribute('aria-selected', 'false');

  // Activate new
  slides[index].classList.add('hero-carousel__slide--active');
  slides[index].setAttribute('aria-hidden', 'false');
  indicators[index]?.classList.add('hero-carousel__indicator--active');
  indicators[index]?.setAttribute('aria-selected', 'true');

  instance.currentIndex = index;
  instance.options.onSlideChange?.(index, slides[index]);
}

function nextSlide(carousel) {
  const instance = carousels.get(carousel.parentElement) || carousels.get(carousel);
  if (!instance) return;

  const slides = carousel.querySelectorAll('.hero-carousel__slide');
  const nextIndex = (instance.currentIndex + 1) % slides.length;
  goToSlide(carousel, nextIndex);
}

function prevSlide(carousel) {
  const instance = carousels.get(carousel.parentElement) || carousels.get(carousel);
  if (!instance) return;

  const slides = carousel.querySelectorAll('.hero-carousel__slide');
  const prevIndex = (instance.currentIndex - 1 + slides.length) % slides.length;
  goToSlide(carousel, prevIndex);
}

function pause(instance) {
  instance.isPaused = true;
  stopAutoRotate(instance);
}

function resume(instance) {
  instance.isPaused = false;
  if (instance.options.autoRotate && !prefersReducedMotion()) {
    startAutoRotate(instance);
  }
}

function startAutoRotate(instance) {
  stopAutoRotate(instance);
  instance.intervalId = setInterval(() => {
    if (!instance.isPaused && document.visibilityState === 'visible') {
      nextSlide(instance.element);
    }
  }, instance.options.interval);
}

function stopAutoRotate(instance) {
  if (instance.intervalId) {
    clearInterval(instance.intervalId);
    instance.intervalId = null;
  }
}

export function destroy(container) {
  const instance = carousels.get(container);
  if (instance) {
    stopAutoRotate(instance);
    carousels.delete(container);
  }
}

export function getInstance(container) {
  return carousels.get(container);
}

export default { init, destroy, getInstance, nextSlide, prevSlide, goToSlide, pause, resume };