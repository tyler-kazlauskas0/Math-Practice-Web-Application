# Deployment

The app is a static site: `npm run build` puts everything in `dist/`. It's hosted on
**Netlify**, which builds and deploys from GitHub on its own. Cloudflare Pages works the same
way, using the same files. Both work with a private repository on their free plans.

## What the build includes for hosting

| File                   | Purpose                                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------------------------ |
| `public/_redirects`    | Opens the app for any address that isn't a file, so `/statistics` can be opened or refreshed directly. |
| `dist/_headers`        | Security headers for every page, and long caching for `/assets/` (generated from `vite.config.ts`).    |
| `statistics.html` etc. | A copy of the page for each address (plus `404.html`), so hosts without `_redirects` work too.         |
| `netlify.toml`         | Netlify's build settings: lint, test, then build; publish `dist/`; Node 22.                            |

## One-time setup: Netlify

1. Sign in at [app.netlify.com](https://app.netlify.com) with GitHub (the free plan is enough).
2. **Add new site → Import an existing project → GitHub**, and allow access to
   `tyler-kazlauskas0/Math-Practice-Web-Application`.
3. Netlify reads `netlify.toml`, so leave the build settings as they are. Production branch:
   `main`. Click **Deploy**.
4. Optional:
   - **Site configuration → Change site name** gives a friendlier address, e.g.
     `math-practice-kids.netlify.app`;
   - **Domain management** adds your own domain (HTTPS is automatic).

After that:

- every change merged into `main` is lint-checked, tested, built, and published;
- every pull request gets its own **deploy preview** address to try before merging.

## Alternative: Cloudflare Pages

**Workers & Pages → Create → Pages → Connect to Git**, pick the repository, then set:

- Framework preset: none
- Build command: `npm run lint && npm test && npm run build`
- Output directory: `dist`
- Environment variable: `NODE_VERSION` = `22`

Cloudflare reads the same `_redirects` and `_headers`.

## Checking a deployment

- **Automatically:** when Netlify (or Cloudflare) reports a successful deploy to GitHub,
  `.github/workflows/verify-deployment.yml` runs on that deploy (previews and the live site)
  in Chromium, Firefox, WebKit, an iPhone, and an Android phone. It checks:
  - every address opens directly and after a refresh;
  - progress is kept after closing the tab, and a session continues after a refresh;
  - nothing at all is written to the console;
  - nothing is sent anywhere, and the security headers are present.
- **By hand, from your computer:**
  ```bash
  E2E_BASE_URL=https://<your-site>.netlify.app npx playwright test e2e/deployment.spec.ts e2e/privacy.spec.ts
  ```
- **Before deploying:** `npm run test:e2e` runs every browser test against the production build,
  served locally the way Netlify serves it (`npm run build && npm run preview:host` does the
  same by hand, at http://localhost:4173).

## Release checklist

- [ ] CI is green on the pull request: lint, formatting, types, unit tests, build size, and every browser.
- [ ] The deploy preview has been tried on a real phone or tablet (see docs/TESTING.md).
- [ ] The privacy review in docs/PRIVACY.md still holds.
- [ ] After merging, "Verify deployment" passes for the live site.
