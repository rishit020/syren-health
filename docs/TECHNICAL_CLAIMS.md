# Technical claims and image provenance

Checked October 24, 2026 against `aksharkakkad-web/MedicalHardware`, branch `hardware/device-frame-format` at `fdf2e1a`, plus the clinic UI on its current `main` worktree at `fcf96a2`.

| Website statement | Evidence and scope |
| --- | --- |
| One bench receiver combines 60 GHz radar, 32 × 24 thermal and Wi-Fi CSI | `firmware/bench-node/src/main.cpp`, `firmware/shared/frame.h` and `firmware/docs/BRINGUP_LOG.md` in MedicalHardware. Bench engineering status only. |
| CSI uses a separate ESP32-C6 transmitter and ESP32-S3 receiver | `firmware/tx-node/src/main.cpp`, `firmware/bench-node/src/main.cpp` and `firmware/host/README.md`. This is a single directed sensing link, not a multi-room mesh. |
| A local host dashboard displays the bench stream | `firmware/host/bridge.py` and `firmware/host/dashboard/index.html`. Its rate and vital estimates are engineering outputs without reference-instrument validation. |
| The clinic dashboard is working software | `apps/clinic-dashboard/` renders a clinic overview, event queue and resident workflow against a typed mock client. It is not evidence that real sensor telemetry is connected end to end. |
| A coordinated multi-room mesh is planned | Product direction only. Multi-node coordination, room attribution and performance have not been implemented or validated. |

`public/syren/clinic-overview-wide.png` and `clinic-overview-card.png` were captured on October 24, 2026 from the clinic app running locally at `http://127.0.0.1:3100/`. The visible “Demo environment / Synthetic records only” label comes from the app. The overview showed six fictional records. No PHI was used. The wide capture uses a 1440 × 1050 viewport; the card capture clips the same app at 900 × 1200 for the existing portrait card.

The homepage room card uses the existing `approach-room-v1.webp` illustration. It is visibly labeled as a placement concept. The capability card describes design goals and can open an illustrative sensor walkthrough; the detailed bench diagram appears in the technical material below.

The homepage care scenarios show fictional activity, uncertain occupancy, and an offline device, with illustrative traces and a link to the matching synthetic dashboard record. They describe intended review capabilities, not measured clinical performance. There are no customer ratings or outcome percentages. The generated room scene is visibly labeled as illustrative; the dashboard images are labeled as synthetic software captures.

Keep public wording at the prototype/research stage until real hardware-to-product integration, multi-room sensing, and performance are separately verified. Do not use these screenshots or bench rates as clinical validation.
