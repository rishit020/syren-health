import "./care-experience.css";

const scenarios = {
  activity: {
    label: "Notice a change", number: "01", title: "A moment worth a closer look.",
    description: "A useful care view brings changes in activity together, so a caregiver can review the context and check what happened.",
    room: "Room 102", resident: 1, state: "Staff review", tone: "attention", headline: "Unusual activity needs review",
    observations: ["Movement changed from the usual pattern", "A position change was recorded", "Little movement followed"],
    limitation: "Sensor patterns cannot confirm a cause. A person checks the situation.",
    path: "M0 62 L32 61 L60 57 L88 60 L115 51 L140 55 L165 26 L182 44 L198 13 L216 51 L235 60 L265 62 L298 61 L330 62 L370 61 L410 62",
  },
  occupancy: {
    label: "Understand the limits", number: "02", title: "Uncertainty deserves to be visible.",
    description: "When another person may be in the room, resident-specific information needs a clear limit. The example view makes that uncertainty part of the review.",
    room: "Room 104", resident: 3, state: "Limited confidence", tone: "limited", headline: "Confirm room occupancy",
    observations: ["Possible another person in the room", "Resident-specific attribution is limited", "No resident vital values are shown"],
    limitation: "The system does not identify or separate people in the room.",
    path: "M0 57 L30 44 L60 61 L90 30 L120 47 L150 22 L180 60 L210 35 L240 53 L270 29 L300 56 L330 33 L370 48 L410 39",
  },
  device: {
    label: "Know what’s available", number: "03", title: "A gap in data should be clear.",
    description: "A caregiver needs to know when monitoring is unavailable. Device health stays visible alongside the care view, with missing readings clearly explained.",
    room: "Room 105", resident: 4, state: "Data unavailable", tone: "unavailable", headline: "Room device needs attention",
    observations: ["The room sensor is offline", "Current monitoring is unavailable", "The device issue stays visible for review"],
    limitation: "An offline device has no current readings to show.", path: "M0 57 L35 53 L70 57 L105 49 L140 55",
  },
};

function panelMarkup(id) {
  const s = scenarios[id];
  return `<div class="syren-care__story"><span class="syren-care__index">${s.number} / A fictional care example</span><h3>${s.title}</h3><p>${s.description}</p><button type="button" class="syren-care__action" data-syren-demo-trigger data-demo-initial-resident="${s.resident}" data-demo-initial-view="events">Explore this example <span aria-hidden="true">↗</span></button><span class="syren-care__disclosure">Synthetic data · prototype in development</span></div>
    <div class="syren-care__preview" data-care-tone="${s.tone}"><div class="syren-care__preview-top"><span>Example care view</span><span>${s.room}</span></div><div class="syren-care__signal"><span class="syren-care__state"><i aria-hidden="true"></i>${s.state}</span><svg viewBox="0 0 410 85" role="img" aria-label="Illustrative activity trace, not a measured signal"><path class="syren-care__baseline" d="M0 68H410 M0 35H410"/><path class="syren-care__trace" d="${s.path}"/>${id === "device" ? '<path class="syren-care__missing" d="M155 57H410"/>' : ""}</svg><span class="syren-care__signal-caption">Illustrative activity ${id === "device" ? "· data gap" : "· example only"}</span></div><div class="syren-care__event"><h4>${s.headline}</h4><ol>${s.observations.map((item, index) => `<li><span aria-hidden="true">0${index + 1}</span>${item}</li>`).join("")}</ol><p>${s.limitation}</p></div></div>`;
}

export function applyCareExperience(root) {
  const section = root.querySelector('section[data-framer-name="Impact Section"]');
  if (!section || section.dataset.syrenCareExperience) return;
  section.id = "care-experience";
  section.dataset.syrenCareExperience = "true";
  section.setAttribute("aria-labelledby", "syren-care-heading");
  section.innerHTML = `<div class="syren-care__inner"><header class="syren-care__heading"><div><span class="syren-care__eyebrow">Care, in context</span><h2 id="syren-care-heading">A clearer picture.<br>A more informed next step.</h2></div><p>Explore what the care experience is being designed to support. These fictional situations show the interface’s possibilities and its limits.</p></header><div class="syren-care__tabs" role="tablist" aria-label="Explore care situations">${Object.entries(scenarios).map(([id, s], index) => `<button type="button" role="tab" id="care-tab-${id}" aria-controls="care-scenario-panel" aria-selected="${index === 0}" tabindex="${index === 0 ? 0 : -1}" data-care-scenario="${id}"><span>${s.number}</span>${s.label}</button>`).join("")}</div><div class="syren-care__panel" id="care-scenario-panel" role="tabpanel" aria-labelledby="care-tab-activity" data-care-current="activity">${panelMarkup("activity")}</div></div>`;
}
function selectScenario(section, id, focus = false) {
  if (!scenarios[id]) return;
  section.querySelectorAll("[data-care-scenario]").forEach((tab) => {
    const selected = tab.dataset.careScenario === id;
    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;
    if (selected && focus) tab.focus();
  });
  const panel = section.querySelector(".syren-care__panel");
  panel.innerHTML = panelMarkup(id);
  panel.dataset.careCurrent = id;
  panel.setAttribute("aria-labelledby", `care-tab-${id}`);
}
export function handleCareExperienceClick(event) {
  const tab = event.target.closest("[data-care-scenario]");
  if (!tab) return false;
  selectScenario(tab.closest("[data-syren-care-experience]"), tab.dataset.careScenario);
  return true;
}
export function handleCareExperienceKeyDown(event) {
  const tab = event.target.closest("[data-care-scenario]");
  if (!tab || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return false;
  event.preventDefault();
  const ids = Object.keys(scenarios);
  const index = ids.indexOf(tab.dataset.careScenario);
  const next = event.key === "Home" ? 0 : event.key === "End" ? ids.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + ids.length) % ids.length;
  selectScenario(tab.closest("[data-syren-care-experience]"), ids[next], true);
  return true;
}
