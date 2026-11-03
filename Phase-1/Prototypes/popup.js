const MIN_SPEED = 0.25;
const MAX_SPEED = 4.5;
const PRESETS = [1, 1.5, 2, 3, 4, 4.5];

const readout = document.getElementById("readout");
const slider = document.getElementById("speed");
const presets = document.getElementById("presets");
const autoSkip = document.getElementById("autoSkip");
const count = document.getElementById("count");

const label = (speed) => `${Number(speed.toFixed(2))}×`;

const show = (speed) => {
  const share = (speed - MIN_SPEED) / (MAX_SPEED - MIN_SPEED);
  readout.textContent = label(speed);
  readout.style.setProperty("--weight", Math.round(250 + share * 550));
  readout.style.setProperty("--width", `${Math.round(75 + share * 25)}%`);
  slider.value = speed;
  for (const button of presets.children) {
    button.setAttribute("aria-pressed", Number(button.value) === speed);
  }
};

const setSpeed = (speed) => {
  show(speed);
  chrome.storage.sync.set({ speed });
};

const showCount = (skipped) => {
  count.textContent =
    skipped === 1 ? "1 ad skipped" : skipped ? `${skipped} ads skipped` : "";
};

for (const speed of PRESETS) {
  const button = document.createElement("button");
  button.type = "button";
  button.value = speed;
  button.textContent = label(speed);
  button.addEventListener("click", () => setSpeed(speed));
  presets.append(button);
}

slider.addEventListener("input", () => setSpeed(Number(slider.value)));
autoSkip.addEventListener("change", () =>
  chrome.storage.sync.set({ autoSkip: autoSkip.checked })
);

chrome.storage.sync.get(["speed", "autoSkip"]).then(({ speed = 1, autoSkip: on = true }) => {
  show(speed);
  autoSkip.checked = on;
});
chrome.storage.local.get("adsSkipped").then(({ adsSkipped = 0 }) => showCount(adsSkipped));

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes.speed) show(changes.speed.newValue ?? 1);
  if (area === "local" && changes.adsSkipped) showCount(changes.adsSkipped.newValue);
});
