import assert from "node:assert/strict";
import fs from "node:fs/promises";

import { launch, settle } from "./browser.mjs";

const base = process.env.LOCAL_URL || "http://127.0.0.1:4173";
const output = "reference/validation/how-it-works";
const viewports = {
  desktop1440: { width: 1440, height: 900 },
  laptop1280: { width: 1280, height: 800 },
  tablet768: { width: 768, height: 1024 },
  mobile390: { width: 390, height: 844 },
};
const expected = [
  {
    visual: "room",
    href: "/#device",
    title: "Awareness through the night.",
    description: "More context between caregiver check-ins.",
    visible: ["Placement concept", "Awareness through the night."],
    image: "/syren/approach-room-v1.webp",
  },
  {
    visual: "sensing",
    href: "/#features",
    title: "Radar, thermal and Wi-Fi CSI.",
    description: "Three sensing streams on the bench.",
    visible: ["Bench setup", "60 GHz radar", "32 × 24 thermal", "Wi-Fi CSI", "ESP32-C6", "ESP32-S3", "Measured on one bench link"],
  },
  {
    visual: "dashboard",
    href: "/#engineering",
    title: "An actual dashboard UI.",
    description: "Current clinic interface with synthetic records.",
    visible: ["Current UI", "A real clinic", "Synthetic records only"],
    image: "/syren/clinic-overview-card.png",
  },
];

await fs.mkdir(output, { recursive: true });
const browser = await launch();
const report = { viewports: [], keyboard: [], errors: [], failedResources: [] };

try {
  for (const [name, viewport] of Object.entries(viewports)) {
    const page = await browser.newPage({ viewport });
    page.on("pageerror", (error) => report.errors.push({ viewport: name, message: error.message }));
    page.on("response", (response) => {
      if (response.status() >= 400) report.failedResources.push({ viewport: name, status: response.status(), url: response.url() });
    });
    await page.goto(base);
    const section = page.locator('#how-it-works[data-syren-how-it-works="true"]');
    await section.waitFor();
    const cards = section.locator('a[data-syren-how-card="true"]');
    assert.equal(await cards.count(), 3, `${name}: expected three cards`);

    for (const [index, target] of expected.entries()) {
      const card = cards.nth(index);
      await card.scrollIntoViewIfNeeded();
      await settle(page, 240);
      const details = await card.evaluate((element) => {
        const panel = element.querySelector("[data-syren-how-visual]");
        const image = panel.querySelector("img");
        const rect = element.getBoundingClientRect();
        return {
          href: element.getAttribute("href"),
          label: element.getAttribute("aria-label"),
          title: element.querySelector("h4")?.textContent,
          description: element.querySelector(".framer-m5clq p")?.textContent,
          visual: panel.dataset.syrenHowVisual,
          visible: panel.innerText,
          image: image ? { src: image.getAttribute("src"), loaded: image.complete && image.naturalWidth > 0, alt: image.alt } : null,
          ratio: rect.height / rect.width,
          captionHidden: element.querySelector(".framer-p5qlki").getBoundingClientRect().width <= 1,
          oldOverlayHidden: getComputedStyle(element.querySelector('[data-framer-name="Overlay"]')).display === "none",
          oldImageGone: !element.querySelector('img[data-syren-how-image]'),
        };
      });
      assert.equal(details.href, target.href, `${name}: card ${index + 1} destination`);
      assert.ok(details.label.includes(target.title), `${name}: accessible label`);
      assert.equal(details.title, target.title, `${name}: title`);
      assert.equal(details.description, target.description, `${name}: description`);
      assert.equal(details.visual, target.visual, `${name}: card visual`);
      target.visible.forEach((value) => assert.ok(details.visible.includes(value), `${name}: missing visible ${value}`));
      if (target.image) {
        assert.equal(details.image?.src, target.image, `${name}: image source`);
        assert.ok(details.image.loaded && details.image.alt, `${name}: image load and alt text`);
      } else assert.equal(details.image, null, `${name}: sensing artwork should be native HTML`);
      assert.ok(Math.abs(details.ratio - 4 / 3) < 0.01, `${name}: card ratio changed`);
      assert.ok(details.captionHidden && details.oldOverlayHidden && details.oldImageGone, `${name}: old card layer remains`);
      await card.focus();
      assert.ok(await card.evaluate((element) => element.matches(":focus-visible")), `${name}: keyboard focus`);
    }

    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${name}: horizontal overflow`);
    if (name === "desktop1440") await section.screenshot({ path: `${output}/desktop1440.png`, animations: "disabled" });
    if (name === "mobile390") await cards.nth(2).screenshot({ path: `${output}/mobile390-dashboard.png`, animations: "disabled" });
    report.viewports.push({ name, ...viewport, cards: 3, passed: true });
    await page.close();
    console.log(`PASS ${name}: three accurate cards, loaded media, focus and no overflow`);
  }

  for (const [index, target] of expected.entries()) {
    const page = await browser.newPage({ viewport: viewports.desktop1440 });
    await page.goto(base);
    const card = page.locator('#how-it-works a[data-syren-how-card="true"]').nth(index);
    await card.focus();
    await card.press("Enter");
    await page.waitForTimeout(150);
    assert.equal(new URL(page.url()).hash, new URL(target.href, base).hash, `card ${index + 1} keyboard destination`);
    report.keyboard.push({ card: index + 1, destination: target.href });
    await page.close();
  }

  const reduced = await browser.newPage({ viewport: viewports.desktop1440, reducedMotion: "reduce" });
  await reduced.goto(base);
  const reducedCard = reduced.locator('#how-it-works a[data-syren-how-card="true"]').first();
  await reducedCard.scrollIntoViewIfNeeded();
  await reducedCard.hover();
  assert.equal(await reducedCard.evaluate((element) => getComputedStyle(element).transform), "none", "reduced motion: hover movement");
  await reduced.close();

  assert.deepEqual(report.errors, [], "page errors");
  assert.deepEqual(report.failedResources, [], "failed resources");
  await fs.writeFile(`${output}/report.json`, `${JSON.stringify(report, null, 2)}\n`);
} finally {
  await browser.close();
}
