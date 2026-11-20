[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/kriptmwan/vice-cover-studio/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/kriptmwan/vice-cover-studio/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

# Vice Cover Studio

Vice Cover Studio turns one photo and one line of text into a poster-style
cover that looks like it came off a Vice City billboard: chunky display type,
a glowing script subtitle, a sunset or neon colour grade, and a row of stars
rating the heat. When it looks right, save it as a PNG sized for the feed or
for stories.

Everything runs in your own browser, with nothing uploaded anywhere. Open the
app, choose a panel layout and a grade, drop in a photo of your own (or start
from one of the photos and painted scenes that ship with it), nudge each photo
into place inside its panel, and export. There is no server behind it, no
account to make, and your photos never leave your machine.

## Getting started

```sh
node serve.ts            # serves app/ on http://localhost:8080
```

You need Node 22 or newer. There are no dependencies to install and no build
step to run.

## Inside the studio

- **Six panel layouts** — Four Corners, Hero + Three, Full Bleed, Nine Panel,
  Tilted Snaps and Film Strip.
- **Five colour grades** — Vice Sunset, Neon Night, Palm Gold, Teal Noir and
  Hot Pink. Each grade is a gradient map applied panel by panel, so the same
  photo can feel like dusk in one panel and midnight neon in the next.
- **Poster lettering** — big Anton capitals filled with a sunset gradient, a
  Pacifico subtitle in neon script, a halftone title block, a badge ribbon
  and a star heat meter.
- **Your photos, your way** — bring your own image, or use the two bundled
  sample photos and the two scenes the app draws for you (a neon street, a
  palm beach at sunset). Click a panel to crop: drag to reposition, scroll to
  zoom, or fine-tune with the sliders.
- **Exports for every feed** — 1080×1080, 1080×1350, 1920×1080 and 1080×1920
  for stories, saved one by one or all together as PNG.
- **Finishing touches** — film grain, a vignette, undo and redo, plus caption
  presets when you want a starting point.

## Previewing shots

The four preview shots are listed in `shots.json`. Add `?shot=cover` to see a
finished cover on its own, or `?shot=editor` to open the editor with a cover
already loaded — for example
`http://localhost:8080/?shot=cover&layout=quad&grade=sunset&caption=Neon%20Shore`.

## What's in the repo

- `main.ts` — the entry point: it copies `app/` and `screenshots/` into the
  output directory and writes `dossier.json`.
- `app/` — the app itself (`index.html`, `style.css`, `src/*.js`), fully
  offline.
- `app/fonts/` — Anton and Pacifico under the SIL Open Font License
  (`OFL-Anton.txt` and `OFL-Pacifico.txt` sit next to them).
- `app/samples/` — two sample photos made for make.fun, free to use.

Every cover here is original art made with this tool. It is not affiliated
with Rockstar Games, and it uses no official artwork, logos or fonts.

## License

MIT — see `LICENSE`.

---

<sub>Entered in the [gta6-cover-art-01 bounty](https://make.fun/bounty/gta6-cover-art-01) on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
