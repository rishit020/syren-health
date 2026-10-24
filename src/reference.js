import { applyScopedHomeContent, homeTitle } from "./home-content.js";
import { applyContactContent } from "./contact-content.js";

const pageCache = new Map();
const stateCache = new Map();

export function normalizePath(pathname) {
  if (!pathname || pathname === "/") return "/";
  const clean = pathname.replace(/\/+$/, "") || "/";
  return clean;
}

export function resolvedRoute(pathname) {
  const normalized = normalizePath(pathname);
  return ["/", "/contact", "/404"].includes(normalized) ? normalized : "/404";
}

export function routeKey(route) {
  return route === "/" ? "home" : route.slice(1).replaceAll("/", "__");
}

export function viewportVariant(width) {
  if (width <= 599) return "mobile";
  if (width <= 809) return "tablet";
  if (width <= 1199) return "compact";
  if (width <= 1359) return "laptop";
  return "desktop";
}

async function loadJson(url, cache) {
  if (!cache.has(url)) {
    cache.set(
      url,
      fetch(url).then((response) => {
        if (!response.ok) throw new Error(`Unable to load reference data: ${url}`);
        return response.json();
      }),
    );
  }
  return cache.get(url);
}

export function loadPage(route, variant) {
  return loadJson(`/reference/${routeKey(route)}/${variant}.json`, pageCache);
}

export function loadState(name) {
  return loadJson(`/reference/states/${name}.json`, stateCache);
}

function normalizeInternalLinks(documentNode, currentPath = "/") {
  documentNode.querySelectorAll("a[href]").forEach((anchor) => {
    const href = anchor.getAttribute("href");
    if (!href || href.startsWith("#") || href.startsWith("/assets/")) return;
    try {
      const url = new URL(href, `https://luvia.framer.website${currentPath}`);
      if (url.origin === "https://luvia.framer.website") {
        anchor.setAttribute("href", `${url.pathname}${url.search}${url.hash}`);
      }
    } catch {
      // Keep malformed outbound references untouched, matching browser behavior.
    }
  });
}

export function sanitizeBodyHtml(html, currentPath = "/") {
  const parsed = new DOMParser().parseFromString(html, "text/html");
  parsed
    .querySelectorAll("script,noscript,#__framer-editorbar,iframe.status_hidden,link[rel='modulepreload'],link[rel='preload'][as='script'],link[rel='prefetch'][as='script'],link[rel='preconnect'],link[rel='dns-prefetch']")
    .forEach((element) => element.remove());
  parsed
    .querySelectorAll("[data-capture-target]")
    .forEach((element) => element.removeAttribute("data-capture-target"));
  parsed.querySelectorAll("form").forEach((form) => {
    form.removeAttribute("action");
    form.removeAttribute("method");
    form.setAttribute("data-local-form", "true");
  });
  parsed.querySelectorAll('button[aria-label^="Share on"]').forEach((button) => {
    button.setAttribute("type", "button");
  });
  normalizeInternalLinks(parsed, currentPath);
  applyScopedHomeContent(parsed);
  applyContactContent(parsed);
  if (currentPath === "/404") {
    parsed.querySelectorAll("h1,h2,p").forEach((node) => {
      if (node.textContent.startsWith("The requested protocol")) {
        node.textContent = "This page isn’t available. Head back to Syren Health to explore the prototype.";
      }
    });
  }
  return parsed.body.innerHTML;
}

export function parseFragment(html, currentPath = "/") {
  const parsed = new DOMParser().parseFromString(html, "text/html");
  normalizeInternalLinks(parsed, currentPath);
  applyScopedHomeContent(parsed);
  applyContactContent(parsed);
  return parsed;
}

export function applyDocumentAttributes(data) {
  document.title = data.path === "/" ? homeTitle : data.path === "/contact" ? "Contact | Syren Health" : "Page not found | Syren Health";
  for (const attribute of [...document.documentElement.attributes]) {
    if (!["lang", "dir"].includes(attribute.name)) {
      document.documentElement.removeAttribute(attribute.name);
    }
  }
  for (const [name, value] of Object.entries(data.htmlAttrs || {})) {
    document.documentElement.setAttribute(name, value);
  }
  for (const attribute of [...document.body.attributes]) {
    document.body.removeAttribute(attribute.name);
  }
  for (const [name, value] of Object.entries(data.bodyAttrs || {})) {
    document.body.setAttribute(name, value);
  }
}
