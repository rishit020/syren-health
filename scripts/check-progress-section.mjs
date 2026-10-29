import assert from "node:assert/strict";
import fs from "node:fs/promises";

import { launch, settle } from "./browser.mjs";

const base = process.env.LOCAL_URL || "http://127.0.0.1:4173";
const output = "reference/validation/progress-section";
const viewports = {
  desktop1440: { width: 1440, height: 900 },
  desktop1355: { width: 1355, height: 923 },
  laptop1280: { width: 1280, height: 800 },
  tablet768: { width: 768, height: 1024 },
  mobile390: { width: 390, height: 844 },
};

const requiredText = [
  "Our progress",
  "Where we are today.",
  "A sensing bench and clinic interface exist today. Multi-room coordination and clinical performance remain open engineering work.",
  "The sensing prototype.",
  "Radar, thermal and Wi-Fi CSI are captured in one local engineering setup.",
  "Bench-tested",
  "What we’re validating.",
  "Testing needs to show when the system is useful, and when it gets things wrong.",
  "Validation priorities",
  "Reliability",
  "False alerts",
  "Caregiver usefulness",
  "Care-team feedback.",
  "Conversations with care teams can help guide what we build next.",
  "What would help your team?",
  "Share your perspective",
  "Work in senior care? Help us build around your team’s needs.",
  "Talk to Us",
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

const browser = await launch();
const report = { viewports: [], lifecycle: null, reducedMotion: null, errors: [], failedResources: [] };

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
    await page.waitForSelector('#testimonials[data-syren-progress="true"]');
    const section = page.locator('#testimonials[data-syren-progress="true"]');
    const beforeScroll = await section.evaluate((element) => ({
      active: element.classList.contains("is-active"),
      waveState: getComputedStyle(element.querySelector(".syren-progress__signal-path span")).animationPlayState,
    }));
    assert.equal(beforeScroll.active, false, `${name}: offscreen section marked active`);
    assert.equal(beforeScroll.waveState, "paused", `${name}: offscreen artwork animation is not paused`);

    await section.scrollIntoViewIfNeeded();
    await settle(page, 1100);
    const text = (await section.textContent()).replace(/\s+/g, " ").trim();
    requiredText.forEach((value) => assert.ok(text.includes(value), `${name}: missing ${value}`));
    assert.doesNotMatch(
      text,
      /Amy Chase|Marcus Chen|Sarah Jenkins|Lead Designer|Creative Director|Head of Product|Luvia makes|best health tool|global community/i,
      `${name}: source testimonial content remains`,
    );

    assert.equal(await section.locator("article").count(), 3, `${name}: card count`);
    assert.equal(await section.locator('a[href="/contact"]').count(), 2, `${name}: contact-link count`);
    assert.equal(await section.locator('button[data-syren-sensor-demo="radar"]').count(), 1, `${name}: sensor walkthrough button`);
    const statusTags = await section.locator(".syren-progress__status").evaluateAll((items) =>
      items.map((item) => ({ tag: item.tagName, role: item.getAttribute("role"), tabIndex: item.tabIndex })),
    );
    assert.deepEqual(
      statusTags,
      [
        { tag: "SPAN", role: null, tabIndex: -1 },
        { tag: "SPAN", role: null, tabIndex: -1 },
      ],
      `${name}: statuses must be plain text badges`,
    );

    const layout = await section.evaluate((element) => {
      const cards = [...element.querySelectorAll("article")];
      const visuals = [...element.querySelectorAll(".syren-progress__visual")];
      const heading = element.querySelector("h2");
      const animations = {
        wave: getComputedStyle(element.querySelector(".syren-progress__signal-path span")).animationPlayState,
        thermal: getComputedStyle(element.querySelector(".syren-progress__thermal-grid i")).animationPlayState,
        focus: getComputedStyle(element.querySelector(".syren-progress__criteria"), "::before").animationPlayState,
        dots: getComputedStyle(element.querySelector(".syren-progress__reply-bubble span")).animationPlayState,
      };
      return {
        sectionId: element.id,
        active: element.classList.contains("is-active"),
        cards: cards.map((card) => {
          const rect = card.getBoundingClientRect();
          return { width: rect.width, height: rect.height };
        }),
        visuals: visuals.map((visual) => visual.getBoundingClientRect().height),
        headingOverflow: {
          x: heading.scrollWidth - heading.clientWidth,
          y: heading.scrollHeight - heading.clientHeight,
          overflow: getComputedStyle(heading).overflow,
        },
        documentOverflow: document.documentElement.scrollWidth - innerWidth,
        animations,
      };
    });
    assert.equal(layout.sectionId, "testimonials", `${name}: footer anchor changed`);
    assert.ok(
      layout.headingOverflow.x <= 2 && (layout.headingOverflow.y <= 2 || layout.headingOverflow.overflow === "visible"),
      `${name}: heading clipped`,
    );
    assert.ok(layout.documentOverflow <= 1, `${name}: horizontal overflow ${layout.documentOverflow}px`);
    assert.equal(layout.active, true, `${name}: visible section motion did not activate`);
    Object.entries(layout.animations).forEach(([animation, state]) =>
      assert.equal(state, "running", `${name}: ${animation} animation did not activate`),
    );
    if (viewport.width >= 810) {
      const heights = layout.cards.map((card) => card.height);
      assert.ok(Math.max(...heights) - Math.min(...heights) < 1, `${name}: desktop cards are not equal height`);
      heights.forEach((height) => assert.ok(height >= 390 && height <= 425, `${name}: desktop card height ${height}`));
      layout.visuals.forEach((height) => assert.ok(height >= 145 && height <= 165, `${name}: visual height ${height}`));
    }

    if (viewport.width >= 810) {
      const card = section.locator("article").first();
      await card.hover();
      await page.waitForTimeout(280);
      const transform = await card.evaluate((element) => getComputedStyle(element).transform);
      assert.notEqual(transform, "none", `${name}: card hover polish missing`);
      await page.mouse.move(1, 1);
    }

    if (name === "desktop1355") {
      await page.addStyleTag({ content: 'nav, #__framer-badge-container { visibility: hidden !important; }' });
      await section.screenshot({ path: `${output}/desktop1355-full-section.png`, animations: "disabled" });
    }
    if (name === "mobile390") {
      await page.addStyleTag({ content: 'nav, #__framer-badge-container { visibility: hidden !important; }' });
      for (let index = 0; index < 3; index += 1) {
        await section.locator("article").nth(index).screenshot({
          path: `${output}/mobile390-card-${index + 1}.png`,
          animations: "disabled",
        });
      }
      await section.locator(".syren-progress__banner").screenshot({
        path: `${output}/mobile390-banner.png`,
        animations: "disabled",
      });
    }

    report.viewports.push({ name, ...viewport, ...layout });
    report.errors.push(...errors.map((message) => ({ viewport: name, message })));
    report.failedResources.push(...failedResources.map((item) => ({ viewport: name, ...item })));
    await page.close();
    console.log(`PASS ${name}: content, layout, motion and overflow`);
  }

  const keyboard = await browser.newPage({ viewport: viewports.desktop1355 });
  await keyboard.goto(base);
  await keyboard.waitForSelector('[data-syren-progress="true"]');
  const feedbackLink = keyboard.locator(".syren-progress__card-link");
  await feedbackLink.focus();
  assert.ok(await feedbackLink.evaluate((element) => element.matches(":focus-visible")), "card link focus is hidden");
  await feedbackLink.press("Enter");
  await keyboard.waitForURL("**/contact");
  assert.equal(new URL(keyboard.url()).pathname, "/contact", "card link destination");
  await keyboard.goBack();
  await keyboard.waitForSelector('[data-syren-progress="true"]');
  const bannerLink = keyboard.locator(".syren-progress__banner > a");
  await bannerLink.focus();
  assert.ok(await bannerLink.evaluate((element) => element.matches(":focus-visible")), "banner link focus is hidden");
  await bannerLink.press("Enter");
  await keyboard.waitForURL("**/contact");
  await keyboard.goBack();
  await keyboard.reload();
  await keyboard.waitForSelector('[data-syren-progress="true"]');
  const sectionCount = await keyboard.locator('[data-syren-progress="true"]').count();
  assert.equal(sectionCount, 1, "route/back/reload duplicated the section");
  await keyboard.goto(`${base}/#testimonials`);
  await keyboard.reload();
  await keyboard.waitForFunction(() => {
    const header = document.querySelector('.syren-progress__header');
    return header && getComputedStyle(header).opacity === '1';
  });
  report.lifecycle = { nativeKeyboardLinks: true, destinations: ["/contact", "/contact"], sectionCountAfterReload: sectionCount };
  await keyboard.close();
  console.log("PASS keyboard and lifecycle: links route to contact; back/reload remains clean");

  const reduced = await browser.newPage({ viewport: viewports.desktop1355, reducedMotion: "reduce" });
  await reduced.goto(base);
  const reducedSection = reduced.locator('[data-syren-progress="true"]');
  await reducedSection.scrollIntoViewIfNeeded();
  const reducedState = await reducedSection.evaluate((element) => ({
    motionMode: element.dataset.progressMotion,
    visible: element.getBoundingClientRect().height > 0,
    wave: getComputedStyle(element.querySelector(".syren-progress__signal-path span")).animationName,
    focus: getComputedStyle(element.querySelector(".syren-progress__criteria"), "::before").animationName,
    dots: getComputedStyle(element.querySelector(".syren-progress__reply-bubble span")).animationName,
    opacity: getComputedStyle(element.querySelector(".syren-progress__card")).opacity,
  }));
  assert.equal(reducedState.motionMode, "reduced");
  assert.equal(reducedState.visible, true);
  assert.equal(reducedState.wave, "none");
  assert.equal(reducedState.focus, "none");
  assert.equal(reducedState.dots, "none");
  assert.equal(reducedState.opacity, "1");
  report.reducedMotion = reducedState;
  await reduced.close();
  console.log("PASS reduced motion: content remains visible and loops are disabled");

  assert.deepEqual(report.errors, [], "page errors");
  assert.deepEqual(report.failedResources, [], "failed resources");
  await fs.writeFile(`${output}/report.json`, `${JSON.stringify(report, null, 2)}\n`);
} finally {
  await browser.close();
}
