import "./how-it-works.css";

const steps = [
  {
    number: "1",
    label: "Room awareness",
    title: "Awareness through the night.",
    description: "More context between caregiver check-ins.",
    href: "/#device",
    image: "card-room-approved",
    alt: "Warm bedroom with a room-activity concept graph and the Syren device on a bedside shelf.",
  },
  {
    number: "2",
    label: "Contactless sensing",
    title: "Radar, thermal and Wi-Fi CSI.",
    description: "Three sensing streams on the bench.",
    href: "/#features",
    image: "card-sensing-approved",
    alt: "Syren device concept with separate radar and thermal illustrations.",
  },
  {
    number: "3",
    label: "Caregiver review",
    title: "An actual dashboard UI.",
    description: "Current clinic interface with synthetic records.",
    href: "/#engineering",
    image: "clinic-overview-card",
    alt: "Screenshot of the actual Syren clinic overview UI showing a demo environment, synthetic resident records, an attention queue and monitoring coverage.",
  },
];

function setText(element, value) {
  if (element) element.textContent = value;
}

function replaceCardMedia(root, card, step) {
  const current = card.querySelector("video,img[data-syren-how-image]");
  if (!current) return;

  const image = root.createElement("img");
  image.dataset.syrenHowImage = step.image;
  const screenshot = step.image === "clinic-overview-card";
  image.setAttribute("src", `/syren/${step.image}.${screenshot ? "png" : "webp"}`);
  if (!screenshot) image.setAttribute(
    "srcset",
    `/syren/${step.image}-640.webp 640w, /syren/${step.image}-960.webp 960w, /syren/${step.image}.webp 1086w`,
  );
  image.setAttribute(
    "sizes",
    "(min-width: 1200px) 387px, (min-width: 810px) calc((100vw - 80px) / 3), calc(100vw - 32px)",
  );
  image.setAttribute("width", screenshot ? "900" : "1086");
  image.setAttribute("height", screenshot ? "1200" : "1448");
  image.setAttribute("alt", step.alt);
  image.setAttribute("decoding", "async");
  image.setAttribute("loading", "lazy");
  image.setAttribute(
    "style",
    `display:block;width:100%;height:100%;object-fit:${screenshot ? "cover" : "contain"};object-position:${screenshot ? "top left" : "center"};border-radius:0`,
  );
  current.replaceWith(image);
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
    "A closer look at the Syren concept, from contactless sensing to caregiver review.",
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
    replaceCardMedia(root, card, step);
  });
}
