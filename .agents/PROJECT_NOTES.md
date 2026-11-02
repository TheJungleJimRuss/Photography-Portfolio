# Living Project Notes: PhotographyPortfolio

## 1. Project Overview & Scope
- **Project Name**: PhotographyPortfolio (Glow Creative Co.)
- **Repository**: `https://github.com/TheJungleJimRuss/Photography-Portfolio.git`
- **Target Platform & Engine**: Vite v8, Vanilla ES Modules, CSS3
- **Status**: Live on `http://localhost:5173/`
- **Core Concept**: Photography portfolio showcasing Commercial & Weddings photography, featuring a 3-station rotational wheel page transition ([About] <-> [Portfolio] <-> [Contact]), adaptive luminance navbar detection, horizontal darkroom develop gallery, interactive lightbox, continuous sliding film strips, and discrete step-flip print stack.

## 2. System Architecture & Components
- **Modular Scripts**:
  - `transitions.js`: 3-station rotational wheel page router managing dynamic DOM replacement and directional sliding transitions between `index.html`, `about.html`, and `contact.html`.
  - `portfolio.js`: Dual-world mode toggle, slat curtain transitions, adaptive navbar contrast sampling, video playback controls, scroll scenes, lightbox, and discrete gesture-stepped print stack transitions.
  - `scrollbar.js`: Transparent floating custom scrollbar.
- **Print Stack Discrete Flip Interaction**:
  - `.stack-print` configured with `transition: transform 0.48s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.45s ease;`
  - Replaced continuous pixel-scrubbing with discrete active card states: cards animate completely off-screen (`opacity: 0`, full exit) and land flat on the pile (`opacity: 1`, `scale(1)`), eliminating any midway hovering or half-finished animations.
  - Added wheel/touch gesture interceptors on `.stack-section` to cleanly advance cards on user scroll gestures.

## 3. Active Roadmap & Milestones
- [x] Merged feature/fix branch (`fix/about-contact`) into `main` and resolved merge conflicts
- [x] Vite development server running on `http://localhost:5173/`
- [x] Cleaned up 51.5 MB of redundant unzipped archives
- [x] Implemented discrete, complete photo exits for the Print Stack to prevent stuck/half-way states
