// Vice Cover Studio — cover engine.
// Draws a GTA-style multi-panel poster onto a 2D canvas from a plain state
// object: layout, grade, caption, stars, badge and one photo per panel.
// No network, no libraries: only the Canvas 2D API and vendored fonts.

export const LAYOUTS = {
  quad:    { name: 'Four Corners',  slots: 4 },
  hero:    { name: 'Hero + Three',  slots: 4 },
  bleed:   { name: 'Full Bleed',    slots: 1 },
  nine:    { name: 'Nine Panel',    slots: 9 },
  tilted:  { name: 'Tilted Snaps',  slots: 3 },
  strip:   { name: 'Film Strip',    slots: 4 },
};

// Each grade is a 3-stop gradient map: a photo's luminance is remapped onto
// the ramp, then mixed back with the original so detail survives.
export const GRADES = {
  sunset: { name: 'Vice Sunset', stops: ['#16042e', '#ff5e3a', '#ffd319'], mix: 0.72, accent: '#ff5e3a' },
  neon:   { name: 'Neon Night',  stops: ['#04021a', '#ff2e88', '#00e5ff'], mix: 0.72, accent: '#ff2e88' },
  palm:   { name: 'Palm Gold',   stops: ['#221303', '#e8820e', '#ffe9a8'], mix: 0.70, accent: '#e8820e' },
  teal:   { name: 'Teal Noir',   stops: ['#01141a', '#0e7c86', '#9ff5e8'], mix: 0.72, accent: '#0e7c86' },
  pink:   { name: 'Hot Pink',    stops: ['#2b0218', '#ff2e88', '#ffb3d9'], mix: 0.70, accent: '#ff2e88' },
};

export const SIZES = [
  { label: 'Square 1080 × 1080', w: 1080, h: 1080 },
  { label: 'Portrait 1080 × 1350', w: 1080, h: 1350 },
  { label: 'Wide 1920 × 1080', w: 1920, h: 1080 },
  { label: 'Story 1080 × 1920', w: 1080, h: 1920 },
];

export function defaultState() {
  return {
    layout: 'quad',
    grade: 'sunset',
    title: 'NEON SHORE',
    subtitle: 'a vice city story',
    stars: 4,
    badge: 'SUNSET HEIST',
    grain: true,
    vignette: true,
    // Nine slots; layouts with fewer slots simply use the first ones.
    // The boulevard photo is portrait, so its slots start panned down a
    // touch to keep the subject's face in frame on wide panels.
    panels: [
      { photo: 'boulevard', zoom: 1.0, ox: 0, oy: 0.15 },
      { photo: 'pier', zoom: 1.0, ox: 0, oy: 0 },
      { photo: 'neon-street', zoom: 1.0, ox: 0, oy: 0 },
      { photo: 'sunset-palms', zoom: 1.0, ox: 0, oy: 0 },
      { photo: 'boulevard', zoom: 1.0, ox: 0, oy: 0.15 },
      { photo: 'pier', zoom: 1.0, ox: 0, oy: 0 },
      { photo: 'neon-street', zoom: 1.0, ox: 0, oy: 0 },
      { photo: 'sunset-palms', zoom: 1.0, ox: 0, oy: 0 },
      { photo: 'boulevard', zoom: 1.0, ox: 0, oy: 0.15 },
    ],
  };
}

function hexRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Build a 256-entry lookup table from the grade's colour stops.
function gradeLut(grade) {
  const stops = grade.stops.map((hex, i) => ({ at: i / (grade.stops.length - 1), rgb: hexRgb(hex) }));
  const lut = new Uint8Array(256 * 3);
  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    let a = stops[0], b = stops[stops.length - 1];
    for (let s = 0; s < stops.length - 1; s++) {
      if (t >= stops[s].at && t <= stops[s + 1].at) { a = stops[s]; b = stops[s + 1]; break; }
    }
    const f = b.at === a.at ? 0 : (t - a.at) / (b.at - a.at);
    lut[i * 3] = a.rgb[0] + (b.rgb[0] - a.rgb[0]) * f;
    lut[i * 3 + 1] = a.rgb[1] + (b.rgb[1] - a.rgb[1]) * f;
    lut[i * 3 + 2] = a.rgb[2] + (b.rgb[2] - a.rgb[2]) * f;
  }
  return lut;
}

const lutCache = {};
function lutFor(gradeId) {
  if (!lutCache[gradeId]) lutCache[gradeId] = gradeLut(GRADES[gradeId]);
  return lutCache[gradeId];
}

// Remap one panel's pixels through the grade, in place.
function applyGrade(ctx, w, h, gradeId) {
  const grade = GRADES[gradeId];
  const lut = lutFor(gradeId);
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  const mix = grade.mix;
  for (let i = 0; i < d.length; i += 4) {
    const lum = Math.round(0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]);
    const j = lum * 3;
    d[i] = d[i] + (lut[j] - d[i]) * mix;
    d[i + 1] = d[i + 1] + (lut[j + 1] - d[i + 1]) * mix;
    d[i + 2] = d[i + 2] + (lut[j + 2] - d[i + 2]) * mix;
  }
  ctx.putImageData(img, 0, 0);
}

// Draw a photo cover-fitting a rect, honouring zoom and pan offsets.
function drawPhotoInto(ctx, photo, x, y, w, h, zoom, ox, oy) {
  const iw = photo.width || photo.naturalWidth;
  const ih = photo.height || photo.naturalHeight;
  if (!iw || !ih) return;
  const s = Math.max(w / iw, h / ih) * zoom;
  const dw = iw * s, dh = ih * s;
  ctx.drawImage(photo, x + (w - dw) / 2 + ox * w, y + (h - dh) / 2 + oy * h, dw, dh);
}

// Panel rectangles in canvas space. The title band sits at the bottom except
// for full-bleed, where the title floats over the photo.
function layoutRects(layout, W, H) {
  const band = layout === 'bleed' ? 0 : Math.round(H * 0.17);
  const cw = W, ch = H - band;
  const g = Math.max(4, Math.round(W * 0.012));
  const R = [];
  if (layout === 'quad') {
    const pw = (cw - g * 3) / 2, ph = (ch - g * 3) / 2;
    R.push([g, g, pw, ph], [g * 2 + pw, g, pw, ph], [g, g * 2 + ph, pw, ph], [g * 2 + pw, g * 2 + ph, pw, ph]);
  } else if (layout === 'hero') {
    const lw = Math.round(cw * 0.60) - g;
    const rw = cw - lw - g * 3;
    const ph = (ch - g * 4) / 3;
    R.push([g, g, lw, ch - g * 2]);
    for (let i = 0; i < 3; i++) R.push([lw + g * 2, g + i * (ph + g), rw, ph]);
  } else if (layout === 'bleed') {
    R.push([0, 0, W, H]);
  } else if (layout === 'nine') {
    const pw = (cw - g * 4) / 3, ph = (ch - g * 4) / 3;
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) R.push([g + c * (pw + g), g + r * (ph + g), pw, ph]);
  } else if (layout === 'tilted') {
    const pw = cw * 0.46, ph = ch * 0.52;
    R.push([cw * 0.05, ch * 0.10, pw, ph, -0.10]);
    R.push([cw * 0.49, ch * 0.06, pw, ph, 0.07]);
    R.push([cw * 0.27, ch * 0.42, pw, ph, -0.03]);
  } else if (layout === 'strip') {
    const pw = (cw - g * 5) / 4;
    for (let i = 0; i < 4; i++) R.push([g + i * (pw + g), g, pw, ch - g * 2]);
  }
  return { rects: R, band };
}

function starPath(ctx, cx, cy, r) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const ang = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 === 0 ? r : r * 0.45;
    const x = cx + Math.cos(ang) * rad, y = cy + Math.sin(ang) * rad;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function drawStars(ctx, cx, cy, r, count) {
  const gap = r * 2.35;
  const x0 = cx - ((5 - 1) * gap) / 2;
  for (let i = 0; i < 5; i++) {
    starPath(ctx, x0 + i * gap, cy, r);
    ctx.fillStyle = i < count ? '#ffd319' : 'rgba(255,255,255,0.22)';
    ctx.fill();
    ctx.lineWidth = Math.max(1.5, r * 0.12);
    ctx.strokeStyle = 'rgba(10,5,20,0.85)';
    ctx.stroke();
  }
}

// Halftone dots: a field of dots whose size swells in a slow wave.
function drawHalftone(ctx, x, y, w, h) {
  const step = Math.max(10, Math.round(w / 64));
  ctx.fillStyle = 'rgba(255,255,255,0.10)';
  for (let yy = y + step / 2; yy < y + h; yy += step) {
    for (let xx = x + step / 2; xx < x + w; xx += step) {
      const wave = 0.5 + 0.5 * Math.sin((xx / w) * Math.PI * 3 + (yy / h) * Math.PI * 2);
      const r = 1 + wave * step * 0.16;
      ctx.beginPath();
      ctx.arc(xx, yy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

let grainTile = null;
function grainPattern(ctx) {
  if (!grainTile) {
    grainTile = document.createElement('canvas');
    grainTile.width = 128; grainTile.height = 128;
    const g = grainTile.getContext('2d');
    const img = g.createImageData(128, 128);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.floor(Math.random() * 256);
      img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v; img.data[i + 3] = 34;
    }
    g.putImageData(img, 0, 0);
  }
  return ctx.createPattern(grainTile, 'repeat');
}

// Fit the title in Anton caps; returns the size used.
function fitTitle(ctx, text, maxW, startSize) {
  let size = startSize;
  ctx.font = `${size}px Anton, 'Arial Narrow', sans-serif`;
  while (ctx.measureText(text).width > maxW && size > 12) {
    size -= 2;
    ctx.font = `${size}px Anton, 'Arial Narrow', sans-serif`;
  }
  return size;
}

/**
 * Render the cover. `photos` maps photo id -> drawable (Image or canvas).
 * `rectsOut` optionally receives the panel rects (for hit-testing in the editor).
 */
export function renderCover(canvas, state, photos, rectsOut) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const grade = GRADES[state.grade] || GRADES.sunset;
  const { rects, band } = layoutRects(state.layout, W, H);

  // Backdrop.
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#16042e');
  bg.addColorStop(0.55, '#3d0a4e');
  bg.addColorStop(1, '#12041f');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Tilted layout gets a painted sunset sky behind its snapshots.
  if (state.layout === 'tilted') {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#2a0a4e');
    sky.addColorStop(0.45, '#ff5e3a');
    sky.addColorStop(0.75, '#ffd319');
    sky.addColorStop(1, '#ff2e88');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H - band);
    ctx.fillStyle = '#fff3c4';
    ctx.beginPath();
    ctx.arc(W * 0.5, (H - band) * 0.42, Math.min(W, H) * 0.16, 0, Math.PI * 2);
    ctx.fill();
    // Distant skyline: a solid dark ground band, then taller blocks.
    const base = (H - band) * 0.72;
    ctx.fillStyle = '#16042e';
    ctx.fillRect(0, base, W, H - band - base);
    ctx.fillStyle = 'rgba(34,8,54,0.95)';
    for (let i = 0; i < 9; i++) {
      const bw = W * 0.115, bh = (H - band) * (0.08 + ((i * 37) % 10) / 55);
      ctx.fillRect(i * W * 0.11, base - bh, bw, bh);
    }
  }

  // Panels: grade each one offscreen, then ink it in with a poster frame.
  const off = document.createElement('canvas');
  const octx = off.getContext('2d');
  rects.forEach((r, i) => {
    const [x, y, w, h, rot = 0] = r;
    const slot = state.panels[i] || state.panels[0];
    const photo = photos[slot.photo];
    off.width = Math.max(2, Math.round(w));
    off.height = Math.max(2, Math.round(h));
    octx.fillStyle = '#241534';
    octx.fillRect(0, 0, off.width, off.height);
    if (photo) drawPhotoInto(octx, photo, 0, 0, off.width, off.height, slot.zoom, slot.ox, slot.oy);
    applyGrade(octx, off.width, off.height, state.grade);
    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate(rot);
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = Math.max(6, W * 0.015);
    ctx.shadowOffsetY = Math.max(3, W * 0.006);
    ctx.drawImage(off, -w / 2, -h / 2, w, h);
    ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    // Inked frame: thick dark edge, thin white keyline, accent corner band.
    ctx.lineWidth = Math.max(3, W * 0.006);
    ctx.strokeStyle = '#12041f';
    ctx.strokeRect(-w / 2, -h / 2, w, h);
    ctx.lineWidth = Math.max(1.5, W * 0.002);
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.strokeRect(-w / 2 + W * 0.006, -h / 2 + W * 0.006, w - W * 0.012, h - W * 0.012);
    ctx.fillStyle = grade.accent;
    const bw = Math.min(w * 0.28, 120);
    ctx.beginPath();
    ctx.moveTo(-w / 2, -h / 2);
    ctx.lineTo(-w / 2 + bw, -h / 2);
    ctx.lineTo(-w / 2, -h / 2 + bw * 0.42);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  });

  // Title band.
  const bandY = state.layout === 'bleed' ? H - band : H - band;
  const bandH = state.layout === 'bleed' ? Math.round(H * 0.24) : band;
  const ty = H - bandH;
  if (state.layout === 'bleed') {
    const fade = ctx.createLinearGradient(0, ty - H * 0.12, 0, H);
    fade.addColorStop(0, 'rgba(10,3,24,0)');
    fade.addColorStop(1, 'rgba(10,3,24,0.88)');
    ctx.fillStyle = fade;
    ctx.fillRect(0, ty - H * 0.12, W, bandH + H * 0.12);
  } else {
    ctx.fillStyle = '#12041f';
    ctx.fillRect(0, ty, W, bandH);
    ctx.fillStyle = grade.accent;
    ctx.fillRect(0, ty, W, Math.max(3, H * 0.006));
    drawHalftone(ctx, 0, ty, W, bandH);
  }

  // Badge ribbon, top-left, tilted.
  if (state.badge && state.badge.trim()) {
    const label = state.badge.trim().toUpperCase();
    ctx.save();
    ctx.translate(W * 0.02, H * 0.055);
    ctx.rotate(-0.06);
    ctx.font = `${Math.max(14, Math.round(W * 0.022))}px Anton, 'Arial Narrow', sans-serif`;
    const tw = ctx.measureText(label).width;
    const pad = W * 0.02, bh = Math.max(24, H * 0.042);
    ctx.fillStyle = grade.accent;
    ctx.fillRect(-pad, -bh / 2, tw + pad * 2, bh);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillRect(-pad, -bh / 2, tw + pad * 2, Math.max(2, bh * 0.1));
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 0, 1);
    ctx.restore();
  }

  // Heat meter: stars top-right.
  drawStars(ctx, W * 0.88, H * 0.055, Math.max(10, W * 0.016), state.stars);

  // Title: Anton caps with a sunset gradient fill and a dark outline.
  const title = (state.title || '').trim().toUpperCase();
  if (title) {
    const maxW = W * 0.92;
    const size = fitTitle(ctx, title, maxW, Math.round(bandH * 0.52));
    const grad = ctx.createLinearGradient(0, ty + bandH * 0.12, 0, ty + bandH * 0.92);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.55, '#ffd319');
    grad.addColorStop(1, '#ff5e3a');
    ctx.font = `${size}px Anton, 'Arial Narrow', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = Math.max(2, size * 0.09);
    ctx.strokeStyle = '#16042e';
    ctx.lineJoin = 'round';
    const tx = W / 2, tyy = ty + bandH * 0.46;
    ctx.strokeText(title, tx, tyy);
    ctx.fillStyle = grad;
    ctx.fillText(title, tx, tyy);
  }

  // Subtitle: Pacifico neon script with a glow.
  const sub = (state.subtitle || '').trim();
  if (sub) {
    const size = Math.max(13, Math.round(bandH * 0.20));
    ctx.font = `${size}px Pacifico, cursive`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = grade.accent;
    ctx.shadowBlur = size * 0.7;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(sub, W / 2, ty + bandH * 0.82);
    ctx.shadowBlur = 0;
  }

  // Grain + vignette finish.
  if (state.grain) {
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = grainPattern(ctx);
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  if (state.vignette) {
    const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(5,0,15,0.42)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
  }

  if (rectsOut) {
    rectsOut.length = 0;
    rects.forEach((r) => rectsOut.push(r));
  }
}
