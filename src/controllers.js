import { submitContact } from "./contact-delivery.js";
import { openClinicDemo } from "./clinic-demo.js";
import revealTiming from "../reference/reveal-timing.json";
import scrollReveals from "../reference/reveal-selectors.json";

import { parseFragment, routeKey } from "./reference.js";
import { installProgressSectionMotion } from "./progress-section.js";

import { faqQuestions } from "./site-chrome.js";

const carouselPositions = new WeakMap();
const carouselRestarts = new WeakMap();
const hoverSnapshots = new WeakMap();
const copyResetTimers = new WeakMap();

function elementFromOuterHtml(outerHtml) {
  const template = document.createElement("template");
  template.innerHTML = outerHtml.trim();
  return template.content.firstElementChild;
}

function findFaqItem(root, question) {
  return [...root.querySelectorAll('div[tabindex="0"]')].find((element) =>
    element.textContent.trim().startsWith(question),
  );
}

function prepareMenuToggle(nav) {
  const toggle = nav?.querySelector('div[tabindex="0"]');
  if (!toggle) return;
  const open = nav.dataset.localMenuOpen === "true";
  toggle.setAttribute("role", "button");
  toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  toggle.setAttribute("aria-expanded", String(open));
}

function prepareFaqItem(item) {
  const question = faqQuestions.find((text) => item.textContent.trim().startsWith(text));
  if (!question) return;
  const isOpen = item.textContent.trim().length > question.length + 5;
  item.setAttribute("role", "button");
  item.setAttribute("aria-expanded", String(isOpen));
  item.setAttribute("aria-label", question);
}

export function enhanceInteractiveSemantics(scope) {
  scope.querySelectorAll("nav").forEach(prepareMenuToggle);
  scope.querySelectorAll('div[tabindex="0"]').forEach(prepareFaqItem);
  scope.querySelectorAll("form").forEach(syncContactFormState);
}

function stateTargetHtml(state) {
  const html = state?.targets?.[0]?.outerHtml;
  if (!html) return null;
  return parseFragment(html, state.path).body.firstElementChild?.outerHTML || null;
}

export function buildTemplates({
  pageHtml,
  menuClosed,
  menuOpen,
  faqOpenAll,
  loadMore,
  hoverNav,
  hoverPrimary,
  hoverStory,
}) {
  const current = parseFragment(pageHtml);
  const templates = {
    closedFaq: new Map(),
    openFaq: new Map(),
    menuClosed: null,
    menuOpen: null,
    expandedItems: null,
    initialNavigation: current.querySelector("nav")?.outerHTML || null,
    stickyNavigation: null,
    hoverNav: stateTargetHtml(hoverNav),
    hoverPrimary: stateTargetHtml(hoverPrimary),
    hoverStory: stateTargetHtml(hoverStory),
  };

  for (const question of faqQuestions) {
    const closed = findFaqItem(current, question);
    if (closed) {
      templates.closedFaq.set(question, {
        outerHtml: closed.outerHTML,
        containerHeight: closed.parentElement?.style.height || "88px",
      });
    }
  }

  if (faqOpenAll) {
    const openDocument = parseFragment(faqOpenAll.bodyHtml);
    for (const question of faqQuestions) {
      const open = findFaqItem(openDocument, question);
      if (open) {
        templates.openFaq.set(question, {
          outerHtml: open.outerHTML,
          containerHeight: open.parentElement?.style.height || "auto",
        });
      }
    }
  }

  if (menuClosed) {
    templates.menuClosed =
      parseFragment(menuClosed.bodyHtml, menuClosed.path).querySelector("nav")?.outerHTML || null;
  }
  if (menuOpen) {
    templates.menuOpen =
      parseFragment(menuOpen.bodyHtml, menuOpen.path).querySelector("nav")?.outerHTML || null;
  }
  if (hoverStory) {
    templates.stickyNavigation =
      parseFragment(hoverStory.bodyHtml, hoverStory.path).querySelector("nav")?.outerHTML || null;
  }
  if (loadMore) {
    const expanded = parseFragment(loadMore.bodyHtml, loadMore.path);
    templates.expandedItems =
      expanded.querySelector('[data-framer-name="Items Section"]')?.outerHTML || null;
    templates.stickyNavigation = expanded.querySelector("nav")?.outerHTML || null;
  }
  return templates;
}

function setCurrentNavigationLink(nav, pathname) {
  nav.querySelectorAll("a[data-framer-page-link-current]").forEach((anchor) =>
    anchor.removeAttribute("data-framer-page-link-current"),
  );
  for (const anchor of nav.querySelectorAll("a[href]")) {
    const href = anchor.getAttribute("href")?.split("#")[0];
    if (href === pathname || (pathname === "/" && href === "/")) {
      anchor.setAttribute("data-framer-page-link-current", "true");
    }
  }
}

function animateElementHeight(element, startHeight, endHeight, kind) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches || startHeight === endHeight) {
    return;
  }
  const originalHeight = element.style.height;
  const originalOverflow = element.style.overflow;
  element.style.height = `${startHeight}px`;
  element.style.overflow = "hidden";
  const menuProgress = [0, 0.12, 0.43, 0.7, 0.88, 0.97, 1.005, 1.015, 1.009, 0.998, 1];
  const menuOffsets = [0, 0.08, 0.16, 0.24, 0.32, 0.4, 0.49, 0.57, 0.7, 0.85, 1];
  const faqProgress = [0, 0.065, 0.249, 0.535, 0.8, 0.958, 1];
  const progress = kind === "menu" ? menuProgress : faqProgress;
  const offsets = kind === "menu" ? menuOffsets : [0, 0.165, 0.33, 0.5, 0.665, 0.83, 1];
  const animation = element.animate(
    progress.map((value, index) => ({
      height: `${startHeight + (endHeight - startHeight) * value}px`,
      offset: offsets[index],
    })),
    {
      delay: kind === "faq" ? 33 : 0,
      duration: kind === "menu" ? 420 : 200,
      easing: "linear",
      fill: "both",
    },
  );
  animation.finished
    .then(() => {
      animation.cancel();
      element.style.height = originalHeight;
      element.style.overflow = originalOverflow;
    })
    .catch(() => {});
}

function replaceNavigation(nav, outerHtml, pathname, open) {
  if (!outerHtml) return;
  const startHeight = nav.getBoundingClientRect().height;
  const shouldRestoreFocus = nav.contains(document.activeElement);
  const replacement = elementFromOuterHtml(outerHtml);
  setCurrentNavigationLink(replacement, pathname);
  replacement.dataset.localMenuOpen = String(open);
  if (window.innerWidth < 810 && window.scrollY > 80) {
    replacement.style.backgroundColor =
      "var(--token-2cb724d1-b8ed-4091-9220-9830f90479f0, rgb(254, 249, 239))";
    replacement.dataset.localSticky = "true";
  }
  prepareMenuToggle(replacement);
  nav.replaceWith(replacement);
  const endHeight = replacement.getBoundingClientRect().height;
  animateElementHeight(replacement, startHeight, endHeight, "menu");
  if (shouldRestoreFocus) {
    replacement.querySelector('div[tabindex="0"]')?.focus({ preventScroll: true });
  }
}

function replaceStickyNavigation(scope, outerHtml, pathname, sticky) {
  const nav = scope.querySelector("nav");
  if (!nav || !outerHtml || nav.dataset.localMenuOpen === "true") return;
  if (nav.dataset.localSticky === String(sticky)) return;
  const replacement = elementFromOuterHtml(outerHtml);
  setCurrentNavigationLink(replacement, pathname);
  replacement.dataset.localSticky = String(sticky);
  replacement.dataset.localMenuOpen = "false";
  prepareMenuToggle(replacement);
  nav.replaceWith(replacement);
}

export function installStickyNavigation(scope, route, templates) {
  if (!templates.initialNavigation) return () => {};
  const update = () => {
    const sticky = window.scrollY > 80;
    let stickyNavigation = templates.stickyNavigation;
    if (sticky && window.innerWidth < 810) {
      const mobile = elementFromOuterHtml(templates.initialNavigation);
      mobile.style.backgroundColor =
        "var(--token-2cb724d1-b8ed-4091-9220-9830f90479f0, rgb(254, 249, 239))";
      stickyNavigation = mobile.outerHTML;
    }
    replaceStickyNavigation(
      scope,
      sticky ? stickyNavigation : templates.initialNavigation,
      route,
      sticky,
    );
  };
  window.addEventListener("scroll", update, { passive: true });
  update();
  return () => window.removeEventListener("scroll", update);
}

function toggleFaq(item, templates) {
  const question = faqQuestions.find((text) => item.textContent.trim().startsWith(text));
  if (!question) return false;
  const isOpen = item.textContent.trim().length > question.length + 5;
  const next = isOpen ? templates.closedFaq.get(question) : templates.openFaq.get(question);
  if (!next) return true;
  const container = item.parentElement;
  const startHeight = container?.getBoundingClientRect().height || item.getBoundingClientRect().height;
  const shouldRestoreFocus = item === document.activeElement || item.contains(document.activeElement);
  const replacement = elementFromOuterHtml(next.outerHtml);
  if (container && next.containerHeight) container.style.height = next.containerHeight;
  prepareFaqItem(replacement);
  item.replaceWith(replacement);
  if (container) {
    const endHeight = Number.parseFloat(next.containerHeight) || replacement.getBoundingClientRect().height;
    animateElementHeight(container, startHeight, endHeight, "faq");
    animateElementHeight(replacement, startHeight, endHeight, "faq");
  }
  if (shouldRestoreFocus) replacement.focus({ preventScroll: true });
  return true;
}

function localStatus(form) {
  let status = form.querySelector('[role="status"]');
  if (!status) {
    status = document.createElement("div");
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    status.className = "local-form-status";
    form.append(status);
  }
  const isContact = Boolean(form.querySelector('input[placeholder="Full name"]'));
  status.textContent = isContact
    ? "Your inquiry preview is ready. Nothing has been sent; contact delivery is not connected yet."
    : "Local demo only — this email was not subscribed.";
}

function submitLocalForm(form) {
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }
  if (form.dataset.syrenContact === "true") {
    void submitContact(form, syncContactFormState);
    return;
  }
  localStatus(form);
}

function syncContactFormState(form) {
  if (!form?.querySelector('input[placeholder="Full name"]')) return;
  const button = form.querySelector('button[type="submit"]');
  if (!button) return;
  const valid = form.checkValidity() && form.dataset.sending !== "true";
  button.classList.toggle("framer-v-1mwk4iw", !valid);
  button.classList.toggle("framer-v-1yu8f8x", valid);
  button.dataset.framerName = valid ? "Default" : "Disabled";
  button.style.opacity = valid ? "1" : "0.5";
  button.style.willChange = valid ? "transform" : "auto";
  button.setAttribute("aria-disabled", String(!valid));
}

function copyVariantState(current, variant) {
  const currentNodes = [current, ...current.querySelectorAll("*")];
  const variantNodes = [variant, ...variant.querySelectorAll("*")];
  hoverSnapshots.set(
    current,
    currentNodes.map((node) => ({ node, className: node.getAttribute("class"), style: node.getAttribute("style") })),
  );
  for (let index = 0; index < Math.min(currentNodes.length, variantNodes.length); index += 1) {
    const source = variantNodes[index];
    const target = currentNodes[index];
    for (const attribute of ["class", "style"]) {
      const value = source.getAttribute(attribute);
      if (value == null) target.removeAttribute(attribute);
      else target.setAttribute(attribute, value);
    }
  }
}

function restoreVariantState(element) {
  const snapshot = hoverSnapshots.get(element);
  if (!snapshot) return;
  for (const { node, className, style } of snapshot) {
    if (className == null) node.removeAttribute("class");
    else node.setAttribute("class", className);
    if (style == null) node.removeAttribute("style");
    else node.setAttribute("style", style);
  }
  hoverSnapshots.delete(element);
}

function hoverTarget(target, templates) {
  const anchor = target.closest("a[href]");
  if (!anchor) return null;
  const href = anchor.getAttribute("href")?.split("#")[0];
  // These cards contain custom markup. Applying the captured Framer hover
  // variant copies classes by child index and destroys their layout.
  if (anchor.dataset.syrenHowCard === "true") return null;
  if (anchor.closest("nav") && anchor.dataset.syrenNavLink) return [anchor, templates.hoverNav];
  if (anchor.closest("nav") && anchor.dataset.syrenCta) return [anchor, templates.hoverPrimary];
  if (anchor.closest("nav") && href === "/about") return [anchor, templates.hoverNav];
  if (anchor.closest("nav") && href === "/contact") return [anchor, templates.hoverPrimary];
  if (href === "/success-stories/scaling-executive-vitality") return [anchor, templates.hoverStory];
  return null;
}

async function handleShare(button) {
  const label = button.getAttribute("aria-label")?.toLowerCase() || "";
  const pageUrl = window.location.href;
  if (label.includes("copy") || label.includes("link copied")) {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(pageUrl);
      button.setAttribute("aria-label", "Link copied");
      window.clearTimeout(copyResetTimers.get(button));
      copyResetTimers.set(
        button,
        window.setTimeout(() => button.setAttribute("aria-label", "Share on copy"), 2_000),
      );
    } catch {
      button.setAttribute("aria-label", "Unable to copy link");
    }
    return;
  }
  const encoded = encodeURIComponent(pageUrl);
  const target = label.includes("facebook")
    ? `https://www.facebook.com/sharer/sharer.php?u=${encoded}`
    : label.includes("linkedin")
      ? `https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`
      : `https://x.com/intent/post?url=${encoded}`;
  window.open(target, "_blank", "noopener,noreferrer");
}

function setAboutCarouselIndex(section, index, animate = true) {
  const track = section?.querySelector("ul");
  if (!section || !track) return;
  const gap = Number.parseFloat(getComputedStyle(track).gap) || 10;
  const step = section.clientWidth + gap;
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  for (const [slideIndex, slide] of [...track.children].entries()) {
    const content = slide.firstElementChild;
    if (!content) continue;
    content.style.visibility = "visible";
    content.setAttribute("aria-hidden", String(slideIndex !== index));
  }
  track.style.transition =
    reduceMotion || !animate ? "none" : "transform 700ms cubic-bezier(.22,1,.36,1)";
  track.style.transform = `translateX(${-index * step}px)`;
  carouselPositions.set(section, index);

  if (index === 4 || index === 10) {
    window.setTimeout(() => {
      const wrapped = index === 4 ? 9 : 5;
      track.style.transition = "none";
      track.style.transform = `translateX(${-wrapped * step}px)`;
      carouselPositions.set(section, wrapped);
      for (const [slideIndex, slide] of [...track.children].entries()) {
        slide.firstElementChild?.setAttribute("aria-hidden", String(slideIndex !== wrapped));
      }
    }, reduceMotion || !animate ? 0 : 720);
  }
}

function moveAboutCarousel(button) {
  const section = button.closest("section");
  if (!section) return;
  const index = carouselPositions.get(section) ?? 5;
  const direction = button.getAttribute("aria-label") === "Next" ? 1 : -1;
  setAboutCarouselIndex(section, index + direction);
  carouselRestarts.get(section)?.();
}

export function installAboutCarousel(scope, route) {
  if (route !== "/about") return () => {};
  const next = scope.querySelector('button[aria-label="Next"]');
  const section = next?.closest("section");
  const track = section?.querySelector("ul");
  if (!section || !track) return () => {};

  carouselPositions.set(section, 5);
  let interval = 0;
  let drag = null;
  const autoplayAllowed = !matchMedia("(prefers-reduced-motion: reduce)").matches;
  const startAutoplay = () => {
    window.clearInterval(interval);
    if (!autoplayAllowed) return;
    interval = window.setInterval(() => {
      setAboutCarouselIndex(section, (carouselPositions.get(section) ?? 5) + 1);
    }, 3_000);
  };
  const onPointerDown = (event) => {
    if (event.button !== 0 || event.target.closest("button")) return;
    const step = section.clientWidth + (Number.parseFloat(getComputedStyle(track).gap) || 10);
    drag = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      index: carouselPositions.get(section) ?? 5,
      step,
      horizontal: false,
    };
    section.setPointerCapture?.(event.pointerId);
    window.clearInterval(interval);
  };
  const onPointerMove = (event) => {
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (!drag.horizontal && Math.abs(dx) < 8) return;
    if (!drag.horizontal && Math.abs(dy) > Math.abs(dx)) {
      drag = null;
      startAutoplay();
      return;
    }
    drag.horizontal = true;
    event.preventDefault();
    track.style.cursor = "grabbing";
    track.style.transition = "none";
    track.style.transform = `translateX(${-(drag.index * drag.step) + dx}px)`;
  };
  const onPointerUp = (event) => {
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.startX;
    const nextIndex =
      drag.horizontal && Math.abs(dx) > drag.step * 0.18
        ? drag.index + (dx < 0 ? 1 : -1)
        : drag.index;
    drag = null;
    track.style.cursor = "grab";
    setAboutCarouselIndex(section, nextIndex);
    startAutoplay();
  };

  section.addEventListener("pointerdown", onPointerDown);
  section.addEventListener("pointermove", onPointerMove);
  section.addEventListener("pointerup", onPointerUp);
  section.addEventListener("pointercancel", onPointerUp);
  carouselRestarts.set(section, startAutoplay);
  startAutoplay();
  return () => {
    window.clearInterval(interval);
    section.removeEventListener("pointerdown", onPointerDown);
    section.removeEventListener("pointermove", onPointerMove);
    section.removeEventListener("pointerup", onPointerUp);
    section.removeEventListener("pointercancel", onPointerUp);
    carouselRestarts.delete(section);
  };
}

export function installAboutTicker(scope, route) {
  if (route !== "/about" || scope.querySelector('button[aria-label="Next"]')) return () => {};
  const track = scope.querySelector("ul");
  if (!track) return () => {};

  // Framer's ticker virtualizer moves individual items between loop copies.
  // Our independent loop uses their natural flex positions instead.
  for (const child of track.children) child.style.transform = "none";
  track.style.transform = "translateX(0px)";
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return () => {};

  const clones = [];
  if (track.children.length === 5) {
    for (const child of [...track.children]) {
      const clone = child.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      clone.dataset.localTickerClone = "true";
      track.append(clone);
      clones.push(clone);
    }
  }

  // Five 320px cards and five 16px inter-card gaps form the source's 1680px
  // loop. The measured production velocity is a constant 30px/s to the left.
  const animation = track.animate(
    [{ transform: "translateX(0px)" }, { transform: "translateX(-1680px)" }],
    {
      duration: 56_000,
      easing: "linear",
      iterations: Infinity,
    },
  );
  return () => {
    animation.cancel();
    clones.forEach((clone) => clone.remove());
  };
}

export function installReferenceMotion(scope, route) {
  const cleanProgressMotion = installProgressSectionMotion(scope, route);
  if (route !== "/" || matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return cleanProgressMotion;
  }
  const artwork = scope.querySelector('[data-framer-appear-id="1dbzf36"]');
  if (!artwork) return cleanProgressMotion;
  // Framer's source config uses an over-damped spring (mass 1, stiffness 120,
  // damping 60). Sampling the physical response keeps the original slow settle
  // without shipping Framer's runtime.
  const stiffness = 120;
  const damping = 60;
  const discriminant = Math.sqrt(damping ** 2 - 4 * stiffness);
  const slowRoot = (-damping + discriminant) / 2;
  const fastRoot = (-damping - discriminant) / 2;
  const slowCoefficient = -fastRoot / (fastRoot - slowRoot);
  const fastCoefficient = -1 - slowCoefficient;
  const duration = 3_000;
  const keyframes = Array.from({ length: 61 }, (_, index) => {
    const offset = index / 60;
    const seconds = (duration * offset) / 1_000;
    const value =
      1 +
      slowCoefficient * Math.exp(slowRoot * seconds) +
      fastCoefficient * Math.exp(fastRoot * seconds);
    return { opacity: Math.max(0.001, Math.min(1, value)), offset };
  });
  const animation = artwork.animate(keyframes, {
    delay: 300,
    duration,
    easing: "linear",
    fill: "both",
  });
  return () => {
    animation.cancel();
    cleanProgressMotion();
  };
}

function restoreMotionStyle(element, style) {
  element.style.opacity = style.opacity;
  element.style.transform = style.transform;
  element.style.willChange = style.willChange;
}

function revealTransform(entry, remaining) {
  const transforms = [];
  if (entry.baseTransform && entry.baseTransform !== "none") transforms.push(entry.baseTransform);
  const translateY = (entry.translateY ?? 60) * remaining;
  if (Math.abs(translateY) > 0.001) transforms.push(`translateY(${translateY}px)`);
  if (entry.scale != null) {
    const scale = 1 - (1 - entry.scale) * remaining;
    if (Math.abs(scale - 1) > 0.0001) transforms.push(`scale(${scale})`);
  }
  return transforms.length ? transforms.join(" ") : "none";
}

function revealKeyframes(entry) {
  const frames = revealTiming.frames.filter((frame) => frame.ms <= revealTiming.fit.approxSettleMs);
  const duration = revealTiming.fit.approxSettleMs;
  return {
    duration,
    frames: [
      { opacity: 0, transform: revealTransform(entry, 1), offset: 0 },
      ...frames.map((frame) => ({
        opacity: frame.opacity,
        transform: revealTransform(entry, frame.y / 60),
        offset: Math.min(1, frame.ms / duration),
      })),
      { opacity: 1, transform: revealTransform(entry, 0), offset: 1 },
    ],
  };
}

export function installScrollRevealMotion(scope, route, variant) {
  const entries = scrollReveals[routeKey(route)]?.[variant] || [];
  const elements = [];
  const seen = new Map();

  for (const entry of entries) {
    for (const element of scope.querySelectorAll(entry.selector)) {
      if (element.getBoundingClientRect().width === 0) continue;
      const existing = seen.get(element);
      if (existing) {
        if (Object.keys(entry).length > Object.keys(existing.entry).length) {
          existing.entry = entry;
          existing.finalStyle.transform = entry.baseTransform || "none";
        }
        continue;
      }
      const finalStyle = {
        // Some route payloads were captured while Framer's reveal was still
        // in flight. Every node in this evidence map is a confirmed 0/60px
        // reveal target, whose settled source state is 1/none.
        opacity: "1",
        transform: entry.baseTransform || "none",
        willChange: element.style.willChange,
      };
      const item = { element, finalStyle, entry };
      seen.set(element, item);
      elements.push(item);
    }
  }

  // A few snapshots caught a reveal between its initial 0/60px frame and
  // settled state, so it never appeared in the exact initial-frame map. The
  // inline will-change + partial opacity + positive translateY tuple is the
  // same source animation and safely identifies those missed targets.
  for (const element of scope.querySelectorAll('[style*="will-change"]')) {
    if (seen.has(element) || element.getBoundingClientRect().width === 0) continue;
    const opacity = Number.parseFloat(element.style.opacity);
    const transform = element.style.transform;
    if (
      !element.style.willChange.includes("transform") ||
      !Number.isFinite(opacity) ||
      opacity <= 0 ||
      opacity >= 1 ||
      !/^translateY\((?:0*[1-9]|[1-9]\d*)(?:\.\d+)?px\)$/.test(transform)
    ) {
      continue;
    }
    const item = {
      element,
      finalStyle: { opacity: "1", transform: "none", willChange: element.style.willChange },
      entry: { selector: "[inline-partial-reveal]", translateY: 60 },
    };
    seen.set(element, item);
    elements.push(item);
  }

  if (!elements.length) return () => {};

  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    elements.forEach(({ element, finalStyle }) => restoreMotionStyle(element, finalStyle));
    return () => {};
  }

  elements.forEach(({ element, entry }) => {
    element.style.opacity = "0";
    element.style.transform = revealTransform(entry, 1);
    element.style.willChange = "transform, opacity";
  });

  const animations = new Set();
  const start = (item) => {
    const { duration, frames } = revealKeyframes(item.entry);
    const animation = item.element.animate(frames, {
      duration,
      easing: "linear",
      fill: "both",
    });
    if (!item.entry.onMount) animation.currentTime = 39;
    animations.add(animation);
    animation.addEventListener(
      "finish",
      () => {
        animation.cancel();
        animations.delete(animation);
        restoreMotionStyle(item.element, item.finalStyle);
      },
      { once: true },
    );
  };
  const observer = new IntersectionObserver(
    (changes) => {
      for (const change of changes) {
        if (!change.isIntersecting) continue;
        observer.unobserve(change.target);
        const item = seen.get(change.target);
        if (!item) continue;
        start(item);
      }
    },
    { threshold: 0.01 },
  );

  elements.forEach((item) => {
    if (item.entry.onMount) start(item);
    else observer.observe(item.element);
  });

  return () => {
    observer.disconnect();
    animations.forEach((animation) => animation.cancel());
    elements.forEach(({ element, finalStyle }) => restoreMotionStyle(element, finalStyle));
  };
}

export function createInteractionHandlers({ route, templates, navigate }) {
  function onClick(event) {
    const demoTrigger = event.target.closest('[data-syren-demo-trigger],a[data-syren-how-step="3"]');
    if (demoTrigger && event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
      event.preventDefault();
      openClinicDemo(demoTrigger);
      return;
    }
    const anchor = event.target.closest("a[href]");
    if (anchor) {
      const href = anchor.getAttribute("href");
      const ordinaryClick =
        event.button === 0 &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.shiftKey &&
        !event.altKey &&
        !anchor.hasAttribute("download") &&
        (!anchor.target || anchor.target === "_self");
      if (href?.startsWith("/") && ordinaryClick) {
        event.preventDefault();
        const nav = anchor.closest("nav");
        if (nav?.dataset.localMenuOpen === "true") {
          replaceNavigation(nav, templates.menuClosed, route, false);
        }
        navigate(href);
        return;
      }
    }

    const share = event.target.closest(
      'button[aria-label^="Share on"],button[aria-label="Link copied"]',
    );
    if (share) {
      event.preventDefault();
      handleShare(share);
      return;
    }

    const carouselButton = event.target.closest('button[aria-label="Previous"],button[aria-label="Next"]');
    if (carouselButton && carouselButton.closest("section")?.querySelector("ul")) {
      event.preventDefault();
      moveAboutCarousel(carouselButton);
      return;
    }

    const menuToggle = event.target.closest('nav div[tabindex="0"]');
    if (menuToggle && menuToggle.tagName === "DIV") {
      const nav = menuToggle.closest("nav");
      const open = nav.dataset.localMenuOpen === "true";
      replaceNavigation(nav, open ? templates.menuClosed : templates.menuOpen, route, !open);
      return;
    }

    const faqItem = event.target.closest('div[tabindex="0"]');
    if (faqItem && toggleFaq(faqItem, templates)) return;

    const loadMore = event.target.closest("button");
    if (loadMore?.textContent.trim() === "Load More" && templates.expandedItems) {
      event.preventDefault();
      const section = loadMore.closest('[data-framer-name="Items Section"]');
      section?.replaceWith(elementFromOuterHtml(templates.expandedItems));
    }
  }

  function onKeyDown(event) {
    if (!["Enter", " "].includes(event.key)) return;
    const menuToggle = event.target.closest('nav div[tabindex="0"]');
    if (menuToggle) {
      event.preventDefault();
      const nav = menuToggle.closest("nav");
      const open = nav.dataset.localMenuOpen === "true";
      replaceNavigation(nav, open ? templates.menuClosed : templates.menuOpen, route, !open);
      return;
    }
    const faqItem = event.target.closest('div[tabindex="0"]');
    if (!faqItem || !faqQuestions.some((question) => faqItem.textContent.trim().startsWith(question))) return;
    event.preventDefault();
    toggleFaq(faqItem, templates);
  }

  function onSubmit(event) {
    event.preventDefault();
    event.stopPropagation();
    submitLocalForm(event.target);
  }

  function onInput(event) {
    syncContactFormState(event.target.closest("form"));
  }

  function onChange(event) {
    syncContactFormState(event.target.closest("form"));
  }

  function onPointerOver(event) {
    if (window.innerWidth < 810 || !matchMedia("(hover: hover)").matches) return;
    const result = hoverTarget(event.target, templates);
    if (!result) return;
    const [element, outerHtml] = result;
    if (!outerHtml || element.contains(event.relatedTarget) || hoverSnapshots.has(element)) return;
    const variant = elementFromOuterHtml(outerHtml);
    if (variant) copyVariantState(element, variant);
  }

  function onPointerOut(event) {
    const result = hoverTarget(event.target, templates);
    if (!result) return;
    const [element] = result;
    if (event.relatedTarget && element.contains(event.relatedTarget)) return;
    restoreVariantState(element);
  }

  return { onClick, onKeyDown, onInput, onChange, onPointerOver, onPointerOut, onSubmit };
}
