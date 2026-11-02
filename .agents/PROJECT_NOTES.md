# Living Project Notes: PhotographyPortfolio

## 1. Project Overview & Scope
- **Project Name**: PhotographyPortfolio (Glow Creative Co.)
- **Repository**: `https://github.com/TheJungleJimRuss/Photography-Portfolio.git`
- **Target Platform & Engine**: Vite v8, Vanilla ES Modules, CSS3
- **Status**: Merged & Finished Local Production Build
- **Core Concept**: Photography portfolio showcasing Commercial & Weddings photography, featuring a 3-station rotational wheel page transition ([About] <-> [Portfolio] <-> [Contact]), adaptive luminance navbar detection, horizontal darkroom develop gallery, interactive lightbox, and continuous sliding film strips.

## 2. System Architecture & Components
- **Modular Scripts**:
  - `transitions.js`: 3-station rotational wheel page router managing dynamic DOM replacement and directional sliding transitions between `index.html`, `about.html`, and `contact.html`.
  - `portfolio.js`: Lifecycle-managed (`initPortfolioPage` / `destroyPortfolioPage`) dual-world Commercial vs Weddings mode toggle, slat curtain transitions, adaptive navbar contrast sampling, video playback controls, scroll scenes, and lightbox.
  - `scrollbar.js`: Transparent floating custom scrollbar.
- **Build System**:
  - `vite.config.js`: Multi-page rollup configuration targeting `index.html`, `about.html`, and `contact.html` with automated root media asset bundling (`copyRootMedia` plugin for `CATCAT.mp4` and `Puppy.mp4`).

## 3. Active Roadmap & Milestones
- [x] Cloned and fetched all branches from GitHub (`TheJungleJimRuss/Photography-Portfolio`)
- [x] Merged feature/fix branch (`fix/about-contact`) into `main`
- [x] Resolved merge conflict in `index.html` by integrating the modular transitions router and preserving all recent filmstrip & video markup from `main`
- [x] Cleaned up legacy unzipped directory artifacts (`Completed VSCODE/` and `images/Completed VSCODE/`, saving 51.5 MB)
- [x] Verified zero-warning production build with `npm run build`

## 4. Architectural Decisions & Conventions Log
- `2026-11-02`: Reconciled divergence between `main` (recent PR #19 film strips & video improvements) and `fix/about-contact` (wheel transitions & redesign of About/Contact). Preserved modular JS architecture while ensuring complete HTML structure and media bundling.
