# Firefox Add-ons listing (draft)

**Name:** Wake Lock Indicator

**Summary (en):** Shows which tabs hold wake locks or use media and WebRTC, the usual reasons a PC won't sleep.

**Summary (de):** Zeigt, welche Tabs Wake-Locks halten oder Medien und WebRTC nutzen – die üblichen Gründe, warum ein PC nicht einschläft.

**Categories:** Tabs; Other

**License:** MIT

**Homepage:** https://github.com/dMopp/wake-lock-indicator

**Support:** https://github.com/dMopp/wake-lock-indicator/issues

**Data collection:** None

## Description (en)

Your PC won't lock or go to sleep, and you suspect a browser tab? Wake Lock Indicator marks the usual suspects.

- A badge on the toolbar icon shows how many tabs are suspicious.
- The popup lists those tabs and the reason. Clicking a title jumps to the tab.
- Suspicious tabs get a small crossed-out moon on their favicon.

It detects screen wake locks, playing video and audio elements, connected WebRTC sessions and tabs playing sound.

Good to know: browsers offer no way to ask which tab really holds a wake lock, so this is a hint, not proof. A marked tab isn't necessarily the cause, and an empty list doesn't rule out a tab. To confirm a suspect, close it and check whether your desktop goes idle again. Tabs that were already open at install time need a reload before earlier wake locks and WebRTC connections show up.

The extension collects no data and sends nothing to the developer. It needs access to all websites because these features can start on any page.

## Description (de)

Dein PC sperrt nicht oder schläft nicht ein, und du hast einen Browser-Tab im Verdacht? Wake Lock Indicator markiert die üblichen Verdächtigen.

- Ein Badge am Symbol zeigt, wie viele Tabs auffällig sind.
- Das Popup listet diese Tabs mit dem Grund. Ein Klick auf den Titel springt zum Tab.
- Auffällige Tabs bekommen einen kleinen durchgestrichenen Mond am Favicon.

Erkannt werden Wake-Locks, laufende Video- und Audio-Elemente, verbundene WebRTC-Sitzungen und Tabs mit Ton.

Gut zu wissen: Browser bieten keine Abfrage, welcher Tab wirklich einen Wake-Lock hält. Die Anzeige ist deshalb ein Hinweis, kein Beweis. Ein markierter Tab ist nicht zwingend die Ursache, und eine leere Liste schließt keinen Tab aus. Zum Prüfen schließt du den Tab und schaust, ob dein Desktop wieder in den Leerlauf geht. Bei Tabs, die schon vor der Installation offen waren, erscheinen frühere Wake-Locks und WebRTC-Verbindungen erst nach einem Neuladen.

Die Erweiterung erhebt keine Daten und sendet nichts an den Entwickler. Sie braucht Zugriff auf alle Websites, weil diese Funktionen auf jeder Seite starten können.

## Notes for reviewers

No build step, no minified code, no remote code. The package contains the source as is. `hook.js` runs in the page's main world because wake lock, media and WebRTC calls can only be observed there; it talks to `bridge.js` through a DOM event that carries only counters.

To test: open a page that plays a video and check the badge, the popup and the moon on the favicon. Pausing the video removes the marking.
