# Syren Health

The Syren Health website, live at https://syrenhealth.com and locally runnable, built with React and Vite. Its visual design uses a cream and terracotta palette, refreshed typography and the original hero motion.

## Run

Requires Node.js 20.19+ or 22.12+.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:5173. For the production preview:

```sh
npm run build
npm run preview -- --port 4173
```

## Current website

- `/`: hero, how it works, progress, approach, features/device, purpose, engineering proof, FAQ and footer.
- `/contact`: Syren inquiry form that submits directly through FormSubmit to **rishit020@gmail.com**. FormSubmit was activated and an actual website submission was verified in Gmail (it initially landed in Spam). No email app is required.
- `/404` and unknown paths: branded not-found page.

Navigation and footer links point only to these pages or existing homepage sections. The unused pricing, news, stories, legal and original About routes now resolve to the not-found page; historical template captures remain archived in `public/reference/` for provenance.

The project is deployed to Vercel at https://syrenhealth.com. The www hostname redirects to the apex domain. GitHub main is connected for future deployments. Static hosting must rewrite application paths to `index.html`. Host-level HTTP 404 status requires hosting configuration.

## Verification

```sh
npm run build
npm run test:contact
npm run test:site
npm run test:progress
npm run test:content
npm run test:demo
```

`test:site` checks desktop, laptop, tablet and mobile; active routes, links and anchors, mobile menu, every FAQ, images, overflow, runtime errors, reduced motion and direct form submission states (with intercepted provider responses). Automated tests intercept the provider; they send no emails or production submissions. Screenshots and reports live in `reference/validation/final-syren/`.

`test:demo` checks the synthetic dashboard's resident selection, simulated vitals, local-only clearing, history and reset, plus every sensor walkthrough entry point and control on desktop and mobile.

Older scripts and comparison reports document the original Luvia reconstruction phase and are historical, not current Syren acceptance checks.

## Implementation and assets

`src/App.jsx` supplies routing and responsive template selection. `src/home-content.js` adapts the homepage; `src/home-visuals.css` styles its native bench diagram and visual labels; `src/visual-refresh.css` supplies the shared homepage visual treatment and hero dashboard preview. `src/site-chrome.js` owns shared navigation, FAQ and footer; `src/contact-content.js` adapts the contact form. `src/controllers.js` handles interactions and motion. Native progress visuals are in `src/progress-section.*`; the engineering section is in `src/technical-proof.*`; photographic and dashboard cards are in `src/how-it-works.*`.

All media and fonts are served locally. The room photograph is an illustrative concept with an on-image label. The device feature uses a native diagram of the current single-room bench topology. The two `clinic-overview-*.png` assets are captures of the actual clinic dashboard UI running on its synthetic mock client, not photographs, live patient data or proof of integrated hardware. The product is described as a prototype; there are no customer testimonials or validated performance statistics. See `docs/TECHNICAL_CLAIMS.md` for source and status of public technical claims.

The interactive website dashboard is a separate synthetic walkthrough: example vital numbers and trends are fictional, and clearing items changes local demo state only. The radar, thermal and Wi-Fi CSI animations are illustrative schematics, not recorded signals.

See `docs/ATTRIBUTION.md` for template provenance and own-project usage boundaries, `docs/PROGRESS.md` for iteration history, and `docs/KNOWN-DIFFERENCES.md` for current limitations.

## Contact activation

FormSubmit is the managed form backend: https://formsubmit.co/documentation. The first real submission triggers a confirmation email at rishit020@gmail.com. Activate that email before accepting visitor inquiries. Reconfirm after changing the site origin if the service requests it.

The form sends name, reply email, care connection, topic, selected interests and optional message to FormSubmit. Its documentation says submissions are retained for 30 days. Visitors are asked not to include resident or medical information. Submission acceptance is not proof of inbox delivery. No API keys or payment setup are used.

Live verification on October 24, 2026: recipient activation completed, actual website POST accepted and test email found in Gmail Spam. Mark the FormSubmit message as Not spam to improve inbox placement. Activation/deliverability should be rechecked on the final hosted domain.
