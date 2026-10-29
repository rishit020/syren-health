import { applyHowItWorks } from "./how-it-works.js";
import { applyProgressSection } from "./progress-section.js";
import { applySiteChrome } from "./site-chrome.js";
import { applyTechnicalProof } from "./technical-proof.js";
import "./home-visuals.css";
import "./visual-refresh.css";

// Content-only adaptation. Keep the captured component tree, CSS and motion.
export const homeTitle = "Syren Health | Contactless Overnight Awareness";

const heroCopy = new Map([
  ["Better health through data", "Awareness for overnight care."],
  ["Stop managing symptoms and start engineering your vitality. Luvia integrates deep biomarker analysis with real-time AI insights.", "Syren Health is developing contactless room monitoring to help care teams notice overnight activity that may need a closer look."],
  ["+500 Members", "Contactless sensing"],
  ["Helping high-performers", "Room-based monitoring"],
  ["+15 Years of longevity", "No wearable needed"],
  ["Focused on extending healthspan", "A design goal for resident comfort"],
  ["98% Sleep improvement", "Caregiver awareness"],
  ["Proven results in recovery", "In development for senior care"],
]);

const featureCopy = new Map([
  ["Driving measurable health results.", "Built for overnight awareness."],
  ["Our platform tracks your unique biological data to help you understand what’s happening inside your body.", "Our bench prototype brings 60 GHz radar, a 32 × 24 thermal array and Wi-Fi CSI into one room-level engineering view."],
  ["Biological Optimization", "Three sensing modalities"],
  ["Precision tools designed to optimize your internal health metrics.", "Radar, thermal and a separated Wi-Fi transmitter/receiver pair explore motion and presence without a wearable."],
  ["Real-Time Wellness", "Overnight Awareness"],
  ["Monitor your vitals with instant alerts and expert support.", "Designed around the moments between routine caregiver check-ins."],
  ["Evidence-Based Living", "Quality-aware output"],
  ["Make better decisions using data-driven, scientific insights.", "The prototype withholds stale or unsupported readings instead of filling gaps with invented values."],
  ["Longevity Generation", "Planned room mesh"],
  ["Build personalized systems that evolve with your biological needs.", "We are designing coordinated nodes across rooms; multi-room sensing and resident attribution still need validation."],
]);

const impactCopy = new Map([
  ["Our Impact", "Our Purpose"],
  ["Scale your wellness.", "More context for care."],
  ["Experience a modular stack designed for high-performance health optimization.", "Developing contactless sensing to support overnight care."],
  ["Efficiency", "Awareness"],
  ["Precision", "Comfort"],
  ["Growth", "Dignity"],
  ["Support", "Care teams"],
  ["Sarah Mitchel", "Our purpose"],
  ["Founder of Aura", "Supporting overnight care"],
  ["160+", "Radar"],
  ["Individual biomarkers tracked to provide a full picture of your health.", "Exploring contactless sensing of movement and presence in the room."],
  ["12k+", "Thermal"],
  ["Personalized health protocols generated for our global members.", "Using a thermal array to explore patterns in room activity."],
  ["98%", "Wi-Fi CSI"],
  ["Average improvement in sleep quality and nightly recovery scores.", "Sampling channel changes between a separate transmit node and the ESP32-S3 receiver on the bench."],
  ["24/7", "Care"],
  ["Continuous monitoring to catch health changes before they happen.", "Keeping assessment and response in the hands of the care team."],
]);

const impactDetails = new Map([
  ["Radar", ["60 GHz", "room-level sensing"]],
  ["Thermal", ["32 × 24", "thermal array"]],
  ["Wi-Fi CSI", ["C6 → S3", "bench sensing link"]],
  ["Care", ["Human review", "care team judgment"]],
]);

const approachCopy = new Map([
  ["Why us?", "Our approach"],
  ["Biological integrity in every layer.", "Built around the realities of care."],
  ["We aim to provide the high-fidelity foundation for your complex systems.", "Developing Syren around everyday routines, resident comfort and caregiver judgment."],
  ["We believe that high-performance health should be mathematically precise. Our framework empowers individuals to deploy complex wellness protocols", "Give care teams more context between check-ins, while keeping residents’ comfort and dignity central to the design."],
  ["Biological Precision", "Fits everyday routines"],
  ["We prioritize analytical rigor to ensure every recommendation serves your body.", "Explore room-based sensing without asking residents to wear or activate a device."],
  ["Systemic Growth", "Useful information"],
  ["We build scalable architectures that evolve alongside your biology's complex needs.", "Focus on activity that could help a caregiver decide what needs a closer look."],
  ["Integrated Delivery", "People make the decisions"],
  ["We eliminate friction to help you launch data-driven wellness routines.", "Present context for caregiver review, with clear limits on what the system can tell us."],
]);

const icons = {
  sensing: '<circle cx="12" cy="12" r="2"/><path d="M7.1 7.1a7 7 0 0 0 0 9.8m9.8-9.8a7 7 0 0 1 0 9.8M3.6 3.6a12 12 0 0 0 0 16.8m16.8-16.8a12 12 0 0 1 0 16.8"/>',
  wearable: '<path d="m10 3 1-2h4l2 5m-7 15 1 2h4l2-5M3 3l18 18"/><rect x="6" y="6" width="12" height="12" rx="3"/><path d="M12 8v4l2 2"/>',
  care: '<circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3m2-16a3 3 0 0 1 0 6m1 4a5 5 0 0 1 3 4v2"/>',
  night: '<path d="M21 13a9 9 0 1 1-10-10 7 7 0 0 0 10 10Z"/><path d="M18 2v4m-2-2h4"/>',
  dignity: '<path d="M12 3 3 7v6c0 5 9 9 9 9s9-4 9-9V7l-9-4Z"/><path d="M9 12c0-3 3-3 3-1 0-2 3-2 3 1 0 2-3 4-3 4s-3-2-3-4Z"/>',
  quality: '<path d="M12 3 4 6v6c0 5 3.5 7.8 8 9 4.5-1.2 8-4 8-9V6l-8-3Z"/><path d="m8.5 12 2.4 2.4 4.7-4.8"/>',
  mesh: '<circle cx="5" cy="6" r="2"/><circle cx="19" cy="6" r="2"/><circle cx="12" cy="18" r="2"/><path d="M6.8 7.2 10.7 16M17.2 7.2 13.3 16M7 6h10"/>',
  routine: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  context: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5M8 11h5M10.5 8.5v5"/>',
};

const benchVisual = `
  <div class="syren-feature-bench" data-syren-feature-bench="true" role="img" aria-label="Current single-room bench setup: a separate ESP32-C6 Wi-Fi transmitter sends a signal to an ESP32-S3 CSI receiver. The receiver also takes 60 GHz radar and 32 by 24 thermal inputs and sends a USB stream to a local dashboard.">
    <div class="syren-feature-bench__top"><span>Inside the bench setup</span><strong>Current prototype</strong></div>
    <h3>Three inputs.<br>One receiver.</h3>
    <p>Measured signal path in one room.</p>
    <div class="syren-feature-bench__wireless">
      <div><small>Separate TX</small><b>ESP32-C6</b></div>
      <span><i></i>Wi-Fi CSI<i></i></span>
      <div><small>Bench RX</small><b>ESP32-S3</b></div>
    </div>
    <div class="syren-feature-bench__inputs"><span>60 GHz radar</span><span>32 × 24 thermal</span><span>CSI samples</span></div>
    <div class="syren-feature-bench__footer"><span>USB → local dashboard</span><small>Engineering data</small></div>
  </div>
`;

const heroShowcase = `
  <button type="button" class="syren-hero-showcase" data-syren-demo-trigger aria-label="Explore the interactive clinic dashboard preview with synthetic data">
    <div class="syren-hero-showcase__heading"><span>Care, in context</span><span>Interface preview</span></div>
    <div class="syren-hero-showcase__window">
      <div class="syren-hero-showcase__bar"><i></i><i></i><i></i><span>Clinic overview · Synthetic data</span></div>
      <img src="/syren/clinic-overview-wide.png" width="1440" height="1050" alt="Current clinic dashboard interface with synthetic resident records" />
    </div>
    <div class="syren-hero-showcase__bottom"><span>Explore the dashboard demo</span><span aria-hidden="true">↗</span></div>
    <p>Clinic interface uses synthetic records. Hardware integration is in development.</p>
  </button>
`;

function addHeroShowcase(root, hero) {
  const stats = hero.querySelector('[data-framer-name="Hero stats"]');
  if (!stats || hero.querySelector(".syren-hero-showcase")) return;
  const template = root.createElement("template");
  template.innerHTML = heroShowcase.trim();
  stats.before(template.content.cloneNode(true));
}

function renderBenchVisual(root, picture) {
  if (!picture || picture.dataset.syrenBenchVisual) return;
  const template = root.createElement("template");
  template.innerHTML = benchVisual.trim();
  picture.replaceChildren(template.content.cloneNode(true));
  picture.dataset.syrenBenchVisual = "true";
}

function labelRoomConcept(root, image) {
  const frame = image?.parentElement?.parentElement;
  if (!frame || frame.querySelector("[data-syren-room-concept]")) return;
  frame.dataset.syrenRoomFrame = "true";
  const label = root.createElement("span");
  label.dataset.syrenRoomConcept = "true";
  label.textContent = "Illustrative room placement";
  frame.append(label);
}

function addImpactDetails(root, section) {
  section?.querySelectorAll('[data-framer-name="Title"] p').forEach((heading) => {
    const content = impactDetails.get(heading.textContent.trim());
    const card = heading.closest('[data-framer-name="Desktop"],[data-framer-name="Tablet"],[data-framer-name="Mobile"]');
    if (!content || !card || card.querySelector('[data-syren-impact-detail]')) return;
    card.dataset.syrenImpactCard = "true";
    const detail = root.createElement("div");
    detail.dataset.syrenImpactDetail = "true";
    const value = root.createElement("strong");
    const description = root.createElement("span");
    value.textContent = content[0];
    description.textContent = content[1];
    detail.append(value, description);
    card.querySelector('[data-framer-name="Description"]')?.before(detail);
  });
}

function replaceCopy(root, copy) {
  root?.querySelectorAll("h1,h2,h3,h4,p").forEach((element) => {
    const replacement = copy.get(element.textContent.trim());
    if (!replacement) return;
    // Preserve the original strong/span typography wrappers.
    const leaf = element.children.length === 1 && element.firstElementChild.children.length === 0
      ? element.firstElementChild : element;
    leaf.textContent = replacement;
  });
}

function replaceIcon(svg, name) {
  if (!svg || svg.dataset.syrenIcon) return;
  svg.innerHTML = icons[name];
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "#26211a");
  svg.setAttribute("stroke-width", "1.5");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true");
  svg.dataset.syrenIcon = name;
}

export function applyScopedHomeContent(root) {
  applySiteChrome(root);
  const hero = [...root.querySelectorAll('section[data-framer-name="Hero Section"]')]
    .find((section) => section.dataset.syrenHome || section.querySelector("h1")?.textContent.trim() === "Better health through data");
  if (!hero) return;
  hero.dataset.syrenHome = "true";
  hero.id = "top";
  replaceCopy(hero, heroCopy);
  addHeroShowcase(root, hero);
  hero.querySelectorAll("a[href]").forEach((anchor) => {
    const original = anchor.querySelector("p")?.textContent.trim();
    const label = original === "Request Access" ? "See how it works" : original === "Book a Demo" ? "Get in Touch" : null;
    if (!label) return;
    anchor.querySelectorAll("p").forEach((p) => { p.textContent = label; });
    anchor.setAttribute("href", original === "Request Access" ? "/#how-it-works" : "/contact");
    anchor.removeAttribute("target");
  });
  const stats = hero.querySelector('[data-framer-name="Hero stats"]');
  stats?.querySelectorAll('[data-framer-name="Icon"] svg').forEach((svg) => {
    const card = svg.closest('[data-framer-name="Desktop"],[data-framer-name="Mobile"],[data-framer-name="Tablet"]') || svg.parentElement.parentElement;
    const text = card.textContent;
    replaceIcon(svg, text.includes("Contactless sensing") ? "sensing" : text.includes("No wearable needed") ? "wearable" : "care");
  });

  const impact = root.querySelector('section[data-framer-name="Impact Section"]');
  replaceCopy(impact, impactCopy);
  addImpactDetails(root, impact);
  const oldRating = impact?.querySelector('[data-framer-name="Stars"]');
  if (oldRating) {
    oldRating.replaceChildren("Development goal");
    oldRating.dataset.syrenPurposeLabel = "true";
  }
  // Preserve the original emphasis nodes and all motion hooks in the purpose card.
  const purpose = [...(impact?.querySelectorAll("p") || [])]
    .find((p) => p.textContent.includes("has completely changed how I track"));
  if (purpose) {
    purpose.querySelector("strong").textContent = "Syren Health";
    [...purpose.childNodes].filter((node) => node.nodeType === 3 && node.textContent.trim())
      .forEach((node) => { node.textContent = "is being developed to support more informed overnight care."; });
  }

  applyHowItWorks(root);
  applyTechnicalProof(root);
  applyProgressSection(root);
  const approach = root.querySelector('section[data-framer-name="About Section"]');
  if (approach) {
    approach.id = "approach";
    approach.style.scrollMarginTop = "96px";
  }
  replaceCopy(approach, approachCopy);
  const approachImage = approach?.querySelector("img");
  if (approachImage) {
    approachImage.setAttribute("src", "/syren/approach-room-v1.webp");
    approachImage.removeAttribute("srcset");
    approachImage.setAttribute("alt", "Illustrative Syren room placement with a concept enclosure on a bedside table; not a deployed installation.");
    labelRoomConcept(root, approachImage);
  }
  approach?.querySelectorAll("h4").forEach((heading) => {
    const card = heading.closest('[data-framer-name="Default"]');
    const icon = card?.querySelector('[data-framer-name="Icon"] svg');
    const name = heading.textContent;
    replaceIcon(icon, name.includes("routines") ? "routine" : name.includes("information") ? "context" : "care");
  });

  const features = root.querySelector("#features");
  replaceCopy(features, featureCopy);
  if (!features) return;
  features.style.scrollMarginTop = "96px";
  features.querySelectorAll("h4").forEach((heading) => {
    const card = heading.closest('[data-framer-name="Desktop"],[data-framer-name="Mobile"],[data-framer-name="Tablet"]');
    const name = heading.textContent;
    replaceIcon(card?.querySelector("svg"), name.includes("sensing") ? "sensing" : name.includes("Overnight") ? "night" : name.includes("Quality") ? "quality" : "mesh");
  });
  const picture = features.querySelector('[data-framer-name="Center image"]');
  if (picture) {
    picture.id = "device";
    picture.style.scrollMarginTop = "110px";
    renderBenchVisual(root, picture);
  }
  // Lead with care and the interactive product preview; keep detailed
  // prototype specifications together near the end of the page.
  const faq = root.querySelector("#faq");
  const engineering = root.querySelector("#engineering");
  const progress = root.querySelector('#testimonials[data-syren-progress="true"]');
  if (faq && impact && engineering && progress) faq.before(features, impact, progress, engineering);
}
