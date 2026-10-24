# Luvia frontend reconstruction notes

## Authority and scope

- The live Luvia template and captured files in `public/reference/` are the visual and content authority. This is a reconstruction, not a redesign.
- UIArc was attempted before implementation, but its MCP requires OAuth in this environment. No substitute component gallery is needed because the original template is the stronger reference.
- The free template license permits modifying the template for this project. Keep the original creator attribution shown by the template and do not redistribute the captured template as a standalone asset.
- The implementation must not load Framer's proprietary runtime. It may preserve the licensed template's rendered DOM, CSS, fonts, and image assets while React owns local interaction state.

## Fidelity-first rendering plan

Render the captured `bodyHtml` and route CSS as the default page representation. Preserve:

- original element order, class names, `data-framer-*` attributes, root IDs, SVG sprites, and inline styles;
- the breakpoint-specific classes and media rules captured at each source viewport;
- body attributes and route metadata;
- local asset URLs exactly as rewritten by the reference capture;
- the source attribution badge included in the captured body.

The app chooses the exact captured viewport family at runtime and renders one route snapshot. The required targets are 1440x900, 1280x800, 768x1024, and 390x844, with an additional 1024px `compact` capture for the source's 810–1199 breakpoint. CSS and DOM remain responsive between those targets; viewport selection only remounts when a real source breakpoint is crossed.

Use a shared React route shell for metadata, reference loading, route changes, scroll restoration, and error handling. Keep route content as captured HTML rather than manually approximating the layout. React can attach behavior through one delegated event handler plus small controllers that find stable elements using semantic text, hrefs, native control types, and captured `data-framer-name` attributes.

## Local React controllers

### Header and mobile menu

- Desktop header shows logo, About, Pricing, Success Stories, News, and Request Access.
- At 390px the navigation collapses to a two-line menu icon. The open state expands the header vertically, changes the icon to an X, and reveals centered navigation links plus the Request Access button.
- Closing the menu restores the original compact header. Route navigation closes the menu and scrolls the new page to the top.
- The header becomes sticky while the page is scrolled.
- On all 25 routes, scrolling past 80px applies the captured opaque navigation background; returning to the top restores the original header. Narrow layouts retain their mobile geometry while scrolling and opening the menu.
- Desktop navigation, primary CTA, and featured story card hover states copy the captured variant class and child transforms instead of approximating them with generic CSS.

### FAQ

- Each question is independently expandable. Opening a second item does not close an already open item.
- The closed state has a plus; the open state has an X and a softly tinted background.
- Answers and open-state heights must come from captured interaction data. Controls should be real buttons with `aria-expanded` and keyboard activation even if the visual markup is preserved.
- Each FAQ wrapper adopts the captured settled height as its inner variant changes. This preserves the original 10px spacing and prevents answer clipping.

### Collection load more

- News and Success Stories each render six collection cards initially.
- `Load More` reveals the seventh card and then disappears.
- News seventh item: `/news/the-science-of-circadian-health`.
- Success Stories seventh item: `/success-stories/strategic-health-acceleration`.

### Forms

- Contact fields: name, email, location, objective, and four health-plan checkboxes.
- Preserve native required-field validation. Empty submission focuses the name field and displays the browser's native validation message.
- Do not submit data to the production template. The local reconstruction reports a truthful `role=status` message that the request was not sent.
- Footer and news newsletter fields must remain local and must not contact the production endpoint.
- The contact CTA keeps the captured `Disabled` variant at 50% opacity until name, email, location, and objective are valid, then changes to the captured `Default` variant. This is a visible state only; native validation remains authoritative.

### Sharing and detail navigation

- Article and story pages include Facebook, LinkedIn, X, and copy-link controls.
- Social controls can open the canonical share URL. Copy writes the current local route URL and exposes the captured confirmation state if present.
- Previous and next links follow the route order in the captured manifest. Boundary pages may show only one direction.
- Copy confirmation is only shown after the Clipboard API succeeds, resets after two seconds, and can be used repeatedly.

### Motion

- The reference uses soft page/section reveals with measured 40/60/100px travel, a separate header entrance and scale variants. The measured trajectory settles in about 2.1 seconds. The final same-clock source/local trace differs by at most 0.43px and by 0.07px on average; motion evidence and capture timing are documented in `docs/MOTION.md`.
- Captured post-scroll markup is the stable final rendering source. The minimal route- and viewport-specific selector map in `reference/reveal-selectors.json` drives one-time `IntersectionObserver` entry motion, and `reference/reveal-timing.json` supplies its sampled keyframes. The full evidence remains in `reference/scroll-reveals.json`. Final captured geometry is restored after each reveal.
- The homepage hero artwork has a separate opacity-only source animation: 300ms delay, mass 1, stiffness 120, damping 60, and no translation.
- Disable transforms and transitions under `prefers-reduced-motion: reduce`.
- The homepage impact labels are a static feature strip in the observed DOM, not an interactive carousel. Pricing has three fixed one-time plans and no billing switch.
- The About feature carousel appears at the source's mobile and tablet breakpoints. It supports arrows, three-second autoplay, horizontal pointer/touch drag with snap and looping clones, and `touch-action: pan-y` so vertical page scrolling remains native. At widths of 810px and above, the feature strip travels continuously at 30px/s through a 56-second cycle and continues on hover. Reduced motion stops this loop.

## Route families

- Marketing: `/`, `/about`, `/contact`, `/pricing`.
- Collection: `/news`, `/success-stories`.
- News detail: seven `/news/:slug` pages with shared hero, feature image, share rail, previous/next links, and rich article body.
- Story detail: seven `/success-stories/:slug` pages with shared hero, profile image, metadata pills, share rail, metric cards, previous/next links, and rich case-study body.
- Legal: four `/legal/:slug` pages sharing last-updated rail and legal body layout.
- Unknown route: full 404 page with navigation, footer, and Home page button.

## Observed core tokens

- Display type: Domine, usually weight 600.
- Body/UI type: Inter.
- Page background: `#fef9ef`.
- Main ink: `#26211a`.
- Muted copy: `#696963`.
- CTA color and section-specific tones should come directly from captured CSS rather than manually inferred values.

## Capture requirements

Each reference payload needs `path`, `viewport`, `title`, `bodyHtml`, `css`, `bodyAttrs`, section and control inventories, route resources, and geometry. Preserve page/root classes and all breakpoint attributes because Framer's scoped CSS depends on them.

Interaction-state captures should include:

- mobile menu closed and open;
- all FAQ answer text plus representative closed/open styles;
- news and story lists before and after Load More;
- contact native control, focus, checked, select-open/value, disabled, validation, and any local success state;
- newsletter focus/validation states;
- share hover, copy confirmation, and previous/next boundary states;
- representative button/card hover styles.

Captured HTML that has been fully scrolled will contain final reveal styles. Retain enough pre-reveal evidence (or a concise reveal recipe) to reproduce motion without restoring Framer's runtime.

## Browser QA ownership

After implementation, inspect and compare every route family at 1440x900, 1280x800, 768x1024, and 390x844. Exercise mobile navigation, multiple open FAQ items, both Load More flows, native form validation, local form state, share/copy controls, route transitions, sticky navigation, unknown-route rendering, reduced motion, keyboard focus, console errors, clipping, and horizontal overflow.

Durable browser evidence is stored under `reference/validation/local-qa/` and `reference/validation/state-comparison/`. The final local QA covers About autoplay and swipe at 390px and 768px, all six FAQ answers with client-height clipping assertions, repeated copy, contact disabled/enabled states, exact scrolled navigation, hover variants, reduced motion, and runtime/resource errors.
