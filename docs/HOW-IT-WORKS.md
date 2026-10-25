# Homepage How it works section

The homepage retains the original three-card grid and its native links. `src/how-it-works.js` replaces the card artwork inside the existing Framer media wrappers; `src/how-it-works.css` owns the presentation. Each card remains 3:4 and keyboard reachable.

1. **Room awareness** uses the existing `approach-room-v1.webp` concept render. Its visible label says “Placement concept.” This is an illustration, not a photograph of a deployed product or measured room activity.
2. **Contactless sensing** is native HTML/CSS showing the current single-room bench topology: ESP32-C6 transmitter, ESP32-S3 CSI receiver, 60 GHz radar and a 32 × 24 thermal array. The visual explicitly says “Bench setup” and “Measured on one bench link.” It does not depict a deployed multi-room mesh.
3. **Caregiver review** frames `clinic-overview-card.png`, a direct capture of the current clinic UI. The visible footer says “Synthetic records only.” The card links to the larger screenshot and claim details in the engineering section.

The original caption DOM remains visually hidden for the source component structure, while each link has a complete accessible name. The old baked two-sensor and fictional dashboard artwork is no longer rendered.

## Verification

Run `CHROME_PATH=<installed Chrome path> node scripts/check-how-it-works.mjs` against the local site at `http://127.0.0.1:4173`. The check covers desktop, laptop, tablet and mobile widths, loaded images, card geometry, visible claims, focus and keyboard navigation, reduced motion, failed resources and page errors. Screenshots are saved in `reference/validation/how-it-works/`.
