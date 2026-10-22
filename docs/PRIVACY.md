# Privacy

Math Practice is used by children ages 7–12, so it collects nothing, sends nothing, and shows
no ads. This page records the review behind that, and how it is kept true.

## Summary

| Question                                      | Answer                                                                                                 |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Does it collect personal information?         | No. There are no accounts, and it never asks for a name, age, email, or anything else about the child. |
| Where is practice data kept?                  | Only in the browser's `localStorage`, on that device, under keys starting with `math-practice:`.       |
| Is anything sent to a server?                 | No. The app makes no network requests after it has loaded, and its security policy blocks any.         |
| Tracking or analytics?                        | None. No analytics, cookies, fingerprinting, or third-party scripts.                                   |
| Advertisements?                               | None, and none can be added: the security policy blocks content from other sites.                      |
| Can the child be contacted or share anything? | No. There's no chat, sharing, links to other sites, or uploads.                                        |
| How is data removed?                          | Settings → Clear All Application Data, or clearing the browser's site data.                            |

## What is saved

Everything is listed in the README's "Saved data" table: settings, practice sessions, answers
(the question, the answer chosen, whether it was marked right, and how long it took), totals
for older answers, mistakes to review, and the session in progress. Session IDs are random and
aren't linked to the child or the device.

Because it lives only in the browser, **clearing the browser's data removes all progress**:
clearing history or site data, using a private window, or switching browser or device all start
fresh. The Settings page explains this to parents ("Your data"), and a notice appears if the
browser won't let the app save at all (e.g. some private-browsing modes).

## How it's enforced

- **Content-Security-Policy** (in the page, and as an HTTP header on Netlify or Cloudflare
  Pages; see `vite.config.ts`):
  - `connect-src 'none'` stops the page sending data anywhere, including to its own site;
  - scripts, styles, images, and fonts may only come from the app's own site;
  - `frame-ancestors 'none'` stops other sites showing the app inside theirs.
- **Other headers:**
  - `Referrer-Policy: no-referrer` tells no site where a visitor came from;
  - `Permissions-Policy` turns off the camera, microphone, and location.
- **Dependencies:** the only runtime dependencies are React, React DOM, and React Router, none
  of which send data.
- **Automated checks** (`e2e/privacy.spec.ts`, every browser, and against every deployment):
  - a whole visit makes no request to any other site, sets no cookies, and saves nothing but
    `math-practice:` keys (no `sessionStorage`, no IndexedDB);
  - attempts to send data with `fetch`, a beacon, an image, or a script are all blocked and
    never reach the network;
  - the security headers are sent, and Settings explains where progress is kept.

## Review checklist (before each release)

- [ ] No new runtime dependency sends data. Check `npm ls --omit=dev --depth=0` and read
      anything new.
- [ ] No new network request, external link, embed, font, or image from another site.
- [ ] Nothing new asks for or stores information about the child.
- [ ] `npm run test:e2e` passes, including `privacy.spec.ts`.
