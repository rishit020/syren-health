import assert from "node:assert/strict";
import { launch, settle } from "./browser.mjs";

const base = process.env.LOCAL_URL || "http://127.0.0.1:4173";
const browser = await launch();
try {
  for (const width of [1440, 768, 390, 320]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(base);
    await page.waitForSelector("#care-experience");
    if (width <= 809) await page.getByRole("button", { name: "Open menu", exact: true }).click();
    await page.locator('nav:visible a[href="/#care-experience"]').click();
    assert.equal(new URL(page.url()).hash, "#care-experience");
    const section = page.locator("#care-experience");
    for (const [id, resident, room] of [["activity", "B", "102"], ["occupancy", "D", "104"], ["device", "E", "105"]]) {
      await section.locator(`[data-care-scenario="${id}"]`).click();
      const panel = section.locator('[role="tabpanel"]');
      assert.equal(await panel.getAttribute("data-care-current"), id);
      assert.equal(await section.locator(`[data-care-scenario="${id}"]`).getAttribute("aria-selected"), "true");
      assert.match(await panel.innerText(), new RegExp(`Room ${room}`));
      await panel.locator(".syren-care__action").click();
      const demo = page.locator("dialog.syren-demo");
      assert.ok(await demo.isVisible());
      assert.equal(await demo.locator("h2").innerText(), "Events");
      assert.equal(await demo.locator(".syren-demo__detail h3").innerText(), `Resident ${resident}`);
      await demo.locator("[data-demo-close]").click();
      assert.ok(await panel.locator(".syren-care__action").evaluate((element) => element === document.activeElement));
    }
    const activeTab = section.locator('[data-care-scenario="device"]');
    await activeTab.focus();
    await page.keyboard.press("Home");
    assert.equal(await section.locator('[data-care-scenario="activity"]').getAttribute("aria-selected"), "true");
    await page.keyboard.press("ArrowRight");
    assert.equal(await section.locator('[data-care-scenario="occupancy"]').getAttribute("aria-selected"), "true");
    await page.keyboard.press("End");
    assert.equal(await section.locator('[data-care-scenario="device"]').getAttribute("aria-selected"), "true");
    await page.keyboard.press("ArrowLeft");
    assert.equal(await section.locator('[data-care-scenario="occupancy"]').getAttribute("aria-selected"), "true");
    assert.ok(await section.evaluate((element) => element.scrollWidth <= element.clientWidth + 1));

    // Click every internal footer destination, then return through the brand.
    for (const href of ["/#top", "/#approach", "/#device", "/#features", "/#how-it-works", "/#testimonials", "/#faq", "/contact"]) {
      const link = page.locator(`footer[data-syren-footer] a[href="${href}"]`).first();
      await link.scrollIntoViewIfNeeded();
      await settle(page, 200);
      await link.click();
      await page.waitForURL(`${base}${href}`);
      if (href.startsWith("/#")) assert.equal(await page.locator(href.slice(1)).count(), 1);
    }
    await page.locator('nav:visible [data-syren-brand]').click();
    await page.waitForURL(`${base}/`);
    const primary = page.locator('[data-syren-home] a[data-syren-demo-trigger]').filter({ hasText: "Try the demo" }).first();
    await primary.click();
    const demo = page.locator("dialog.syren-demo");
    await demo.locator("[data-demo-reset]").click();
    await demo.locator('[data-demo-resident="4"]').click();
    if (width <= 780) {
      const detail = await demo.locator(".syren-demo__detail h3").boundingBox();
      const header = await demo.locator(".syren-demo__topbar").boundingBox();
      const bounds = await demo.boundingBox();
      assert.ok(detail.y >= header.y + header.height - 1 && detail.y < bounds.y + bounds.height, `${width}: selected resident detail is visible`);
    }
    await demo.evaluate((element) => { element.scrollTop = element.scrollHeight; });
    const closeBounds = await demo.locator("[data-demo-close]").boundingBox();
    const dialogBounds = await demo.boundingBox();
    assert.ok(closeBounds.y >= dialogBounds.y && closeBounds.y + closeBounds.height <= dialogBounds.y + dialogBounds.height, `${width}: close control stays in view`);
    await demo.locator("[data-demo-close]").focus();
    for (let index = 0; index < 12; index += 1) {
      await page.keyboard.press("Tab");
      assert.ok(await demo.evaluate((element) => element.contains(document.activeElement)), `${width}: modal focus stays trapped`);
    }
    await page.keyboard.press("Escape");
    assert.ok(await primary.evaluate((element) => element === document.activeElement));
    if (width === 768) {
      const bounds = await page.locator('a[data-syren-how-step="2"]').boundingBox();
      assert.ok(bounds.height < bounds.width, "tablet cards should use the compact landscape layout");
    }
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    assert.deepEqual(errors, []);
    await page.close();
    console.log(`PASS walkthrough ${width}: scenarios, keyboard tabs, footer navigation, primary CTA and modal usability`);
  }
  const lifecycle = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await lifecycle.goto(base);
  await lifecycle.locator(".syren-hero-showcase").click();
  await lifecycle.setViewportSize({ width: 390, height: 844 });
  await lifecycle.waitForTimeout(1000);
  await lifecycle.locator("dialog [data-demo-close]").click();
  await lifecycle.waitForFunction(() => document.activeElement.matches(".syren-hero-showcase"));
  assert.ok(await lifecycle.locator(".syren-hero-showcase").evaluate((element) => element === document.activeElement), "resize restores focus to current page");
  await lifecycle.locator('a[data-syren-how-step="2"]').click();
  await lifecycle.setViewportSize({ width: 1440, height: 900 });
  await lifecycle.waitForTimeout(1000);
  await lifecycle.locator("dialog [data-sensor-close]").click();
  await lifecycle.waitForFunction(() => document.activeElement.matches('a[data-syren-how-step="2"]'));
  assert.ok(await lifecycle.locator('a[data-syren-how-step="2"]').evaluate((element) => element === document.activeElement), "sensor resize restores focus");
  await lifecycle.goto(`${base}/contact`);
  await lifecycle.locator('footer[data-syren-footer] a[href="/#top"]').click();
  await lifecycle.locator(".syren-hero-showcase").click();
  await lifecycle.goBack();
  await lifecycle.waitForSelector("[data-syren-contact]");
  assert.ok(!(await lifecycle.locator("dialog.syren-demo").isVisible()), "browser back dismisses modal");
  await lifecycle.goto(`${base}/this-page-does-not-exist`);
  await lifecycle.waitForSelector("h1");
  assert.match(await lifecycle.locator("h1").innerText(), /404/);
  await lifecycle.getByText("Home page", { exact: true }).first().click();
  await lifecycle.waitForURL(`${base}/`);
  await lifecycle.close();
  console.log("PASS modal lifecycle: resize, focus restoration, browser back and not-found recovery");
  const reduced = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  await reduced.goto(base);
  await reduced.waitForSelector("[data-syren-home] video");
  await reduced.waitForFunction(() => { const video = document.querySelector("[data-syren-home] video"); return video.paused && !video.autoplay; });
  await reduced.emulateMedia({ reducedMotion: "no-preference" });
  await reduced.waitForFunction(() => !document.querySelector("[data-syren-home] video").paused);
  await reduced.emulateMedia({ reducedMotion: "reduce" });
  await reduced.waitForFunction(() => document.querySelector("[data-syren-home] video").paused);
  await reduced.close();
  console.log("PASS decorative video honors initial and changed reduced-motion preferences");
} finally { await browser.close(); }
