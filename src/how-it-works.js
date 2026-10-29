import "./how-it-works.css";

const steps = [
  {
    number: "1",
    label: "Room awareness",
    title: "Awareness through the night.",
    description: "More context between caregiver check-ins.",
    href: "/#approach",
  },
  {
    number: "2",
    label: "Designed around care",
    title: "More context. Less disruption.",
    description: "Explore the contactless sensing design.",
    href: "/#features",
  },
  {
    number: "3",
    label: "Caregiver review",
    title: "A clearer view for care teams.",
    description: "Explore the clinic dashboard with synthetic records.",
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
    <div class="syren-how-visual__top"><span>02 / Designed around care</span><span class="syren-how-visual__tag">In development</span></div>
    <h3>More context.<br>Less disruption.</h3>
    <p class="syren-how-visual__lead">Designed to fit into the rhythms of care.</p>
    <div class="syren-how-visual__capabilities">
      <div><span aria-hidden="true">✦</span><div><strong>Contactless by design</strong><small>No wearable to remember</small></div></div>
      <div><span aria-hidden="true">◷</span><div><strong>Overnight context</strong><small>Explore activity between check-ins</small></div></div>
      <div><span aria-hidden="true">↗</span><div><strong>Caregiver review</strong><small>People make the decisions</small></div></div>
    </div>
    <div class="syren-how-visual__foot"><span>See how sensing works</span><span class="syren-how-visual__arrow" aria-hidden="true">↗</span></div>
  </div>`,
  `<div class="syren-how-visual syren-how-visual--dashboard" data-syren-how-visual="dashboard">
    <div class="syren-how-visual__top"><span>03 / Caregiver review</span><span class="syren-how-visual__tag">Current UI</span></div>
    <h3>A clearer view<br>for care teams.</h3>
    <p class="syren-how-visual__lead">A sample overview for caregiver review.</p>
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
    "Designed around comfort, overnight awareness and caregiver review. Syren is in development.",
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
