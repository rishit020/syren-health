# Progress section — implemented design

Status: approved and implemented on the homepage. The native section follows the approved composition in `reference/progress-section/progress-section-v1.png` while refining the three illustrations for legibility and motion.

## Purpose and assumptions

Explain Syren's development stage and invite care-team feedback. The user has no testimonials. Do not present customer quotes, client logos, proven outcomes or completed testing. Readiness for pilot testing has not been confirmed, so the invitation requests conversations and feedback rather than enrollment in a live pilot.

## Composition

Use the existing cream/terracotta system, Domine headings, Inter body text, clear warm borders and rounded cards. Keep a centered introduction, three compact equal-height cards and a full-width call-to-action banner. Desktop content aligns with the surrounding 1200px container.

- Tag: Our progress.
- Heading: Where we are today.
- Introduction: Syren is in development. We’re shaping the prototype and the questions it needs to answer.
- Card 1: The prototype. A room-based concept bringing radar and thermal sensing together. Status: In development. Small radar/thermal input schematic in a terracotta panel.
- Card 2: What we’re validating. Testing needs to show when the system is useful, and when it gets things wrong. Status: Validation priorities. Unchecked Reliability / False alerts / Caregiver usefulness list; never animate checkmarks or suggest passed tests.
- Card 3: Care-team feedback. Conversations with care teams can help guide what we build next. Link: Share your perspective. Small question/reply illustration reading What would help your team? No avatars, attributed quotes or AI people.
- Banner: Work in senior care? Help us build around your team’s needs. Button: Talk to Us.

## Behavior and responsive plan

Preserve the established entrance animation. Light hover edge emphasis is sufficient; illustrations should stay calm. Honor reduced motion. Status labels in cards one/two are noninteractive badges, even though the generated mockup uses outlined shapes. Only Share your perspective and Talk to Us are actionable; both go to the existing contact page. No new form or backend is needed.

Tablet/mobile stack the cards in reading order, preserve comfortable text sizes and 16–24px padding, then stack banner text/button. Maintain visible boundaries against the page and keyboard focus on actionable links.

## Implementation notes and boundary

The section is native accessible HTML, CSS and SVG in `src/progress-section.js` and `src/progress-section.css`; the reference image is not rendered in the page. The original `Testimonials Section` shell and `#testimonials` footer anchor remain in place. Decorative diagrams are hidden from assistive technology, while the three validation criteria are repeated as a visually hidden semantic list. Both visible links are native anchors to `/contact`, and the status labels are noninteractive text.

The entrance reveal uses the existing controller lifecycle. Radar propagation, thermal cells, the validation focus line and reply dots run only while the section is in view. Reduced-motion preferences remove all loops and reveal movement while keeping every word visible. Desktop cards retain equal heights; tablet uses a horizontal card layout; mobile cards collapse to natural content height.

Focused validation lives in `scripts/check-progress-section.mjs`. It covers 1440px, 1355px, 1280px, 768px and 390px widths; exact copy and legacy-testimonial removal; layout and overflow; offscreen motion pausing; keyboard routing; route/back/reload cleanup; and reduced motion. Rendered evidence and the machine-readable report are saved in `reference/validation/progress-section/`.
