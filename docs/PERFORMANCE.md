# Performance

What was measured, what was changed, and how to check it again.

## How to measure

| Command                         | What it shows                                                                                                                 |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `npm run build && npm run size` | What the first page load downloads and what comes later (fails over budget)                                                   |
| `npm run test:e2e`              | Includes `e2e/slowDevice.spec.ts`: a slow phone (6× slower CPU, slow 4G) with a full history                                  |
| `npm test`                      | Includes `src/services/largeHistory.test.ts` (thousands of answers) and `src/pages/rendering.test.tsx` (re-renders and saves) |

The Settings page also shows how much this app has saved on the device and what share of
the browser's space that is.

## Results

On a simulated slow phone (6× slower CPU, slow 4G, 390×844 screen) with 5,000 answers
already saved. Median of three runs. "Busy" means the page couldn't respond to taps.

|                                        | Before (Phase 20) | After (Phase 21) |
| -------------------------------------- | ----------------- | ---------------- |
| Busy after marking an answer           | 372 ms            | 107 ms           |
| Busy after Next Question               | 154 ms            | 0 ms             |
| Opening Statistics                     | 651 ms            | 512 ms           |
| Home page usable (first visit)         | 1.78 s            | 1.77 s           |
| First load download (gzipped JS + CSS) | 119.9 KB          | 116.9 KB         |

The 107 ms after marking an answer includes the very first answer, which reads the saved history
for the first time. After that it's about 70 ms.

## What was changed, and why

### Saving answers (the biggest cost)

Every answer is saved straight away, so nothing is lost if the browser closes. The answers
are stored as one list, and each save rewrites the whole list. Measured on the slow phone:

| Answers kept in full | Characters | Turn into text | Write to storage | Read back |
| -------------------- | ---------- | -------------- | ---------------- | --------- |
| 1,000                | 0.33 M     | 15 ms          | 22 ms            | 10 ms     |
| 5,000                | 1.67 M     | 66 ms          | 96 ms            | 59 ms     |

- **Fewer answers kept in full: 5,000 → 1,000** (`MAX_STORED_ATTEMPTS`). Older answers are
  folded into the archive totals, as before.
- **The archive now keeps everything the Statistics page shows:**
  - the best streak, plus the run of right answers at the very end of the archive, so a
    streak that runs into the kept answers is counted whole;
  - mistake-review totals, alongside the counts it already kept.

  So archiving loses nothing that's shown. (Average answer time isn't shown on the
  Statistics page.) Older archives without these fields are read as zero.

- **No second save on Next Question.** Moving on used to save the last answer again,
  reading and checking the whole list just to find it was already there.
- **Saved lists are read once.** A checked list is reused while the saved text is unchanged
  (compared in full, so a change from another tab is still noticed).
- At most 100 sessions are kept in full, as before. Sessions are small.

`largeHistory.test.ts` checks the following with thousands of answers:

- every total, the best streak (including one across the archive boundary) and the review
  totals come out exactly as if nothing had been archived;
- storage stays well under browser limits;
- each answer rewrites less than 400,000 characters.

### Rendering

Measured by counting each component's renders during a session
(`src/pages/rendering.test.tsx` keeps these from coming back):

- **Number-key listener:** the front of the card got a new `onSelect` function on every render,
  so its `keydown` listener was removed and re-added every time. The callbacks are now stable
  (`useCallback`).
- **Hidden front of the card:** it re-rendered, with its four answer buttons, while the back
  changed (marking, the leave warning). `QuestionCardFront`, `AnswerChoice` and
  `SessionProgress` are now `memo` components.
- **Settings:** setting a value to what it already was used to re-render everything that reads
  settings, and save. Now it does neither. Settings are also no longer re-saved every time the
  app starts.
- **Mistakes page:** mistakes are sorted once per change, not on every view switch.

Already fine, and now covered by tests:

- Questions are made in event handlers, never while rendering (the session reducer is pure).
- Statistics are worked out once per visit (`useStatistics`).

### Loading

What the first load contained (gzipped):

| Part                      | Size      |
| ------------------------- | --------- |
| React DOM                 | 53%       |
| React Router              | 24%       |
| All of the app's own code | about 20% |

So there's little to gain by splitting the app's own code:

- **Statistics, Mistakes and Settings load separately** (`lazyPage` in `src/routes.tsx`).
  Once the first page is showing, they're downloaded in the background, so they usually open
  instantly. If one can't be downloaded, the friendly error page appears and the next visit
  tries again.
- **Favicon:** the Vite logo left over from the project template (9.5 KB) was replaced with a
  222-byte icon of the app's own. There are no other images; icons are emoji.
- **Fonts:** none to download. The app uses the device's own fonts.
- **Dependencies:** all used. The only runtime dependencies are `react`, `react-dom`, and
  `react-router`.

Watch out: the bundler splits code shared between the first page and a separately loaded page
into its own file, which is then downloaded on first load anyway. This happened once in
this phase: importing `mistakeStatistics` into `practiceHistory` moved React Router into a
shared file. `npm run size` lists every file downloaded on first load, so it's easy to spot.
