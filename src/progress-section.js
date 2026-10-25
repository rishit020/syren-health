import "./progress-section.css";

const progressMarkup = `
  <div class="syren-progress__container" id="progress">
    <header class="syren-progress__header syren-progress__reveal" style="--progress-delay: 0ms">
      <p class="syren-progress__eyebrow">Our progress</p>
      <h2 id="syren-progress-heading">Where we are today.</h2>
      <p class="syren-progress__intro">A sensing bench and clinic interface exist today. Multi-room coordination and clinical performance remain open engineering work.</p>
    </header>

    <div class="syren-progress__cards">
      <article class="syren-progress__card syren-progress__reveal" style="--progress-delay: 80ms">
        <div class="syren-progress__visual syren-progress__visual--prototype" aria-hidden="true">
          <div class="syren-progress__visual-label">Sensing inputs</div>
          <div class="syren-progress__instrument">
            <div class="syren-progress__sensor syren-progress__sensor--radar">
              <svg viewBox="0 0 40 40">
                <circle cx="10" cy="20" r="2"></circle>
                <path d="M14 14a8 8 0 0 1 0 12M18 10a14 14 0 0 1 0 20M22 6a20 20 0 0 1 0 28"></path>
              </svg>
              <span>Radar</span>
            </div>
            <div class="syren-progress__signal-path">
              <span></span><span></span><span></span>
            </div>
            <div class="syren-progress__sensor syren-progress__sensor--thermal">
              <span class="syren-progress__thermal-grid">
                <i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>
              </span>
              <span>Thermal</span>
            </div>
            <div class="syren-progress__signal-path"><span></span><span></span><span></span></div>
            <div class="syren-progress__sensor syren-progress__sensor--csi">
              <svg viewBox="0 0 40 40"><path d="M5 14c5-6 10 6 15 0s10-6 15 0M5 25c5-6 10 6 15 0s10-6 15 0"></path></svg>
              <span>CSI</span>
            </div>
          </div>
          <div class="syren-progress__context-line"><span></span>Room context</div>
        </div>
        <div class="syren-progress__card-copy">
          <p class="syren-progress__index">01 / Bench</p>
          <h3>The sensing prototype.</h3>
          <p>Radar, thermal and Wi-Fi CSI are captured in one local engineering setup.</p>
          <span class="syren-progress__status">Bench-tested</span>
        </div>
      </article>

      <article class="syren-progress__card syren-progress__reveal" style="--progress-delay: 150ms">
        <div class="syren-progress__visual syren-progress__visual--priorities" aria-hidden="true">
          <div class="syren-progress__visual-label">Questions to answer</div>
          <div class="syren-progress__criteria">
            <div class="syren-progress__criterion">
              <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="7"></circle><path d="M12 5v3M19 12h-3"></path></svg>
              <span>Reliability</span>
            </div>
            <div class="syren-progress__criterion">
              <svg viewBox="0 0 24 24"><path d="M7 16h10l-1.2-2.1V10a3.8 3.8 0 0 0-7.6 0v3.9L7 16Z"></path><path d="M10 19h4M5 5l14 14"></path></svg>
              <span>False alerts</span>
            </div>
            <div class="syren-progress__criterion">
              <svg viewBox="0 0 24 24"><path d="M5 6.5h14v9H10l-4 3v-3H5v-9Z"></path><path d="M9 10h6M9 12.5h4"></path></svg>
              <span>Caregiver usefulness</span>
            </div>
          </div>
        </div>
        <div class="syren-progress__card-copy">
          <p class="syren-progress__index">02 / Learning</p>
          <h3>What we’re validating.</h3>
          <p>Testing needs to show when the system is useful, and when it gets things wrong.</p>
          <ul class="syren-progress__sr-only" aria-label="Validation priorities">
            <li>Reliability</li>
            <li>False alerts</li>
            <li>Caregiver usefulness</li>
          </ul>
          <span class="syren-progress__status">Validation priorities</span>
        </div>
      </article>

      <article class="syren-progress__card syren-progress__reveal" style="--progress-delay: 220ms">
        <div class="syren-progress__visual syren-progress__visual--feedback" aria-hidden="true">
          <div class="syren-progress__visual-label">Care-team conversation</div>
          <div class="syren-progress__reply-bubble"><span></span><span></span><span></span></div>
          <div class="syren-progress__question-bubble">What would help<br> your team?</div>
        </div>
        <div class="syren-progress__card-copy">
          <p class="syren-progress__index">03 / Listening</p>
          <h3>Care-team feedback.</h3>
          <p>Conversations with care teams can help guide what we build next.</p>
          <a class="syren-progress__card-link" href="/contact">
            <span>Share your perspective</span>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M14 7l5 5-5 5"></path></svg>
          </a>
        </div>
      </article>
    </div>

    <aside class="syren-progress__banner syren-progress__reveal" style="--progress-delay: 120ms" aria-label="Care-team invitation">
      <div class="syren-progress__banner-message">
        <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M6 6.5h20v15H14l-7 5v-5H6v-15Z"></path><circle cx="12" cy="14" r="1"></circle><circle cx="16" cy="14" r="1"></circle><circle cx="20" cy="14" r="1"></circle></svg>
        <p>Work in senior care? Help us build around your team’s needs.</p>
      </div>
      <a href="/contact">Talk to Us</a>
    </aside>
  </div>
`;

export function applyProgressSection(root) {
  const section = root?.querySelector('section[data-framer-name="Testimonials Section"]');
  if (!section || section.dataset.syrenProgress === "true") return;

  const template = root.createElement("template");
  template.innerHTML = progressMarkup.trim();
  section.replaceChildren(template.content.cloneNode(true));
  section.id = "testimonials";
  section.setAttribute("aria-labelledby", "syren-progress-heading");
  section.dataset.syrenProgress = "true";
}

export function installProgressSectionMotion(scope, route) {
  if (route !== "/") return () => {};
  const section = scope?.querySelector('[data-syren-progress="true"]');
  if (!section) return () => {};

  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  section.dataset.progressMotion = reducedMotion ? "reduced" : "ready";
  if (reducedMotion || typeof IntersectionObserver === "undefined") {
    section.classList.add("is-visible");
    return () => {
      section.classList.remove("is-visible", "is-active");
      delete section.dataset.progressMotion;
    };
  }

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry) return;
      if (entry.isIntersecting) {
        section.classList.add("is-visible", "is-active");
      } else {
        section.classList.remove("is-active");
      }
    },
    { threshold: 0.12, rootMargin: "40px 0px -8%" },
  );
  observer.observe(section);

  // Embedded browsers can delay intersection delivery after restoring a hash.
  // Use viewport geometry as a fallback so the entrance never strands content.
  const syncViewport = () => {
    const rect = section.getBoundingClientRect();
    const visible = rect.bottom > 0 && rect.top < window.innerHeight;
    if (visible) section.classList.add("is-visible");
    section.classList.toggle("is-active", visible);
  };
  syncViewport();
  const frame = requestAnimationFrame(syncViewport);
  window.addEventListener("scroll", syncViewport, { passive: true });
  window.addEventListener("resize", syncViewport);
  window.addEventListener("hashchange", syncViewport);

  return () => {
    cancelAnimationFrame(frame);
    window.removeEventListener("scroll", syncViewport);
    window.removeEventListener("resize", syncViewport);
    window.removeEventListener("hashchange", syncViewport);
    observer.disconnect();
    section.classList.remove("is-visible", "is-active");
    delete section.dataset.progressMotion;
  };
}
