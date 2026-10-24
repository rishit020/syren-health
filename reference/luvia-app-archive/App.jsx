import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import {
  buildTemplates,
  createInteractionHandlers,
  enhanceInteractiveSemantics,
  installAboutCarousel,
  installAboutTicker,
  installReferenceMotion,
  installScrollRevealMotion,
  installStickyNavigation,
} from "./controllers.js";
import {
  applyDocumentAttributes,
  loadPage,
  loadState,
  normalizePath,
  resolvedRoute,
  sanitizeBodyHtml,
  viewportVariant,
} from "./reference.js";

function currentLocation() {
  return {
    pathname: normalizePath(window.location.pathname),
    hash: window.location.hash,
  };
}

function useLocation() {
  const [location, setLocation] = useState(currentLocation);
  useEffect(() => {
    const update = () => setLocation(currentLocation());
    window.addEventListener("popstate", update);
    return () => window.removeEventListener("popstate", update);
  }, []);
  return [location, setLocation];
}

function useViewportVariant() {
  const [variant, setVariant] = useState(() => viewportVariant(window.innerWidth));
  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setVariant(viewportVariant(window.innerWidth)));
    };
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", update);
    };
  }, []);
  return variant;
}

function initialBundle(page) {
  const html = sanitizeBodyHtml(page.bodyHtml, page.path);
  return {
    page,
    html,
    templates: buildTemplates({ pageHtml: html }),
  };
}

async function loadInteractionTemplates(page, route, variant) {
  const small = variant === "mobile" || variant === "tablet";
  const hasFaq = ["/", "/about", "/contact", "/pricing"].includes(route);
  const menuPromise = small
    ? Promise.all([
        loadState(`mobile-menu-${variant}-closed`),
        loadState(`mobile-menu-${variant}-open`),
      ])
    : Promise.resolve([null, null]);
  const faqPromise = hasFaq
    ? loadState(`faq-${small ? "mobile" : "laptop"}-open-all`)
    : Promise.resolve(null);
  const loadMorePromise = ["/news", "/success-stories"].includes(route)
    ? loadState(`${route === "/news" ? "news" : "success-stories"}-load-more-expanded`)
    : Promise.resolve(null);
  const hoverPromise = Promise.all([
    loadState("hover-nav-about"),
    loadState("hover-primary-button"),
    loadState("hover-story-card"),
  ]);
  const [[menuClosed, menuOpen], faqOpenAll, loadMore, hoverStates] = await Promise.all([
    menuPromise,
    faqPromise,
    loadMorePromise,
    hoverPromise,
  ]);
  const bundle = initialBundle(page);
  return {
    ...bundle,
    templates: buildTemplates({
      pageHtml: bundle.html,
      menuClosed,
      menuOpen,
      faqOpenAll,
      loadMore,
      hoverNav: hoverStates[0],
      hoverPrimary: hoverStates[1],
      hoverStory: hoverStates[2],
    }),
  };
}

export default function App() {
  const [location, setLocation] = useLocation();
  const variant = useViewportVariant();
  const route = resolvedRoute(location.pathname);
  const [bundle, setBundle] = useState(null);
  const [error, setError] = useState(null);
  const surfaceRef = useRef(null);

  useEffect(() => {
    let current = true;
    let visibleBundle = null;
    setError(null);
    setBundle(null);
    loadPage(route, variant)
      .then((page) => {
        if (!current) return;
        applyDocumentAttributes(page);
        visibleBundle = initialBundle(page);
        setBundle(visibleBundle);
        return loadInteractionTemplates(page, route, variant);
      })
      .then((nextBundle) => {
        // Interaction templates do not affect the initial pixels. Mutating the
        // stable template object avoids replacing the live DOM after a quick
        // user interaction while these larger state snapshots finish loading.
        if (current && nextBundle && visibleBundle) {
          Object.assign(visibleBundle.templates, nextBundle.templates);
          window.dispatchEvent(new Event("scroll"));
        }
      })
      .catch((reason) => {
        if (current) setError(reason);
      });
    return () => {
      current = false;
    };
  }, [route, variant]);

  useEffect(() => {
    if (!bundle || !surfaceRef.current) return undefined;
    enhanceInteractiveSemantics(surfaceRef.current);
    if (location.hash) {
      requestAnimationFrame(() => {
        document.querySelector(location.hash)?.scrollIntoView({ block: "start" });
      });
    } else {
      window.scrollTo(0, 0);
    }
    return undefined;
  }, [bundle, location.hash, route]);

  useLayoutEffect(() => {
    if (!bundle || !surfaceRef.current) return undefined;
    const cleanups = [
      installScrollRevealMotion(surfaceRef.current, route, variant),
      installReferenceMotion(surfaceRef.current, route),
      installAboutCarousel(surfaceRef.current, route),
      installAboutTicker(surfaceRef.current, route),
    ];
    return () => cleanups.forEach((cleanup) => cleanup());
  }, [bundle, route, variant]);

  useEffect(() => {
    if (!bundle || !surfaceRef.current) return undefined;
    return installStickyNavigation(surfaceRef.current, route, bundle.templates);
  }, [bundle, route]);

  const navigate = (href) => {
    const url = new URL(href, window.location.origin);
    if (url.origin !== window.location.origin) return;
    const next = { pathname: normalizePath(url.pathname), hash: url.hash };
    window.history.pushState({}, "", `${next.pathname}${next.hash}`);
    setLocation(next);
  };

  const handlers = useMemo(
    () =>
      bundle
        ? createInteractionHandlers({ route: location.pathname, templates: bundle.templates, navigate })
        : {},
    [bundle, location.pathname],
  );

  if (error) {
    return (
      <main className="reference-error" role="alert">
        <h1>Unable to load this page.</h1>
        <p>{error.message}</p>
      </main>
    );
  }

  if (!bundle) return <div className="reference-loading" aria-label="Loading" />;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: bundle.page.css }} />
      <div
        ref={surfaceRef}
        className="reference-surface"
        onClick={handlers.onClick}
        onKeyDown={handlers.onKeyDown}
        onInput={handlers.onInput}
        onChange={handlers.onChange}
        onPointerOver={handlers.onPointerOver}
        onPointerOut={handlers.onPointerOut}
        onSubmit={handlers.onSubmit}
        dangerouslySetInnerHTML={{ __html: bundle.html }}
      />
    </>
  );
}
