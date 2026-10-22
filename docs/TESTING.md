# Testing

How the app is tested, where to find the test for each requirement, and the results of the
accessibility review.

## Running the tests

| Command                 | What it runs                                                                   |
| ----------------------- | ------------------------------------------------------------------------------ |
| `npm test`              | Unit, component, and integration tests (Vitest + React Testing Library)        |
| `npm run test:watch`    | The same, re-running on every change                                           |
| `npm run test:coverage` | The same, with a coverage report (also saved as HTML in `coverage/`)           |
| `npm run test:e2e`      | Real-browser tests (Playwright) in every browser, against the production build |

The real-browser tests need the browsers once: `npx playwright install`. Pick browsers with
`--project`, e.g. `npx playwright test --project=firefox`. To use a Chromium that is already
installed, set `PLAYWRIGHT_CHROMIUM_PATH` to its executable.

Coverage of `src/` (excluding tests): about 98% of lines and 95% of branches.

### Where tests live

- **Unit and component tests** sit next to the code they test: `foo.ts` → `foo.test.ts`.
- **Page tests** are in `src/pages/`. They render the whole app at one page.
- **Integration tests** are in `src/integration/`. They are whole journeys that start on the
  home page and use only what is on screen.
- **Real-browser tests** are in `e2e/`. They cover what jsdom can't check: zoom, real color
  contrast, visible focus, and motion.
- **Shared helpers** are in `src/test/`. For example, `practice.tsx` opens the app and answers
  questions.

### Performance tests

- **`src/services/largeHistory.test.ts`:** thousands of answers. Checks the limits, that
  totals are exact after archiving, storage size, and how much each answer rewrites.
- **`src/pages/rendering.test.tsx`:** no needless re-renders, saves or question generation.
- **`e2e/slowDevice.spec.ts`:** a slow phone. These tests run on their own, after the other
  browser tests, so they measure fairly.

See [PERFORMANCE.md](PERFORMANCE.md) for the measurements.

## Browsers and devices

Every browser test runs in each of these (CI runs them all on every pull request; see
`.github/workflows/ci.yml`):

| Project                           | What it stands for                                      |
| --------------------------------- | ------------------------------------------------------- |
| `chromium`                        | Chrome and Edge (the same engine)                       |
| `google chrome`, `microsoft edge` | The real branded browsers (`E2E_BRANDED_BROWSERS=1`)    |
| `firefox`                         | Firefox                                                 |
| `webkit`                          | Safari on a Mac (Safari's engine)                       |
| `iphone`                          | Safari on an iPhone 14 (WebKit, touch, phone screen)    |
| `ipad`                            | Safari on an iPad Pro 11 (WebKit, touch, tablet screen) |
| `android phone`                   | Chrome on a Pixel 7 (touch, phone screen)               |
| `slow device`                     | A slow phone: 6× slower CPU and slow 4G (Chromium only) |

The keyboard-only tests are skipped:

- **On WebKit:** Safari doesn't move focus to links and buttons with Tab unless "Press Tab to
  highlight each item" is turned on, so it's checked by hand below.
- **On phones and tablets:** they have no keyboard.

### Real devices (before each release)

Emulators don't catch everything (e.g. real touch, iOS Safari's address bar, VoiceOver). On the
deploy preview, on an iPhone or iPad and an Android phone or tablet:

1. Home → Start Practice → answer a 5-question session by tapping. Each answer, flip, and Next
   responds straight away.
2. Turn the device sideways mid-session: the card still fits and nothing is cut off.
3. Close the tab, open the site again: Statistics shows the session.
4. Refresh mid-session: it continues ("Welcome back!").
5. Settings → turn off Card flip animation; turn on the device's Reduce Motion: no movement.
6. Safari on a Mac with "Press Tab to highlight each item" on: a whole session by keyboard.

Record the device, browser version, date and any problems here.

## Requirement → test map

### 79. Unit tests

| Requirement                          | Tests                                                                                                                                                                                                                                                                                           |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Arithmetic generators                | `src/utils/questions/{addition,subtraction,multiplication,division,generateQuestion,validateQuestion}.test.ts`                                                                                                                                                                                  |
| Difficulty boundaries                | `src/data/difficultyRules.test.ts` covers each level's exact limits, accepted and one past, written out by hand. The levels must get harder in order and match their descriptions. Also `difficultyCheck.test.ts` and the per-generator min/max tests                                           |
| Distractor generation                | `src/utils/questions/distractors.test.ts`                                                                                                                                                                                                                                                       |
| Answer-choice uniqueness             | `src/utils/questions/answerChoices.test.ts`: four unique choices, with the right answer exactly once, for every operation × level (300 random questions each), placed in every position about equally                                                                                           |
| Statistics calculations              | `src/utils/statistics.test.ts`, `sessionSummary.test.ts`, `mistakeStatistics.test.ts`                                                                                                                                                                                                           |
| Mistake-pattern updates              | `src/utils/mistakePatterns.test.ts`, `src/services/mistakePatterns.test.ts`, `src/utils/mistakePriority.test.ts`                                                                                                                                                                                |
| Similar-question generation          | `src/utils/questions/similarQuestions.test.ts`                                                                                                                                                                                                                                                  |
| Mastery rules                        | `src/utils/mistakePatterns.test.ts` (the "mastery" and `applyAttempt` sections)                                                                                                                                                                                                                 |
| Storage serialization and validation | `src/services/serialization.test.ts`: every saved type comes back field for field, and each validator rejects every missing or wrong-typed field. Also `storage.test.ts`, `schema.test.ts`, `dataHealth.test.ts`, `practiceHistory.test.ts`, `activeSession.test.ts`, `settingsStorage.test.ts` |

### 80. Component tests

| Requirement             | Tests                                                                                                                                                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Operation selection     | `src/components/practice/selectors.test.tsx`, `src/pages/PracticeSetupPage.test.tsx`                                                                                                                               |
| Difficulty selection    | `src/components/practice/selectors.test.tsx` (including arrow keys), `src/pages/PracticeSetupPage.test.tsx`                                                                                                        |
| Answer selection        | `src/components/question/AnswerChoice.test.tsx`, `QuestionCard.test.tsx`, `QuestionCardAccessibility.test.tsx` (number keys)                                                                                       |
| Card flipping           | `src/components/question/QuestionCard.test.tsx` ("QuestionCard flipping")                                                                                                                                          |
| Right and wrong buttons | `src/components/question/QuestionCard.test.tsx` ("QuestionCard back")                                                                                                                                              |
| Progress updates        | `src/components/session/SessionProgress.test.tsx`, `src/pages/PracticeSessionPage.test.tsx`, `src/pages/sessionAccessibility.test.tsx`                                                                             |
| Session completion      | `src/pages/PracticeSessionPage.test.tsx`, `src/pages/PracticeSummaryPage.test.tsx`, `src/utils/practiceSession.test.ts`                                                                                            |
| Statistics display      | `src/components/statistics/StatCard.test.tsx`, `src/pages/StatisticsPage.test.tsx`, `src/pages/MistakesPage.test.tsx`                                                                                              |
| Confirmation dialogs    | `src/components/confirmationDialogs.test.tsx` checks End Session, Reset Statistics, Clear All Data and Leave Session the same way: focus moves in, Escape and Cancel close it, focus returns, and confirming works |

### 81. Integration tests

All in `src/integration/journeys.test.tsx` unless noted.

| Requirement                           | Test                                                                                                                     |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| A full addition session               | "a full addition session": from Home through setup, five questions and the summary, to Statistics                        |
| A mixed-operation session             | "a mixed-operation session": 20 questions using only the chosen operations, broken down in the summary                   |
| Continuous practice                   | "continuous practice": past the longest fixed session (20), then ended by the player                                     |
| An incorrect answer creates a mistake | "mistakes › an answer marked wrong becomes a mistake…": checks storage, the summary, Statistics and the Mistakes page    |
| Mistake-review generation             | "mistakes › mistake review asks related questions…" (also `src/pages/mistakeReview.test.tsx`)                            |
| Mastery completion                    | The same test: three right answers master the mistake, the review ends, and review mode turns off                        |
| Persistence after a browser refresh   | "a browser refresh": mid-session and after finishing (also `src/pages/sessionRecovery.test.tsx`, `persistence.test.tsx`) |
| Resetting statistics                  | "resetting statistics": history is deleted, while settings and mistakes to review are kept                               |

### 82. Accessibility testing

| Requirement                         | How                                                                                                                                                                                                                                                             |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Complete a session by keyboard only | `src/integration/keyboardOnly.test.tsx` reaches every control with Tab alone. `e2e/keyboard.spec.ts` does the same in Chromium and checks that a 2px+ focus ring is visible at every step                                                                       |
| Test with a screen reader           | Automated: `e2e/screenReader.spec.ts` checks the accessibility tree (names, roles, live announcements, heading and landmark structure, reading order) and `QuestionCardAccessibility.test.tsx` checks the spoken question text. Manual: see the checklist below |
| Reduced-motion mode                 | `e2e/display.spec.ts` checks that nothing on the page is transitioning or animating when the device asks for reduced motion. Also `src/pages/sessionAccessibility.test.tsx`                                                                                     |
| Browser zoom                        | `e2e/display.spec.ts` checks every page, and answering a question, at 200% and 400% zoom (WCAG reflow) and with text set to 200%, with no sideways scrolling                                                                                                    |
| Automated accessibility checker     | axe-core: `src/accessibility.test.tsx` covers every page and state in jsdom. `e2e/accessibility.spec.ts` covers every page empty and with data, a whole session, and the dialogs in Chromium, including color contrast                                          |
| Manually review reported issues     | See "Accessibility review" below                                                                                                                                                                                                                                |

## Accessibility review

Issues found by the automated checks during this review, and what was done about them.

| Found by                                                                  | Issue                                                                                                                                                                                                                                          | Resolution                                                                                                                                                                                                         |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| axe in Chromium (`label-content-name-mismatch`, WCAG 2.5.3 Label in Name) | Answer buttons were named with `aria-label="Answer 56"`, so the name was set separately from the visible text, which also includes the shortcut number. Voice-control users say what they see, so the visible text should be part of the name. | **Fixed.** The name now comes from the button's own text: "Answer" is visually hidden and the number is shown. The shortcut number and checkmark are hidden from screen readers, so the name is still "Answer 56". |
| Zoom test at 400% (320px wide)                                            | When the next question appeared, the card slid in from the right and briefly made the page scroll sideways by about 8px.                                                                                                                       | **Fixed.** The card now rises in from just below, which can't cause sideways scrolling.                                                                                                                            |
| Review of a test that missed a deliberate bug                             | Removing the CSS reduced-motion rule for the card fade-in didn't change anything, because the app already turns the fade off in JavaScript when the device asks for reduced motion.                                                            | **No change needed.** The CSS rule is a backup. A test does fail when both are broken, or when any other moving part (e.g. buttons) ignores reduced motion.                                                        |

No other issues were reported. axe found no violations on any page or in any state, in jsdom
or in Chromium.

### Manual screen-reader checklist

Automated checks confirm what the browser gives a screen reader, but not how it sounds. Before
a release, someone should go through this list with a real screen reader: VoiceOver (macOS:
⌘F5, iOS), NVDA (Windows, free) or TalkBack (Android). Work from the home page.

1. **Landmarks:** the rotor or landmark list shows the banner, the main navigation, and main.
   "Skip to main content" is the first thing reached.
2. **Setup:** each group is announced with its question ("How hard?"). Each choice is read
   with its state ("checked") and level description.
3. **Start Session:** the first question is announced in words ("What is 7 times 8?"),
   followed by the progress ("Question 1 of 5").
4. **Answers:** each button reads as "Answer 56, toggle button, not pressed". Pressing one reads
   "pressed".
5. **Flip:** the correct answer and the chosen answer are announced.
6. **I Got It Right / Wrong:** the encouraging message (if on) and the progress are announced
   once each, not repeated.
7. **Next Question:** the new question is announced.
8. **Leave mid-session** (e.g. via the menu): the dialog title and description are read, and
   focus is on Keep Practicing.
9. **Summary:** the heading and every result tile are read with their labels.
10. **Statistics, Mistakes and Settings:** headings are in order (one h1), cards are named by
    their titles, and the Reset and Clear dialogs read their warnings.

Record the screen reader, browser, date and any problems in the table above.
