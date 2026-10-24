import fs from "node:fs/promises";

import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

import { launch, settle, freezeMedia, viewports } from "../../scripts/browser.mjs";

const base = process.env.LOCAL_URL || "http://127.0.0.1:4173";
const outputDir = "reference/validation/state-comparison";
await fs.mkdir(outputDir, { recursive: true });

const browser = await launch();
const page = await browser.newPage({ viewport: viewports.mobile });
const results = [];

async function open(route, viewport) {
  await page.setViewportSize(viewport);
  await page.goto(base + route, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#main");
  await settle(page, 450);
}

async function compare(name, localState) {
  const statePath = `public/reference/states/${name}.json`;
  const sourcePath = `public/reference/states/${name}.png`;
  const state = JSON.parse(await fs.readFile(statePath, "utf8"));
  const interaction = (await localState(state)) || {};
  if (interaction.anchor && state.targets?.length) {
    const sourceTarget = state.targets.at(-1);
    const localRect = await interaction.anchor.evaluate((element) =>
      element.getBoundingClientRect().toJSON(),
    );
    await page.evaluate(
      ({ delta }) => window.scrollBy(0, delta),
      { delta: localRect.y - sourceTarget.rect.y },
    );
  } else {
    await page.evaluate((scroll) => window.scrollTo(scroll.x, scroll.y), state.scroll || { x: 0, y: 0 });
  }
  await page.waitForTimeout(name.startsWith("hover-") ? 3400 : 600);
  if (name.startsWith("hover-")) await freezeMedia(page);

  const localPath = `${outputDir}/${name}-local.png`;
  const diffPath = `${outputDir}/${name}-diff.png`;
  const sidePath = `${outputDir}/${name}-side-by-side.png`;
  await page.screenshot({ path: localPath, animations: "disabled" });

  const source = PNG.sync.read(await fs.readFile(sourcePath));
  const local = PNG.sync.read(await fs.readFile(localPath));
  const width = Math.max(source.width, local.width);
  const height = Math.max(source.height, local.height);
  const align = (image) => {
    if (image.width === width && image.height === height) return image;
    const next = new PNG({ width, height });
    next.data.fill(255);
    PNG.bitblt(image, next, 0, 0, image.width, image.height, 0, 0);
    return next;
  };
  const a = align(source);
  const b = align(local);
  const diff = new PNG({ width, height });
  const pixels = pixelmatch(a.data, b.data, diff.data, width, height, {
    threshold: 0.12,
    includeAA: false,
  });
  await fs.writeFile(diffPath, PNG.sync.write(diff));
  const side = new PNG({ width: width * 2, height });
  PNG.bitblt(a, side, 0, 0, width, height, 0, 0);
  PNG.bitblt(b, side, 0, 0, width, height, width, 0);
  await fs.writeFile(sidePath, PNG.sync.write(side));
  const row = {
    name,
    differentPixels: pixels,
    differenceRatio: pixels / (width * height),
    source: sourcePath,
    local: localPath,
    diff: diffPath,
    sideBySide: sidePath,
  };
  results.push(row);
  console.log("STATE", name, `${(row.differenceRatio * 100).toFixed(3)}%`);
}

await compare("mobile-menu-mobile-open", async () => {
  await open("/", viewports.mobile);
  await page.getByRole("button", { name: "Open menu", exact: true }).click();
  await page.getByRole("button", { name: "Close menu", exact: true }).waitFor();
});

await compare("faq-mobile-open-all", async () => {
  await open("/", viewports.mobile);
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
  return { anchor: page.getByRole("button", { name: questions.at(-1), exact: true }) };
});

await compare("about-carousel-mobile-next", async () => {
  await open("/about", viewports.mobile);
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.waitForTimeout(550);
});

async function settleVideos() {
  await page.evaluate(async () => {
    await Promise.all(
      [...document.querySelectorAll("video")].map(
        (video) =>
          new Promise((resolve) => {
            const seek = () => {
              video.pause();
              const finish = () => resolve();
              video.addEventListener("seeked", finish, { once: true });
              try {
                video.currentTime = Math.min(1, Number.isFinite(video.duration) ? video.duration / 2 : 1);
              } catch {
                resolve();
              }
              setTimeout(resolve, 2_000);
            };
            if (video.readyState >= 2) seek();
            else {
              video.addEventListener("loadeddata", seek, { once: true });
              video.load();
              setTimeout(resolve, 3_000);
            }
          }),
      ),
    );
  });
}

await compare("news-load-more-expanded", async () => {
  await open("/news", viewports.laptop);
  await page.getByRole("button", { name: "Load More", exact: true }).click();
  const anchor = page.locator('a[href="/news/the-science-of-circadian-health"]');
  await anchor.waitFor();
  await settleVideos();
  return { anchor };
});

await compare("success-stories-load-more-expanded", async () => {
  await open("/success-stories", viewports.laptop);
  await page.getByRole("button", { name: "Load More", exact: true }).click();
  const anchor = page.locator('a[href="/success-stories/strategic-health-acceleration"]');
  await anchor.waitFor();
  await settleVideos();
  return { anchor };
});

await compare("hover-nav-about", async () => {
  await open("/", viewports.laptop);
  await page.getByRole("link", { name: "About", exact: true }).first().hover();
});

await compare("hover-primary-button", async () => {
  await open("/", viewports.laptop);
  await page.getByRole("link", { name: /Request Access/ }).first().hover();
});

await compare("hover-story-card", async () => {
  await open("/", viewports.laptop);
  const anchor = page.locator('a[href="/success-stories/scaling-executive-vitality"]').first();
  await anchor.scrollIntoViewIfNeeded();
  await anchor.hover();
  return { anchor };
});

await compare("contact-valid-filled", async () => {
  await open("/contact", viewports.laptop);
  const form = page.locator("form").first();
  await form.getByPlaceholder("Full name").fill("Ada Lovelace");
  await form.locator('input[type="email"]').fill("ada@example.com");
  await form.locator("select").first().selectOption({ label: "United States" });
  await form.locator("select").nth(1).selectOption({ label: "Performance" });
  await form.getByRole("checkbox", { name: "Full Lab Analysis" }).check();
  await form.getByRole("checkbox", { name: "Custom Wellness Protocol" }).check();
});

await fs.writeFile(`${outputDir}/report.json`, JSON.stringify(results, null, 2));
await browser.close();
