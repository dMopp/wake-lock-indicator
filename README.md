# Wake Lock Indicator

Your PC won't lock or go to sleep, and you suspect a browser tab? This extension marks the tabs that
are the usual suspects.

- A **badge** on the toolbar icon shows how many tabs are suspicious.
- The **popup** lists those tabs and the reason. Clicking a title jumps to the tab.
- Suspicious tabs get a small **crossed-out moon** on their favicon.

Available in English and German.

## What it detects

- Screen wake locks requested through `navigator.wakeLock`
- Playing `video` and `audio` elements, including those in shadow DOM
- Connected `RTCPeerConnection`s
- Tabs the browser reports as playing sound

## What it can't tell you

Browsers offer no way to ask which tab really holds a wake lock, so the extension watches the APIs
above. That has limits:

- **A marked tab is a hint, not proof.** It may not be what keeps your screen awake.
- **An empty list is no all-clear.** Causes inside the browser that don't go through these APIs stay
  invisible.
- **Tabs already open at install time** are only partly covered. Media and sound are detected right
  away, earlier wake lock requests and WebRTC connections only after reloading the tab.

To confirm a suspect, close the tab and check whether your desktop goes idle again.

## Install

### Firefox

Firefox 142 or newer. Store link to follow.

### Chromium-based browsers (Brave, Chrome, Edge, Vivaldi …)

There is no Chrome Web Store release, so you load it yourself:

1. Download the `-chromium.zip` of the latest
   [release](https://github.com/dMopp/wake-lock-indicator/releases) and unpack it to a folder you
   keep. The browser loads the extension from there, so don't delete
   the folder afterwards.
2. Open the extensions page, for example `chrome://extensions` or `brave://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked** and select the unpacked folder.
5. Pin the icon to your toolbar.

Updates don't arrive automatically. To update, replace the folder's contents and click the reload
icon on the extension's card.

## Permissions

| Permission | Why |
| --- | --- |
| Access to all websites | Wake locks, media and WebRTC can start on any page, and the favicon is changed there |
| `tabs` | Show titles, addresses and sound state of suspicious tabs |
| `scripting` | Add the detection to tabs that were already open at install time |
| `storage` | Remember the current state while the background script sleeps (session only) |
| `alarms` | Regularly remove outdated entries |
| `favicon` (Chromium only) | Read the tab's current favicon to add the moon |
| `webNavigation` | Reset a tab's state only when a new page loads, not when a running page just changes its address |

## Privacy

The extension sends nothing to the developer or to anyone else. It reads the titles and addresses of
suspicious tabs only to show them in the popup and the toolbar tooltip, and it doesn't store them.
The state of your tabs stays in the browser's session storage and is gone when the browser closes. In Firefox it
requests the favicon of a marked tab from the address the browser reports for that tab, which is
usually the website you are on.

## Side effects on pages

To see these calls, the extension wraps `navigator.wakeLock.request`, `HTMLMediaElement.play`,
`Element.attachShadow` and `RTCPeerConnection` inside every page, and it replaces the favicon of
marked tabs while they are marked. Pages can notice this, and it could affect a site in rare cases.
If a page misbehaves, disable the extension and check again, then please open an issue.

## Building

`python3 scripts/build.py` creates a Chromium and a Firefox ZIP in `dist/`. `manifest.json` is the
Chromium version, so the repository folder can be loaded as an unpacked extension directly. The
Firefox differences are applied by the build script.

## Testing status

Tested in Brave and Firefox 158 on local test pages for wake lock, video in shadow DOM and WebRTC,
and briefly on real sites in Brave. Sound detection and adding the detection to already open tabs
have not been tested yet.

## License

[MIT](LICENSE)

Written with help from Claude Code.
