#!/usr/bin/env python3
"""Baut dist/*-chromium.zip und dist/*-firefox.zip.

manifest.json gilt für Chromium und lässt sich direkt als entpackte Erweiterung laden.
Firefox bekommt beim Bauen seine eigenen Manifest-Unterschiede, denn jeder Browser
warnt bei Schlüsseln, die nur der andere kennt.
"""
import json
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"
FILES = ["LICENSE", "background.js", "bridge.js", "hook.js", "popup.html", "popup.js"]
DIRS = ["_locales", "icons"]


def firefox_manifest(manifest):
    result = dict(manifest)
    result["background"] = {"scripts": ["background.js"]}
    result["permissions"] = [p for p in manifest["permissions"] if p != "favicon"]
    result["browser_specific_settings"] = {
        "gecko": {
            "id": "wake-lock-indicator@dmopp",
            "strict_min_version": "142.0",
            "data_collection_permissions": {"required": ["none"]},
        }
    }
    return result


def package(path, manifest):
    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as archive:
        archive.writestr("manifest.json", json.dumps(manifest, indent=2, ensure_ascii=False) + "\n")
        for name in FILES:
            archive.write(ROOT / name, name)
        for directory in DIRS:
            for file in sorted((ROOT / directory).rglob("*")):
                if file.is_file():
                    archive.write(file, file.relative_to(ROOT).as_posix())
    print(path)


def main():
    manifest = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))
    DIST.mkdir(exist_ok=True)
    stem = f"wake-lock-indicator-{manifest['version']}"
    package(DIST / f"{stem}-chromium.zip", manifest)
    package(DIST / f"{stem}-firefox.zip", firefox_manifest(manifest))


if __name__ == "__main__":
    main()
