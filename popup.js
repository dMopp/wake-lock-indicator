const t = (key) => chrome.i18n.getMessage(key);

document.documentElement.lang = chrome.i18n.getUILanguage();
document.getElementById("heading").textContent = t("popupHeading");
document.getElementById("empty").textContent = t("popupEmpty");
document.getElementById("note").textContent = t("popupNote");

function tagsFor(tab) {
  const tags = [];
  if (tab.wakeLock) tags.push(t("tagWakeLock"));
  if (tab.video) tags.push(`${t("tagVideo")} ${tab.video}`);
  if (tab.audio) tags.push(`${t("tagAudio")} ${tab.audio}`);
  if (tab.webrtc) tags.push(`${t("tagWebRtc")} ${tab.webrtc}`);
  if (tab.sound) tags.push(t("tagSound"));
  return tags;
}

function hostOf(url) {
  try {
    return new URL(url).host;
  } catch {
    return url || "";
  }
}

async function render() {
  const tabs = await chrome.runtime.sendMessage({ type: "list" });
  const list = document.getElementById("list");
  list.replaceChildren();
  document.getElementById("empty").hidden = tabs.length > 0;

  for (const tab of tabs) {
    const item = document.createElement("li");

    const title = document.createElement("button");
    title.className = "title";
    title.textContent = tab.title || tab.url;
    title.addEventListener("click", async () => {
      await chrome.tabs.update(tab.id, { active: true });
      await chrome.windows.update(tab.windowId, { focused: true });
    });

    const host = document.createElement("div");
    host.className = "host";
    host.textContent = hostOf(tab.url);

    const tags = document.createElement("div");
    tags.className = "tags";
    for (const text of tagsFor(tab)) {
      const tag = document.createElement("span");
      tag.className = "tag";
      tag.textContent = text;
      tags.append(tag);
    }

    item.append(title, host, tags);
    list.append(item);
  }
}

render();
setInterval(render, 2000);
