// Isolierter Kontext: reicht Meldungen aus hook.js an den Service Worker weiter und
// tauscht im Hauptframe das Favicon gegen die Variante mit Mond-Plakette.
(() => {
  // Beim Neuladen der Erweiterung bleibt dieses window bestehen, der alte Kontext ist aber tot.
  if (window.__wakeLockIndicatorCleanup) window.__wakeLockIndicatorCleanup();

  const DISABLED_REL = "wake-lock-indicator-disabled";
  const ORIGINAL_REL = "wakeLockIndicatorRel";
  let dotLink = null;
  let observer = null;

  function onReport(event) {
    try {
      chrome.runtime
        .sendMessage({ type: "report", state: JSON.parse(event.detail) })
        .catch(() => {});
    } catch {
      // Erweiterung wurde neu geladen, dieser Kontext ist ungültig.
    }
  }

  // Seitenfavicons abschalten, sonst wählt der Browser eventuell eines davon statt des Punkts.
  function disablePageIcons() {
    for (const link of document.querySelectorAll('link[rel~="icon"]')) {
      if (link === dotLink) continue;
      link.dataset[ORIGINAL_REL] = link.rel;
      link.rel = DISABLED_REL;
    }
  }

  function showDot(href) {
    if (!dotLink) {
      dotLink = document.createElement("link");
      dotLink.rel = "icon";
    }
    disablePageIcons();
    dotLink.href = href;
    (document.head || document.documentElement).append(dotLink);
    if (!observer) {
      observer = new MutationObserver(disablePageIcons);
      observer.observe(document.head || document.documentElement, { childList: true, subtree: true });
    }
  }

  function hideDot() {
    if (!dotLink) return;
    observer.disconnect();
    observer = null;
    dotLink.remove();
    dotLink = null;
    const disabled = document.querySelectorAll(`link[rel="${DISABLED_REL}"]`);
    for (const link of disabled) link.rel = link.dataset[ORIGINAL_REL];
    if (disabled.length === 0) {
      // Seite ohne eigenen Link: Der Browser soll wieder das Standard-Favicon verwenden.
      const fallback = document.createElement("link");
      fallback.rel = "icon";
      fallback.href = "/favicon.ico";
      (document.head || document.documentElement).append(fallback);
    }
  }

  function onMessage(message) {
    if (message.type !== "dot") return;
    if (message.href) showDot(message.href);
    else hideDot();
  }

  window.addEventListener("__wake-lock-indicator", onReport);
  chrome.runtime.onMessage.addListener(onMessage);

  window.__wakeLockIndicatorCleanup = () => {
    window.removeEventListener("__wake-lock-indicator", onReport);
    hideDot();
  };
})();
