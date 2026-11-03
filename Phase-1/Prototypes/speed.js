// Holds every video on the page at the chosen speed. Runs on all sites and in
// all frames, and leaves the page alone while the speed is 1x.
(() => {
  const TOLERANCE = 0.01;
  const SCAN_GAP_MS = 1000;
  const SWEEP_MS = 1000;
  // Stops a tug of war with a player that keeps resetting its own speed.
  const MAX_CORRECTIONS_PER_SECOND = 20;

  let target = 1;
  const videos = new Set();
  const changedByUs = new WeakSet();
  const corrections = new WeakMap();

  // Ads play at normal speed. skip.js handles those.
  const isYouTubeAd = (video) =>
    video.closest?.(".ad-showing, .ad-interrupting") != null;

  // Video calls and live broadcasts cannot run ahead of real time.
  const canChangeSpeed = (video) =>
    !video.srcObject && video.duration !== Infinity;

  const withinCorrectionLimit = (video) => {
    const now = performance.now();
    let record = corrections.get(video);
    if (!record || now - record.since > 1000) {
      record = { since: now, count: 0 };
      corrections.set(video, record);
    }
    record.count += 1;
    return record.count <= MAX_CORRECTIONS_PER_SECOND;
  };

  const apply = (video) => {
    if (!canChangeSpeed(video)) return;

    const wanted = isYouTubeAd(video) ? 1 : target;
    if (wanted === 1 && !changedByUs.has(video)) return;

    if (
      Math.abs(video.playbackRate - wanted) > TOLERANCE &&
      withinCorrectionLimit(video)
    ) {
      try {
        video.defaultPlaybackRate = wanted;
        video.playbackRate = wanted;
      } catch {
        return;
      }
    }

    if (target === 1) changedByUs.delete(video);
    else changedByUs.add(video);
  };

  const adopt = (video) => {
    if (videos.has(video)) return;
    videos.add(video);
    for (const type of ["ratechange", "loadedmetadata", "play"]) {
      video.addEventListener(type, () => apply(video));
    }
    apply(video);
  };

  const scan = (root) => {
    root.querySelectorAll("video").forEach(adopt);
    root.querySelectorAll("*").forEach((el) => {
      const shadow = chrome.dom?.openOrClosedShadowRoot?.(el) ?? el.shadowRoot;
      if (shadow) scan(shadow);
    });
  };

  let scanQueued = false;
  let lastScan = -SCAN_GAP_MS;
  const queueScan = () => {
    if (scanQueued) return;
    scanQueued = true;
    const wait = Math.max(0, lastScan + SCAN_GAP_MS - performance.now());
    setTimeout(() => {
      scanQueued = false;
      lastScan = performance.now();
      scan(document);
    }, wait);
  };

  const sweep = () => {
    for (const video of videos) {
      if (video.isConnected) apply(video);
      else videos.delete(video);
    }
  };

  const showSpeed = () => {
    const video = [...videos].find((v) => {
      const box = v.getBoundingClientRect();
      return box.width > 0 && box.height > 0;
    });
    if (!video) return;

    document.getElementById("skipspeed-toast")?.remove();

    const box = video.getBoundingClientRect();
    const toast = document.createElement("div");
    toast.id = "skipspeed-toast";
    toast.textContent = `${target}×`;
    toast.style.cssText = `all: initial; position: fixed; z-index: 2147483647;
      top: ${Math.max(box.top, 0) + 12}px; left: ${Math.max(box.left, 0) + 12}px;
      padding: 4px 10px; border-radius: 6px; pointer-events: none;
      background: rgba(20, 22, 60, 0.85); color: #fff;
      font: 700 18px system-ui, sans-serif;`;
    (document.fullscreenElement ?? document.documentElement).append(toast);
    setTimeout(() => toast.remove(), 900);
  };

  // Media events do not bubble, but they can be caught on the way down.
  for (const type of ["play", "loadedmetadata"]) {
    document.addEventListener(
      type,
      (event) => {
        if (event.target instanceof HTMLVideoElement) adopt(event.target);
      },
      true
    );
  }

  new MutationObserver(queueScan).observe(document, {
    childList: true,
    subtree: true,
  });
  queueScan();
  setInterval(sweep, SWEEP_MS);

  const start = async () => {
    try {
      ({ speed: target = 1 } = await chrome.storage.sync.get("speed"));
    } catch {
      return;
    }
    sweep();

    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === "sync" && changes.speed) {
        target = changes.speed.newValue ?? 1;
        sweep();
        showSpeed();
      }
    });
  };

  start();
})();
