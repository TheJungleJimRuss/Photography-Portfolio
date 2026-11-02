/**
 * transitions.js
 * 3-Station Rotational Wheel Page Transitions
 * Glow Creative Co. — Portfolio, About, Contact
 *
 * Mental Model:
 * Continuous wheel ordered cyclically: [About] <—> [Portfolio] <—> [Contact] <—> [About]
 * - From Portfolio: About slides from Left (-1), Contact slides from Right (+1)
 * - From About: Portfolio slides from Right (+1), Contact slides from Left (-1)
 * - From Contact: Portfolio slides from Left (-1), About slides from Right (+1)
 */

import { initPortfolioPage, destroyPortfolioPage } from './portfolio.js';
import { initScrollbar, updateScrollbar } from './scrollbar.js';

const WHEEL_ORDER = ['about', 'portfolio', 'contact'];

// Lookup table for exact wheel transition directions:
// 'left': incoming enters from Left (-100%), outgoing exits to Right (+100%)
// 'right': incoming enters from Right (+100%), outgoing exits to Left (-100%)
const WHEEL_DIRECTIONS = {
  'portfolio->about': 'left',
  'portfolio->contact': 'right',
  'about->portfolio': 'right',
  'about->contact': 'left',
  'contact->portfolio': 'left',
  'contact->about': 'right',
};

const PAGE_URLS = {
  portfolio: 'index.html',
  about: 'about.html',
  contact: 'contact.html',
};

const DURATION = 720;
const EASING = 'cubic-bezier(0.16, 1, 0.3, 1)'; // High-end editorial deceleration

class PageWheelRouter {
  constructor() {
    this.cache = new Map();
    this.isTransitioning = false;
    this.currentPage = this.detectPageFromPath(window.location.pathname);
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    this.init();
  }

  detectPageFromPath(path) {
    const clean = path.toLowerCase().split('/').pop() || 'index.html';
    if (clean.includes('about')) return 'about';
    if (clean.includes('contact')) return 'contact';
    return 'portfolio';
  }

  init() {
    // Intercept clicks
    document.addEventListener('click', this.handleLinkClick.bind(this));

    // Handle back / forward browser navigation
    window.addEventListener('popstate', (e) => {
      const targetPage = e.state?.page || this.detectPageFromPath(window.location.pathname);
      if (targetPage !== this.currentPage) {
        this.navigateTo(targetPage, false);
      }
    });

    // Suppress wheel and keyboard scroll during active transition without hiding the scrollbar
    const lockScrollEvents = (e) => {
      if (this.isTransitioning) {
        e.preventDefault();
      }
    };
    window.addEventListener('wheel', lockScrollEvents, { passive: false });
    window.addEventListener('touchmove', lockScrollEvents, { passive: false });
    window.addEventListener('keydown', (e) => {
      if (this.isTransitioning && ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Space', 'Home', 'End'].includes(e.code)) {
        e.preventDefault();
      }
    });

    // Seed history state for current page
    if (!history.state || !history.state.page) {
      history.replaceState({ page: this.currentPage }, '', window.location.href);
    }

    // Pre-cache other pages on idle
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => this.prefetchAll(), { timeout: 2000 });
    } else {
      setTimeout(() => this.prefetchAll(), 1000);
    }

    this.measureScrollbarWidth();
    window.addEventListener('resize', () => this.measureScrollbarWidth());

    // Initialize custom floating scrollbar with 100% transparent track
    initScrollbar();

    // Initialize current page scripts & attributes
    if (this.currentPage === 'portfolio') {
      initPortfolioPage();
    } else {
      document.documentElement.classList.add('subpage-active');
      document.body.classList.add('subpage');
    }
  }

  measureScrollbarWidth() {
    const outer = document.createElement('div');
    outer.style.visibility = 'hidden';
    outer.style.overflow = 'scroll';
    outer.style.position = 'absolute';
    outer.style.top = '-9999px';
    outer.style.width = '100px';
    document.body.appendChild(outer);
    const inner = document.createElement('div');
    outer.appendChild(inner);
    const sbw = outer.offsetWidth - inner.offsetWidth;
    outer.parentNode.removeChild(outer);
    if (sbw > 0) {
      document.documentElement.style.setProperty('--system-scrollbar-width', `${sbw}px`);
    }
  }

  async prefetchAll() {
    for (const [page, url] of Object.entries(PAGE_URLS)) {
      if (page !== this.currentPage && !this.cache.has(page)) {
        try {
          const res = await fetch(url);
          if (res.ok) {
            const html = await res.text();
            this.cache.set(page, this.parsePage(html, page));
          }
        } catch (e) {
          // Pre-fetch is opportunistic; failure will fallback to live fetch
        }
      }
    }
  }

  parsePage(html, pageKey) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const content = doc.getElementById('page-content') || doc.querySelector('.subpage-container') || doc.body;
    const title = doc.title || 'Glow Creative Co';
    const navLeft = doc.getElementById('nav-group-left')?.innerHTML || '';
    const bodyMode = doc.body.getAttribute('data-mode');
    const isSubpage = doc.body.classList.contains('subpage') || pageKey !== 'portfolio';

    return {
      title,
      contentHtml: content.innerHTML,
      pageKey,
      navLeft,
      bodyMode,
      isSubpage,
    };
  }

  async getPageData(pageKey) {
    if (this.cache.has(pageKey)) {
      return this.cache.get(pageKey);
    }
    const url = PAGE_URLS[pageKey];
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to load ${url}`);
    const html = await res.text();
    const parsed = this.parsePage(html, pageKey);
    this.cache.set(pageKey, parsed);
    return parsed;
  }

  handleLinkClick(e) {
    const link = e.target.closest('a');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || link.target === '_blank') {
      return;
    }

    // Check if link points to one of our wheel pages
    const targetPage = this.detectPageFromPath(href);
    if (PAGE_URLS[targetPage]) {
      e.preventDefault();

      if (targetPage === this.currentPage) {
        if (targetPage === 'portfolio') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        return;
      }

      this.navigateTo(targetPage, true);
    }
  }

  async navigateTo(targetPage, pushHistory = true) {
    if (this.isTransitioning) return;
    const fromPage = this.currentPage;
    const toPage = targetPage;

    if (fromPage === toPage) return;

    this.isTransitioning = true;

    try {
      const pageData = await this.getPageData(toPage);
      const direction = WHEEL_DIRECTIONS[`${fromPage}->${toPage}`] || 'right';

      // Update URL & history
      if (pushHistory) {
        history.pushState({ page: toPage }, '', PAGE_URLS[toPage]);
      }

      await this.runWheelTransition(fromPage, toPage, pageData, direction);
      this.currentPage = toPage;
    } catch (err) {
      console.error('Page transition failed, falling back to standard navigation:', err);
      window.location.href = PAGE_URLS[toPage];
    } finally {
      this.isTransitioning = false;
    }
  }

  runWheelTransition(fromPage, toPage, pageData, direction) {
    return new Promise((resolve) => {
      const stage = document.getElementById('page-stage') || document.body;
      const outgoingPanel = document.getElementById('page-content');
      const siteHeader = document.getElementById('site-header');

      // Update active nav link classes immediately
      this.updateNavbarActive(toPage);

      // Update left nav group (Commercial/Weddings switcher vs Glow Creative .Co brand)
      this.updateNavbarLeft(toPage, pageData.navLeft);

      // Update document title
      document.title = pageData.title;

      // Update page attributes and scrollbar compensation immediately
      this.applyPageAttributes(toPage, pageData);

      // Clean up previous page script hooks if leaving portfolio
      if (fromPage === 'portfolio') {
        destroyPortfolioPage();
      }

      if (this.reducedMotion.matches || !outgoingPanel) {
        // Reduced motion fallback: instant dissolve
        if (outgoingPanel) outgoingPanel.innerHTML = pageData.contentHtml;
        this.applyPageAttributes(toPage, pageData);
        window.scrollTo(0, 0);
        if (toPage === 'portfolio') {
          initPortfolioPage();
        }
        resolve();
        return;
      }

      // Record current scroll offset so outgoing panel stays visually static during transition
      const currentScroll = window.scrollY;

      // Lock stage during animation
      stage.classList.add('is-transitioning');
      document.documentElement.classList.add('transition-locked');

      // Position outgoing panel absolutely at its current visual offset
      outgoingPanel.style.position = 'absolute';
      outgoingPanel.style.top = `${-currentScroll}px`;
      outgoingPanel.style.left = '0';
      outgoingPanel.style.width = '100%';
      outgoingPanel.style.zIndex = '1';

      // Reset window scroll to top
      window.scrollTo(0, 0);

      // Create incoming panel
      const incomingPanel = document.createElement('div');
      incomingPanel.id = 'page-content';
      incomingPanel.className = 'page-panel';
      incomingPanel.setAttribute('data-page', toPage);
      incomingPanel.innerHTML = pageData.contentHtml;

      // Position incoming panel absolutely at top 0
      incomingPanel.style.position = 'absolute';
      incomingPanel.style.top = '0';
      incomingPanel.style.left = '0';
      incomingPanel.style.width = '100%';
      incomingPanel.style.zIndex = '2';

      stage.appendChild(incomingPanel);

      // Wheel transform parameters
      // direction === 'left': new page enters from Left (-100%), outgoing exits to Right (+100%)
      // direction === 'right': new page enters from Right (+100%), outgoing exits to Left (-100%)
      const isLeft = direction === 'left';
      const outTranslateX = isLeft ? '100%' : '-100%';
      const outRotateY = isLeft ? '-10deg' : '10deg';

      const inStartTranslateX = isLeft ? '-100%' : '100%';
      const inStartRotateY = isLeft ? '10deg' : '-10deg';

      // Animate outgoing panel
      const animOut = outgoingPanel.animate([
        {
          transform: 'translate3d(0, 0, 0) scale(1) rotateY(0deg)',
          opacity: 1,
        },
        {
          transform: `translate3d(${outTranslateX}, 0, -80px) scale(0.95) rotateY(${outRotateY})`,
          opacity: 0.5,
        }
      ], {
        duration: DURATION,
        easing: EASING,
        fill: 'forwards'
      });

      // Animate incoming panel
      const animIn = incomingPanel.animate([
        {
          transform: `translate3d(${inStartTranslateX}, 0, -80px) scale(0.95) rotateY(${inStartRotateY})`,
          opacity: 0.5,
        },
        {
          transform: 'translate3d(0, 0, 0) scale(1) rotateY(0deg)',
          opacity: 1,
        }
      ], {
        duration: DURATION,
        easing: EASING,
        fill: 'forwards'
      });

      // Update body classes and header style smoothly mid-transition
      setTimeout(() => {
        this.applyPageAttributes(toPage, pageData);
      }, DURATION * 0.25);

      let finished = false;
      const onFinish = () => {
        if (finished) return;
        finished = true;

        animOut.cancel();
        animIn.cancel();

        // Clean up outgoing panel
        if (outgoingPanel.parentNode) {
          outgoingPanel.parentNode.removeChild(outgoingPanel);
        }

        // Restore incoming panel to normal flow
        incomingPanel.style.position = '';
        incomingPanel.style.top = '';
        incomingPanel.style.left = '';
        incomingPanel.style.width = '';
        incomingPanel.style.zIndex = '';
        incomingPanel.style.transform = '';
        incomingPanel.style.opacity = '';

        stage.classList.remove('is-transitioning');
        document.documentElement.classList.remove('transition-locked');

        this.applyPageAttributes(toPage, pageData);

        // Initialize incoming page hooks
        if (toPage === 'portfolio') {
          initPortfolioPage();
        }

        resolve();
      };

      animIn.onfinish = onFinish;
      // Safety timeout in case WAAPI finish event is delayed
      setTimeout(onFinish, DURATION + 50);
    });
  }

  updateNavbarActive(pageKey) {
    const links = {
      portfolio: document.getElementById('nav-portfolio'),
      about: document.getElementById('nav-about'),
      contact: document.getElementById('nav-contact'),
    };

    Object.entries(links).forEach(([key, el]) => {
      if (!el) return;
      el.classList.toggle('active', key === pageKey);
    });
  }

  updateNavbarLeft(toPage, navLeftHtml) {
    const navGroupLeft = document.getElementById('nav-group-left');
    if (!navGroupLeft) return;

    if (toPage === 'portfolio') {
      const mode = document.body.getAttribute('data-mode') || 'commercial';
      const isComm = mode === 'commercial';
      navGroupLeft.innerHTML = `
        <button type="button" class="nav-item toggle-btn ${isComm ? 'active' : ''}" data-target="commercial">Commercial</button>
        <span class="nav-sep" aria-hidden="true">/</span>
        <button type="button" class="nav-item toggle-btn ${!isComm ? 'active' : ''}" data-target="weddings">Weddings</button>
      `;
    } else {
      navGroupLeft.innerHTML = `
        <a href="index.html" class="nav-item nav-brand" id="brand-link">Glow Creative .Co</a>
      `;
    }
  }

  applyPageAttributes(toPage, pageData) {
    const body = document.body;
    const html = document.documentElement;
    const header = document.getElementById('site-header');

    if (toPage === 'portfolio') {
      body.classList.remove('subpage');
      html.classList.remove('subpage-active');
      if (header) {
        header.classList.remove('solid');
      }
      if (!body.getAttribute('data-mode')) {
        body.setAttribute('data-mode', 'commercial');
      }
    } else {
      body.classList.add('subpage');
      html.classList.add('subpage-active');
      if (header) {
        header.classList.add('solid');
        header.setAttribute('data-nav-tone', 'dark');
      }
    }

    updateScrollbar();
  }
}

// Instantiate router once DOM is interactive
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.pageWheelRouter = new PageWheelRouter();
  });
} else {
  window.pageWheelRouter = new PageWheelRouter();
}
