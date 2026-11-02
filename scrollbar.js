/**
 * scrollbar.js
 * Glow Creative Co. — Floating Overlay Scrollbar
 *
 * Provides a 100% transparent-track floating capsule scrollbar:
 * - Completely transparent track: underlying full-bleed imagery shines through
 * - Smooth architectural thumb styled with atmospheric theme variables
 * - Full mouse/pointer dragging and track-click jump support
 * - Automatic visibility management (hides on subpages and non-scrollable views)
 * - Zero layout shift across page transitions
 */

class FloatingScrollbar {
  constructor() {
    this.el = null;
    this.track = null;
    this.thumb = null;
    this.isDragging = false;
    this.startY = 0;
    this.startScrollTop = 0;
    this.rafId = 0;

    this.onScroll = this.onScroll.bind(this);
    this.onResize = this.onResize.bind(this);
    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);
    this.onTrackClick = this.onTrackClick.bind(this);
  }

  mount() {
    if (this.el) {
      this.update();
      return;
    }

    const existing = document.querySelector('.floating-scrollbar');
    if (existing) {
      this.el = existing;
      this.track = existing.querySelector('.floating-scrollbar-track');
      this.thumb = existing.querySelector('.floating-scrollbar-thumb');
    } else {
      this.el = document.createElement('div');
      this.el.className = 'floating-scrollbar';
      this.el.setAttribute('aria-hidden', 'true');

      this.track = document.createElement('div');
      this.track.className = 'floating-scrollbar-track';

      this.thumb = document.createElement('div');
      this.thumb.className = 'floating-scrollbar-thumb';

      this.track.appendChild(this.thumb);
      this.el.appendChild(this.track);
      document.body.appendChild(this.el);
    }

    this.thumb.addEventListener('pointerdown', this.onPointerDown);
    this.track.addEventListener('pointerdown', this.onTrackClick);

    window.addEventListener('scroll', this.onScroll, { passive: true });
    window.addEventListener('resize', this.onResize);

    this.update();
  }

  update() {
    if (!this.el || !this.thumb || !this.track) return;

    const doc = document.documentElement;
    const scrollHeight = doc.scrollHeight;
    const clientHeight = window.innerHeight;
    const maxScroll = scrollHeight - clientHeight;

    const isSubpage = document.body.classList.contains('subpage') ||
                      doc.classList.contains('subpage-active') ||
                      document.body.getAttribute('data-subpage') === 'true';

    if (maxScroll <= 5 || isSubpage) {
      this.el.classList.remove('is-active');
      return;
    }

    this.el.classList.add('is-active');

    const trackHeight = this.track.clientHeight;
    if (trackHeight <= 0) return;

    // Proportional thumb height with minimum and maximum bounds
    const rawThumbHeight = trackHeight * (clientHeight / scrollHeight);
    const thumbHeight = Math.max(36, Math.min(rawThumbHeight, trackHeight - 24));
    this.thumb.style.height = `${thumbHeight}px`;

    // Position thumb based on current scroll position
    const scrollY = window.scrollY || doc.scrollTop || 0;
    const scrollRatio = Math.max(0, Math.min(1, scrollY / maxScroll));
    const maxThumbTranslate = trackHeight - thumbHeight;
    const thumbY = scrollRatio * maxThumbTranslate;

    this.thumb.style.transform = `translate3d(0, ${thumbY}px, 0)`;
  }

  onScroll() {
    if (this.isDragging) return;
    if (!this.rafId) {
      this.rafId = requestAnimationFrame(() => {
        this.update();
        this.rafId = 0;
      });
    }
  }

  onResize() {
    this.update();
  }

  onPointerDown(e) {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    this.isDragging = true;
    this.startY = e.clientY;
    this.startScrollTop = window.scrollY || document.documentElement.scrollTop || 0;

    this.el.classList.add('is-dragging');
    document.documentElement.classList.add('scrollbar-dragging');

    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
    window.addEventListener('pointercancel', this.onPointerUp);
  }

  onPointerMove(e) {
    if (!this.isDragging) return;
    e.preventDefault();

    const doc = document.documentElement;
    const maxScroll = doc.scrollHeight - window.innerHeight;
    const trackHeight = this.track.clientHeight;
    const thumbHeight = this.thumb.offsetHeight;
    const maxThumbTranslate = trackHeight - thumbHeight;

    if (maxThumbTranslate <= 0) return;

    const deltaY = e.clientY - this.startY;
    const scrollDelta = (deltaY / maxThumbTranslate) * maxScroll;
    const targetScroll = Math.max(0, Math.min(maxScroll, this.startScrollTop + scrollDelta));

    window.scrollTo({ top: targetScroll, behavior: 'instant' });
    this.update();
  }

  onPointerUp(e) {
    if (!this.isDragging) return;
    this.isDragging = false;
    this.el.classList.remove('is-dragging');
    document.documentElement.classList.remove('scrollbar-dragging');

    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('pointercancel', this.onPointerUp);
  }

  onTrackClick(e) {
    if (e.target === this.thumb || this.isDragging) return;
    e.preventDefault();

    const trackRect = this.track.getBoundingClientRect();
    const clickY = e.clientY - trackRect.top;
    const trackHeight = trackRect.height;
    const thumbHeight = this.thumb.offsetHeight;

    const doc = document.documentElement;
    const maxScroll = doc.scrollHeight - window.innerHeight;

    const targetThumbY = clickY - (thumbHeight / 2);
    const maxThumbTranslate = trackHeight - thumbHeight;
    if (maxThumbTranslate <= 0) return;

    const targetRatio = Math.max(0, Math.min(1, targetThumbY / maxThumbTranslate));

    window.scrollTo({
      top: targetRatio * maxScroll,
      behavior: 'smooth'
    });
  }

  destroy() {
    window.removeEventListener('scroll', this.onScroll);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('pointercancel', this.onPointerUp);

    if (this.thumb) {
      this.thumb.removeEventListener('pointerdown', this.onPointerDown);
    }
    if (this.track) {
      this.track.removeEventListener('pointerdown', this.onTrackClick);
    }
    if (this.el && this.el.parentNode) {
      this.el.parentNode.removeChild(this.el);
    }
    this.el = null;
    this.track = null;
    this.thumb = null;
  }
}

export const scrollbarInstance = new FloatingScrollbar();

export function initScrollbar() {
  scrollbarInstance.mount();
  return scrollbarInstance;
}

export function updateScrollbar() {
  scrollbarInstance.update();
}

export function destroyScrollbar() {
  scrollbarInstance.destroy();
}
