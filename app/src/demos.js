// Vice Cover Studio — procedural demo photos.
// Two cover-ready scenes painted with canvas shapes alone, so the app works
// with zero uploads: a neon night street and a sunset palm beach. Each
// returns a canvas the cover engine can draw like any photo.

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

function palm(ctx, x, y, s, lean) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(lean);
  ctx.scale(s, s);
  ctx.strokeStyle = '#0d0218';
  ctx.lineWidth = 14;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(14, -90, 34, -160);
  ctx.stroke();
  // Fronds: long arcs fanning across the upper half of the crown, drooping
  // at the tips the way real palm fronds do.
  ctx.lineWidth = 11;
  for (let i = 0; i < 7; i++) {
    const a = (-Math.PI * 0.97) + (i * Math.PI * 0.94) / 6;
    const ex = 34 + Math.cos(a) * 118;
    const ey = -160 + Math.sin(a) * 62 + 92;
    ctx.beginPath();
    ctx.moveTo(34, -160);
    ctx.quadraticCurveTo(34 + Math.cos(a) * 62, -160 + Math.sin(a) * 26 + 56, ex, ey);
    ctx.stroke();
  }
  ctx.restore();
}

export function neonStreetScene() {
  const c = makeCanvas(900, 700);
  const ctx = c.getContext('2d');
  // Night sky + street.
  const sky = ctx.createLinearGradient(0, 0, 0, 700);
  sky.addColorStop(0, '#070218');
  sky.addColorStop(0.6, '#1c0533');
  sky.addColorStop(1, '#3d0a4e');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 900, 700);
  // Building blocks with lit windows.
  const blocks = [
    [0, 120, 210, 470, '#12082a'], [220, 60, 190, 530, '#0e0622'],
    [420, 150, 200, 440, '#150a30'], [630, 80, 270, 510, '#0d0520'],
  ];
  blocks.forEach(([x, y, w, h, col]) => {
    ctx.fillStyle = col;
    ctx.fillRect(x, y, w, h);
    for (let wy = y + 24; wy < y + h - 20; wy += 44) {
      for (let wx = x + 16; wx < x + w - 20; wx += 40) {
        ctx.fillStyle = (wx * 7 + wy * 13) % 5 === 0 ? '#ffd319' : 'rgba(0,229,255,0.5)';
        ctx.globalAlpha = 0.55 + (((wx + wy) % 3) * 0.18);
        ctx.fillRect(wx, wy, 20, 26);
      }
    }
    ctx.globalAlpha = 1;
  });
  // Neon signs.
  const signs = [
    { x: 40, y: 200, w: 150, h: 54, col: '#ff2e88', text: 'NEON' },
    { x: 660, y: 170, w: 190, h: 54, col: '#00e5ff', text: 'PALMS' },
    { x: 450, y: 300, w: 140, h: 44, col: '#ffd319', text: 'OPEN' },
  ];
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  signs.forEach((s) => {
    ctx.save();
    ctx.shadowColor = s.col;
    ctx.shadowBlur = 34;
    ctx.fillStyle = s.col;
    ctx.fillRect(s.x, s.y, s.w, s.h);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#12041f';
    ctx.font = 'bold 30px Arial, sans-serif';
    ctx.fillText(s.text, s.x + s.w / 2, s.y + s.h / 2 + 1);
    ctx.restore();
  });
  // Wet pavement with neon reflections.
  const wet = ctx.createLinearGradient(0, 560, 0, 700);
  wet.addColorStop(0, '#1a0b2e');
  wet.addColorStop(1, '#05020f');
  ctx.fillStyle = wet;
  ctx.fillRect(0, 560, 900, 140);
  ['#ff2e88', '#00e5ff', '#ffd319'].forEach((col, i) => {
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = col;
    ctx.fillRect(90 + i * 260, 575, 130, 110);
    ctx.restore();
  });
  // A lone figure silhouette.
  ctx.fillStyle = '#05020f';
  ctx.beginPath();
  ctx.arc(450, 480, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(428, 505, 44, 90);
  ctx.fillRect(428, 590, 16, 70);
  ctx.fillRect(456, 590, 16, 70);
  return c;
}

export function sunsetPalmsScene() {
  const c = makeCanvas(900, 700);
  const ctx = c.getContext('2d');
  // Sunset sky.
  const sky = ctx.createLinearGradient(0, 0, 0, 520);
  sky.addColorStop(0, '#2a0a4e');
  sky.addColorStop(0.4, '#ff5e3a');
  sky.addColorStop(0.7, '#ff9a3d');
  sky.addColorStop(1, '#ffd319');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 900, 520);
  // Sun.
  ctx.fillStyle = '#fff3c4';
  ctx.beginPath();
  ctx.arc(450, 400, 110, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,243,196,0.35)';
  ctx.beginPath();
  ctx.arc(450, 400, 150, 0, Math.PI * 2);
  ctx.fill();
  // Sea.
  const sea = ctx.createLinearGradient(0, 520, 0, 700);
  sea.addColorStop(0, '#ff7a4d');
  sea.addColorStop(1, '#7a1e5e');
  ctx.fillStyle = sea;
  ctx.fillRect(0, 520, 900, 180);
  ctx.strokeStyle = 'rgba(255,243,196,0.6)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 5; i++) {
    const y = 545 + i * 28;
    ctx.beginPath();
    ctx.moveTo(360 + (i % 2) * 40, y);
    ctx.lineTo(540 - (i % 2) * 40, y);
    ctx.stroke();
  }
  // Palms left and right, crowns well inside the frame, flanking the sun.
  palm(ctx, 180, 660, 1.25, -0.18);
  palm(ctx, 720, 660, 1.35, 0.22);
  return c;
}

export const PROCEDURAL = {
  'neon-street': neonStreetScene,
  'sunset-palms': sunsetPalmsScene,
};
