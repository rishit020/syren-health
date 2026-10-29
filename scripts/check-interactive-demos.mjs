import assert from "node:assert/strict";
import { launch, settle } from "./browser.mjs";

const base = process.env.LOCAL_URL || "http://127.0.0.1:4173";
const browser = await launch();
try {
  for (const [name, viewport] of Object.entries({ desktop: { width: 1440, height: 900 }, mobile: { width: 390, height: 844 } })) {
    const page = await browser.newPage({ viewport });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(base);
    await page.waitForSelector(".syren-hero-showcase");
    const order = await page.evaluate(() => ["top", "how-it-works", "testimonials", "approach", "features", "engineering", "faq"].map((id) => document.getElementById(id).getBoundingClientRect().top + scrollY));
    assert.ok(order.every((position, index) => index === 0 || position > order[index - 1]), `${name}: technical sections should come after care sections`);
    const trigger = page.locator(".syren-hero-showcase");
    await trigger.click();
    const demo = page.locator("dialog.syren-demo");
    assert.ok(await demo.isVisible());
    assert.match(await demo.innerText(), /synthetic data/i);
    assert.match(await demo.locator("[data-demo-open-count]").innerText(), /^4/);
    for (let index = 0; index < 6; index += 1) {
      await demo.locator(`[data-demo-resident="${index}"]`).click();
      assert.match(await demo.locator(".syren-demo__detail h3").innerText(), new RegExp(`Resident ${String.fromCharCode(65 + index)}`));
    }
    await demo.locator('[data-demo-view="vitals"]').click();
    await demo.locator('[data-demo-resident="0"]').click();
    assert.match(await demo.locator(".syren-demo__vitals").innerText(), /72[\s\S]*16/);
    await demo.locator('[data-demo-resident="1"]').click();
    assert.match(await demo.locator(".syren-demo__vitals").innerText(), /78[\s\S]*17/);
    for (const index of [2, 3, 4, 5]) {
      await demo.locator(`[data-demo-resident="${index}"]`).click();
      assert.match(await demo.locator(".syren-demo__vitals").innerText(), /No sample readings/);
      assert.match(await demo.locator(".syren-demo__trend").innerText(), /unavailable/i);
    }
    await demo.locator('[data-demo-view="devices"]').click();
    assert.match(await demo.innerText(), /Room devices/);
    await demo.locator('[data-demo-view="events"]').click();
    for (const index of [1, 3, 4, 5]) {
      await demo.locator(`.syren-demo__ledger [data-demo-resident="${index}"]`).click();
      await demo.locator(`[data-demo-clear="${index}"]`).click();
      assert.match(await demo.locator(".syren-demo__detail").innerText(), /Cleared in this demo/);
    }
    assert.match(await demo.innerText(), /All demo items have been cleared/);
    await demo.locator('[data-demo-view="overview"]').click();
    assert.match(await demo.locator("[data-demo-open-count]").innerText(), /^0/);
    await demo.locator('[data-demo-view="history"]').click();
    assert.equal(await demo.locator(".syren-demo__history-row").count(), 4);
    await demo.locator("[data-demo-reset]").click();
    assert.match(await demo.locator("[data-demo-open-count]").innerText(), /^4/);
    await demo.locator('[data-demo-view="history"]').click();
    assert.match(await demo.innerText(), /No items cleared yet/);
    assert.ok(await demo.evaluate((element) => element.scrollWidth <= element.clientWidth + 1), `${name}: demo overflow`);
    await demo.locator("[data-demo-close]").click();
    assert.ok(await trigger.evaluate((element) => element === document.activeElement), `${name}: dashboard focus return`);

    // Exercise each distinct public entry point and its default sensor.
    const triggers = [
      ['a[data-syren-how-step="2"]', "radar"],
      ['#testimonials [data-syren-sensor-demo="radar"]', "radar"],
      ['#engineering [data-syren-sensor-demo="radar"]', "radar"],
      ['#engineering [data-syren-sensor-demo="thermal"]', "thermal"],
      ['#engineering [data-syren-sensor-demo="csi"]', "csi"],
    ];
    for (const [selector, initial] of triggers) {
      const button = page.locator(selector);
      await button.scrollIntoViewIfNeeded();
      await settle(page, 700);
      await button.click();
      const sensor = page.locator("dialog.syren-sensor");
      assert.ok(await sensor.isVisible(), `${name}: ${selector} opens walkthrough`);
      assert.equal(await sensor.locator(`[data-sensor-mode="${initial}"]`).getAttribute("aria-pressed"), "true");
      for (const mode of ["radar", "thermal", "csi"]) {
        await sensor.locator(`[data-sensor-mode="${mode}"]`).click();
        assert.equal(await sensor.locator(`[data-sensor-mode="${mode}"]`).getAttribute("aria-pressed"), "true");
        assert.match(await sensor.locator(".syren-sensor__note").innerText(), /illustrat|schematic/i);
        const animated = sensor.locator(mode === "radar" ? ".syren-sensor__waves i" : mode === "thermal" ? ".syren-sensor__grid i.is-warm" : ".syren-sensor__link i").first();
        assert.match(await animated.evaluate((element) => getComputedStyle(element).animationName), /sensor-/);
        assert.equal(await animated.evaluate((element) => getComputedStyle(element).animationPlayState), "running");
      }
      const motion = sensor.locator("[data-sensor-motion]");
      await motion.click();
      assert.equal(await sensor.getAttribute("data-motion"), "paused");
      assert.match(await motion.innerText(), /Play/);
      assert.equal(await sensor.locator(".syren-sensor__link i").first().evaluate((element) => getComputedStyle(element).animationPlayState), "paused");
      await motion.click();
      assert.equal(await sensor.getAttribute("data-motion"), "playing");
      assert.ok(await sensor.evaluate((element) => element.scrollWidth <= element.clientWidth + 1), `${name}: sensor dialog overflow`);
      await sensor.locator("[data-sensor-close]").click();
      assert.ok(await button.evaluate((element) => element === document.activeElement), `${name}: sensor focus return`);
    }
    await page.locator('a[data-syren-how-step="2"]').focus();
    await page.keyboard.press("Enter");
    assert.ok(await page.locator("dialog.syren-sensor").isVisible());
    await page.keyboard.press("Escape");
    assert.ok(!(await page.locator("dialog.syren-sensor").isVisible()));
    await page.locator('a[data-syren-how-step="2"]').click();
    await page.mouse.click(1, 1);
    assert.ok(!(await page.locator("dialog.syren-sensor").isVisible()), `${name}: backdrop closes sensor walkthrough`);
    assert.deepEqual(errors, []);
    await page.close();
    console.log(`PASS ${name}: section order, every demo view and action, all sensor entry points and controls`);
  }
  const reduced = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  await reduced.goto(base);
  await reduced.locator('a[data-syren-how-step="2"]').click();
  assert.ok(await reduced.locator("[data-sensor-motion]").isDisabled());
  assert.match(await reduced.locator("[data-sensor-motion]").innerText(), /Motion reduced/);
  assert.equal(await reduced.locator(".syren-sensor__waves i").first().evaluate((element) => getComputedStyle(element).animationName), "none");
  await reduced.close();
  console.log("PASS reduced motion: sensor animation stays disabled");
} finally { await browser.close(); }
