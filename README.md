# 👑🧝 The Elf Queen

A daily trivia game with a twist, built with SvelteKit, Tailwind CSS and
three.js, styled like an early-2000s console game set in a cozy winter hut:
low-poly 3D, a crackling fireplace, chrome,
glossy plastic and CRT scanlines.

Every day Her Majesty sets **six easy prompts**, one from each category:
Geography, Sports, Movies/TV, History, Food and Science. The catch is that each
prompt has a **twist**:

> **Name a country** — *smaller is better*
>
> Russia → 1 · France → 20 · Singapore → 81 · Vatican City → 100

Any real answer counts, but you earn **1–100 points of Christmas cheer** depending on how
well it fits the twist. Only the single best answer scores 100.

## Rules

- Six questions a day, one per category, arranged in a ring of gifts around the queen.
- **30 seconds** per question. Run out of time and that gift scores 0.
- One answer per question. Misspellings are forgiven, and answers the workshop
  doesn't recognize can be retried at no cost (apart from time).
- New gifts every day at local midnight. Past days can be played from the archive.
- Share your result as an emoji grid when you finish.

## Running it

```sh
npm install
npm run dev
```

Then open the URL it prints (usually http://localhost:5173).

```sh
npm run check   # type-check
npm run build   # production build
```

## Project layout

| Path | What's there |
| --- | --- |
| `src/lib/data/questions.ts` | The question bank: prompts, twists and answer values |
| `src/lib/data/countries.ts`, `people.ts` | Larger answer tables (countries, states, presidents, monarchs) |
| `src/lib/game.ts` | Answer matching, scoring and daily question selection |
| `src/lib/retro/` | The N64-style 3D layer (three.js): cabin scene, 3D logo, the 3D Elf Queen and helper elves, low-poly models and pre-rendered category icons |
| `src/lib/components/` | Gift ring, question card, timer and results |
| `src/routes/+page.svelte` | Title screen, game screen and How to play |

## Adding a question

Add an entry to `QUESTIONS` in `src/lib/data/questions.ts` with a category, a
prompt, a twist, whether higher or lower values are better, and a list of
answers with their values (plus optional aliases). It joins the daily rotation
automatically.

Answer values are approximate and were compiled by hand.

## Saved data

Progress, stats and timers are stored in the browser's `localStorage` under keys
starting with `queen-bee:`. There is no server or account.
