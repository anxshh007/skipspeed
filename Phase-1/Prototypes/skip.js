// Presses Skip on YouTube ads. Runs on YouTube pages only.
//
// It acts only once YouTube shows a visible Skip button, so ads without one
// play as normal. YouTube can ignore clicks made by scripts (event.isTrusted
// is false), so if the ad is still running shortly after the click, the ad is
// seeked to its end, which reaches the same result.
(() => {
  const POLL_MS = 200;
  const SEEK_AFTER_MS = 350;

  const PLAYER_IN_AD =
    ".html5-video-player.ad-showing, .html5-video-player.ad-interrupting";

  // YouTube renames these from time to time. Update this list first if
  // skipping stops working.
  const SKIP_SELECTORS = [
    ".ytp-skip-ad-button",
    ".ytp-ad-skip-button-modern",
    ".ytp-ad-skip-button",
    ".ytp-ad-skip-button-slot button",
    ".ytp-ad-skip-button-container button",
    'button[id^="skip-button"]',
    '[id^="skip-button"] button',
  ];

  let enabled = true;
  let pressedAt = 0;
  let pressedAd = "";

  const isVisible = (el) => {
    const box = el.getBoundingClientRect();
    return (
      box.width > 0 &&
      box.height > 0 &&
      !el.disabled &&
      el.checkVisibility({ opacityProperty: true, visibilityProperty: true })
    );
  };

  const looksLikeSkip = (button) => {
    const name = `${button.className} ${button.id}`;
    return (
      /skip/i.test(name) &&
      !/preview|countdown/i.test(name) &&
      !/\d/.test(button.textContent)
    );
  };

  const findSkipButton = (player) => {
    for (const selector of SKIP_SELECTORS) {
      for (const el of player.querySelectorAll(selector)) {
        if (isVisible(el)) return el;
      }
    }
    // Last resort for a renamed button: anything skip-like in the ad layer.
    for (const button of player.querySelectorAll(
      ".video-ads button, .ytp-ad-module button"
    )) {
      if (looksLikeSkip(button) && isVisible(button)) return button;
    }
    return null;
  };

  const press = (button) => {
    const box = button.getBoundingClientRect();
    const position = {
      bubbles: true,
      cancelable: true,
      composed: true,
      view: window,
      clientX: box.left + box.width / 2,
      clientY: box.top + box.height / 2,
    };
    button.dispatchEvent(new PointerEvent("pointerdown", position));
    button.dispatchEvent(new MouseEvent("mousedown", position));
    button.dispatchEvent(new PointerEvent("pointerup", position));
    button.dispatchEvent(new MouseEvent("mouseup", position));
    button.click();
  };

  const seekToEnd = (video) => {
    if (video && Number.isFinite(video.duration) && video.duration > 0) {
      video.currentTime = Math.max(video.currentTime, video.duration - 0.05);
    }
  };

  const countSkip = async () => {
    try {
      const { adsSkipped = 0 } = await chrome.storage.local.get("adsSkipped");
      await chrome.storage.local.set({ adsSkipped: adsSkipped + 1 });
    } catch {
      // The extension was reloaded while this page stayed open.
    }
  };

  const tick = () => {
    if (!enabled) return;

    const player = document.querySelector(PLAYER_IN_AD);
    const button = player && findSkipButton(player);
    if (!button) {
      pressedAt = 0;
      return;
    }

    const video = player.querySelector("video");
    const ad = video?.currentSrc ?? "";

    if (!pressedAt || ad !== pressedAd) {
      pressedAt = performance.now();
      pressedAd = ad;
      press(button);
      countSkip();
    } else if (performance.now() - pressedAt >= SEEK_AFTER_MS) {
      seekToEnd(video);
    }
  };

  const start = async () => {
    try {
      ({ autoSkip: enabled = true } = await chrome.storage.sync.get("autoSkip"));
    } catch {
      return;
    }

    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === "sync" && changes.autoSkip) {
        enabled = changes.autoSkip.newValue !== false;
      }
    });

    setInterval(tick, POLL_MS);
  };

  start();
})();
