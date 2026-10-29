import "./how-it-works.css";

const steps = [
  {
    number: "1",
    label: "Room awareness",
    title: "Awareness through the night.",
    description: "More context between caregiver check-ins.",
    href: "/#device",
  },
  {
    number: "2",
    label: "Contactless sensing",
    title: "Radar, thermal and Wi-Fi CSI.",
    description: "Three sensing streams on the bench.",
    href: "/#features",
  },
  {
    number: "3",
    label: "Caregiver review",
    title: "An actual dashboard UI.",
    description: "Explore an interactive preview with synthetic records.",
    href: "/#engineering",
  },
];

const cardVisuals = [
  `<div class="syren-how-visual syren-how-visual--room" data-syren-how-visual="room">
    <img src="/syren/approach-room-v1.webp" width="1450" height="1086" alt="Illustrative bedside placement in a resident room; this is a concept render, not a deployed device." loading="lazy" decoding="async" />
    <div class="syren-how-visual__room-shade"></div>
    <div class="syren-how-visual__top"><span>01 / Room awareness</span><span class="syren-how-visual__tag">Placement concept</span></div>
    <div class="syren-how-visual__room-copy"><h3>Awareness through the night.</h3><p>More context between caregiver check-ins.</p><span class="syren-how-visual__arrow" aria-hidden="true">↗</span></div>
  </div>`,
  `<div class="syren-how-visual syren-how-visual--sensing" data-syren-how-visual="sensing">
    <div class="syren-how-visual__top"><span>02 / Contactless sensing</span><span class="syren-how-visual__tag">Bench setup</span></div>
    <h3>Three sensing streams.<br>One room.</h3>
    <p class="syren-how-visual__lead">60 GHz radar · 32 × 24 thermal · Wi-Fi CSI</p>
    <div class="syren-how-visual__bench" aria-label="Separate ESP32-C6 transmitter sends a wireless signal to an ESP32-S3 receiver that captures CSI alongside wired radar and thermal inputs.">
      <div class="syren-how-visual__bench-node"><small>ESP32-C6</small><strong>TX node</strong></div>
      <div class="syren-how-visual__rf"><span>Wi-Fi signal</span><i></i></div>
      <div class="syren-how-visual__bench-node syren-how-visual__bench-node--rx"><small>ESP32-S3</small><strong>CSI receiver</strong></div>
    </div>
    <div class="syren-how-visual__inputs"><span>60 GHz radar</span><span>Thermal array</span><span>CSI samples</span></div>
    <div class="syren-how-visual__foot"><span>Measured on one bench link</span><span class="syren-how-visual__arrow" aria-hidden="true">↗</span></div>
  </div>`,
  `<div class="syren-how-visual syren-how-visual--dashboard" data-syren-how-visual="dashboard">
    <div class="syren-how-visual__top"><span>03 / Caregiver review</span><span class="syren-how-visual__tag">Current UI</span></div>
    <h3>A real clinic<br>dashboard.</h3>
    <p class="syren-how-visual__lead">Care-team overview, attention queue and monitoring status.</p>
    <div class="syren-how-visual__screen"><div class="syren-how-visual__screen-bar"><span></span><span></span><span></span><strong>Clinic overview · Demo</strong></div><img src="/syren/clinic-overview-card.png" width="900" height="1200" alt="Actual Syren clinic overview interface with synthetic resident records, an attention queue and monitoring coverage." loading="lazy" decoding="async" /></div>
    <div class="syren-how-visual__foot"><span>Explore demo · synthetic data</span><span class="syren-how-visual__arrow" aria-hidden="true">↗</span></div>
  </div>`,
];

function setText(element, value) {
  if (element) element.textContent = value;
}

function replaceCardMedia(root, card, index) {
  if (card.querySelector("[data-syren-how-visual]")) return;
  const current = card.querySelector("video,img[data-syren-how-image]");
  if (!current) return;
  const template = root.createElement("template");
  template.innerHTML = cardVisuals[index].trim();
  current.replaceWith(template.content.cloneNode(true));
}

export function applyHowItWorks(root) {
  const section = root.querySelector('section[data-framer-name="Services Section"]');
  if (!section) return;

  section.id = "how-it-works";
  section.dataset.syrenHowItWorks = "true";

  const heading = section.querySelector('[data-framer-name="Heading"]');
  setText(heading?.querySelector("p"), "How it works");
  setText(heading?.querySelector("h2"), "From room awareness to informed care.");

  const supportingCopy = [...section.querySelectorAll("p")].find((paragraph) =>
    paragraph.textContent.includes("We help high-performers"),
  );
  setText(
    supportingCopy,
    "An illustrated room concept, a measured sensing bench and the current clinic interface.",
  );

  const cards = [
    ...section.querySelectorAll('a[href*="/success-stories/"]'),
    ...section.querySelectorAll('a[data-syren-how-card="true"]'),
  ].filter((card, index, all) => all.indexOf(card) === index);

  cards.slice(0, steps.length).forEach((card, index) => {
    const step = steps[index];
    card.dataset.syrenHowCard = "true";
    card.dataset.syrenHowStep = step.number;
    card.setAttribute("href", step.href);
    card.setAttribute(
      "aria-label",
      `${step.number}. ${step.label}. ${step.title} ${step.description}`,
    );

    setText(card.querySelector("h4"), step.title);
    setText(card.querySelector("strong"), step.number);
    setText(card.querySelector('[data-framer-name="Stat"] .framer-m5clq p'), step.description);
    replaceCardMedia(root, card, index);
  });
}
