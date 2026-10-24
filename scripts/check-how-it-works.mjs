import assert from "node:assert/strict";
import fs from "node:fs/promises";

import { launch, settle } from "./browser.mjs";

const base = process.env.LOCAL_URL || "http://127.0.0.1:4173";
const output = "reference/validation/how-it-works";
const viewports = {
  desktop1440: { width: 1440, height: 900 },
  desktop1355: { width: 1355, height: 923 },
  laptop1280: { width: 1280, height: 800 },
  tablet768: { width: 768, height: 1024 },
  compact510: { width: 510, height: 900 },
  mobile390: { width: 390, height: 844 },
};
const expected = [
  {
    title: "Awareness through the night.",
    description: "More context between caregiver check-ins.",
    href: "/#device",
    image: "card-room-approved",
    label: "1. Room awareness. Awareness through the night. More context between caregiver check-ins.",
  },
  {
    title: "Radar meets thermal.",
    description: "Exploring movement and room activity.",
    href: "/#features",
    image: "card-sensing-approved",
    label: "2. Contactless sensing. Radar meets thermal. Exploring movement and room activity.",
  },
  {
    title: "Context for the care team.",
    description: "An overview built around caregiver review.",
    href: "/contact",
    image: "card-caregiver-approved",
    label: "3. Caregiver review. Context for the care team. An overview built around caregiver review.",
  },
];

await fs.mkdir(output, { recursive: true });
assert.equal(
  await fs.readFile("src/App.jsx", "utf8"),
  await fs.readFile("reference/luvia-app-archive/App.jsx", "utf8"),
  "src/App.jsx changed",
);
assert.equal(
  await fs.readFile("src/local.css", "utf8"),
  await fs.readFile("reference/luvia-app-archive/local.css", "utf8"),
  "src/local.css changed",
);
const scopedCss = await fs.readFile("src/how-it-works.css", "utf8");
assert.doesNotMatch(scopedCss, /syren-technical|syren-radar|@keyframes/, "rejected card animation CSS remains");

const browser = await launch();
const report = { viewports: [], keyboard: [], reducedMotion: null, errors: [], failedResources: [] };

try {
  for (const [name, viewport] of Object.entries(viewports)) {
    const page = await browser.newPage({ viewport });
    const errors = [];
    const failedResources = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("response", (response) => {
      if (response.status() >= 400) failedResources.push({ status: response.status(), url: response.url() });
    });

    await page.goto(base);
    await page.waitForSelector('#how-it-works[data-syren-how-it-works="true"]');
    const section = page.locator("#how-it-works");
    await section.scrollIntoViewIfNeeded();
    await settle(page, 2200);
    const cards = section.locator('a[data-syren-how-card="true"]');
    assert.equal(await cards.count(), 3, `${name}: expected three cards`);

    const sectionText = (await section.textContent()).replace(/\s+/g, " ");
    for (const value of [
      "How it works",
      "From room awareness to informed care.",
      "A closer look at the Syren concept, from contactless sensing to caregiver review.",
      ...expected.flatMap((step) => [step.title, step.description]),
    ]) {
      assert.ok(sectionText.includes(value), `${name}: missing ${value}`);
    }
    assert.doesNotMatch(
      sectionText,
      /Success Stories|Proven biological results|Scaling Executive|Athlete Longevity|Team Vitality|Contactless awareness|Sensing activity|Supporting caregivers|Deep Sleep|Recovery Score|Protocols Generated/i,
      `${name}: rejected or source card content returned`,
    );

    const details = await cards.evaluateAll((items) =>
      items.map((card) => {
        const image = card.querySelector("img[data-syren-how-image]");
        const media = card.querySelector(".framer-1yxk61a-container");
        const caption = card.querySelector(".framer-p5qlki");
        const overlay = card.querySelector('[data-framer-name="Overlay"]');
        const cardRect = card.getBoundingClientRect();
        const imageRect = image.getBoundingClientRect();
        const mediaRect = media.getBoundingClientRect();
        return {
          href: card.getAttribute("href"),
          ariaLabel: card.getAttribute("aria-label"),
          title: card.querySelector("h4")?.textContent,
          description: card.querySelector(".framer-m5clq p")?.textContent,
          image: image.dataset.syrenHowImage,
          imageSrc: image.getAttribute("src"),
          currentSrc: image.currentSrc,
          imageAlt: image.alt,
          natural: [image.naturalWidth, image.naturalHeight],
          loaded: image.complete && image.naturalWidth > 0,
          objectFit: getComputedStyle(image).objectFit,
          cardRect: { width: cardRect.width, height: cardRect.height },
          imageRect: { width: imageRect.width, height: imageRect.height },
          mediaRect: { width: mediaRect.width, height: mediaRect.height },
          overlayDisplay: getComputedStyle(overlay).display,
          caption: {
            width: caption.getBoundingClientRect().width,
            height: caption.getBoundingClientRect().height,
            clipPath: getComputedStyle(caption).clipPath,
          },
          before: getComputedStyle(card.querySelector('[data-framer-name="Background"]'), "::before").content,
          after: getComputedStyle(card.querySelector('[data-framer-name="Background"]'), "::after").content,
        };
      }),
    );

    details.forEach((card, index) => {
      const target = expected[index];
      assert.equal(card.href, target.href, `${name}: card ${index + 1} href`);
      assert.equal(card.ariaLabel, target.label, `${name}: card ${index + 1} accessible name`);
      assert.equal(card.title, target.title, `${name}: card ${index + 1} hidden title`);
      assert.equal(card.description, target.description, `${name}: card ${index + 1} hidden description`);
      assert.equal(card.image, target.image, `${name}: card ${index + 1} image`);
      assert.equal(card.imageSrc, `/syren/${target.image}.webp`);
      assert.match(card.currentSrc, new RegExp(`${target.image}(?:-640|-960)?\\.webp$`));
      assert.ok(card.loaded, `${name}: card ${index + 1} image did not load`);
      assert.ok(card.imageAlt, `${name}: card ${index + 1} alt is empty`);
      assert.ok(
        card.natural[0] > 0 && Math.abs(card.natural[1] / card.natural[0] - 4 / 3) < 0.01,
        `${name}: card ${index + 1} decoded asset ratio`,
      );
      assert.equal(card.objectFit, "contain", `${name}: card ${index + 1} is cropped`);
      assert.ok(Math.abs(card.cardRect.height / card.cardRect.width - 4 / 3) < 0.01, `${name}: card ${index + 1} ratio`);
      assert.ok(Math.abs(card.imageRect.width - card.mediaRect.width) < 1);
      assert.ok(Math.abs(card.imageRect.height - card.mediaRect.height) < 1);
      assert.ok(Math.abs(card.cardRect.height - card.imageRect.height) < 1);
      assert.equal(card.overlayDisplay, "none", `${name}: old gradient remains`);
      assert.ok(card.caption.width <= 1 && card.caption.height <= 1, `${name}: duplicate caption is visible`);
      assert.equal(card.caption.clipPath, "inset(50%)");
      assert.equal(card.before, "none", `${name}: old decoration remains`);
      assert.equal(card.after, "none", `${name}: old decoration remains`);
    });
    assert.match(details[2].imageAlt, /concept.*sample data/i, `${name}: third alt lacks concept/sample-data disclosure`);
    if (viewport.width >= 1200) {
      assert.ok(details[0].cardRect.height <= 517, `${name}: desktop card grew beyond approved allowance`);
    }

    for (let index = 0; index < 3; index += 1) {
      const card = cards.nth(index);
      await card.focus();
      assert.ok(await card.evaluate((element) => element.matches(":focus-visible")), `${name}: card ${index + 1} focus`);
    }

    if (viewport.width >= 810) {
      for (let index = 0; index < 3; index += 1) {
        const card = cards.nth(index);
        const before = await card.evaluate((element) => ({
          text: element.textContent,
          src: element.querySelector("img")?.getAttribute("src"),
          fit: getComputedStyle(element.querySelector("img")).objectFit,
          height: element.getBoundingClientRect().height,
        }));
        await card.hover();
        await page.waitForTimeout(300);
        const hovered = await card.evaluate((element) => ({
          text: element.textContent,
          src: element.querySelector("img")?.getAttribute("src"),
          fit: getComputedStyle(element.querySelector("img")).objectFit,
          height: element.getBoundingClientRect().height,
          transform: getComputedStyle(element).transform,
        }));
        assert.deepEqual(
          { text: hovered.text, src: hovered.src, fit: hovered.fit, height: hovered.height },
          before,
          `${name}: card ${index + 1} hover restored rejected content or geometry`,
        );
        assert.notEqual(hovered.transform, "none", `${name}: card ${index + 1} hover polish missing`);
        await page.mouse.move(1, 1);
        await page.waitForTimeout(300);
      }
    }

    assert.ok(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
      `${name}: horizontal overflow`,
    );
    const clippedHeading = await section.locator("h2").evaluate((element) =>
      element.scrollWidth > element.clientWidth + 1 || element.scrollHeight > element.clientHeight + 1,
    );
    assert.equal(clippedHeading, false, `${name}: heading clipped`);

    await page.mouse.move(1, 1);
    await page.evaluate(() => document.activeElement?.blur());
    if (name === "desktop1355") {
      await section.screenshot({ path: `${output}/desktop1355-context.png`, animations: "disabled" });
    }
    if (name === "mobile390") {
      await page.locator("nav").evaluateAll((navs) => navs.forEach((nav) => {
        nav.dataset.validationVisibility = nav.style.visibility;
        nav.style.visibility = "hidden";
      }));
      await section.screenshot({ path: `${output}/mobile390-all-three.png`, animations: "disabled" });
      await page.locator("nav").evaluateAll((navs) => navs.forEach((nav) => {
        nav.style.visibility = nav.dataset.validationVisibility || "";
        delete nav.dataset.validationVisibility;
      }));
    }
    report.viewports.push({ name, ...viewport, cards: details });
    report.errors.push(...errors.map((message) => ({ viewport: name, message })));
    report.failedResources.push(...failedResources.map((item) => ({ viewport: name, ...item })));
    await page.close();
    console.log(`PASS ${name}: all approved cards visible, uncropped and accessible`);
  }

  for (const [index, target] of expected.entries()) {
    const page = await browser.newPage({ viewport: viewports.desktop1355 });
    await page.goto(base);
    const card = page.locator('#how-it-works a[data-syren-how-card="true"]').nth(index);
    await card.focus();
    await card.press("Enter");
    await page.waitForTimeout(150);
    const url = new URL(page.url());
    if (target.href === "/contact") assert.equal(url.pathname, "/contact");
    else assert.equal(url.hash, new URL(target.href, base).hash);
    report.keyboard.push({ card: index + 1, destination: `${url.pathname}${url.hash}` });
    await page.close();
  }
  console.log("PASS keyboard: all three native links activate");

  const reduced = await browser.newPage({ viewport: viewports.desktop1355, reducedMotion: "reduce" });
  await reduced.goto(base);
  const reducedCard = reduced.locator('#how-it-works a[data-syren-how-card="true"]').first();
  await reducedCard.scrollIntoViewIfNeeded();
  await reducedCard.hover();
  const reducedState = await reducedCard.evaluate((card) => ({
    transform: getComputedStyle(card).transform,
    transitionDuration: getComputedStyle(card).transitionDuration,
    visible: card.getBoundingClientRect().height > 0,
  }));
  assert.equal(reducedState.transform, "none", "reduced motion: hover still moves");
  assert.ok(
    reducedState.transitionDuration.split(",").every((value) => Number.parseFloat(value) <= 0.00001),
    "reduced motion: transition remains",
  );
  assert.equal(reducedState.visible, true);
  report.reducedMotion = reducedState;
  await reduced.close();
  console.log("PASS reduced motion: cards remain visible without hover movement");

  assert.deepEqual(report.errors, [], "page errors");
  assert.deepEqual(report.failedResources, [], "failed resources");
  await fs.writeFile(`${output}/report.json`, `${JSON.stringify(report, null, 2)}\n`);
} finally {
  await browser.close();
}
