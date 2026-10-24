# Homepage How it works section

The homepage keeps the original Luvia Services Section grid, heading spacing and reveal wrappers. Its three cards now render the user-approved Syren compositions as complete 3:4 artwork, with no extra gradient, caption or arrow drawn over them.

## Story and destinations

1. **Awareness through the night.** — More context between caregiver check-ins. → `/#device`
2. **Radar meets thermal.** — Exploring movement and room activity. → `/#features`
3. **Context for the care team.** — An overview built around caregiver review. → `/contact`

The original caption DOM carries these titles and descriptions for assistive technology while remaining visually hidden. Each native link also has one complete accessible name. The third image alt text explicitly identifies its dashboard as a concept containing fictional sample data.

## Approved image contract

Each full card uses a 1086×1448 WebP with 960px and 640px responsive alternatives in `public/syren/`:

- `card-room-approved.webp`
- `card-sensing-approved.webp`
- `card-caregiver-approved.webp`

The cards use their native 3:4 ratio and `object-fit: contain`, so typography, diagrams and baked arrows remain fully visible. At desktop widths this adds at most about 17px to the source card height. The original card entrance remains intact; pointer hover adds a small lift and shadow, and reduced-motion users receive a static card.

## Verification

With the production preview available at `http://127.0.0.1:4173`, run:

```sh
node scripts/check-how-it-works.mjs
```

The check covers 1440, 1355, 1280, 768, 510 and 390px widths; complete responsive image loading; uncropped 3:4 geometry; removal of duplicate visual layers; accessible text, alt text, focus and all three keyboard destinations; hover stability; reduced motion; overflow; page errors and failed resources. Final screenshots are saved as `reference/validation/how-it-works/desktop1355-context.png` and `reference/validation/how-it-works/mobile390-all-three.png`.
