import "./clinic-demo.css";

// A small, clearly synthetic walkthrough of the existing clinic UI. This is
// intentionally separate from the clinic app's data client and cannot be
// mistaken for a live monitoring connection.
const residents = [
  { name: "Resident A", room: "Room 101", attention: "No open items", monitoring: "Active", device: "Online", tone: "ok", detail: "Monitoring is active and data quality is good." },
  { name: "Resident B", room: "Room 102", attention: "High · Staff review", monitoring: "Active", device: "Online", tone: "high", detail: "Unusual activity needs staff review. Sensor data cannot confirm what caused the pattern." },
  { name: "Resident C", room: "Room 103", attention: "No open items", monitoring: "Paused", device: "Online", tone: "muted", detail: "Resident is away, so resident-specific monitoring is paused." },
  { name: "Resident D", room: "Room 104", attention: "Watch · Check occupancy", monitoring: "Limited", device: "Online", tone: "watch", detail: "Possible another person in the room limits resident-specific attribution." },
  { name: "Resident E", room: "Room 105", attention: "Watch · Device issue", monitoring: "Unavailable", device: "Offline", tone: "muted", detail: "The room device is offline, so current monitoring is unavailable." },
  { name: "Resident F", room: "Assignment review", attention: "Watch · Assignment", monitoring: "Unavailable", device: "Unknown", tone: "muted", detail: "A conflicting room assignment makes resident-specific monitoring unavailable." },
];

const views = [
  { id: "overview", label: "Overview" },
  { id: "events", label: "Events" },
  { id: "devices", label: "Devices" },
];

let dialog;
let opener;
let view = "overview";
let selected = 1;

function status(text, tone) {
  return `<span class="syren-demo__status syren-demo__status--${tone}"><i aria-hidden="true"></i>${text}</span>`;
}

function recordList(mode) {
  return residents.map((resident, index) => {
    const main = mode === "devices" ? resident.device : resident.attention;
    const tone = mode === "devices" ? (resident.device === "Online" ? "ok" : "muted") : resident.tone;
    return `<button type="button" class="syren-demo__row${selected === index ? " is-selected" : ""}" data-demo-resident="${index}" aria-label="View ${resident.name}, ${resident.room}">
      <span><strong>${resident.name}</strong><small>${resident.room}</small></span>
      ${status(main, tone)}
      <span class="syren-demo__row-end">${resident.monitoring}<span aria-hidden="true">›</span></span>
    </button>`;
  }).join("");
}

function detailPanel() {
  const resident = residents[selected];
  return `<aside class="syren-demo__detail" aria-label="Selected resident details">
    <span class="syren-demo__eyebrow">Selected record</span>
    <h3>${resident.name}</h3>
    <p class="syren-demo__detail-room">${resident.room}</p>
    <dl>
      <div><dt>Attention</dt><dd>${status(resident.attention, resident.tone)}</dd></div>
      <div><dt>Monitoring</dt><dd>${resident.monitoring}</dd></div>
      <div><dt>Device</dt><dd>${resident.device}</dd></div>
    </dl>
    <p class="syren-demo__detail-note">${resident.detail}</p>
    <p class="syren-demo__detail-caveat">Demo record. This preview cannot acknowledge an event or change monitoring state.</p>
  </aside>`;
}

function overviewContent() {
  return `<div class="syren-demo__heading"><div><span class="syren-demo__eyebrow">Care workspace</span><h2 id="syren-demo-view-heading">Clinic overview</h2><p>Six synthetic resident records across room and assignment states.</p></div></div>
    <div class="syren-demo__metrics">
      <div><span>Needs review</span><strong>4 <small>of 6</small></strong><p>One high · three watch</p></div>
      <div><span>Monitoring active</span><strong>2 <small>of 6</small></strong><p>Other states shown below</p></div>
      <div><span>Device online</span><strong>4 <small>of 6</small></strong><p>One offline · one unknown</p></div>
    </div>
    <div class="syren-demo__workspace"><section class="syren-demo__ledger"><div class="syren-demo__section-head"><h3>Resident ledger</h3><span>Select a record to inspect</span></div>${recordList("overview")}</section>${detailPanel()}</div>`;
}

function eventsContent() {
  return `<div class="syren-demo__heading"><div><span class="syren-demo__eyebrow">Care workspace</span><h2 id="syren-demo-view-heading">Events</h2><p>Example attention items from the clinic app's synthetic fixture.</p></div></div>
    <div class="syren-demo__workspace"><section class="syren-demo__ledger"><div class="syren-demo__section-head"><h3>Attention queue</h3><span>Open demo items</span></div>
      <button type="button" class="syren-demo__row" data-demo-resident="1"><span><strong>Unusual activity needs staff review</strong><small>Resident B · Room 102</small></span>${status("High", "high")}<span class="syren-demo__row-end">View<span aria-hidden="true">›</span></span></button>
      <button type="button" class="syren-demo__row" data-demo-resident="3"><span><strong>Confirm room occupancy</strong><small>Resident D · Room 104</small></span>${status("Watch", "watch")}<span class="syren-demo__row-end">View<span aria-hidden="true">›</span></span></button>
      <button type="button" class="syren-demo__row" data-demo-resident="4"><span><strong>Room device needs attention</strong><small>Resident E · Room 105</small></span>${status("Watch", "watch")}<span class="syren-demo__row-end">View<span aria-hidden="true">›</span></span></button>
      <button type="button" class="syren-demo__row" data-demo-resident="5"><span><strong>Resolve room assignment</strong><small>Resident F · Assignment review</small></span>${status("Watch", "watch")}<span class="syren-demo__row-end">View<span aria-hidden="true">›</span></span></button>
    </section>${detailPanel()}</div>`;
}

function devicesContent() {
  return `<div class="syren-demo__heading"><div><span class="syren-demo__eyebrow">Care workspace</span><h2 id="syren-demo-view-heading">Devices</h2><p>Room device health is shown separately from resident attention.</p></div></div>
    <div class="syren-demo__workspace"><section class="syren-demo__ledger"><div class="syren-demo__section-head"><h3>Room devices</h3><span>Fixture state</span></div>${recordList("devices")}</section>${detailPanel()}</div>`;
}

function render() {
  const nav = dialog.querySelector(".syren-demo__nav");
  nav.innerHTML = views.map(({ id, label }) => `<button type="button" class="${view === id ? "is-active" : ""}" data-demo-view="${id}" aria-current="${view === id ? "page" : "false"}">${label}</button>`).join("");
  dialog.querySelector(".syren-demo__main").innerHTML = view === "events" ? eventsContent() : view === "devices" ? devicesContent() : overviewContent();
}

function createDialog() {
  dialog = document.createElement("dialog");
  dialog.className = "syren-demo";
  dialog.setAttribute("aria-labelledby", "syren-demo-title");
  dialog.innerHTML = `<div class="syren-demo__shell">
    <header class="syren-demo__topbar"><div class="syren-demo__brand"><span class="syren-demo__brand-icon" aria-hidden="true">✦</span><div><strong>Syren Health</strong><small id="syren-demo-title">Clinic dashboard preview</small></div></div><span class="syren-demo__demo-label">Interactive demo · synthetic data</span><button type="button" class="syren-demo__close" data-demo-close aria-label="Close dashboard demo">×</button></header>
    <div class="syren-demo__body"><nav class="syren-demo__nav" aria-label="Dashboard demo sections"></nav><div class="syren-demo__main" role="region" aria-label="Demo content"></div></div>
    <footer class="syren-demo__footer">Interactive walkthrough based on the current clinic interface. Synthetic records; no live monitoring or clinical deployment.</footer>
  </div>`;
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog || event.target.closest("[data-demo-close]")) {
      dialog.close();
      return;
    }
    const nextView = event.target.closest("[data-demo-view]");
    if (nextView) {
      view = nextView.dataset.demoView;
      render();
      dialog.querySelector(`[data-demo-view="${view}"]`)?.focus();
      return;
    }
    const record = event.target.closest("[data-demo-resident]");
    if (record) {
      selected = Number(record.dataset.demoResident);
      render();
      dialog.querySelector(`[data-demo-resident="${selected}"]`)?.focus();
    }
  });
  dialog.addEventListener("close", () => opener?.focus());
  document.body.append(dialog);
}

export function openClinicDemo(trigger) {
  if (!dialog) createDialog();
  opener = trigger;
  view = "overview";
  selected = 1;
  render();
  dialog.showModal();
  dialog.querySelector("[data-demo-close]")?.focus();
}
