// Vice Cover Studio — entrypoint (Node 22, standard library only).
// Hands the app in: copies app/ and screenshots/ from beside this file into
// the output directory and writes dossier.json, the summary the judge reads,
// using the vendored make.fun library.
//
// Run it directly to check the output locally:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Serve the app for a browser instead with: node serve.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The scorer's caps (from the kit's gate): keep the entry inside them here so
// a too-big bundle is caught before it ever reaches the scorer — at most 4
// screenshots of 256 KiB, at most 993 files / 48 MiB under app/, paths under
// 1000 bytes, and 160 KiB of dossier text.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
