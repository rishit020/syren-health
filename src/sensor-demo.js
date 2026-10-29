import "./sensor-demo.css";

const modes = {
  radar: { label: "Radar", eyebrow: "60 GHz radar", title: "Movement changes the reflected signal.", description: "The bench radar sends radio waves into the room and receives reflections. Changes in those reflections can support motion and range measurements; heart and breathing estimates remain experimental.", note: "Schematic animation · not a measured signal" },
  thermal: { label: "Thermal", eyebrow: "32 × 24 thermal array", title: "A low-resolution view of warmth.", description: "The thermal array senses patterns of surface heat. It can add spatial context, but surface temperature is not a measurement of core body temperature.", note: "Illustrative pixels · not a real thermal frame" },
  csi: { label: "Wi-Fi CSI", eyebrow: "Separate transmitter + receiver", title: "Movement changes the Wi-Fi path.", description: "On the current bench, an ESP32-C6 transmits and an ESP32-S3 captures channel information. Changes in the link are explored as movement and presence features.", note: "One illustrated bench link · multi-room mesh is planned" },
};
let dialog;
let opener;
let active = "radar";
let paused = false;

function visual(mode) {
  if (mode === "thermal") return `<div class="syren-sensor__scene syren-sensor__scene--thermal" role="img" aria-label="Illustration of a thermal grid with a warm region"><div class="syren-sensor__grid">${Array.from({ length: 48 }, (_, i) => `<i class="${[19,20,21,26,27,28,29,34,35,36].includes(i) ? "is-warm" : ""}"></i>`).join("")}</div><span>Illustrative thermal pattern</span></div>`;
  if (mode === "csi") return `<div class="syren-sensor__scene syren-sensor__scene--csi" role="img" aria-label="Illustration of a Wi-Fi signal between a transmitter and a receiver"><div class="syren-sensor__node"><small>TRANSMITTER</small><strong>ESP32-C6</strong></div><div class="syren-sensor__link"><i></i><i></i><i></i><span>Wi-Fi link</span></div><div class="syren-sensor__node syren-sensor__node--rx"><small>RECEIVER</small><strong>ESP32-S3</strong></div><span class="syren-sensor__person" aria-hidden="true">●<br>│</span></div>`;
  return `<div class="syren-sensor__scene syren-sensor__scene--radar" role="img" aria-label="Illustration of radar waves reflecting from a person in a room"><div class="syren-sensor__radar-node"><span>RADAR</span><b>60 GHz</b></div><div class="syren-sensor__waves"><i></i><i></i><i></i></div><div class="syren-sensor__target" aria-hidden="true"><i></i><b></b></div><span class="syren-sensor__scene-label">Illustrative room</span></div>`;
}
function render() {
  const data = modes[active];
  dialog.querySelector(".syren-sensor__tabs").innerHTML = Object.entries(modes).map(([id, mode]) => `<button type="button" data-sensor-mode="${id}" aria-pressed="${active === id}">${mode.label}</button>`).join("");
  dialog.querySelector(".syren-sensor__body").innerHTML = `<div class="syren-sensor__copy"><span class="syren-sensor__eyebrow">${data.eyebrow}</span><h3>${data.title}</h3><p>${data.description}</p></div>${visual(active)}<p class="syren-sensor__note">${data.note}</p>`;
  dialog.dataset.motion = paused ? "paused" : "playing";
  const motion = dialog.querySelector("[data-sensor-motion]");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  motion.disabled = reduced;
  motion.textContent = reduced ? "Motion reduced" : paused ? "Play animation" : "Pause animation";
  motion.setAttribute("aria-pressed", String(!paused && !reduced));
}
function createDialog() {
  dialog = document.createElement("dialog");
  dialog.className = "syren-sensor";
  dialog.setAttribute("aria-labelledby", "syren-sensor-title");
  dialog.innerHTML = `<header class="syren-sensor__header"><div><span class="syren-sensor__eyebrow">Explore the prototype</span><h2 id="syren-sensor-title">How the sensors work.</h2></div><button type="button" class="syren-sensor__close" data-sensor-close aria-label="Close sensor walkthrough">×</button></header><div class="syren-sensor__tabs" role="group" aria-label="Choose a sensor"></div><div class="syren-sensor__body"></div><footer class="syren-sensor__footer"><span>Animated illustration · engineering prototype</span><button type="button" data-sensor-motion></button></footer>`;
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog || event.target.closest("[data-sensor-close]")) { dialog.close(); return; }
    const mode = event.target.closest("[data-sensor-mode]");
    if (mode && modes[mode.dataset.sensorMode]) { active = mode.dataset.sensorMode; render(); dialog.querySelector(`[data-sensor-mode="${active}"]`)?.focus(); return; }
    const motion = event.target.closest("[data-sensor-motion]");
    if (motion && !motion.disabled) { paused = !paused; render(); dialog.querySelector("[data-sensor-motion]")?.focus(); }
  });
  dialog.addEventListener("close", () => opener?.focus());
  document.body.append(dialog);
}
export function openSensorDemo(trigger, initial = "radar") {
  if (!dialog) createDialog();
  opener = trigger;
  active = modes[initial] ? initial : "radar";
  paused = false;
  render();
  dialog.showModal();
  dialog.querySelector("[data-sensor-close]")?.focus();
}
