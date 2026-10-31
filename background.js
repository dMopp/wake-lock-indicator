// Hält pro Tab und Frame den letzten gemeldeten Zustand. Der Service Worker kann jederzeit
// beendet werden, deshalb liegt alles in storage.session.
const STALE_MS = 3 * 60 * 1000;
const KEY = "tabs";
const DOTS_KEY = "dotted";
const IS_FIREFOX = chrome.runtime.getURL("").startsWith("moz-extension:");

let queue = Promise.resolve();

function update(change) {
  queue = queue.then(async () => {
    const { [KEY]: tabs = {} } = await chrome.storage.session.get(KEY);
    await change(tabs);
    await chrome.storage.session.set({ [KEY]: tabs });
    await refreshBadge(tabs);
  }).catch(console.error);
  return queue;
}

function prune(tabs) {
  const oldest = Date.now() - STALE_MS;
  for (const [tabId, frames] of Object.entries(tabs)) {
    for (const [frameId, frame] of Object.entries(frames)) {
      if (frame.at < oldest) delete frames[frameId];
    }
    if (Object.keys(frames).length === 0) delete tabs[tabId];
  }
}

function summarize(frames) {
  const sum = { wakeLock: 0, video: 0, audio: 0, webrtc: 0 };
  for (const frame of Object.values(frames)) {
    for (const key of Object.keys(sum)) sum[key] += frame[key] || 0;
  }
  return sum;
}

async function listActive(tabs) {
  const result = [];
  const audible = await chrome.tabs.query({ audible: true });
  const audibleIds = new Set(audible.map((tab) => tab.id));
  const open = await chrome.tabs.query({});
  for (const tab of open) {
    const sum = summarize(tabs[tab.id] || {});
    const sound = audibleIds.has(tab.id);
    if (sound || sum.wakeLock + sum.video + sum.audio + sum.webrtc > 0) {
      result.push({
        ...sum,
        sound,
        id: tab.id,
        windowId: tab.windowId,
        title: tab.title,
        url: tab.url,
        favIconUrl: tab.favIconUrl,
      });
    }
  }
  return result;
}

// Liefert das Favicon als data-URL mit Mond-Plakette. Sie liegt immer an derselben Stelle,
// ein bereits markiertes Favicon aus dem Browser-Cache sieht also genauso aus.
async function badgedFavicon(tab) {
  const SIZE = 64;
  const BACKING = 17;
  const BADGE = 28;
  const canvas = new OffscreenCanvas(SIZE, SIZE);
  const context = canvas.getContext("2d");
  try {
    // Firefox kennt /_favicon/ nicht, dort liefert der Tab selbst die Adresse.
    let source = tab.favIconUrl;
    if (!IS_FIREFOX) {
      const url = new URL(chrome.runtime.getURL("/_favicon/"));
      url.searchParams.set("pageUrl", tab.url);
      url.searchParams.set("size", String(SIZE));
      source = url;
    }
    const response = await fetch(source);
    const bitmap = await createImageBitmap(await response.blob());
    context.drawImage(bitmap, 0, 0, SIZE, SIZE);
  } catch {
    // Ohne Favicon bleibt nur die Plakette.
  }
  // Dunkler Grund, damit der gelbe Mond auch auf hellen Favicons und Tableisten sichtbar bleibt.
  const center = SIZE - BACKING;
  context.beginPath();
  context.arc(center, center, BACKING, 0, 2 * Math.PI);
  context.fillStyle = "#18181c";
  context.fill();
  const response = await fetch(chrome.runtime.getURL("icons/badge.png"));
  const badge = await createImageBitmap(await response.blob());
  context.drawImage(badge, center - BADGE / 2, center - BADGE / 2, BADGE, BADGE);
  const blob = await canvas.convertToBlob({ type: "image/png" });
  const bytes = new Uint8Array(await blob.arrayBuffer());
  return `data:image/png;base64,${btoa(String.fromCharCode(...bytes))}`;
}

async function refreshDots(active) {
  const { [DOTS_KEY]: dotted = [] } = await chrome.storage.session.get(DOTS_KEY);
  const activeIds = new Set(active.map((tab) => tab.id));
  const next = [];
  for (const tabId of dotted) {
    if (activeIds.has(tabId)) next.push(tabId);
    else await chrome.tabs.sendMessage(tabId, { type: "dot", href: null }, { frameId: 0 }).catch(() => {});
  }
  for (const tab of active) {
    if (dotted.includes(tab.id) || !tab.url) continue;
    const href = await badgedFavicon(tab);
    // Scheitert das Senden, ist die Seite noch nicht bereit: beim nächsten Durchlauf erneut.
    const sent = await chrome.tabs
      .sendMessage(tab.id, { type: "dot", href }, { frameId: 0 })
      .then(() => true, () => false);
    if (sent) next.push(tab.id);
  }
  await chrome.storage.session.set({ [DOTS_KEY]: next });
}

async function refreshBadge(tabs) {
  prune(tabs);
  const active = await listActive(tabs);
  await refreshDots(active);
  await chrome.action.setBadgeBackgroundColor({ color: "#c62828" });
  await chrome.action.setBadgeText({ text: active.length ? String(active.length) : "" });
  await chrome.action.setTitle({
    title: active.length
      ? active.map((tab) => tab.title).join("\n")
      : chrome.i18n.getMessage("titleIdle"),
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "report" && sender.tab) {
    const tabId = sender.tab.id;
    const frameId = sender.frameId;
    update((tabs) => {
      const frames = (tabs[tabId] = tabs[tabId] || {});
      const active = message.state.wakeLock + message.state.video + message.state.audio + message.state.webrtc > 0;
      if (active) frames[frameId] = { ...message.state, at: Date.now() };
      else delete frames[frameId];
      if (Object.keys(frames).length === 0) delete tabs[tabId];
    });
    return;
  }
  if (message.type === "list") {
    update(() => {}).then(async () => {
      const { [KEY]: tabs = {} } = await chrome.storage.session.get(KEY);
      sendResponse(await listActive(tabs));
    });
    return true;
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  update((tabs) => delete tabs[tabId]);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if ("audible" in changeInfo || "title" in changeInfo) update(() => {});
});

// Neues Dokument, der Punkt muss neu gesetzt werden.
function forgetDocument(tabId) {
  update(async (tabs) => {
    delete tabs[tabId];
    const { [DOTS_KEY]: dotted = [] } = await chrome.storage.session.get(DOTS_KEY);
    await chrome.storage.session.set({ [DOTS_KEY]: dotted.filter((id) => id !== tabId) });
  });
}

// Nicht tabs.onUpdated: Dessen status "loading" kommt in Chromium auch bei pushState und
// Hash-Änderungen, obwohl die Seite samt Verbindungen weiterläuft.
chrome.webNavigation.onCommitted.addListener(({ tabId, frameId }) => {
  if (frameId === 0) forgetDocument(tabId);
});

// Chromium löst bei Fehlerseiten kein onCommitted aus, Firefox schon. Bei einem Abbruch bleibt
// die alte Seite dagegen offen.
chrome.webNavigation.onErrorOccurred.addListener(({ tabId, frameId, error }) => {
  if (!IS_FIREFOX && frameId === 0 && error !== "net::ERR_ABORTED") forgetDocument(tabId);
});

chrome.alarms.onAlarm.addListener(() => update(() => {}));

async function injectIntoOpenTabs() {
  const open = await chrome.tabs.query({ url: ["http://*/*", "https://*/*"] });
  for (const tab of open) {
    const target = { tabId: tab.id, allFrames: true };
    await chrome.scripting.executeScript({ target, files: ["bridge.js"] }).catch(() => {});
    await chrome.scripting.executeScript({ target, files: ["hook.js"], world: "MAIN" }).catch(() => {});
  }
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create("refresh", { periodInMinutes: 1 });
  injectIntoOpenTabs();
});

chrome.runtime.onStartup.addListener(() => {
  chrome.alarms.create("refresh", { periodInMinutes: 1 });
});
