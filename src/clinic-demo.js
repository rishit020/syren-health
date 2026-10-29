import "./clinic-demo.css";

// Marketing walkthrough with local-only, fictional data; it does not access
// the clinic app, change real events, or receive sensor telemetry.
const residents = [
  { name: "Resident A", room: "Room 101", monitoring: "Active", device: "Online", detail: "Monitoring is active and data quality is good.", vitals: { heart: 72, breathing: 16 } },
  { name: "Resident B", room: "Room 102", monitoring: "Active", device: "Online", detail: "Unusual activity needs staff review. Sensor data cannot confirm what caused the pattern.", vitals: { heart: 78, breathing: 17 } },
  { name: "Resident C", room: "Room 103", monitoring: "Paused", device: "Online", detail: "Resident is away, so resident-specific monitoring is paused." },
  { name: "Resident D", room: "Room 104", monitoring: "Limited", device: "Online", detail: "Possible another person in the room limits resident-specific attribution." },
  { name: "Resident E", room: "Room 105", monitoring: "Unavailable", device: "Offline", detail: "The room device is offline, so current monitoring is unavailable." },
  { name: "Resident F", room: "Assignment review", monitoring: "Unavailable", device: "Unknown", detail: "A conflicting room assignment makes resident-specific monitoring unavailable." },
];
const sampleItems = [
  { resident: 1, priority: "High", title: "Unusual activity needs staff review" },
  { resident: 3, priority: "Watch", title: "Confirm room occupancy" },
  { resident: 4, priority: "Watch", title: "Room device needs attention" },
  { resident: 5, priority: "Watch", title: "Resolve room assignment" },
];
const views = [
  { id: "overview", label: "Overview" },
  { id: "events", label: "Events" },
  { id: "vitals", label: "Vitals" },
  { id: "devices", label: "Devices" },
  { id: "history", label: "History" },
];

let dialog;
let opener;
let view = "overview";
let selected = 1;
let items = sampleItems.map((item) => ({ ...item, cleared: false }));
let history = [];

function status(text, tone) {
  return `<span class="syren-demo__status syren-demo__status--${tone}"><i aria-hidden="true"></i>${text}</span>`;
}
function itemFor(index) { return items.find((item) => item.resident === index); }
function attentionFor(index) {
  const item = itemFor(index);
  if (!item) return { text: "No open items", tone: "ok" };
  if (item.cleared) return { text: "Cleared in demo", tone: "muted" };
  return { text: `${item.priority} · Review`, tone: item.priority === "High" ? "high" : "watch" };
}
function recordList(mode) {
  return residents.map((resident, index) => {
    const attention = attentionFor(index);
    const main = mode === "devices" ? resident.device : attention.text;
    const tone = mode === "devices" ? (resident.device === "Online" ? "ok" : "muted") : attention.tone;
    return `<button type="button" class="syren-demo__row${selected === index ? " is-selected" : ""}" data-demo-resident="${index}" aria-label="View ${resident.name}, ${resident.room}">
      <span><strong>${resident.name}</strong><small>${resident.room}</small></span>${status(main, tone)}
      <span class="syren-demo__row-end">${resident.monitoring}<span aria-hidden="true">›</span></span></button>`;
  }).join("");
}
function vitalsBlock(resident) {
  if (!resident.vitals) return `<div class="syren-demo__vitals"><span class="syren-demo__eyebrow">Simulated vitals</span><p>No sample readings for this monitoring state.</p></div>`;
  return `<div class="syren-demo__vitals"><span class="syren-demo__eyebrow">Simulated vitals</span><div class="syren-demo__vital-grid"><div><span>Heart rate</span><strong>${resident.vitals.heart} <small>bpm</small></strong></div><div><span>Breathing</span><strong>${resident.vitals.breathing} <small>breaths/min</small></strong></div></div><p>Illustrative values only; not sensor measurements.</p></div>`;
}
function detailPanel() {
  const resident = residents[selected];
  const attention = attentionFor(selected);
  const item = itemFor(selected);
  return `<aside class="syren-demo__detail" aria-label="Selected resident details">
    <span class="syren-demo__eyebrow">Selected record</span><h3 tabindex="-1">${resident.name}</h3><p class="syren-demo__detail-room">${resident.room}</p>
    <dl><div><dt>Attention</dt><dd>${status(attention.text, attention.tone)}</dd></div><div><dt>Monitoring</dt><dd>${resident.monitoring}</dd></div><div><dt>Device</dt><dd>${resident.device}</dd></div></dl>
    <p class="syren-demo__detail-note">${item?.cleared ? "Cleared in this demo. Monitoring and device states are unchanged." : resident.detail}</p>${vitalsBlock(resident)}
    ${item && !item.cleared ? `<button type="button" class="syren-demo__action" data-demo-clear="${selected}">Clear demo item</button>` : ""}
    <p class="syren-demo__detail-caveat">Actions only change this local demo; no care records are affected.</p></aside>`;
}
function overviewContent() {
  const open = items.filter((item) => !item.cleared);
  const high = open.filter((item) => item.priority === "High").length;
  const watch = open.length - high;
  return `<div class="syren-demo__heading"><div><span class="syren-demo__eyebrow">Care workspace</span><h2 id="syren-demo-view-heading">Clinic overview</h2><p>Six fictional records. Select a resident to explore the demo.</p></div></div>
    <div class="syren-demo__metrics"><div><span>Needs review</span><strong data-demo-open-count>${open.length} <small>of 6</small></strong><p>${high} high · ${watch} watch</p></div><div><span>Monitoring active</span><strong>2 <small>of 6</small></strong><p>Other states shown below</p></div><div><span>Device online</span><strong>4 <small>of 6</small></strong><p>One offline · one unknown</p></div></div>
    <div class="syren-demo__workspace"><section class="syren-demo__ledger"><div class="syren-demo__section-head"><h3>Resident ledger</h3><span>Select a record to inspect</span></div>${recordList("overview")}</section>${detailPanel()}</div>`;
}
function eventsContent() {
  const open = items.filter((item) => !item.cleared);
  const rows = open.map((item) => { const resident = residents[item.resident]; return `<button type="button" class="syren-demo__row${selected === item.resident ? " is-selected" : ""}" data-demo-resident="${item.resident}"><span><strong>${item.title}</strong><small>${resident.name} · ${resident.room}</small></span>${status(item.priority, item.priority === "High" ? "high" : "watch")}<span class="syren-demo__row-end">View<span aria-hidden="true">›</span></span></button>`; }).join("");
  return `<div class="syren-demo__heading"><div><span class="syren-demo__eyebrow">Care workspace</span><h2 id="syren-demo-view-heading">Events</h2><p>Choose an item, then clear it from this demo.</p></div></div><div class="syren-demo__workspace"><section class="syren-demo__ledger"><div class="syren-demo__section-head"><h3>Attention queue</h3><span>${open.length} open demo items</span></div>${rows || '<p class="syren-demo__empty">All demo items have been cleared. See History or reset the demo.</p>'}</section>${detailPanel()}</div>`;
}
function vitalsContent() {
  const resident = residents[selected];
  return `<div class="syren-demo__heading"><div><span class="syren-demo__eyebrow">Example data</span><h2 id="syren-demo-view-heading">Simulated vitals</h2><p>Fictional values illustrate the interface. They are not measured or clinical data.</p></div></div><div class="syren-demo__workspace"><section class="syren-demo__ledger"><div class="syren-demo__section-head"><h3>Select a resident</h3><span>Example records</span></div>${recordList("overview")}</section>${detailPanel()}</div><div class="syren-demo__trend"><div><span class="syren-demo__eyebrow">Illustrative trend · ${resident.name}</span><h3>${resident.vitals ? "Example heart-rate trace" : "Trend unavailable"}</h3><p>${resident.vitals ? "A drawn example, not a live signal or validation result." : "This record has no resident-specific sample values in the demo."}</p></div>${resident.vitals ? '<svg viewBox="0 0 440 80" role="img" aria-label="Decorative synthetic trend"><path d="M0 58 L25 54 L50 56 L75 46 L100 49 L125 40 L150 45 L175 38 L200 44 L225 33 L250 39 L275 35 L300 42 L325 32 L350 36 L375 30 L400 34 L440 29" fill="none" stroke="#2563eb" stroke-width="3" vector-effect="non-scaling-stroke"/></svg>' : ""}</div>`;
}
function devicesContent() {
  return `<div class="syren-demo__heading"><div><span class="syren-demo__eyebrow">Care workspace</span><h2 id="syren-demo-view-heading">Devices</h2><p>Room device health is shown separately from resident attention.</p></div></div><div class="syren-demo__workspace"><section class="syren-demo__ledger"><div class="syren-demo__section-head"><h3>Room devices</h3><span>Fixture state</span></div>${recordList("devices")}</section>${detailPanel()}</div>`;
}
function historyContent() {
  const rows = history.map((entry) => `<div class="syren-demo__history-row"><strong>${entry.title}</strong><span>${entry.resident} · Cleared in this demo</span></div>`).join("");
  return `<div class="syren-demo__heading"><div><span class="syren-demo__eyebrow">Local demo history</span><h2 id="syren-demo-view-heading">History</h2><p>Cleared demo items stay here until you reset the example.</p></div></div><section class="syren-demo__ledger syren-demo__history"><div class="syren-demo__section-head"><h3>Cleared items</h3><span>${history.length} records</span></div>${rows || '<p class="syren-demo__empty">No items cleared yet.</p>'}</section>`;
}
function render() {
  dialog.querySelector(".syren-demo__nav").innerHTML = views.map(({ id, label }) => `<button type="button" class="${view === id ? "is-active" : ""}" data-demo-view="${id}" aria-current="${view === id ? "page" : "false"}">${label}</button>`).join("");
  dialog.querySelector(".syren-demo__main").innerHTML = view === "events" ? eventsContent() : view === "vitals" ? vitalsContent() : view === "devices" ? devicesContent() : view === "history" ? historyContent() : overviewContent();
}
function focusDetail() {
  const heading = dialog.querySelector(".syren-demo__detail h3");
  heading?.focus();
  if (window.innerWidth <= 780 && heading) {
    const panel = heading.closest(".syren-demo__detail");
    panel.style.scrollMarginTop = `${dialog.querySelector(".syren-demo__topbar").getBoundingClientRect().height + 16}px`;
    panel.scrollIntoView({ block: "start" });
  }
}
function createDialog() {
  dialog = document.createElement("dialog");
  dialog.className = "syren-demo";
  dialog.setAttribute("aria-label", "Interactive clinic dashboard demo");
  dialog.innerHTML = `<div class="syren-demo__shell"><header class="syren-demo__topbar"><div class="syren-demo__brand"><span class="syren-demo__brand-icon" aria-hidden="true">✦</span><div><strong>Syren Health</strong><small>Clinic dashboard preview</small></div></div><span class="syren-demo__demo-label">Interactive demo · synthetic data</span><button type="button" class="syren-demo__reset" data-demo-reset>Reset demo</button><button type="button" class="syren-demo__close" data-demo-close aria-label="Close dashboard demo">×</button></header><div class="syren-demo__body"><nav class="syren-demo__nav" aria-label="Dashboard demo sections"></nav><div class="syren-demo__main" role="region" aria-label="Demo content"></div></div><footer class="syren-demo__footer">Interactive walkthrough based on the clinic interface. Fictional data; no live monitoring or clinical deployment. <span class="syren-demo__announcement" role="status" aria-live="polite"></span></footer></div>`;
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog || event.target.closest("[data-demo-close]")) { dialog.close(); return; }
    const reset = event.target.closest("[data-demo-reset]");
    if (reset) { items = sampleItems.map((item) => ({ ...item, cleared: false })); history = []; selected = 1; view = "overview"; render(); dialog.querySelector(".syren-demo__announcement").textContent = "Demo reset."; reset.focus(); return; }
    const nextView = event.target.closest("[data-demo-view]");
    if (nextView) { view = nextView.dataset.demoView; render(); dialog.querySelector(`[data-demo-view="${view}"]`)?.focus(); return; }
    const clear = event.target.closest("[data-demo-clear]");
    if (clear) { const index = Number(clear.dataset.demoClear); const item = itemFor(index); if (item && !item.cleared) { item.cleared = true; history.unshift({ title: item.title, resident: residents[index].name }); render(); dialog.querySelector(".syren-demo__announcement").textContent = `${residents[index].name} demo item cleared.`; focusDetail(); } return; }
    const record = event.target.closest("[data-demo-resident]");
    if (record) { selected = Number(record.dataset.demoResident); render(); if (window.innerWidth <= 780) focusDetail(); else dialog.querySelector(`[data-demo-resident="${selected}"]`)?.focus(); }
  });
  // Native dialog restores a connected opener. Only supply a fallback when a
  // responsive page replacement removed it; re-focusing later steals focus
  // from a user's next keyboard action.
  dialog.addEventListener("close", () => {
    const focus = document.activeElement;
    if (!opener?.isConnected && (focus === document.body || focus === document.documentElement || dialog.contains(focus))) document.querySelector(".syren-hero-showcase")?.focus();
  });
  window.addEventListener("popstate", () => { if (dialog.open) dialog.close(); });
  document.body.append(dialog);
}
export function openClinicDemo(trigger, initial = {}) {
  if (!dialog) createDialog();
  opener = trigger;
  view = views.some((entry) => entry.id === initial.view) ? initial.view : "overview";
  const index = Number(initial.resident);
  selected = initial.resident !== undefined && Number.isInteger(index) && residents[index] ? index : 1;
  render();
  dialog.showModal();
  dialog.querySelector("[data-demo-close]")?.focus();
}
