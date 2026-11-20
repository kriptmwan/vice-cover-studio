// Fixed scenes for screenshots: ?shot=cover shows the cover alone, ?shot=editor
// shows the editor with a finished cover. Query params pick the layout, grade,
// photo and caption. window.__shotReady is set once the scene has painted.
import { LAYOUTS, GRADES } from './cover.js';

export async function runShot(shot, query, state, photos, redraw) {
  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    // The cover fills the shot viewport at its own aspect.
    const cv = document.getElementById('cover');
    cv.width = window.innerWidth;
    cv.height = window.innerHeight;
  }
  const layout = query.get('layout');
  if (layout && LAYOUTS[layout]) state.layout = layout;
  const grade = query.get('grade');
  if (grade && GRADES[grade]) state.grade = grade;
  const caption = query.get('caption');
  if (caption) state.title = caption;
  const sub = query.get('sub');
  if (sub) state.subtitle = sub;
  const photo = query.get('photo');
  if (photo && photos[photo]) {
    // The requested photo leads; the other panels cycle the rest, so a
    // multi-panel shot never repeats one frame twice in a row.
    const ids = [photo, ...Object.keys(photos).filter((id) => id !== photo)];
    state.panels.forEach((p, i) => { p.photo = ids[i % ids.length]; });
  }
  const starsParam = query.get('stars');
  if (starsParam !== null) {
    const stars = Number(starsParam);
    if (stars >= 0 && stars <= 5) state.stars = stars;
  }
  await document.fonts.ready;
  redraw();
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
