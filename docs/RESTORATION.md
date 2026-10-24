# Return to the earlier Luvia replica

The user explicitly cancelled the Syren adaptation and requested the original Luvia site, including its feature section and reference motion.

- Restored the saved pre-adaptation `App.jsx`, `local.css`, `index.html` and README from `reference/luvia-app-archive/`. The unchanged original routing/controllers restore all 25 routes and original content.
- Preserved the Syren adaptation as inactive source/assets, with its active entry files archived under `reference/syren-app-archive/`. No Syren content is rendered by the restored application.
- Production build passes and reproduces the earlier application bundle identity (`index-uNRPATma.js`).
- All 25 routes and the 10 interaction groups pass. The 11 rendered UI checks and five responsive motion groups also pass, including menus, FAQ, carousel/ticker speed, forms, copy, hover, all-route sticky headers and reduced motion.
- Live original/local reveal timing comparison passes: maximum measured position difference 0.252px, mean 0.047px; opacity difference at most 0.00372 for the representative About reveal.
- Browser observations confirm the exact same hero asset: 15-second loop, playback rate 1, 4082×2164 pixels, on both the live original and local replica. This measurement is not inferred from the asset name.
- REA passively inspected both live targets and captured/compared aligned 1440×900 screenshots. Evidence is retained under `reference/restoration/rea-*.json`. The REA screenshot comparison reports a 1.336% changed-pixel ratio at channel threshold 12, mostly small rendering differences; it does not prove universal pixel identity.
- Fresh full-home desktop/mobile comparisons match page heights and show no hidden reveal targets or runtime errors. Desktop changed pixels: 0.270%; mobile: 0.142%, with the established pixelmatch tolerance. Initial backgrounded desktop capture was rejected and separately recorded.

Use the existing preview at http://127.0.0.1:4173/. Source/live motion evidence, source/local screenshots and REA artifacts remain reviewable; no production forms were submitted and no deployment was performed.
