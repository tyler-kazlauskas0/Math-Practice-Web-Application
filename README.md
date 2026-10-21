# Math Practice Web Application

A math practice app for kids ages 7–12, built with React, TypeScript, and Vite.

## Getting started

```bash
npm install
npm run dev      # start the dev server
npm run build    # type-check and build for production
npm run preview  # preview the production build

npm run lint          # check code with ESLint
npm run lint:fix      # auto-fix ESLint problems
npm run format        # format all files with Prettier
npm run format:check  # check formatting without changing files
npm test              # run the test suite once (Vitest)
npm run test:watch    # re-run tests on file changes
```

## Project structure

```
src/
  assets/      Images, icons, and other static assets
  components/
    layout/    Page frame: header, navigation, page container
    practice/  Practice setup controls (mode, operation, difficulty, length)
    question/  The flip-over question card and its answer buttons
    session/   Practice session progress bar and End Session control
    settings/  Settings page toggles and Clear All Data
    statistics/ Statistics page cards, mistakes, recent sessions, and reset
    ui/        Shared UI pieces such as buttons
  context/     Shared React context (settings, mistake patterns)
  data/        Static data and configuration (e.g. route paths)
  hooks/       Custom React hooks (e.g. useSettings)
  pages/       One component per route
  services/    Saved data: localStorage wrapper, data versioning, settings, history, mistakes
  styles/      Global stylesheets
  test/        Test setup (Vitest + React Testing Library)
  types/       Shared TypeScript types
  utils/       Helper functions (random numbers, IDs, session logic, mistake priority)
    questions/ Math question generation, validation, and questions similar to past mistakes
  App.tsx      Root component (settings, mistakes, and the router)
  routes.tsx   Every page's address (a React Router data router, needed for leave warnings)
  main.tsx     Entry point
```

## Saved data

Everything is saved in the browser's `localStorage` under keys starting with `math-practice:`.
Nothing is sent to a server.

| Key                              | Contents                                                                      |
| -------------------------------- | ----------------------------------------------------------------------------- |
| `math-practice:schema-version`   | Version of the saved data format (see `src/services/schema.ts`)               |
| `math-practice:settings`         | Settings, including the default practice choices                              |
| `math-practice:sessions`         | The newest 100 practice sessions (without their answers)                      |
| `math-practice:attempts`         | Every answer from those sessions, up to 5,000                                 |
| `math-practice:history-archive`  | Totals (overall, per operation, per level) for answers no longer kept in full |
| `math-practice:mistake-patterns` | One record per math fact answered wrong (up to 500), for mistake practice     |
| `math-practice:active-session`   | The session in progress (question, chosen answer), so a refresh can resume it |

When the format changes, increase `CURRENT_SCHEMA_VERSION` and add a migration to `MIGRATIONS`.

## Error handling

- **Damaged saved data:** on startup, `checkAndRepairStoredData` (`src/services/dataHealth.ts`)
  checks each key above. Unreadable data resets only that key, and bad records are removed from
  a list without touching the good ones. A short notice tells the player what was started fresh.
- **Saving problems:** if the browser blocks storage or runs out of space, a notice explains that
  progress won't be kept. Practice still works.
- **Question generation:** generated questions are validated and retried. If that still fails, a
  simple valid fallback question (`src/utils/questions/fallbackQuestion.ts`) keeps practice going.
- **Page crashes:** a friendly error page with **Try Again** and **Go Home** replaces the crashed
  page. Stack traces are never shown. In development, errors are logged to the console with
  `logDevError` (`src/utils/devLog.ts`).

## Accessibility

- Everything works with a keyboard: Tab, Enter, and Space, plus number keys 1–4 to choose an answer.
- Screen readers hear questions in words ("What is 7 times 8?") and are told about new questions,
  the revealed answer, and progress.
- Card animations turn off with the device's "reduce motion" setting or the app's own setting.
- Choices and results never rely on color alone; colors meet WCAG AA contrast
  (checked by `src/styles/contrast.test.ts`).
- `src/accessibility.test.tsx` runs the axe checker on every page and card state.
