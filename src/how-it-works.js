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
    title: "Radar meets thermal.",
    description: "Exploring movement and room activity.",
    href: "/#features",
    image: "card-sensing-approved",
    alt: "Syren device concept with separate radar and thermal illustrations.",
  },
  {
    number: "3",
    label: "Caregiver review",
    title: "Context for the care team.",
    description: "An overview built around caregiver review.",
    href: "/contact",
    image: "card-caregiver-approved",
    alt: "Caregiver dashboard concept with fictional sample data shown on a tablet in a warm room.",
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
  image.setAttribute("src", `/syren/${step.image}.webp`);
  image.setAttribute(
    "srcset",
    `/syren/${step.image}-640.webp 640w, /syren/${step.image}-960.webp 960w, /syren/${step.image}.webp 1086w`,
  );
  image.setAttribute(
    "sizes",
    "(min-width: 1200px) 387px, (min-width: 810px) calc((100vw - 80px) / 3), calc(100vw - 32px)",
  );
  image.setAttribute("width", "1086");
  image.setAttribute("height", "1448");
  image.setAttribute("alt", step.alt);
  image.setAttribute("decoding", "async");
  image.setAttribute("loading", "lazy");
  image.setAttribute(
    "style",
    "display:block;width:100%;height:100%;object-fit:contain;object-position:center;border-radius:0",
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
