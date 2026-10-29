// Shared Syren copy for captured navigation, FAQ and footer markup.
// Keep the original Framer component structure so its responsive styles and
// interaction templates continue to work.

export const faqContent = [
  {
    source: "How do I prepare for my initial biomarker test?",
    question: "What is Syren Health building?",
    answer:
      "Syren Health is developing a contactless room-monitoring prototype for senior-care settings. The goal is to give care teams more context about overnight activity between routine check-ins.",
  },
  {
    source: "Is my personal health data kept private and secure?",
    question: "Does a resident need to wear anything?",
    answer:
      "No. Avoiding a wearable, charging routine or resident-activated button is a core design goal. Syren is being explored as a room-based system.",
  },
  {
    source: "How long does it take to receive my health results?",
    question: "What kinds of sensing is Syren exploring?",
    answer:
      "The bench prototype combines a 60 GHz radar, a 32 × 24 thermal array and ESP32-S3 Wi-Fi CSI with a separate transmit node. It explores presence and movement; physiological accuracy and clinical use have not been validated. A coordinated multi-room mesh is planned, not deployed.",
  },
  {
    source: "Can I share my reports with my primary care physician?",
    question: "Does Syren make care decisions?",
    answer:
      "No. Syren is designed to surface context for human review. A caregiver remains responsible for assessing the situation and deciding what to do.",
  },
  {
    source: "Do I need a wearable device to use the platform?",
    question: "How is resident privacy being considered?",
    answer:
      "Resident dignity and privacy are design requirements. The product’s data handling and security details are still being defined, so we are not claiming certifications or a finished privacy model yet.",
  },
  {
    source: "How often should I re-test my biological markers?",
    question: "How can care teams or families get involved?",
    answer:
      "Use the contact page to share how overnight care works in your setting. We welcome research conversations with care professionals and families while the prototype is in development.",
  },
];

export const faqQuestions = faqContent.map(({ question }) => question);

const navigation = {
  "/about": ["About", "/#approach"],
  "/pricing": ["Device", "/#device"],
  "/success-stories": ["Experience", "/#care-experience"],
  "/news": ["Contact", "/contact"],
};

const footerGroups = [
  { heading: "Explore", links: [["Home", "/#top"], ["About", "/#approach"]] },
  { heading: "Product", links: [["Device", "/#device"], ["Features", "/#features"]] },
  { heading: "Learn", links: [["How it works", "/#how-it-works"], ["Our progress", "/#testimonials"]] },
  { heading: "Connect", links: [["FAQ", "/#faq"], ["Contact", "/contact"]] },
];

function documentFor(root) {
  return root.nodeType === 9 ? root : root.ownerDocument;
}

function setText(element, value) {
  if (element) element.textContent = value;
}

function replaceLogo(root, logo, { width = "167px", height = "25px" } = {}) {
  if (!logo || logo.dataset.syrenBrand === "true") return;
  const image = logo.querySelector("img");
  if (!image) return;
  const text = documentFor(root).createElement("span");
  text.textContent = "Syren Health";
  text.style.cssText =
    "font:700 26px/25px Domine,serif;color:#26211a;white-space:nowrap;display:block";
  const imageWrapper = image.closest('[data-framer-background-image-wrapper="true"]');
  (imageWrapper || image).replaceWith(text);
  logo.style.width = width;
  logo.style.height = height;
  logo.style.aspectRatio = "auto";
  logo.setAttribute("aria-label", "Syren Health home");
  logo.dataset.syrenBrand = "true";
}

function adaptNavigation(root) {
  root.querySelectorAll("nav").forEach((nav) => {
    replaceLogo(root, nav.querySelector('[data-framer-name="Logo"]'));
    nav.querySelectorAll("a[href]").forEach((anchor) => {
      if (anchor.dataset.syrenNavLink || anchor.dataset.syrenCta) return;
      if (anchor.querySelector('[data-framer-name="Text wrapper"]')) {
        anchor.querySelectorAll("p").forEach((paragraph) => setText(paragraph, "Get in Touch"));
        anchor.setAttribute("href", "/contact");
        anchor.dataset.syrenCta = "true";
        return;
      }
      const next = navigation[anchor.getAttribute("href")];
      if (!next) return;
      const [label, href] = next;
      anchor.querySelectorAll("p").forEach((paragraph) => setText(paragraph, label));
      anchor.setAttribute("href", href);
      anchor.dataset.syrenNavLink = "true";
    });
  });
}

function adaptFaq(root) {
  root.querySelectorAll('section[data-framer-name="FAQ Section"]').forEach((faq) => {
    faq.id = "faq";
    faq.style.scrollMarginTop = "96px";
    [...faq.querySelectorAll("h2,h3,p")].forEach((element) => {
      const original = element.textContent.trim();
      if (original.replace(/\s+/g, "") === "NeedHelp?We'reheretoassist.") {
        const lineBreak = element.querySelector("br") || documentFor(root).createElement("br");
        element.replaceChildren("Questions about Syren?", lineBreak, "What we know so far.");
      }
      if (original === "We aim to provide absolute clarity regarding your biological data and personalized wellness protocols.") {
        setText(element, "Clear answers about the prototype, its limits and the people it is designed to support.");
      }
    });
    faq.querySelectorAll('a[href]').forEach((anchor) => {
      if (anchor.textContent.trim() !== "Contact us") return;
      anchor.setAttribute("href", "/contact");
      anchor.removeAttribute("target");
    });
  });
  // Some captured interaction states contain only the accordion item rather
  // than its FAQ section. Adapt those templates too so opening an item cannot
  // restore the old Luvia question or answer.
  root.querySelectorAll('div[tabindex="0"]').forEach((item) => {
    const question = item.querySelector('[data-framer-name="Question"] p');
    const current = question?.textContent.trim();
    const index = faqContent.findIndex(({ source, question: next }) => current === source || current === next);
    if (index < 0) return;
    const content = faqContent[index];
    setText(question, content.question);
    setText(item.querySelector('[data-framer-name="Answer"] p'), content.answer);
    item.dataset.syrenFaqIndex = String(index);
  });
}

function makeFooterContact(root, subscribe) {
  const form = subscribe?.querySelector("form");
  if (!form) return;
  const documentNode = documentFor(root);
  const contact = documentNode.createElement("div");
  contact.dataset.syrenFooterContact = "true";
  contact.style.cssText =
    "width:100%;height:auto;display:flex;position:relative;flex-direction:row;align-items:center;gap:10px;flex-wrap:wrap";

  const prompt = documentNode.createElement("p");
  prompt.textContent = "Have a question or want to share a care need?";
  prompt.style.cssText =
    "flex:1 1 180px;margin:0;padding:16px;border-radius:8px;font:400 15px/20px Inter,sans-serif;background:var(--token-3ea65dd5-9044-4fec-8f79-f735b9e5d6e6,rgb(244,238,224));color:var(--token-b29437c0-4348-4f95-a3c3-54a5c6056a15,rgb(38,33,26))";

  const link = documentNode.createElement("a");
  link.href = "/contact";
  link.textContent = "Contact Syren";
  link.style.cssText =
    "display:flex;min-height:48px;align-items:center;justify-content:center;padding:0 18px;border-radius:8px;font:400 16px/1 Inter,sans-serif;text-decoration:none;white-space:nowrap;background:var(--token-b29437c0-4348-4f95-a3c3-54a5c6056a15,rgb(38,33,26));color:var(--token-36f469e6-c60a-402e-b209-85fdd4598bd0,rgb(255,255,255))";

  contact.append(prompt, link);
  form.replaceWith(contact);
}

function adaptFooter(root) {
  root.querySelectorAll("footer").forEach((footer) => {
    if (footer.dataset.syrenFooter === "true") return;
    replaceLogo(root, footer.querySelector('[data-framer-name="Logo"]'));

    const brand = footer.querySelector('[data-framer-name="Brand"]');
    const tagline = [...(brand?.querySelectorAll("p") || [])].find((paragraph) =>
      paragraph.textContent.includes("high-fidelity foundation"),
    );
    setText(tagline, "Developing contactless overnight awareness for senior care.");
    makeFooterContact(root, footer.querySelector('[data-framer-name="Subscribe"]'));

    const columns = [...footer.querySelectorAll('[data-framer-name="Footer column"]')];
    const linkWrappers = [...footer.querySelectorAll('[data-framer-name="Footer columns"] a[href]')]
      .slice(0, 8)
      .map((anchor) => anchor.parentElement);
    columns.slice(0, 4).forEach((column, columnIndex) => {
      setText(column.querySelector("strong"), footerGroups[columnIndex].heading);
      const links = column.querySelector('[data-framer-name="Links"]');
      if (!links) return;
      links.replaceChildren();
      footerGroups[columnIndex].links.forEach(([label, href], linkIndex) => {
        const wrapper = linkWrappers[columnIndex * 2 + linkIndex];
        const anchor = wrapper?.querySelector("a[href]");
        if (!wrapper || !anchor) return;
        anchor.setAttribute("href", href);
        anchor.removeAttribute("target");
        anchor.removeAttribute("data-framer-page-link-current");
        anchor.querySelectorAll("p").forEach((paragraph) => setText(paragraph, label));
        anchor.dataset.syrenFooterLink = "true";
        links.append(wrapper);
      });
    });

    const copyright = footer.querySelector('[data-framer-name="Copyright"]');
    const copyrightText = [...(copyright?.querySelectorAll("p") || [])].find((paragraph) =>
      paragraph.textContent.includes("All rights reserved"),
    );
    setText(copyrightText, "© 2026 Syren Health. All rights reserved.");

    const author = footer.querySelector('[data-framer-name="Author"]');
    const sourceLink = author?.querySelector("a");
    const sourceText = author?.querySelector("p");
    if (sourceLink && sourceText) {
      sourceLink.setAttribute("href", "https://www.framer.com/marketplace/templates/luvia/");
      sourceLink.setAttribute("target", "_blank");
      sourceLink.setAttribute("rel", "noopener noreferrer");
      sourceLink.textContent = "Luvia on Framer";
      sourceText.replaceChildren("Source: ", sourceLink);
    }
    footer.dataset.syrenFooter = "true";
  });
}

export function applySiteChrome(root) {
  adaptNavigation(root);
  adaptFaq(root);
  adaptFooter(root);
}
