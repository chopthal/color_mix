#!/usr/bin/env node
/**
 * SVG 원본 → 게임용 WebP 변환 (API 없이 워커가 그린 에셋용)
 *
 *   node svg2webp.mjs <게임폴더> [--only name1,name2] [--unready name]
 *
 * - 원본: tools/imagegen/svg/<게임>/<name>.svg
 * - 크기·출력 경로: tools/imagegen/manifests/<게임>.json 의 같은 name 항목(variants 포함)
 *   (매니페스트에 없으면 games/<게임>/assets/<name>.webp, SVG viewBox 크기)
 * - 표시 크기의 2배로 렌더 → 매니페스트 width/height 비율로 contain, 투명 배경
 * - 변환 후 games/<게임>/assets/ready.json 에 파일명 추가 → 게임이 다음 로드부터 사용
 * - --unready name : ready.json 에서만 빼기(코드 드로잉으로 되돌리기)
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..', '..');

const args = process.argv.slice(2);
const game = args[0];
if (!game || game.startsWith('--')) {
  console.error('usage: node svg2webp.mjs <game> [--only a,b] [--unready name]');
  process.exit(1);
}
const opt = (k) => {
  const i = args.indexOf(k);
  return i > -1 ? args[i + 1] : null;
};
const only = opt('--only') ? new Set(opt('--only').split(',')) : null;
const unready = opt('--unready');

function flatten(items) {
  const out = [];
  for (const it of items || []) {
    if (Array.isArray(it.variants) && it.variants.length) {
      for (const v of it.variants) {
        const name = v.name || `${it.name}-${v.suffix || 'variant'}`;
        out.push({
          name,
          outPath: v.outPath || it.outPath,
          width: v.width ?? it.width,
          height: v.height ?? it.height,
        });
      }
    } else {
      out.push({ name: it.name, outPath: it.outPath, width: it.width, height: it.height });
    }
  }
  return out;
}

async function readJson(p, fallback) {
  try {
    return JSON.parse(await fs.readFile(p, 'utf8'));
  } catch {
    return fallback;
  }
}

async function updateReady(assetDir, file, add) {
  const p = path.join(assetDir, 'ready.json');
  const data = await readJson(p, { ready: [] });
  const key = Array.isArray(data) ? null : data.ready ? 'ready' : data.files ? 'files' : 'ready';
  const list = Array.isArray(data) ? data : (data[key] = data[key] || []);
  const idx = list.indexOf(file);
  if (add && idx === -1) list.push(file);
  if (!add && idx > -1) list.splice(idx, 1);
  list.sort();
  await fs.writeFile(p, JSON.stringify(data, null, 2) + '\n');
}

const manifest = await readJson(path.join(HERE, 'manifests', `${game}.json`), { items: [] });
const items = flatten(Array.isArray(manifest) ? manifest : manifest.items);
const byName = new Map(items.map((i) => [i.name, i]));
const assetDirDefault = path.join(REPO, 'games', game, 'assets');

if (unready) {
  const it = byName.get(unready);
  const out = it?.outPath ? path.resolve(REPO, it.outPath) : path.join(assetDirDefault, `${unready}.webp`);
  await updateReady(path.dirname(out), path.basename(out), false);
  console.log(`unready: ${path.basename(out)}`);
  process.exit(0);
}

const svgDir = path.join(HERE, 'svg', game);
let files = [];
try {
  files = (await fs.readdir(svgDir)).filter((f) => f.endsWith('.svg'));
} catch {
  console.error(`no svg dir: ${path.relative(REPO, svgDir)}`);
  process.exit(1);
}

let ok = 0;
for (const f of files) {
  const name = f.replace(/\.svg$/, '');
  if (only && !only.has(name)) continue;
  const it = byName.get(name);
  const outAbs = it?.outPath ? path.resolve(REPO, it.outPath) : path.join(assetDirDefault, `${name}.webp`);
  const svg = await fs.readFile(path.join(svgDir, f));
  const meta = await sharp(svg).metadata();
  const w = it?.width || meta.width || 256;
  const h = it?.height || meta.height || 256;
  const W = w * 2;
  const H = h * 2;
  // 2배 밀도로 래스터화 후 contain
  const density = Math.max(72, Math.ceil((72 * Math.max(W / (meta.width || W), H / (meta.height || H)))));
  const buf = await sharp(svg, { density })
    .resize(W, H, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 88, alphaQuality: 100 })
    .toBuffer();
  await fs.mkdir(path.dirname(outAbs), { recursive: true });
  await fs.writeFile(outAbs, buf);
  await updateReady(path.dirname(outAbs), path.basename(outAbs), true);
  ok += 1;
  console.log(`✔ ${name} → ${path.relative(REPO, outAbs)} [${W}x${H}] ${(buf.length / 1024).toFixed(1)}KB${it ? '' : ' (manifest 없음)'}`);
}
console.log(`done: ${ok} file(s)`);
