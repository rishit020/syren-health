# Motion reference and implementation

Motion was observed in the published site and implemented independently of Framer's runtime. Static comparison captures hold videos and repeating collections at matching frames; the live website keeps them moving.

| Element | Source behavior / local implementation | Evidence |
|---|---|---|
| Scroll reveals | Fade from 0 to 1 with a spring-like settle over about 2.1 seconds. The common distance is 60px. Source markup also specifies 40px for the team cards, 100px for the homepage center image, and scale 0.8 for metric cards. | `reference/reveal-coverage.json`, `reference/scroll-reveals.json` |
| Header entrance | Starts 60px above its final position. Horizontal centering is preserved throughout. Starts on page mount. | Server-rendered initial styles in `reference/source/` |
| Homepage artwork | Opacity-only over-damped spring, mass 1, stiffness 120, damping 60, 300ms delay. | `reference/motion-config.json` and homepage source markup |
| About wide feature strip | Five 320px cards with 16px gaps; continuous leftward movement at 30px/s. A 1680px cycle takes 56 seconds. Hover does not pause it. Captured virtual-item offsets are reset before the local loop starts. | `reference/motion/about-ticker.json`, `reference/validation/responsive-motion.json` |
| About small-screen carousel | Three-second autoplay; arrows, horizontal drag/swipe, looping copies and a roughly 700ms easing transition. Vertical touch scrolling remains native. | `public/reference/states/about-carousel-*`, `reference/validation/local-qa/report.json` |
| FAQ | Independent items expand/collapse with a measured height trajectory: roughly 33ms response delay and 200ms transition. Final heights return to normal responsive layout. Focus remains on the activated control. | Captured FAQ states and clipping checks in `reference/validation/local-qa/report.json` |
| Mobile menu | Roughly 420ms spring-like height transition, including the source's small overshoot/undershoot. Closed height is 56px; the open state is 340px. | Captured menu states, `src/controllers.js`, responsive motion checks |
| Hover | Source variant classes and child inline states are applied to navigation links, primary buttons and story cards, then restored on pointer exit. | `reference/validation/state-comparison/report.json` |

The representative About reveal is measured using the same viewport, scroll action and animation-frame clock on both sites. A measured 39ms phase adjustment compensates for the local intersection callback's delivery timing. The final trace's measured errors are stored in `reference/validation/local-qa/motion.json`, and the original/local curves are plotted in `reference/motion/comparison/curves.svg`. This is a measurement of that representative reveal, rather than a claim that every browser frame on every element is identical.

Reduced-motion settings stop the repeating strip and autoplay, remove reveal movement, and make panel changes immediate. Production browser checks exercise reduced-motion states separately.
