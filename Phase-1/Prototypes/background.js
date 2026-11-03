// Keyboard shortcuts. The content scripts pick up the new speed from storage.
const MIN_SPEED = 0.25;
const MAX_SPEED = 4.5;
const STEP = 0.25;

const nextSpeed = (command, speed) => {
  if (command === "speed-reset") return 1;
  const steps = speed / STEP;
  const moved =
    command === "speed-up"
      ? Math.floor(steps + 0.001) + 1
      : Math.ceil(steps - 0.001) - 1;
  return Math.min(MAX_SPEED, Math.max(MIN_SPEED, moved * STEP));
};

chrome.commands.onCommand.addListener(async (command) => {
  const { speed = 1 } = await chrome.storage.sync.get("speed");
  await chrome.storage.sync.set({ speed: nextSpeed(command, speed) });
});
