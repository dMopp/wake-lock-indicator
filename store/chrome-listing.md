# Chrome Web Store listing (draft)

**Package:** `dist/wake-lock-indicator-0.3.1-chromium.zip`

**Category:** Productivity > Tools

**Language:** English (default), German

**Official URL:** None

**Homepage:** https://github.com/dMopp/wake-lock-indicator

**Support:** https://github.com/dMopp/wake-lock-indicator/issues

**Images (`store/chrome/`):**

- Store icon: `icon-128.png`
- Screenshots: `screenshot-en-1280x800.png`, `screenshot-de-1280x800.png`
- Small promo tile: `promo-small-en-440x280.png`

## Description (en)

Your PC won't lock or go to sleep, and you suspect a browser tab? Wake Lock Indicator marks the usual suspects.

- A badge on the toolbar icon shows how many tabs are suspicious.
- The popup lists those tabs and the reason. Clicking a title jumps to the tab.
- Suspicious tabs get a small crossed-out moon on their favicon.

It detects screen wake locks, playing video and audio elements, connected WebRTC sessions and tabs playing sound.

Good to know: browsers offer no way to ask which tab really holds a wake lock, so this is a hint, not proof. A marked tab isn't necessarily the cause, and an empty list doesn't rule out a tab. To confirm a suspect, close it and check whether your desktop goes idle again. Tabs that were already open at install time need a reload before earlier wake locks and WebRTC connections show up.

The extension sends nothing to the developer or to anyone else. It reads the titles and addresses of suspicious tabs only to show them in the popup, and they stay in your browser. It needs access to all websites because these features can start on any page.

## Description (de)

Dein PC sperrt nicht oder schläft nicht ein, und du hast einen Browser-Tab im Verdacht? Wake Lock Indicator markiert die üblichen Verdächtigen.

- Ein Badge am Symbol zeigt, wie viele Tabs auffällig sind.
- Das Popup listet diese Tabs mit dem Grund. Ein Klick auf den Titel springt zum Tab.
- Auffällige Tabs bekommen einen kleinen durchgestrichenen Mond am Favicon.

Erkannt werden Wake-Locks, laufende Video- und Audio-Elemente, verbundene WebRTC-Sitzungen und Tabs mit Ton.

Gut zu wissen: Browser bieten keine Abfrage, welcher Tab wirklich einen Wake-Lock hält. Die Anzeige ist deshalb ein Hinweis, kein Beweis. Ein markierter Tab ist nicht zwingend die Ursache, und eine leere Liste schließt keinen Tab aus. Zum Prüfen schließt du den Tab und schaust, ob dein Desktop wieder in den Leerlauf geht. Bei Tabs, die schon vor der Installation offen waren, erscheinen frühere Wake-Locks und WebRTC-Verbindungen erst nach einem Neuladen.

Die Erweiterung sendet nichts an den Entwickler oder an andere. Titel und Adressen auffälliger Tabs liest sie nur, um sie im Popup anzuzeigen, und sie bleiben in deinem Browser. Sie braucht Zugriff auf alle Websites, weil diese Funktionen auf jeder Seite starten können.

## Privacy tab

**Single purpose:** Shows which browser tabs use wake locks, media or WebRTC, to help find out why a computer does not go to sleep.

**Permission justifications:**

| Permission | Justification |
| --- | --- |
| Host permission (`<all_urls>`) | Wake locks, media and WebRTC can start on any website. The content scripts must run on every page to detect them and to mark the favicon of suspicious tabs. |
| `tabs` | Shows the title and address of suspicious tabs in the popup, and detects which tabs play sound. |
| `scripting` | Adds the detection to tabs that were already open when the extension was installed. |
| `storage` | Keeps the current state in session storage while the service worker is inactive. |
| `alarms` | Regularly removes outdated entries. |
| `favicon` | Reads the favicon of a suspicious tab to add the moon marking. |
| `webNavigation` | Resets a tab's state only when a new page loads, not when a running page just changes its address. |

**Remote code:** No. All code is in the package.

**Data usage:** Web history only, because the popup and the toolbar tooltip show titles and addresses of suspicious tabs. Chrome requires this disclosure even for data that stays on the device. All three limited-use statements apply.

**Privacy policy URL:** https://github.com/dMopp/wake-lock-indicator#privacy

## Notes for reviewers

No build step, no minified code, no remote code. The package contains the source as is. `hook.js` runs in the page's main world because wake lock, media and WebRTC calls can only be observed there; it talks to `bridge.js` through a DOM event that carries only counters.

To test: open a page that plays a video and check the badge, the popup and the moon on the favicon. Pausing the video removes the marking.
