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
    practice/  Practice setup controls (operation, difficulty, length)
    question/  The flip-over question card and its answer buttons
    session/   Practice session progress bar and End Session control
    ui/        Shared UI pieces such as buttons
  context/     Shared React context (settings)
  data/        Static data and configuration (e.g. route paths)
  hooks/       Custom React hooks (e.g. useSettings)
  pages/       One component per route
  styles/      Global stylesheets
  test/        Test setup (Vitest + React Testing Library)
  types/       Shared TypeScript types
  utils/       Helper functions (random numbers, IDs)
    questions/ Math question generation and validation
  App.tsx      Root component and route definitions
  main.tsx     Entry point
```
