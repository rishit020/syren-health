import assert from "node:assert/strict";
import fs from "node:fs/promises";

import { launch, settle, viewports } from "../../scripts/browser.mjs";

const base = process.env.LOCAL_URL || "http://127.0.0.1:5173";
const outputDir = "reference/validation/local-qa";
await fs.mkdir(outputDir, { recursive: true });

const browser = await launch();
const context = await browser.newContext({ deviceScaleFactor: 1, viewport: viewports.mobile });
const page = await context.newPage();
const errors = [];
const resourceErrors = [];
const checks = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (event) => {
  if (event.type() === "error") errors.push(event.text());
});
page.on("response", (response) => {
  if (response.status() >= 400) resourceErrors.push({ status: response.status(), url: response.url() });
});

async function check(name, run) {
  try {
    const evidence = await run();
    checks.push({ name, passed: true, ...evidence });
    console.log("PASS", name);
  } catch (error) {
    checks.push({ name, passed: false, error: error.stack });
    console.error("FAIL", name, error.message);
  }
}

async function open(route, viewport = viewports.mobile) {
  await page.setViewportSize(viewport);
  await page.goto(base + route, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#main");
  await settle(page, 450);
}

await check("mobile menu opens, remains stable, and closes from the keyboard", async () => {
  await open("/");
  await page.getByRole("button", { name: "Open menu", exact: true }).click();
  await page.waitForTimeout(1_000);
  const close = page.getByRole("button", { name: "Close menu", exact: true });
  await close.waitFor();
  assert.equal(await page.locator("nav").first().getAttribute("data-local-menu-open"), "true");
  const screenshot = `${outputDir}/mobile-menu-open.png`;
  await page.screenshot({ path: screenshot });
  await close.press("Enter");
  await page.getByRole("button", { name: "Open menu", exact: true }).waitFor();
  return { screenshot };
});

await check("all six FAQ items can remain open together", async () => {
  const questions = [
    "How do I prepare for my initial biomarker test?",
    "Is my personal health data kept private and secure?",
    "How long does it take to receive my health results?",
    "Can I share my reports with my primary care physician?",
    "Do I need a wearable device to use the platform?",
    "How often should I re-test my biological markers?",
  ];
  for (const question of questions) {
    await page.getByRole("button", { name: question, exact: true }).click();
  }
  await page.waitForTimeout(300);
  assert.equal(await page.locator('[aria-expanded="true"]').count(), 6);
  assert.match(await page.locator("#faq").innerText(), /5 to 7 business days/);
  const clipping = await page.locator('[aria-expanded="true"]').evaluateAll((items) =>
    items.map((item) => ({
      text: item.textContent.trim().slice(0, 60),
      clientHeight: item.clientHeight,
      scrollHeight: item.scrollHeight,
      clipped: item.scrollHeight > item.clientHeight + 1,
    })),
  );
  assert.equal(clipping.some((item) => item.clipped), false, JSON.stringify(clipping));
  const screenshot = `${outputDir}/faq-all-open.png`;
  await page.locator("#faq").screenshot({ path: screenshot, animations: "disabled" });
  return { screenshot, clipping };
});

await check("mobile About carousel reaches the captured next and previous cards", async () => {
  await open("/about");
  const previous = page.getByRole("button", { name: "Previous", exact: true });
  const next = page.getByRole("button", { name: "Next", exact: true });
  const carousel = next.locator("xpath=ancestor::section[1]");
  const track = carousel.locator("ul");
  await next.click();
  await page.waitForTimeout(550);
  assert.match(await track.locator('[aria-hidden="false"]').innerText(), /Evidence-Based Care/);
  const nextScreenshot = `${outputDir}/about-carousel-next.png`;
  await carousel.screenshot({ path: nextScreenshot, animations: "disabled" });
  await previous.click();
  await page.waitForTimeout(550);
  await previous.click();
  await page.waitForTimeout(550);
  assert.match(await track.locator('[aria-hidden="false"]').innerText(), /Biological Data/);
  const previousScreenshot = `${outputDir}/about-carousel-previous.png`;
  await carousel.screenshot({ path: previousScreenshot, animations: "disabled" });
  return { screenshots: [nextScreenshot, previousScreenshot] };
});

await check("About carousel autoplay and horizontal swipe work without blocking vertical touch", async () => {
  await open("/about", viewports.mobile);
  const next = page.getByRole("button", { name: "Next", exact: true });
  const section = next.locator("xpath=ancestor::section[1]");
  const track = section.locator("ul");
  assert.equal(await track.evaluate((element) => getComputedStyle(element).touchAction), "pan-y");
  const initialTransform = await track.evaluate((element) => element.style.transform);
  await page.waitForTimeout(3_250);
  const autoplayTransform = await track.evaluate((element) => element.style.transform);
  assert.notEqual(autoplayTransform, initialTransform);

  const box = await section.boundingBox();
  const startX = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(startX, y);
  await page.mouse.down();
  await page.mouse.move(startX - box.width * 0.7, y, { steps: 8 });
  const draggedTransform = await track.evaluate((element) => element.style.transform);
  await page.mouse.up();
  await page.waitForTimeout(760);
  const snappedTransform = await track.evaluate((element) => element.style.transform);
  assert.notEqual(draggedTransform, snappedTransform);

  await open("/about", viewports.tablet);
  const tabletSection = page.getByRole("button", { name: "Next", exact: true }).locator("xpath=ancestor::section[1]");
  const tabletTrack = tabletSection.locator("ul");
  const tabletBox = await tabletSection.boundingBox();
  const tabletX = tabletBox.x + tabletBox.width / 2;
  const tabletY = tabletBox.y + tabletBox.height / 2;
  await page.mouse.move(tabletX, tabletY);
  await page.mouse.down();
  await page.mouse.move(tabletX + tabletBox.width * 0.7, tabletY, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(760);
  assert.match(await page.locator('[aria-hidden="false"]').innerText(), /Biological Data/);
  return { initialTransform, autoplayTransform, draggedTransform, snappedTransform };
});

await check("article copy control exposes confirmation", async () => {
  await open("/news/why-biomarkers-matter");
  const copy = page.getByRole("button", { name: /copy/i }).first();
  await copy.scrollIntoViewIfNeeded();
  await copy.click();
  await page.getByRole("button", { name: "Link copied", exact: true }).waitFor();
  await copy.click();
  await page.getByRole("button", { name: "Link copied", exact: true }).waitFor();
  await page.waitForTimeout(2_100);
  assert.equal(await copy.getAttribute("aria-label"), "Share on copy");
  await copy.click();
  await page.getByRole("button", { name: "Link copied", exact: true }).waitFor();
  const screenshot = `${outputDir}/share-copy-confirmed.png`;
  await page.screenshot({ path: screenshot });
  return { screenshot };
});

await check("article previous and next links resolve within the nested news route", async () => {
  await open("/news/why-biomarkers-matter");
  const siblingLinks = page.locator(
    'a[href="/news/the-future-of-wellness"], a[href="/news/mastering-your-sleep"]',
  );
  assert.equal(await siblingLinks.count(), 2);
  await page.locator('a[href="/news/the-future-of-wellness"]').click();
  await page.waitForURL(base + "/news/the-future-of-wellness");
  await page.waitForSelector("#main");
  assert.equal(new URL(page.url()).pathname, "/news/the-future-of-wellness");
  return {};
});

await check("desktop hover and sticky navigation retain their source states", async () => {
  await open("/", viewports.laptop);
  const about = page.getByRole("link", { name: "About", exact: true }).first();
  await about.hover();
  assert.ok((await about.getAttribute("class")).split(/\s+/).includes("hover"));
  const hoverScreenshot = `${outputDir}/nav-hover.png`;
  await page.locator("nav").first().screenshot({ path: hoverScreenshot, animations: "disabled" });
  const story = page.locator('a[href="/success-stories/scaling-executive-vitality"]').first();
  await story.scrollIntoViewIfNeeded();
  await story.hover();
  assert.ok((await story.getAttribute("class")).split(/\s+/).includes("hover"));
  const cardScreenshot = `${outputDir}/story-card-hover.png`;
  await story.screenshot({ path: cardScreenshot, animations: "disabled" });
  await page.evaluate(() => window.scrollTo(0, 1_400));
  await page.waitForTimeout(250);
  const navRect = await page.locator("nav:visible").first().evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { top: rect.top, bottom: rect.bottom, position: getComputedStyle(element).position };
  });
  assert.ok(navRect.bottom > 0 && navRect.top < viewports.laptop.height, JSON.stringify(navRect));
  const stickyScreenshot = `${outputDir}/sticky-navigation.png`;
  await page.screenshot({ path: stickyScreenshot });
  return { navRect, screenshots: [hoverScreenshot, cardScreenshot, stickyScreenshot] };
});

await check("expanded stories use the captured opaque scrolled navigation", async () => {
  await open("/success-stories", viewports.laptop);
  await page.getByRole("button", { name: "Load More", exact: true }).click();
  const lastCard = page.locator('a[href="/success-stories/strategic-health-acceleration"]');
  await lastCard.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  const navigation = page.locator("nav").first();
  assert.equal(await navigation.getAttribute("data-local-sticky"), "true");
  assert.equal(await navigation.getAttribute("data-framer-name"), "Desktop scrolled");
  const screenshot = `${outputDir}/stories-scrolled-navigation.png`;
  await page.screenshot({ path: screenshot, animations: "disabled" });
  return { screenshot };
});

await check("contact form matches disabled and valid filled button states without sending", async () => {
  await open("/contact", viewports.laptop);
  const form = page.locator("form").first();
  const submit = form.getByRole("button", { name: /Request access/i });
  assert.equal(await submit.getAttribute("data-framer-name"), "Disabled");
  await form.getByPlaceholder("Full name").fill("Ada Lovelace");
  await form.locator('input[type="email"]').fill("ada@example.com");
  await form.locator("select").first().selectOption({ label: "United States" });
  await form.locator("select").nth(1).selectOption({ label: "Performance" });
  assert.equal(await submit.getAttribute("data-framer-name"), "Default");
  assert.ok((await submit.getAttribute("class")).split(/\s+/).includes("framer-v-1yu8f8x"));
  const screenshot = `${outputDir}/contact-valid-filled.png`;
  await form.screenshot({ path: screenshot, animations: "disabled" });
  return { screenshot };
});

await check("reduced motion leaves reveal targets in their final state", async () => {
  const reducedContext = await browser.newContext({
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
    viewport: viewports.tablet,
  });
  const reducedPage = await reducedContext.newPage();
  await reducedPage.goto(base + "/about", { waitUntil: "domcontentloaded" });
  await reducedPage.waitForSelector("#main");
  const state = await reducedPage.locator(".framer-dz5nr6").evaluate((element) => ({
    opacity: getComputedStyle(element).opacity,
    transform: getComputedStyle(element).transform,
  }));
  assert.equal(state.opacity, "1");
  assert.equal(state.transform, "none");
  const screenshot = `${outputDir}/reduced-motion.png`;
  await reducedPage.screenshot({ path: screenshot });
  await reducedContext.close();
  return { state, screenshot };
});

await check("no page errors occurred during local browser QA", async () => {
  assert.deepEqual({ errors, resourceErrors }, { errors: [], resourceErrors: [] });
  return { resourceErrors };
});

const report = { base, checks, errors, resourceErrors, generatedAt: new Date().toISOString() };
await fs.writeFile(`${outputDir}/report.json`, JSON.stringify(report, null, 2));
await context.close();
await browser.close();
if (checks.some((item) => !item.passed)) process.exitCode = 1;
