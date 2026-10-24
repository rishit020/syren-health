# Luvia reconstruction

A local React/Vite reconstruction of [Luvia by Shaigexp](https://www.framer.com/marketplace/templates/luvia/), preserving its original content, artwork, fonts, colors, responsive layouts and route structure. Syren Health branding has not been applied.

## Run locally

Requires Node.js 20.19+ or 22.12+.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:5173. To check the production build:

```sh
npm run build
npm run preview -- --port 4173
```

All site assets are served locally. The application does not require a Framer account, API key, or Framer runtime. Keep the complete `public/` directory with the application. Static hosting must rewrite unknown routes to `index.html`; the application displays the original custom 404 for unrecognized paths.

## Implemented pages

- `/`, `/about`, `/pricing`, `/contact`, `/news`, `/success-stories`
- `/news/the-future-of-wellness`
- `/news/why-biomarkers-matter`
- `/news/mastering-your-sleep`
- `/news/longevity-made-simple`
- `/news/nutrition-and-data`
- `/news/high-performance-health`
- `/news/the-science-of-circadian-health`
- `/success-stories/scaling-executive-vitality`
- `/success-stories/optimizing-athlete-longevity`
- `/success-stories/scaling-team-vitality`
- `/success-stories/building-cellular-resilience`
- `/success-stories/integrating-vital-insights`
- `/success-stories/reclaiming-metabolic-health`
- `/success-stories/strategic-health-acceleration`
- `/legal/privacy-policy`, `/legal/terms-of-service`, `/legal/cookie-policy`, `/legal/licensing-agreement`
- `/404` and fallback for unknown paths

## Evidence and validation

- [Reference inventory](docs/reference/INVENTORY.md): sections, text, typography, geometry, assets, links and controls.
- [Visual comparison gallery](reference/validation/final/index.html): source/local screenshots, difference images and overlays by page and viewport.
- [Visual comparison report](reference/validation/final/REPORT.md): measured differences and page heights.
- [Interaction checks](reference/validation/interactions.json) and [rendered interaction QA](reference/validation/local-qa/report.json).
- [Progress and iteration history](docs/PROGRESS.md).
- [Remaining differences](docs/KNOWN-DIFFERENCES.md).
- [License and attribution](docs/ATTRIBUTION.md).

The four requested viewports are 1440×900, 1280×800, 768×1024 and 390×844. An additional 1024×900 capture covers the source's middle breakpoint. Reference captures include full-page images and regular scroll intervals, rather than only the first viewport. Comparisons wait for fonts and scroll reveals, then pause videos at a verified one-second frame.

To rerun browser checks, install Playwright's browser once if needed:

```sh
npx playwright install chromium
npm run test:interactions
npm run test:ui
npm run test:motion
npm run test:reveal
npm run test:visual
node scripts/build-comparison-gallery.mjs
```

`LOCAL_URL` selects a different local server. `CHROME_PATH` can select an existing Chromium installation. Visual checks read the saved source captures and do not submit data to the live template. Example focused comparison:

```sh
LOCAL_URL=http://127.0.0.1:4173 ROUTES=/about VIEWPORTS=mobile RUN=about-mobile npm run test:visual
```

The reveal timing check opens the published source to record the same scroll action with the same browser clock. Static screenshot checks use saved references. To regenerate the final report and gallery after a full visual run:

```sh
node scripts/audit-capture-paints.mjs
node scripts/summarize-validation.mjs
node scripts/build-comparison-gallery.mjs
```

## Implementation

`src/App.jsx` supplies the shared React route shell and preserves the captured header, sections and footer inside each page payload. `src/controllers.js` owns menu, FAQ, collection expansion, carousel, sharing, local form states and motion. `src/reference.js` handles page payloads, responsive families and local URL resolution. The route payloads in `public/reference/` preserve the template's rendered markup and CSS; `public/assets/` contains the original locally downloaded media and fonts. `reference/asset-manifest.json` records asset provenance.

Contact and newsletter forms validate and show an explicit local-only result. They do not send data or create real subscriptions. External social links and creator links retain their destinations.

This is an own-project adaptation of a free Framer template. It is not licensed here as a standalone template redistribution. See the attribution document before publishing or repurposing it.
