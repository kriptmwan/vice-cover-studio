[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/kriptmwan/vice-cover-studio/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/kriptmwan/vice-cover-studio/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

# Vice Cover Studio

Turn a photo and a caption into a multi-panel cover in the Vice City poster
style — bold Anton lettering, a neon-script subtitle, a sunset or neon grade,
and a heat meter of stars — then export it as a PNG in the common post sizes.

It is an offline web app: open it in a desktop browser, pick a layout and a
grade, drop in any photo (or use the built-in demo photos), drag each panel's
photo into place, and export. Photos never leave the machine; there is no
server, no account and no upload.

## Run it

```sh
node serve.ts            # serves app/ on http://localhost:8080
```

Node 22 or later. No dependencies, no build step.

## What it does

- **6 layouts** — Four Corners, Hero + Three, Full Bleed, Nine Panel, Tilted
  Snaps and Film Strip.
- **5 gradient-map grades** — Vice Sunset, Neon Night, Palm Gold, Teal Noir
  and Hot Pink, remapped per panel.
- **Lettering** — Anton display caps with a sunset gradient fill, Pacifico
  neon-script subtitle, halftone title block, badge ribbon and star heat meter.
- **Any photo** — upload your own, or use the two sample photos and the two
  scenes the app paints itself (a neon street, a sunset palm beach). Per-panel
  crop: click a panel, drag to move, scroll to zoom, or use the sliders.
- **Export** — 1080×1080, 1080×1350, 1920×1080 and 1080×1920 (story), one at a
  time or all at once, as PNG.
- **Polish** — film grain, vignette, undo/redo, caption presets.

## Screenshots

`shots.json` lists the four shots; `?shot=cover` shows a finished cover alone
and `?shot=editor` the editor with a cover loaded, e.g.
`http://localhost:8080/?shot=cover&layout=quad&grade=sunset&caption=Neon%20Shore`.

## Files

- `main.ts` — entrypoint: copies `app/` and `screenshots/` to the output
  directory and writes `dossier.json`.
- `app/` — the offline app (`index.html`, `style.css`, `src/*.js`).
- `app/fonts/` — Anton and Pacifico (SIL Open Font License; see
  `OFL-Anton.txt` and `OFL-Pacifico.txt` beside them).
- `app/samples/` — two sample photos made for make.fun, free to use.

Original cover art made with this tool. Not affiliated with Rockstar Games;
no official artwork, logos or fonts are used.

## License

MIT — see `LICENSE`.

---

<sub>Entered in the [gta6-cover-art-01 bounty](https://make.fun/bounty/gta6-cover-art-01) on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
