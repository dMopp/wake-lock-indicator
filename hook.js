// Läuft im Seitenkontext, weil nur dort navigator.wakeLock & Co. mitgelesen werden können.
(() => {
  if (window.__wakeLockIndicatorHook) return;
  Object.defineProperty(window, "__wakeLockIndicatorHook", { value: true });

  const SCAN_MS = 3000;
  const HEARTBEAT_MS = 30000;

  const sentinels = new Set();
  const roots = new Set([document]);
  const mediaElements = new Set();
  const connections = new Set();

  const wakeLockProto = window.WakeLock && window.WakeLock.prototype;
  if (wakeLockProto && wakeLockProto.request) {
    const request = wakeLockProto.request;
    wakeLockProto.request = async function (...args) {
      const sentinel = await request.apply(this, args);
      sentinels.add(sentinel);
      sentinel.addEventListener("release", () => {
        sentinels.delete(sentinel);
        report();
      });
      report();
      return sentinel;
    };
  }

  // Medien-Events sind nicht composed; Shadow-Roots müssen deshalb einzeln durchsucht werden.
  const attachShadow = Element.prototype.attachShadow;
  Element.prototype.attachShadow = function (...args) {
    const root = attachShadow.apply(this, args);
    roots.add(root);
    watch(root);
    return root;
  };

  // Elemente außerhalb des DOM, zum Beispiel new Audio(), findet die Suche nicht.
  const play = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function (...args) {
    mediaElements.add(this);
    setTimeout(report, 250);
    return play.apply(this, args);
  };

  if (window.RTCPeerConnection) {
    window.RTCPeerConnection = new Proxy(window.RTCPeerConnection, {
      construct(target, args, newTarget) {
        const connection = Reflect.construct(target, args, newTarget);
        connections.add(connection);
        connection.addEventListener("connectionstatechange", report);
        return connection;
      },
    });
  }

  function watch(root) {
    for (const type of ["play", "playing", "pause", "ended", "emptied"]) {
      root.addEventListener(type, report, true);
    }
  }

  // Bereits geladene Seiten: Shadow-Roots von vor der Injektion einmalig einsammeln.
  function collectRoots(root) {
    for (const element of root.querySelectorAll("*")) {
      if (element.shadowRoot && !roots.has(element.shadowRoot)) {
        roots.add(element.shadowRoot);
        watch(element.shadowRoot);
        collectRoots(element.shadowRoot);
      }
    }
  }

  function isPlaying(element) {
    return !element.paused && !element.ended && element.readyState >= 2;
  }

  function collect() {
    const found = new Set();
    for (const root of roots) {
      for (const element of root.querySelectorAll("video, audio")) found.add(element);
    }
    for (const element of mediaElements) {
      if (!element.isConnected && element.paused) mediaElements.delete(element);
      else found.add(element);
    }

    let video = 0;
    let audio = 0;
    for (const element of found) {
      if (!isPlaying(element)) continue;
      if (element instanceof HTMLVideoElement) video++;
      else audio++;
    }

    let webrtc = 0;
    for (const connection of connections) {
      if (connection.connectionState === "closed") connections.delete(connection);
      else if (connection.connectionState === "connected") webrtc++;
    }

    for (const sentinel of sentinels) {
      if (sentinel.released) sentinels.delete(sentinel);
    }

    return { wakeLock: sentinels.size, video, audio, webrtc };
  }

  let lastReport = "";
  let lastSent = 0;

  function report() {
    const state = collect();
    const serialized = JSON.stringify(state);
    const active = state.wakeLock + state.video + state.audio + state.webrtc > 0;
    const changed = serialized !== lastReport;
    if (!changed && !(active && Date.now() - lastSent >= HEARTBEAT_MS)) return;
    if (changed && !active && lastReport === "") {
      lastReport = serialized;
      return;
    }
    lastReport = serialized;
    lastSent = Date.now();
    window.dispatchEvent(new CustomEvent("__wake-lock-indicator", { detail: serialized }));
  }

  watch(document);
  if (document.documentElement) collectRoots(document);
  setInterval(report, SCAN_MS);
  report();
})();
