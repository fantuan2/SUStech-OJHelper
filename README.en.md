# OJHelper

A Chrome Manifest V3 extension for [Hydro](https://github.com/hydro-dev/Hydro)-based online judges, providing **code normalization** and **contest helpers**.

**SUSTech OJ** (`https://acm.sustech.edu.cn`) is enabled by default. Other Hydro sites can be enabled per-site after an explicit risk disclaimer (Beta).

中文说明: [README.md](README.md)

## Features

### Code normalization
- Injects a "Normalize" button into the submit page / scratchpad editor for one-click cleanup.
- **Java**
  - Renames the main class (the one containing `main`) to `Main`, including its constructor.
  - Unifies the `main` method signature.
  - Removes `package` declarations and strips the BOM.
  - Optional: remove `//` and `/* */` comments (a `//` inside string literals is preserved).
- **C/C++**: registered as a placeholder; normalization not implemented yet.
- Parsing skips strings and comments to avoid accidental edits.

### Contest helpers
- **Contest countdown banner**: shows start/end times and a live countdown for the nearest unfinished contest on the homepage and contest list.
- **Resume contest**: a "Resume" button on the homepage that jumps to the **first unsolved problem** of the **soonest-ending ongoing contest**; it is shown greyed out when there is no ongoing contest or everything is solved.
- **Prev / Next problem**: quick navigation using the built-in problem strip on contest problem pages.
- **Locate me**: scrolls to and highlights your row on the scoreboard.

## Install (developer mode)

1. Open `chrome://extensions` and enable "Developer mode" (top right).
2. Click "Load unpacked" and select this repository root (the folder containing `manifest.json`).
3. SUSTech OJ works immediately. On other Hydro sites, click the extension icon and follow the prompt to enable.

> Requires Chrome 111+ (for `chrome.scripting.registerContentScripts`).

## Using other Hydro sites (Beta)

Non-SUSTech sites are **Beta** and may conflict with a site's existing scripts/styles. To enable:

1. Open the target Hydro site and click the extension icon in the toolbar.
2. If it is detected as Hydro and not yet enabled, click "Enable this site…".
3. In the standalone disclaimer window, read the risks, tick the acknowledgement, wait for the 5-second countdown, then click enable.
4. Reload the OJ page for it to take effect.

Enabled sites are listed under "Enabled OJ sites" in the extension options page, where they can be removed. SUSTech is enabled by default and cannot be removed.

## Settings

- **Options page**: click the extension icon → "Open settings", or right-click the extension → "Options".
- **In-site panel**: embedded on Hydro's `home/settings/preference` page.

Configurable: general code options (remove comments), contest countdown toggle, resume button toggle, and per-language parameters (e.g. Java main class name and main signature).

## Project structure

```
manifest.json                 Extension manifest (MV3)
icons/                        Icons
src/
  background.js               Service worker: per-site dynamic script registration
  popup/                      Toolbar popup: site status and enable entry
  disclaimer/                 High-friction disclaimer window (before enabling Beta sites)
  options/                    Extension options page
  lib/
    core.js                   Language module registry + code utilities
    hydro.js                  Runtime Hydro fingerprint detection (OJHDetect)
    registry.js               Single source of script defs + default origin (OJHScripts)
    i18n.js                   Chinese/English strings
    settings.js               Settings read/write and migration
    settings-ui.js            Settings UI builder
    contest-util.js           Pure functions for contest parsing and navigation
    langs/                    Language modules (java, cc)
  content/                    Content scripts (injected into pages)
test/                         Node unit tests
```

## How it works

- The **default site** (SUSTech) is injected statically via `content_scripts` in `manifest.json`.
- **Other sites**, once authorized, are registered dynamically per origin by `background.js` using `chrome.scripting.registerContentScripts` (matching `origin/d/*`).
- Every content script calls `OJHDetect.isHydro()` at startup (checking `window.Hydro` or Hydro theme DOM markers) so it only runs on real Hydro pages.

## Development

No build step; plain JavaScript. Run the tests:

```powershell
node test/normalize.test.js
node test/settings.test.js
node test/i18n.test.js
node test/contest-util.test.js
node test/hydro-detect.test.js
```

## Permissions

| Permission | Purpose |
| --- | --- |
| `storage` | Save extension settings |
| `scripting` | Dynamically register content scripts for authorized non-default sites |
| `activeTab` | Detect whether the current site is Hydro when the user clicks the icon |
| `host_permissions` | Default site `acm.sustech.edu.cn` |
| `optional_host_permissions` | Other Hydro sites, granted per site |

## Disclaimer

Support for non-SUSTech sites is Beta and not fully tested. It may conflict with existing site features, and the rewritten code may not satisfy a site's submission requirements. You bear all consequences of using this extension.
