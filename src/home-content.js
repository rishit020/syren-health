import { applyHowItWorks } from "./how-it-works.js";
import { applyProgressSection } from "./progress-section.js";
import { applySiteChrome } from "./site-chrome.js";
import { applyTechnicalProof } from "./technical-proof.js";

// Content-only adaptation. Keep the captured component tree, CSS and motion.
export const homeTitle = "Syren Health | Contactless Overnight Awareness";

const heroCopy = new Map([
  ["Better health through data", "Awareness for overnight care."],
  ["Stop managing symptoms and start engineering your vitality. Luvia integrates deep biomarker analysis with real-time AI insights.", "Syren Health is developing contactless room monitoring to help care teams notice overnight activity that may need a closer look."],
  ["+500 Members", "Contactless sensing"],
  ["Helping high-performers", "Room-based monitoring"],
  ["+15 Years of longevity", "Radar · thermal · Wi-Fi CSI"],
  ["Focused on extending healthspan", "Designed for resident comfort"],
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
};

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
  hero.querySelectorAll("a[href]").forEach((anchor) => {
    const original = anchor.querySelector("p")?.textContent.trim();
    const label = original === "Request Access" ? "Explore the Device" : original === "Book a Demo" ? "Get in Touch" : null;
    if (!label) return;
    anchor.querySelectorAll("p").forEach((p) => { p.textContent = label; });
    anchor.setAttribute("href", original === "Request Access" ? "/#device" : "/contact");
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
    approachImage.setAttribute("alt", "Syren prototype on a bedside table in an empty, warmly lit resident room.");
  }

  const features = root.querySelector("#features");
  replaceCopy(features, featureCopy);
  if (!features) return;
  features.style.scrollMarginTop = "96px";
  features.querySelectorAll("h4").forEach((heading) => {
    const card = heading.closest('[data-framer-name="Desktop"],[data-framer-name="Mobile"],[data-framer-name="Tablet"]');
    const name = heading.textContent;
    replaceIcon(card?.querySelector("svg"), name.includes("Sensing") ? "sensing" : name.includes("Overnight") ? "night" : name.includes("Human") ? "care" : "dignity");
  });
  const picture = features.querySelector('[data-framer-name="Center image"]');
  const image = picture?.querySelector("img");
  if (image) {
    picture.id = "device";
    picture.style.scrollMarginTop = "110px";
    image.setAttribute("src", "/syren/device-warm-v1.webp");
    image.setAttribute("srcset", "/syren/device-warm-v1-640.webp 640w, /syren/device-warm-v1-960.webp 960w, /syren/device-warm-v1.webp 1145w");
    image.setAttribute("width", "1145");
    image.setAttribute("height", "1374");
    image.setAttribute("alt", "Concept image of the Syren Health prototype on a warm stone bedside surface, with its silver enclosure, recessed sensor and branded front visible.");
    image.style.objectFit = "cover";
    image.style.backgroundColor = "#f3eddf";
  }
}
