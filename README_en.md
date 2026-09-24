[中文](./README.md) | [English](./README_en.md) | [日本語](./README_jp.md)

---

# Misskey Timeline Instance Filter

This is a browser userscript designed for Misskey. It lets you see only the content you care about — by instance and by language — on the Global Timeline (GTL), Social Timeline (STL), antennas and channel timelines.

If you feel there is too much irrelevant noise on the timeline and only want to focus on discussions from specific circles, this script will be very useful. It provides two independently toggleable filter rules:

* **Instance whitelist**: only content from instances on your list is displayed.
* **Language filter**: keep or hide posts based on their detected language (e.g. show only Chinese, or hide English).

> **Suggestion for Privacy-Conscious Users** ([Privacy Note](#privacy)):
> If you do not wish for the script to run on all websites, you can manually modify the "User Matches" in your script manager (Tampermonkey) settings to the specific Misskey instance domains you
> frequent. However, this will cause the script to lose the ability to automatically identify new instances.

## ✨ Key Features

* **Instance Whitelist Filtering**: Only content from instances you manually add to the list will be displayed (can be turned off anytime).
* **Language Filtering**: Detects the language of every post, with two modes: "keep selected languages" and "hide selected languages" (can be turned off anytime). Language codes are flexible — `zh ja en`, `Chinese Japanese`, `jpn` and `zh-CN` all work.
* **Two Switchable Detection Engines**:
    * `tinyld light` (default, ~70KB, 24 languages)
    * `efficient-language-detector` (eld XS, ~940KB, 60 languages, including Vietnamese, Ukrainian, ...)
* **Selectable Filter Scope**: Home, Public (local/social/global), Lists, Antennas, Channels, Roles and Explore can each be included or excluded independently; real-time (WebSocket) pushes follow the same selection.
* **Hide Local Content**: An independent switch to hide posts from the current instance, allowing you to focus on exploring external instances.
* **Smart Auto-Pagination**: When an entire page of content is filtered out, the script automatically loads the next page until it finds posts that match your criteria or reaches the set limit (up to 10 pages), saving you from the hassle of manual scrolling.
* **Recent Blocked List & Real-time Interaction**:
    * The script automatically records instance domains that were recently blocked.
    * **Real-time Feedback**: When you type a domain into the whitelist edit box, the blocked list below refreshes in real-time, automatically removing domains that have just been added to the whitelist.
* **Wildcard Search**: Supports using the `*` wildcard (e.g., `*.jp`) in the "Recent Blocked List" to quickly locate instances with specific suffixes.
* **Multi-language Support**: The interface supports Simplified Chinese, Japanese, and English, and automatically detects your browser language.
* **Lightweight Design**: No detector library is loaded unless the language filter is enabled; runs only when a Misskey instance is detected.

## 🔧 Installation

1. **Install a Userscript Manager**: [Tampermonkey](https://www.tampermonkey.net/) is recommended.
2. **Install the Script**:

> **[Click here to install from GreasyFork](https://greasyfork.org/en/scripts/597338-misskey-timeline-instance-filter)**

3. **Refresh the Page**: After installation, open any Misskey instance. A **⚙️** floating button will appear in the bottom right corner.

## ⚙️ Options Explained

**Instance Whitelist**

* **Instance whitelist switch**: When off, no instance filtering is applied at all (the list is kept for the next time you enable it).
* **Instance Whitelist**: Enter one domain per line (e.g., `misskey.io`).
* **Recently Blocked Instances**: Shows sources that were recently hidden. Click **"Add +"** to quickly add that instance to your whitelist.

**Language Filter**

* **Language filter switch**: When off, no language detection happens at all (the detector library is not even loaded).
* **Mode**: "Keep selected" or "Hide selected".
* **Engine**: `tinyld light` (24 languages) or `eld XS` (60 languages); the languages supported by the current engine are listed right below the selector.
* **Language list**: Separated by spaces or commas. Posts whose language cannot be detected (pure emoji, very short text, ...) are kept to avoid false positives.

**Filter Scope**

* Choose which entry points get filtered: Home, Public, Lists, Antennas, Channels, Roles, Explore. Everything is checked by default. Unchecking one means that endpoint is never intercepted (its response is not even parsed).

**Others**

* **Hide Local Content**: Works independently of the whitelist switch.
    * **Off (Default)**: Shows content from the current instance + whitelist instances.
    * **On**: Hides all local posts, displaying only remote content from the whitelist.
* **Auto-Pagination Limit**: Set the maximum number of pages the script will automatically fetch continuously when content is sparse (0-10).
* **Debug Mode**: When enabled, detailed filtering logs can be viewed in the browser console (F12).

<a name="privacy"></a>

## 🛡️ Permissions & Privacy

### Why is "Access to all websites" permission required?

Since Misskey instances are distributed across thousands of different domains, the script needs to check the `meta` tags in the webpage header to confirm if the current site is running Misskey.

1. **Silent Detection**: The script checks only once when the page loads. If the current site is not Misskey, the script stops running immediately and completely.
2. **Language detection is fully local**: Language detection runs inside your browser — post text is never sent anywhere. The detector library file is downloaded once from a public CDN (jsDelivr / unpkg) by your userscript manager at install/update time, then cached locally for offline use.
3. **Zero Data Upload**: All filtering logic and whitelist data are stored locally in your browser (`GM_setValue`). Your browsing history or personal information is **never** uploaded to any server.
4. **Fully Open Source**: You can view and audit every line of source code on GitHub at any time.

## 🔗 Project Links

If you find this script helpful, you are welcome to support it in the following ways:

* **Project Homepage**: [📦 GitHub Repository](https://github.com/wind-mask/misskey-instance-filter)
* **Feedback**: [🐛 Submit an Issue](https://github.com/wind-mask/misskey-instance-filter/issues)
* **Support the Author**: [☕ Buy me a coffee on Ko-fi](https://ko-fi.com/jk433552)

## ❓ FAQ

**Q: What is an "Instance"?**
A: Misskey is a decentralized social network composed of many independent servers (websites). These servers are called "instances." Users can register on different instances, but they can communicate
with each other. The Global Timeline (GTL) displays public posts from different instances.

**Q: Will this script affect posts from people I follow?**
A: Yes, by default. The "Filter Scope" includes the Home (following) timeline out of the box. If you only want the public timelines or antennas to be filtered, uncheck the corresponding entries in the settings. User profiles, search results, mentions and clips are never filtered.

**Q: I added a whitelist, but the timeline seems empty/slow?**
A: This is normal because the script has filtered out all content from instances not on your whitelist. If you feel there is too little content, try using the "Recently Blocked Instances" feature to
discover and add more instances you are interested in.

**Q: Does language detection send my post content anywhere?**
A: No. Detection runs entirely in your browser (`tinyld` and `eld` are both pure JavaScript). Only the detector library file itself is downloaded once from a CDN when the script is installed or updated.

**Q: Why do some foreign-language posts still show up when I only keep Chinese?**
A: Posts whose language cannot be detected (pure emoji, digits only, very short text) are kept on purpose to avoid false positives. Misskey's own `lang` field is used as a fallback when detection fails.

**Q: Which detection engine should I choose?**
A: `tinyld light` is small (~70KB) but supports only 24 languages; `eld XS` is large (~940KB) but supports 60. Pick `eld XS` if you need to filter by Vietnamese, Ukrainian, etc. Note that filtering by a language the selected engine does not support may cause those posts to be misclassified as another language.

**Q: The detector library failed to download. What now?**
A: The language filter section in the settings panel shows the library status. Click **"Download"** to retry from the fallback CDNs (jsDelivr / unpkg / GitHub); the page reloads automatically on success.

**Q: Can I temporarily disable this script?**
A: Yes. You can find the installed script list in the Tampermonkey extension menu of your browser, where you can temporarily toggle off "Misskey Timeline Instance Filter."

---

*License: [MIT*](https://github.com/Jarvie8176/misskey-instance-filter/blob/main/LICENSE)
