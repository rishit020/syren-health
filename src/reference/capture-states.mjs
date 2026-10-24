import fs from "node:fs/promises";
import path from "node:path";

import { launch, settle, freezeMedia, viewports } from "../../scripts/browser.mjs";

const origin = "https://luvia.framer.website";
const outputDir = "public/reference/states";

await fs.mkdir(outputDir, { recursive: true });

const browser = await launch();
const context = await browser.newContext({
  deviceScaleFactor: 1,
  viewport: viewports.laptop,
});

// Interaction reference work must never submit a production form or emit Framer analytics.
await context.route(
  /events\.framer\.com|api\.framer\.com\/forms|framer\.com\/forms/,
  (route) => route.abort(),
);

const page = await context.newPage();
page.setDefaultTimeout(20_000);

async function open(route, viewport) {
  await page.setViewportSize(viewport);
  await page.goto(origin + route, { waitUntil: "domcontentloaded", timeout: 45_000 });
  await settle(page, 900);
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      [...document.images].map((image) =>
        image.complete
          ? Promise.resolve()
          : new Promise((resolve) => {
              image.onload = image.onerror = resolve;
              setTimeout(resolve, 1_500);
            }),
      ),
    );
  });
}

async function snapshot(name, details = {}) {
  if (name.startsWith("hover-")) {
    await page.waitForTimeout(3400);
    await freezeMedia(page);
  }
  const screenshot = `${outputDir}/${name}.png`;
  await page.screenshot({ path: screenshot, animations: "disabled" });

  const data = await page.evaluate(() => {
    const attributes = (element) =>
      Object.fromEntries([...element.attributes].map((attribute) => [attribute.name, attribute.value]));
    const rect = (element) => {
      const box = element.getBoundingClientRect();
      return {
        x: box.x,
        y: box.y,
        pageY: box.y + window.scrollY,
        width: box.width,
        height: box.height,
      };
    };
    const styleProperties = [
      "display",
      "position",
      "opacity",
      "transform",
      "color",
      "backgroundColor",
      "borderColor",
      "borderRadius",
      "boxShadow",
      "fontFamily",
      "fontSize",
      "fontWeight",
      "lineHeight",
      "padding",
      "gap",
      "height",
      "maxHeight",
      "overflow",
    ];
    const computed = (element) => {
      const styles = getComputedStyle(element);
      return Object.fromEntries(styleProperties.map((property) => [property, styles[property]]));
    };
    const clone = document.body.cloneNode(true);
    clone.querySelectorAll("script,noscript").forEach((element) => element.remove());
    clone
      .querySelectorAll('[data-capture-target="true"]')
      .forEach((element) => element.removeAttribute("data-capture-target"));
    const css = [...document.styleSheets]
      .map((sheet) => {
        try {
          return [...sheet.cssRules].map((rule) => rule.cssText).join("\n");
        } catch {
          return "";
        }
      })
      .join("\n");

    const highlighted = [...document.querySelectorAll('[data-capture-target="true"]')];
    const targets = highlighted.map((element) => ({
      tag: element.tagName,
      text: (element.innerText || element.getAttribute("aria-label") || "").trim().slice(0, 240),
      attrs: attributes(element),
      rect: rect(element),
      styles: computed(element),
      outerHtml: element.outerHTML,
      descendants: [...element.querySelectorAll("*")].slice(0, 24).map((child) => ({
        tag: child.tagName,
        text: (child.innerText || child.getAttribute("aria-label") || "").trim().slice(0, 120),
        attrs: attributes(child),
        styles: computed(child),
      })),
    }));

    highlighted.forEach((element) => element.removeAttribute("data-capture-target"));

    return {
      url: location.href,
      title: document.title,
      viewport: { width: innerWidth, height: innerHeight },
      scroll: { x: scrollX, y: scrollY },
      activeElement: document.activeElement
        ? {
            tag: document.activeElement.tagName,
            attrs: attributes(document.activeElement),
            text: (document.activeElement.innerText || "").trim().slice(0, 120),
          }
        : null,
      bodyHtml: clone.innerHTML,
      css,
      bodyAttrs: attributes(document.body),
      htmlAttrs: attributes(document.documentElement),
      targets,
    };
  });

  Object.assign(data, details, { screenshot: path.basename(screenshot) });
  await fs.writeFile(`${outputDir}/${name}.json`, JSON.stringify(data));
  console.log(`STATE_CAPTURED ${name}`);
}

async function target(locator) {
  await locator.evaluate((element) => element.setAttribute("data-capture-target", "true"));
}

async function mobileMenu(viewportName) {
  const viewport = viewports[viewportName];
  await open("/", viewport);
  const menu = page.locator('div[tabindex="0"]').first();
  await target(page.locator("nav").first());
  await target(menu);
  await snapshot(`mobile-menu-${viewportName}-closed`, {
    path: "/",
    state: "mobile-menu-closed",
    selectors: { navigation: "nav", toggle: 'div[tabindex="0"]' },
  });

  await menu.click();
  await page.waitForTimeout(350);
  await target(page.locator("nav").first());
  await target(menu);
  await snapshot(`mobile-menu-${viewportName}-open`, {
    path: "/",
    state: "mobile-menu-open",
    selectors: { navigation: "nav", toggle: 'div[tabindex="0"]' },
  });
}

async function faqStates(viewportName) {
  await open("/", viewports[viewportName]);
  const first = page.getByText("How do I prepare for my initial biomarker test?", { exact: true }).first();
  const second = page
    .getByText("Is my personal health data kept private and secure?", { exact: true })
    .first();

  await first.click();
  await page.waitForTimeout(250);
  await target(first.locator("xpath=ancestor::*[@tabindex='0'][1]"));
  await snapshot(`faq-${viewportName}-open-1`, {
    path: "/",
    state: "faq-open-1",
    selectors: {
      firstQuestion: "text=How do I prepare for my initial biomarker test?",
      secondQuestion: "text=Is my personal health data kept private and secure?",
    },
  });

  await second.click();
  await page.waitForTimeout(250);
  await target(first.locator("xpath=ancestor::*[@tabindex='0'][1]"));
  await target(second.locator("xpath=ancestor::*[@tabindex='0'][1]"));
  await snapshot(`faq-${viewportName}-open-1-2`, {
    path: "/",
    state: "faq-open-1-2",
    selectors: {
      firstQuestion: "text=How do I prepare for my initial biomarker test?",
      secondQuestion: "text=Is my personal health data kept private and secure?",
    },
  });

  const remainingQuestions = [
    "How long does it take to receive my health results?",
    "Can I share my reports with my primary care physician?",
    "Do I need a wearable device to use the platform?",
    "How often should I re-test my biological markers?",
  ];
  for (const question of remainingQuestions) {
    await page.getByText(question, { exact: true }).first().click();
    await page.waitForTimeout(120);
  }
  // FAQ variants animate their measured height. Capture only the fully settled
  // state so locally inserted items never inherit a clipped intermediate size.
  await page.waitForTimeout(2_300);
  const allQuestions = [
    first,
    second,
    ...remainingQuestions.map((question) => page.getByText(question, { exact: true }).first()),
  ];
  for (const question of allQuestions) {
    await target(question.locator("xpath=ancestor::*[@tabindex='0'][1]"));
  }
  await snapshot(`faq-${viewportName}-open-all`, {
    path: "/",
    state: "faq-open-all",
    selectors: { questions: "#faq [tabindex='0']" },
  });
}

async function loadMore(route, name) {
  await open(route, viewports.laptop);
  const button = page.getByRole("button", { name: "Load More" });
  await button.scrollIntoViewIfNeeded();
  await button.click();
  const expectedSlug =
    route === "/news"
      ? "the-science-of-circadian-health"
      : "strategic-health-acceleration";
  await page.locator(`a[href$="${expectedSlug}"]`).first().waitFor({ state: "attached", timeout: 30_000 });
  await button.waitFor({ state: "hidden", timeout: 30_000 }).catch(() => {});
  await page.waitForTimeout(250);
  const cardLinks = page.locator(`a[href^=".${route}/"], a[href^="${route}/"]`);
  const last = cardLinks.last();
  await last.scrollIntoViewIfNeeded();
  await target(last);
  await snapshot(`${name}-load-more-expanded`, {
    path: route,
    state: "load-more-expanded",
    itemCount: await cardLinks.count(),
    loadMoreVisible: await button.isVisible().catch(() => false),
    selectors: { cards: `a[href*="${route}/"]`, loadMore: 'button:has-text("Load More")' },
  });
}

async function contactStates() {
  const viewport = viewports.laptop;
  await open("/contact", viewport);
  const name = page.getByPlaceholder("Full name");
  await name.focus();
  await target(name);
  await snapshot("contact-name-focus", {
    path: "/contact",
    state: "name-focus",
    selectors: { name: 'input[placeholder="Full name"]' },
  });

  const location = page.locator("select").first();
  const objective = page.locator("select").nth(1);
  await location.selectOption({ label: "United States" });
  await objective.selectOption({ label: "Performance" });
  await target(location);
  await target(objective);
  await snapshot("contact-select-values", {
    path: "/contact",
    state: "select-values",
    selectors: { location: "select:nth-of-type(1)", objective: "select:nth-of-type(2)" },
    values: { location: await location.inputValue(), objective: await objective.inputValue() },
  });

  const firstCheckbox = page.getByRole("checkbox", { name: "Full Lab Analysis" });
  const lastCheckbox = page.getByRole("checkbox", { name: "Custom Wellness Protocol" });
  await firstCheckbox.check();
  await lastCheckbox.check();
  await target(firstCheckbox);
  await target(lastCheckbox);
  await snapshot("contact-checkboxes-checked", {
    path: "/contact",
    state: "checkboxes-checked",
    selectors: {
      first: 'input[type="checkbox"][value="Full Lab Analysis"]',
      last: 'input[type="checkbox"][value="Custom Wellness Protocol"]',
    },
  });

  await page.getByPlaceholder("Full name").fill("Ada Lovelace");
  await page.locator("form").first().locator('input[type="email"]').fill("ada@example.com");
  await page.waitForTimeout(500);
  const enabledSubmit = page.getByRole("button", { name: /Request access/i });
  await target(enabledSubmit);
  await snapshot("contact-valid-filled", {
    path: "/contact",
    state: "valid-filled",
    selectors: { submit: 'button:has-text("Request access")' },
    formValid: await page.locator("form").first().evaluate((element) => element.checkValidity()),
  });

  // Reload before validation so no field state can accidentally produce a valid submission.
  await open("/contact", viewport);
  const submit = page.getByRole("button", { name: /Request access/i });
  await submit.scrollIntoViewIfNeeded();
  await submit.click();
  await page.waitForTimeout(200);
  await target(page.getByPlaceholder("Full name"));
  await target(submit);
  await snapshot("contact-empty-validation", {
    path: "/contact",
    state: "empty-native-validation",
    selectors: {
      name: 'input[placeholder="Full name"]',
      submit: 'button:has-text("Request access")',
    },
    validation: await page.getByPlaceholder("Full name").evaluate((element) => ({
      valid: element.validity.valid,
      valueMissing: element.validity.valueMissing,
      message: element.validationMessage,
    })),
  });
}

async function hoverStates() {
  await open("/", viewports.laptop);
  const about = page.getByRole("link", { name: "About", exact: true }).first();
  await about.hover();
  await target(about);
  await snapshot("hover-nav-about", {
    path: "/",
    state: "hover-nav",
    selectors: { target: 'nav a[href="./about"]' },
  });

  const requestAccess = page.getByRole("link", { name: /Request Access/ }).first();
  await requestAccess.hover();
  await target(requestAccess);
  await snapshot("hover-primary-button", {
    path: "/",
    state: "hover-primary-button",
    selectors: { target: 'nav a[href="./contact"]' },
  });

  const story = page.locator('a[href="./success-stories/scaling-executive-vitality"]').first();
  await story.scrollIntoViewIfNeeded();
  await story.hover();
  await page.waitForTimeout(200);
  await target(story);
  await snapshot("hover-story-card", {
    path: "/",
    state: "hover-story-card",
    selectors: { target: 'a[href="./success-stories/scaling-executive-vitality"]' },
  });
}

async function aboutCarouselStates(viewportName) {
  await open("/about", viewports[viewportName]);
  const previous = page.getByRole("button", { name: "Previous" });
  const next = page.getByRole("button", { name: "Next" });
  const carousel = next.locator(
    "xpath=ancestor::*[.//button[@aria-label='Previous'] and .//button[@aria-label='Next']][1]",
  );

  await carousel.scrollIntoViewIfNeeded();
  await target(carousel);
  await snapshot(`about-carousel-${viewportName}-initial`, {
    path: "/about",
    state: "carousel-initial",
    selectors: {
      previous: 'button[aria-label="Previous"]',
      next: 'button[aria-label="Next"]',
    },
    visibleText: (await carousel.innerText()).trim(),
  });

  await next.click();
  await page.waitForTimeout(950);
  await target(carousel);
  await snapshot(`about-carousel-${viewportName}-next`, {
    path: "/about",
    state: "carousel-next",
    selectors: {
      previous: 'button[aria-label="Previous"]',
      next: 'button[aria-label="Next"]',
    },
    visibleText: (await carousel.innerText()).trim(),
  });

  await previous.click();
  await page.waitForTimeout(950);
  await previous.click();
  await page.waitForTimeout(950);
  await target(carousel);
  await snapshot(`about-carousel-${viewportName}-previous`, {
    path: "/about",
    state: "carousel-previous",
    selectors: {
      previous: 'button[aria-label="Previous"]',
      next: 'button[aria-label="Next"]',
    },
    visibleText: (await carousel.innerText()).trim(),
  });
}

try {
  const mode = process.argv[2];
  if (!mode) {
    await mobileMenu("mobile");
    await mobileMenu("tablet");
    await faqStates("laptop");
    await faqStates("mobile");
    await loadMore("/news", "news");
    await loadMore("/success-stories", "success-stories");
    await contactStates();
    await hoverStates();
  }
  if (!mode || mode === "faq") {
    if (mode === "faq") {
      await faqStates("laptop");
      await faqStates("mobile");
    }
  }
  if (!mode || mode === "about") {
    await aboutCarouselStates("mobile");
    await aboutCarouselStates("tablet");
  }
  if (mode === "load-more") {
    await loadMore("/news", "news");
    await loadMore("/success-stories", "success-stories");
  }
  if (mode === "contact") await contactStates();
  if (mode === "hover") await hoverStates();
} finally {
  await context.close();
  await browser.close();
}
