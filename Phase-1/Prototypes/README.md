# SkipSpeed

For Chrome and Microsoft Edge (version 105 or later).

- Presses Skip on YouTube ads as soon as the button appears.
- Plays video on any website at 0.25x to 4.5x.

## Install

Chrome:

1. Unzip this folder somewhere you will keep it.
2. Go to `chrome://extensions` and turn on **Developer mode**.
3. Click **Load unpacked** and choose the `skipspeed` folder.

Edge:

1. Unzip this folder somewhere you will keep it.
2. Go to `edge://extensions` and turn on **Developer mode**.
3. Click **Load unpacked** and choose the `skipspeed` folder.

Pin the icon to the toolbar, then click it to set the speed.

## Use

| Action | Shortcut |
| --- | --- |
| Faster, by 0.25x | Alt+Shift+. |
| Slower, by 0.25x | Alt+Shift+, |
| Normal speed | Alt+Shift+0 |

If a shortcut clashes with another extension, change it at
`chrome://extensions/shortcuts` or `edge://extensions/shortcuts`.

## How it behaves

- At 1x the extension leaves the page alone. At any other speed it overrides
  the site's own speed control.
- The speed applies to every tab and frame.
- Ads with no Skip button play as normal, and ads play at 1x.
- Video calls and live broadcasts are not sped up.
- A player that resets its speed every time it changes can win. The extension
  stops pushing back after 20 tries a second and tries again every second.
- Browser pages such as `chrome://` and the extension stores cannot be changed
  by any extension.

## If skipping stops working

YouTube renames its player elements from time to time. Update `SKIP_SELECTORS`
at the top of `skip.js`, then click reload on the extensions page.

## Privacy

Nothing leaves your browser. Settings are stored by the browser, and the
extension makes no network requests.

## Credits

The popup uses Bricolage Grotesque, under the SIL Open Font License
(`fonts/OFL.txt`).
