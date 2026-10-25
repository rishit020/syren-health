import "./technical-proof.css";

const markup = `
  <div class="syren-engineering__inner">
    <div class="syren-engineering__lead">
      <div>
        <p class="syren-engineering__eyebrow">Inside the prototype <span>Engineering stage</span></p>
        <h2 id="syren-engineering-heading">A closer look at what we’ve built.</h2>
      </div>
      <p>Three complementary sensing streams feed a room-level bench view. We are testing how their evidence can support caregiver awareness; clinical accuracy has not been established.</p>
    </div>

    <div class="syren-engineering__modalities" aria-label="Current sensing modalities">
      <article>
        <div class="syren-engineering__modality-top"><span class="syren-engineering__modality-number">01</span><span class="syren-engineering__signal" aria-hidden="true"><i></i><i></i><i></i></span></div>
        <p class="syren-engineering__spec">60 GHz <span>mmWave</span></p>
        <h3>Radar</h3>
        <p>MR60BHA2 motion and range outputs, plus experimental heart and breathing estimates when signal conditions support them.</p>
      </article>
      <article>
        <div class="syren-engineering__modality-top"><span class="syren-engineering__modality-number">02</span><span class="syren-engineering__pixels" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span></div>
        <p class="syren-engineering__spec">32 × 24 <span>array</span></p>
        <h3>Thermal</h3>
        <p>MLX90640 low-resolution heat patterns add warm-region and position context. Surface temperature is not core temperature.</p>
      </article>
      <article>
        <div class="syren-engineering__modality-top"><span class="syren-engineering__modality-number">03</span><span class="syren-engineering__waves" aria-hidden="true">≋</span></div>
        <p class="syren-engineering__spec">Wi-Fi <span>CSI</span></p>
        <h3>Channel sensing</h3>
        <p>A separate ESP32-C6 transmitter and ESP32-S3 receiver capture channel changes for experimental movement and presence features.</p>
      </article>
    </div>

    <div class="syren-engineering__topology">
      <article class="syren-engineering__topology-card syren-engineering__topology-card--current">
        <div class="syren-engineering__topology-head"><span>Current bench setup</span><strong>Built &amp; measured</strong></div>
        <div class="syren-engineering__flow" aria-label="Separate Wi-Fi transmitter to radar, thermal and CSI receiver to USB host dashboard">
          <div><small>Separate node</small><b>ESP32-C6</b><span>CSI transmitter</span></div>
          <span class="syren-engineering__arrow" aria-hidden="true">→</span>
          <div><small>Bench node</small><b>ESP32-S3</b><span>Radar + thermal + CSI</span></div>
          <span class="syren-engineering__arrow" aria-hidden="true">→</span>
          <div><small>Local host</small><b>Dashboard</b><span>USB stream + quality gates</span></div>
        </div>
        <p>One sensing receiver is on the bench. A separate transmitter makes the CSI link possible; this is not a deployed multi-room system.</p>
      </article>
      <article class="syren-engineering__topology-card syren-engineering__topology-card--planned">
        <div class="syren-engineering__topology-head"><span>Coordinated room mesh</span><strong>Planned</strong></div>
        <div class="syren-engineering__planned-diagram" aria-hidden="true">
          <span>Room A</span><span>Room B</span><span>Room C</span><i></i><b>Shared care view</b>
        </div>
        <p>The design calls for multiple room nodes, versioned telemetry and cloud fusion. Multi-node coordination, room attribution and performance still need implementation and validation.</p>
      </article>
    </div>

    <figure class="syren-engineering__dashboard">
      <figcaption>
        <div><span class="syren-engineering__eyebrow">Product interface</span><h3>The dashboard is real software.</h3></div>
        <p>Captured from the current clinic app. It uses synthetic demo records while hardware-to-product integration remains in development.</p>
      </figcaption>
      <div class="syren-engineering__screen"><img src="/syren/clinic-overview-wide.png" width="1440" height="1050" loading="lazy" decoding="async" alt="Actual Syren clinic overview screenshot with synthetic demo records, an attention queue, monitoring coverage and device health." /></div>
      <p class="syren-engineering__disclosure">Actual interface screenshot · synthetic data · not a live clinical deployment</p>
    </figure>
  </div>
`;

export function applyTechnicalProof(root) {
  if (root?.querySelector("#engineering")) return;
  const how = root?.querySelector('#how-it-works');
  if (!how) return;
  const section = root.createElement("section");
  section.id = "engineering";
  section.className = "syren-engineering";
  section.setAttribute("aria-labelledby", "syren-engineering-heading");
  section.innerHTML = markup;
  how.after(section);
}
