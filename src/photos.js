// Photo handling.
//
// Every image here belongs to whoever took it — a customer or the owner —
// not to us and not to Google. They are pulled so an owner can see their own
// shop in the mock-up; they are NOT clearance to publish. Attribution rides
// along with each file and the todo list says plainly that they must be
// replaced before the site goes live.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { photoBytes } from './places.js';

const DETECTOR = new URL('../tools/detect-people', import.meta.url).pathname;

/**
 * Reject any image containing a person. Listing photos are full of customers
 * and staff who never agreed to appear on a commercial site, and a salon's
 * best shots are precisely the ones with someone in them.
 *
 * Faces alone are insufficient — the common case is a client photographed
 * from behind to show the haircut, which registers zero faces. Body detection
 * catches those, so either signal disqualifies the image.
 *
 * Returns the subset that is safe to use. Fails closed: if the detector is
 * missing or errors, no photo is used rather than risking a person on the page.
 */
export function rejectPeople(files) {
  if (!files.length) return { clean: [], rejected: [], ok: true };
  if (!fs.existsSync(DETECTOR)) {
    return { clean: [], rejected: files, ok: false,
      why: 'detector not built — run: swiftc -O tools/detect-people.swift -o tools/detect-people' };
  }
  let out;
  try {
    out = execFileSync(DETECTOR, files, { encoding: 'utf8', maxBuffer: 8 << 20 });
  } catch (e) {
    return { clean: [], rejected: files, ok: false, why: 'detector failed: ' + e.message };
  }
  const clean = [], rejected = [];
  for (const line of out.trim().split('\n')) {
    const [file, faces, bodies] = line.split('\t');
    const f = Number(faces), b = Number(bodies);
    // -1 means the image could not be decoded; treat as unusable.
    if (f === 0 && b === 0) clean.push(file);
    else rejected.push(file);
  }
  return { clean, rejected, ok: true };
}

/** Pick which photos are worth paying for: widest first, owner shots preferred. */
export function choosePhotos(place, limit = 3) {
  return (place.photos ?? [])
    .filter(p => p.name)
    .sort((a, b) => (b.widthPx ?? 0) - (a.widthPx ?? 0))
    .slice(0, limit)
    .map(p => ({
      name: p.name,
      w: p.widthPx ?? null,
      h: p.heightPx ?? null,
      author: p.authorAttributions?.[0]?.displayName ?? 'Google user',
      authorUri: p.authorAttributions?.[0]?.uri ?? '',
    }));
}

/**
 * Download chosen photos into <dir>/photos/. Returns the ones that landed,
 * with a path relative to the page. Failures are skipped, never fatal — a
 * missing image must not cost you the whole build.
 */
export async function fetchPhotos(chosen, dir, { maxWidthPx = 1200 } = {}) {
  if (!chosen.length) return [];
  const outDir = path.join(dir, 'photos');

  // If the folder already exists, treat it as reviewed: use exactly the files
  // that are in it and fetch nothing. Deleting an unsuitable photo has to
  // stick — otherwise the rebuild quietly downloads it again, and a shot the
  // user rejected ends up back on the page.
  if (fs.existsSync(outDir)) {
    const have = fs.readdirSync(outDir).filter(f => /\.jpe?g$/i.test(f)).sort();
    const byFile = new Map(chosen.map((c, i) => [`${i + 1}.jpg`, c]));
    return have.map(f => ({
      ...(byFile.get(f) ?? { author: 'Google user', authorUri: '' }),
      src: `photos/${f}`,
    }));
  }

  fs.mkdirSync(outDir, { recursive: true });

  const got = [];
  for (let i = 0; i < chosen.length; i++) {
    const c = chosen[i];
    const file = `${i + 1}.jpg`;
    const abs = path.join(outDir, file);
    try {
      if (!fs.existsSync(abs)) fs.writeFileSync(abs, await photoBytes(c.name, { maxWidthPx }));
      got.push({ ...c, src: `photos/${file}`, abs });
    } catch (e) {
      console.log(`     photo ${i + 1} skipped: ${e.message}`);
    }
  }

  // Screen before anything is written into the page.
  const verdict = rejectPeople(got.map(g => g.abs));
  if (!verdict.ok) console.log(`     photos dropped — ${verdict.why}`);
  for (const r of verdict.rejected) { try { fs.unlinkSync(r); } catch {} }
  if (verdict.rejected.length)
    console.log(`     ${verdict.rejected.length} photo(s) rejected: person detected`);
  const keep = new Set(verdict.clean);
  const safe = got.filter(g => keep.has(g.abs)).map(({ abs, ...rest }) => rest);
  if (!safe.length) { try { fs.rmSync(outDir, { recursive: true, force: true }); } catch {} return []; }
  if (safe.length) {
    fs.writeFileSync(path.join(outDir, 'ATTRIBUTION.txt'),
      'These images came from the business\'s Google listing and belong to the\n' +
      'people who took them. They are here so the owner can see the mock-up with\n' +
      'their own shop in it. Replace them with the owner\'s own photos before the\n' +
      'site goes live.\n\n' +
      'Images containing people were detected and discarded automatically\n' +
      '(Vision framework, faces and bodies). Deleting a file here also sticks —\n' +
      'nothing is re-downloaded on rebuild.\n\n' +
      safe.map(g => `${path.basename(g.src)} — ${g.author}${g.authorUri ? '\n     ' + g.authorUri : ''}`).join('\n'));
  }
  return safe;
}
