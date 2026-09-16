/**
 * portfolio.js
 * Glow Creative Co. — Portfolio Page Interactions
 *
 * Handles:
 * 1. Dual-World Mode Switcher (Commercial / Weddings) with event delegation
 * 2. Adaptive Background Luminance Contrast Detection
 * 3. Smooth Navigation & Scroll Restoration
 * 4. Pinned Scroll Scenes: Hero Zoom, Horizontal Gallery (Darkroom Develop), Print Stack
 * 5. Lifecycle Management (initPortfolioPage / destroyPortfolioPage)
 */

import { updateScrollbar } from './scrollbar.js';

let cleanupPortfolio = null;
let scrollFrame = 0;

export function destroyPortfolioPage() {
  if (typeof cleanupPortfolio === 'function') {
    cleanupPortfolio();
    cleanupPortfolio = null;
  }
}

// Global mode switching accessible across pages and transitions
export function setMode(mode) {
  const body = document.body;
  if (body.getAttribute('data-mode') === mode) return;

  body.setAttribute('data-mode', mode);
  document.documentElement.setAttribute('data-mode', mode);

  // Update all toggle buttons currently in DOM
  document.querySelectorAll('.toggle-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.target === mode);
  });

  updateNavbarContrast();
  updateScrollbar();

  // Redraw scroll scenes for newly active mode
  if (typeof triggerScrollRender === 'function') {
    triggerScrollRender();
  }
}

// Global click delegation for mode buttons (resilient to DOM replacement)
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.toggle-btn');
  if (btn && btn.dataset.target) {
    setMode(btn.dataset.target);
  }
});

// Smooth scroll to top when clicking Portfolio while already on home page
document.addEventListener('click', (e) => {
  const link = e.target.closest('#nav-portfolio');
  if (link && !document.body.classList.contains('subpage')) {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
});

// Adaptive luminance cache and sampler
const luminanceCache = new Map();

export function updateNavbarContrast() {
  const body = document.body;
  const siteHeader = document.getElementById('site-header');
  const navGroupLeft = document.getElementById('nav-group-left');
  const navGroupRight = document.getElementById('nav-group-right');
  const photoCommercial = document.querySelector('.photo-commercial');
  const photoWeddings = document.querySelector('.photo-weddings');

  const mode = body.getAttribute('data-mode') || 'commercial';
  const activeImg = mode === 'weddings' ? photoWeddings : photoCommercial;

  // Defaults while image loads
  if (mode === 'commercial') {
    if (siteHeader) siteHeader.setAttribute('data-nav-tone', 'dark');
    if (navGroupLeft) navGroupLeft.setAttribute('data-tone', 'dark');
    if (navGroupRight) navGroupRight.setAttribute('data-tone', 'dark');
  } else {
    if (siteHeader) siteHeader.setAttribute('data-nav-tone', 'light');
    if (navGroupLeft) navGroupLeft.setAttribute('data-tone', 'light');
    if (navGroupRight) navGroupRight.setAttribute('data-tone', 'light');
  }

  if (!activeImg) return;

  if (!activeImg.complete || activeImg.naturalWidth === 0) {
    activeImg.addEventListener('load', updateNavbarContrast, { once: true });
    return;
  }

  const cacheKey = activeImg.currentSrc || activeImg.src;
  let lumData = luminanceCache.get(cacheKey);

  if (!lumData) {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        const sampleW = 60;
        const sampleH = 16;
        canvas.width = sampleW;
        canvas.height = sampleH;

        ctx.drawImage(
          activeImg,
          0, 0, activeImg.naturalWidth, Math.max(1, Math.floor(activeImg.naturalHeight * 0.15)),
          0, 0, sampleW, sampleH
        );

        const imgData = ctx.getImageData(0, 0, sampleW, sampleH).data;
        let leftLumSum = 0, leftCount = 0;
        let rightLumSum = 0, rightCount = 0;
        let totalLumSum = 0, totalCount = 0;

        for (let y = 0; y < sampleH; y++) {
          for (let x = 0; x < sampleW; x++) {
            const idx = (y * sampleW + x) * 4;
            const r = imgData[idx];
            const g = imgData[idx + 1];
            const b = imgData[idx + 2];
            const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;

            totalLumSum += lum;
            totalCount++;

            if (x < sampleW * 0.35) {
              leftLumSum += lum;
              leftCount++;
            } else if (x > sampleW * 0.55) {
              rightLumSum += lum;
              rightCount++;
            }
          }
        }

        const avgLum = totalLumSum / (totalCount || 1);
        const leftAvg = leftCount > 0 ? leftLumSum / leftCount : avgLum;
        const rightAvg = rightCount > 0 ? rightLumSum / rightCount : avgLum;

        lumData = {
          overall: avgLum < 140 ? 'light' : 'dark',
          left: leftAvg < 140 ? 'light' : 'dark',
          right: rightAvg < 140 ? 'light' : 'dark',
        };

        luminanceCache.set(cacheKey, lumData);
      }
    } catch (e) {
      // Fallback to defaults on CORS / canvas error
    }
  }

  if (lumData) {
    if (siteHeader) siteHeader.setAttribute('data-nav-tone', lumData.overall);
    if (navGroupLeft) navGroupLeft.setAttribute('data-tone', lumData.left);
    if (navGroupRight) navGroupRight.setAttribute('data-tone', lumData.right);
  }
}

let triggerScrollRender = null;

export function initPortfolioPage() {
  destroyPortfolioPage();

  const body = document.body;
  const siteHeader = document.getElementById('site-header');
  const zoomSection = document.querySelector('.frame-zoom-section');
  const zoomBox = document.querySelector('.zoom-frame-box');
  const horizontalSection = document.querySelector('.horizontal-scroll-section');
  const horizontalTrack = document.querySelector('.horizontal-track');
  const galleryFrames = Array.from(document.querySelectorAll('.image-box'));
  const stackSection = document.querySelector('.stack-section');
  const stackCard = document.querySelector('.stack-card');
  const stackPile = document.querySelector('.stack-prints');
  const stackPrints = Array.from(document.querySelectorAll('.stack-print'));
  const stackTexts = Array.from(document.querySelectorAll('.stack-text'));
  const stackCounter = document.querySelector('.stack-counter-current');
  const motionStill = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Skeleton loading tags
  document.querySelectorAll('.hero-photo, .image-box-media img, .stack-print img').forEach((img) => {
    if (img.complete && img.naturalWidth > 0) {
      img.classList.add('is-loaded');
    } else {
      img.addEventListener('load', () => {
        img.classList.add('is-loaded');
        onScroll();
      }, { once: true });
    }
  });

  const DEVELOP_HOLD = 0.25;
  const DEVELOP_FADE = 0.9;
  const STACK_HOLD = 1;
  const STACK_LIFT = 1;
  const PILE_TILT = [-3, 2.5, -1.5, 3, -2, 1.5];
  const PILE_NUDGE = [[-6, 8], [7, 5], [-4, 10], [6, 7], [-7, 6], [4, 9]];
  const PILE_SCALE = 0.96;
  const LIFT_SWING = 40;
  const LIFT_TILT = -8;

  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
  const easeInCubic = (t) => t * t * t;
  const smoothstep = (t) => t * t * (3 - 2 * t);
  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

  function buildStackSteps(count) {
    if (count <= 0) return [];
    const steps = [];
    for (let i = 0; i < count; i++) {
      steps.push({ print: i, kind: 'hold', share: STACK_HOLD });
      if (i < count - 1) steps.push({ print: i, kind: 'lift', share: STACK_LIFT });
    }
    const total = steps.reduce((sum, s) => sum + s.share, 0);
    let at = 0;
    for (const step of steps) {
      step.start = at / total;
      at += step.share;
      step.end = at / total;
    }
    return steps;
  }

  const stackSteps = buildStackSteps(stackPrints.length);

  function printPose(k, top, lift) {
    if (k < top) {
      return `translate3d(${LIFT_SWING}px, ${(-scene.stackExit).toFixed(1)}px, 0) rotate(${LIFT_TILT}deg) scale(1.04)`;
    }
    if (k === top) {
      const swing = easeOutCubic(lift);
      const away = easeInCubic(lift);
      return `translate3d(${(LIFT_SWING * swing).toFixed(1)}px, ${(-scene.stackExit * away).toFixed(1)}px, 0) rotate(${(LIFT_TILT * swing).toFixed(2)}deg) scale(${(1 + 0.04 * swing).toFixed(3)})`;
    }
    const settle = k === top + 1 ? easeOutCubic(lift) : 0;
    const keep = 1 - settle;
    const tilt = PILE_TILT[k % PILE_TILT.length];
    const [nx, ny] = PILE_NUDGE[k % PILE_NUDGE.length];
    return `translate3d(${(nx * keep).toFixed(1)}px, ${(ny * keep).toFixed(1)}px, 0) rotate(${(tilt * keep).toFixed(2)}deg) scale(${(PILE_SCALE + (1 - PILE_SCALE) * settle).toFixed(3)})`;
  }

  const scene = {
    zoomTop: 0, zoomRange: 1,
    galleryTop: 0, galleryRange: 1, galleryTravel: 0, frames: [],
    stackTop: 0, stackRange: 1, stackExit: 0,
    stackPoses: [], stackShowing: -1, stackCopy: '',
    viewportWidth: window.innerWidth,
  };

  function measureScrollScenes() {
    const scrollY = window.scrollY;
    const viewportHeight = window.innerHeight;
    scene.viewportWidth = window.innerWidth;

    if (zoomSection) {
      scene.zoomTop = zoomSection.getBoundingClientRect().top + scrollY;
      scene.zoomRange = Math.max(1, zoomSection.offsetHeight - viewportHeight);
    }

    if (horizontalSection && horizontalTrack) {
      scene.galleryTop = horizontalSection.getBoundingClientRect().top + scrollY;
      scene.galleryRange = Math.max(1, horizontalSection.offsetHeight - viewportHeight);
      scene.galleryTravel = Math.max(0, horizontalTrack.scrollWidth - scene.viewportWidth);
    }

    scene.frames = galleryFrames.map((box) => ({
      box,
      center: box.offsetLeft + box.offsetWidth / 2,
      width: box.offsetWidth,
      develop: '',
    }));

    if (stackSection && stackPile) {
      scene.stackTop = stackSection.getBoundingClientRect().top + scrollY;
      scene.stackRange = Math.max(1, stackSection.offsetHeight - viewportHeight);
      scene.stackExit = viewportHeight + stackPile.offsetHeight / 2 + 40;
      scene.stackPoses = [];
    }
  }

  function renderScrollScenes() {
    scrollFrame = 0;
    const scrollY = window.scrollY;

    // 1. Frame Zoom
    if (zoomBox) {
      const progress = clamp01((scrollY - scene.zoomTop) / scene.zoomRange);
      zoomBox.style.transform = `scale(${0.45 + progress * 0.55})`;
    }

    // 2. Horizontal Gallery
    if (horizontalTrack) {
      const progress = clamp01((scrollY - scene.galleryTop) / scene.galleryRange);
      const shift = progress * scene.galleryTravel;
      horizontalTrack.style.transform = `translate3d(${(-shift).toFixed(2)}px, 0, 0)`;

      const half = scene.viewportWidth / 2;
      const still = motionStill.matches;
      for (const frame of scene.frames) {
        const fromCentre = Math.abs(frame.center - shift - half);
        const t = 1 - clamp01((fromCentre - frame.width * DEVELOP_HOLD) / (frame.width * DEVELOP_FADE));
        const develop = (still ? 1 : smoothstep(t)).toFixed(3);
        if (develop !== frame.develop) {
          frame.develop = develop;
          frame.box.style.setProperty('--develop', develop);
        }
      }
    }

    // 3. Print Stack
    if (stackCard && stackSteps.length && stackPrints.length) {
      const progress = clamp01((scrollY - scene.stackTop) / scene.stackRange);
      const step = stackSteps.find((s) => progress <= s.end) || stackSteps[stackSteps.length - 1];
      const still = motionStill.matches;
      let lift = step.kind === 'lift' ? clamp01((progress - step.start) / (step.end - step.start)) : 0;
      if (still) lift = lift < 0.5 ? 0 : 1;

      stackPrints.forEach((print, k) => {
        const pose = printPose(k, step.print, lift);
        if (pose !== scene.stackPoses[k]) {
          scene.stackPoses[k] = pose;
          print.style.transform = pose;
          print.style.visibility = k < step.print ? 'hidden' : '';
        }
      });

      const showing = Math.min(
        stackPrints.length - 1,
        Math.max(0, step.kind === 'lift' && lift >= 0.5 ? step.print + 1 : step.print)
      );

      let copy = 1;
      if (step.kind === 'lift' && !still) {
        copy = lift < 0.5 ? 1 - smoothstep(clamp01(lift / 0.45)) : smoothstep(clamp01((lift - 0.55) / 0.45));
      }

      if (showing !== scene.stackShowing) {
        scene.stackShowing = showing;
        stackTexts.forEach((el, i) => el.classList.toggle('is-current', i === showing));
        stackPrints.forEach((el, i) => el.classList.toggle('is-top', i === showing));
        if (stackCounter) stackCounter.textContent = String(showing + 1).padStart(2, '0');
      }

      const copyKey = copy.toFixed(3);
      if (copyKey !== scene.stackCopy) {
        scene.stackCopy = copyKey;
        stackCard.style.setProperty('--copy', copyKey);
      }

      const mode = body.getAttribute('data-mode') === 'weddings' ? 'weddings' : 'commercial';
      const photo = stackPrints[showing]?.querySelector(`.mode-photo-${mode}`);
      stackCard.classList.toggle('is-loading', !!photo && !photo.classList.contains('is-loaded'));
    }

    if (siteHeader) {
      siteHeader.classList.toggle('scrolled', scrollY > 20);
    }
  }

  function onScroll() {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(renderScrollScenes);
  }

  function onResize() {
    measureScrollScenes();
    renderScrollScenes();
    updateNavbarContrast();
  }

  triggerScrollRender = onScroll;

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize);

  // Photo prefetch on tab hover/touch
  const prefetchedModes = new Set();
  function prefetchMode(mode) {
    if (prefetchedModes.has(mode)) return;
    prefetchedModes.add(mode);
    document.querySelectorAll(`.image-box-media .mode-photo-${mode}, .stack-print .mode-photo-${mode}`)
      .forEach((img) => { img.loading = 'eager'; });
  }

  const intentHandlers = [];
  document.querySelectorAll('.toggle-btn').forEach((btn) => {
    const intent = () => {
      if (btn.dataset.target !== body.getAttribute('data-mode')) prefetchMode(btn.dataset.target);
    };
    btn.addEventListener('pointerenter', intent);
    btn.addEventListener('focus', intent);
    btn.addEventListener('touchstart', intent, { passive: true });
    intentHandlers.push({ btn, intent });
  });

  measureScrollScenes();
  renderScrollScenes();
  updateNavbarContrast();
  updateScrollbar();

  cleanupPortfolio = () => {
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onResize);
    if (scrollFrame) {
      cancelAnimationFrame(scrollFrame);
      scrollFrame = 0;
    }
    intentHandlers.forEach(({ btn, intent }) => {
      btn.removeEventListener('pointerenter', intent);
      btn.removeEventListener('focus', intent);
      btn.removeEventListener('touchstart', intent);
    });
    triggerScrollRender = null;
  };
}

// Attach to window for backwards compatibility with any inline callers
window.initPortfolioPage = initPortfolioPage;
window.destroyPortfolioPage = destroyPortfolioPage;
window.setMode = setMode;
