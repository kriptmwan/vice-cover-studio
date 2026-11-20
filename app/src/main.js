// Vice Cover Studio — page wiring.
// Owns the editor state, the photo registry, undo/redo, panel picking and
// the PNG export. All rendering lives in cover.js; demo scenes in demos.js.
import { LAYOUTS, GRADES, SIZES, defaultState, renderCover } from './cover.js';
import { PROCEDURAL } from './demos.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const status = document.getElementById('status');
const state = defaultState();
const photos = {}; // id -> drawable (Image or canvas)
let selected = 0; // selected panel index
let uploadCount = 0;

const DEMO_LIST = [
  { id: 'boulevard', label: 'Boulevard', src: 'samples/boulevard.jpg' },
  { id: 'pier', label: 'Pier', src: 'samples/pier.jpg' },
  { id: 'neon-street', label: 'Neon Street (drawn)', gen: true },
  { id: 'sunset-palms', label: 'Sunset Palms (drawn)', gen: true },
];

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function loadDemos() {
  for (const d of DEMO_LIST) {
    if (d.gen) photos[d.id] = PROCEDURAL[d.id]();
    else photos[d.id] = await loadImage(d.src);
  }
}

// ---- history (undo / redo) -----------------------------------------------
const past = [];
const future = [];
function snapshot() { return JSON.stringify(state); }
function commit() {
  past.push(snapshot());
  if (past.length > 60) past.shift();
  future.length = 0;
  refreshUndo();
}
function applySnapshot(json) {
  const next = JSON.parse(json);
  Object.keys(state).forEach((k) => delete state[k]);
  Object.assign(state, next);
  syncControls();
  render();
}
function undo() {
  if (!past.length) return;
  future.push(snapshot());
  applySnapshot(past.pop());
  refreshUndo();
}
function redo() {
  if (!future.length) return;
  past.push(snapshot());
  applySnapshot(future.pop());
  refreshUndo();
}
function refreshUndo() {
  document.getElementById('undo').disabled = !past.length;
  document.getElementById('redo').disabled = !future.length;
}

// ---- rendering ------------------------------------------------------------
function render() {
  renderCover(canvas, state, photos);
  document.getElementById('panel-label').textContent =
    `Panel ${selected + 1} of ${LAYOUTS[state.layout].slots}`;
  const slot = state.panels[selected];
  document.getElementById('zoom').value = slot.zoom;
  document.getElementById('panx').value = slot.ox;
  document.getElementById('pany').value = slot.oy;
  document.getElementById('photo-name').textContent = photoLabel(slot.photo);
}

function photoLabel(id) {
  const d = DEMO_LIST.find((x) => x.id === id);
  return d ? d.label : id.startsWith('up-') ? `Upload ${id.slice(3)}` : id;
}

// ---- controls ---------------------------------------------------------------
function buildButtons() {
  const layoutBox = document.getElementById('layouts');
  Object.entries(LAYOUTS).forEach(([id, l]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = l.name;
    b.dataset.layout = id;
    b.addEventListener('click', () => {
      commit();
      state.layout = id;
      selected = 0;
      syncControls();
      render();
    });
    layoutBox.appendChild(b);
  });
  const gradeBox = document.getElementById('grades');
  Object.entries(GRADES).forEach(([id, g]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'grade';
    b.dataset.grade = id;
    b.title = g.name;
    b.style.background = `linear-gradient(135deg, ${g.stops[0]}, ${g.stops[1]} 55%, ${g.stops[2]})`;
    b.setAttribute('aria-label', g.name);
    b.addEventListener('click', () => {
      commit();
      state.grade = id;
      syncControls();
      render();
    });
    gradeBox.appendChild(b);
  });
  const photoBox = document.getElementById('demo-photos');
  DEMO_LIST.forEach((d) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'demo-photo';
    b.textContent = d.label;
    b.addEventListener('click', () => {
      commit();
      state.panels[selected].photo = d.id;
      render();
    });
    photoBox.appendChild(b);
  });
  const sizeBox = document.getElementById('sizes');
  SIZES.forEach((s) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = s.label;
    b.addEventListener('click', () => exportSize(s));
    sizeBox.appendChild(b);
  });
}

function syncControls() {
  document.querySelectorAll('#layouts button').forEach((b) =>
    b.classList.toggle('active', b.dataset.layout === state.layout));
  document.querySelectorAll('#grades button').forEach((b) =>
    b.classList.toggle('active', b.dataset.grade === state.grade));
  document.getElementById('title').value = state.title;
  document.getElementById('subtitle').value = state.subtitle;
  document.getElementById('badge').value = state.badge;
  document.getElementById('grain').checked = state.grain;
  document.getElementById('vignette').checked = state.vignette;
  document.querySelectorAll('#stars button').forEach((b, i) =>
    b.classList.toggle('on', i < state.stars));
  document.getElementById('grade-name').textContent = GRADES[state.grade].name;
}

function bindInputs() {
  const title = document.getElementById('title');
  title.addEventListener('input', () => { state.title = title.value; render(); });
  title.addEventListener('change', commit);
  const sub = document.getElementById('subtitle');
  sub.addEventListener('input', () => { state.subtitle = sub.value; render(); });
  sub.addEventListener('change', commit);
  const badge = document.getElementById('badge');
  badge.addEventListener('input', () => { state.badge = badge.value; render(); });
  badge.addEventListener('change', commit);
  document.getElementById('grain').addEventListener('change', (e) => {
    commit(); state.grain = e.target.checked; render();
  });
  document.getElementById('vignette').addEventListener('change', (e) => {
    commit(); state.vignette = e.target.checked; render();
  });
  document.querySelectorAll('#stars button').forEach((b, i) => {
    b.textContent = '★';
    b.addEventListener('click', () => { commit(); state.stars = i + 1; syncControls(); render(); });
  });
  document.querySelectorAll('[data-preset]').forEach((b) => {
    b.addEventListener('click', () => {
      commit();
      state.title = b.dataset.preset;
      state.subtitle = b.dataset.sub || state.subtitle;
      syncControls();
      render();
    });
  });
  document.getElementById('zoom').addEventListener('input', (e) => {
    state.panels[selected].zoom = Number(e.target.value); render();
  });
  document.getElementById('zoom').addEventListener('change', commit);
  document.getElementById('panx').addEventListener('input', (e) => {
    state.panels[selected].ox = Number(e.target.value); render();
  });
  document.getElementById('panx').addEventListener('change', commit);
  document.getElementById('pany').addEventListener('input', (e) => {
    state.panels[selected].oy = Number(e.target.value); render();
  });
  document.getElementById('pany').addEventListener('change', commit);
  document.getElementById('shuffle').addEventListener('click', () => {
    commit();
    const ids = DEMO_LIST.map((d) => d.id);
    state.panels.forEach((p) => { p.photo = ids[Math.floor(Math.random() * ids.length)]; });
    render();
  });
  document.getElementById('upload').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const img = await loadImage(URL.createObjectURL(file));
    uploadCount += 1;
    const id = `up-${uploadCount}`;
    photos[id] = img;
    commit();
    state.panels[selected].photo = id;
    render();
    status.textContent = `Loaded ${file.name} — it never leaves this machine.`;
  });
  document.getElementById('undo').addEventListener('click', undo);
  document.getElementById('redo').addEventListener('click', redo);
  document.getElementById('export-all').addEventListener('click', async () => {
    for (const s of SIZES) await exportSize(s);
    status.textContent = `Exported all ${SIZES.length} sizes as PNG.`;
  });
}

// ---- panel picking: click to select, drag to pan, wheel to zoom ------------
function canvasPoint(e) {
  const r = canvas.getBoundingClientRect();
  return { x: (e.clientX - r.left) * (canvas.width / r.width), y: (e.clientY - r.top) * (canvas.height / r.height) };
}
function panelAt(x, y) {
  const rects = [];
  // Ask the engine for the current layout rects on a scratch canvas.
  const scratch = document.createElement('canvas');
  scratch.width = canvas.width; scratch.height = canvas.height;
  renderCover(scratch, state, photos, rects);
  for (let i = rects.length - 1; i >= 0; i--) {
    const [rx, ry, rw, rh, rot = 0] = rects[i];
    const dx = x - (rx + rw / 2), dy = y - (ry + rh / 2);
    const c = Math.cos(-rot), s = Math.sin(-rot);
    const lx = dx * c - dy * s, ly = dx * s + dy * c;
    if (Math.abs(lx) <= rw / 2 && Math.abs(ly) <= rh / 2) return i;
  }
  return -1;
}
let drag = null;
canvas.addEventListener('pointerdown', (e) => {
  const p = canvasPoint(e);
  const hit = panelAt(p.x, p.y);
  if (hit < 0) return;
  selected = hit;
  render();
  drag = { x: p.x, y: p.y, moved: false };
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const p = canvasPoint(e);
  const slot = state.panels[selected];
  const dx = (p.x - drag.x) / canvas.width;
  const dy = (p.y - drag.y) / canvas.height;
  if (Math.abs(dx) + Math.abs(dy) > 0.002) drag.moved = true;
  slot.ox = Math.max(-0.5, Math.min(0.5, slot.ox + dx));
  slot.oy = Math.max(-0.5, Math.min(0.5, slot.oy + dy));
  drag.x = p.x; drag.y = p.y;
  render();
});
canvas.addEventListener('pointerup', () => {
  if (drag && drag.moved) commit();
  drag = null;
});
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const p = canvasPoint(e);
  const hit = panelAt(p.x, p.y);
  if (hit < 0) return;
  selected = hit;
  commit();
  const slot = state.panels[selected];
  slot.zoom = Math.max(0.6, Math.min(3, slot.zoom * (e.deltaY < 0 ? 1.08 : 0.93)));
  render();
}, { passive: false });

// ---- export -----------------------------------------------------------------
async function exportSize(size) {
  const off = document.createElement('canvas');
  off.width = size.w; off.height = size.h;
  renderCover(off, state, photos);
  const blob = await new Promise((res) => off.toBlob(res, 'image/png'));
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `vice-cover-${size.w}x${size.h}.png`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  status.textContent = `Saved vice-cover-${size.w}x${size.h}.png`;
}

// ---- boot ---------------------------------------------------------------------
async function boot() {
  buildButtons();
  bindInputs();
  syncControls();
  refreshUndo();
  await Promise.all([
    document.fonts.load('100px Anton'),
    document.fonts.load('40px Pacifico'),
  ]);
  await loadDemos();
  const shot = new URLSearchParams(location.search).get('shot');
  if (shot) {
    await runShot(shot, new URLSearchParams(location.search), state, photos, () => {
      syncControls();
      render();
    });
  } else {
    render();
  }
}
boot();
