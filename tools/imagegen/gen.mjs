#!/usr/bin/env node
/**
 * Gemini batch image generator for color_mix assets.
 * Reads manifest → generate → chroma-key → resize → WebP.
 * Never writes API keys to disk.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../..');
const DEFAULT_MODEL = 'gemini-2.5-flash-image';
const DEFAULT_CHROMA = '#00FF00';

function printHelp() {
  console.log(`Usage: node gen.mjs [options]

Options:
  --manifest <path>   Manifest JSON (default: ./manifest.json)
  --only <name>       Generate only this item name (repeatable / comma-separated)
  --force             Regenerate even if outPath exists
  --dry-run           Plan only; no API calls, no writes
  --help              Show help
`);
}

function parseArgs(argv) {
  const opts = {
    manifest: path.join(__dirname, 'manifest.json'),
    only: new Set(),
    force: false,
    dryRun: false,
    help: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') opts.help = true;
    else if (a === '--force') opts.force = true;
    else if (a === '--dry-run') opts.dryRun = true;
    else if (a === '--manifest') {
      const v = argv[++i];
      if (!v) throw new Error('--manifest requires a path');
      opts.manifest = path.resolve(process.cwd(), v);
    } else if (a === '--only') {
      const v = argv[++i];
      if (!v) throw new Error('--only requires a name');
      v.split(',').forEach((n) => {
        const t = n.trim();
        if (t) opts.only.add(t);
      });
    } else if (a.startsWith('--only=')) {
      a.slice('--only='.length)
        .split(',')
        .forEach((n) => {
          const t = n.trim();
          if (t) opts.only.add(t);
        });
    } else {
      throw new Error(`Unknown argument: ${a}`);
    }
  }
  return opts;
}

function parseHexColor(hex) {
  const raw = String(hex || DEFAULT_CHROMA).trim();
  const m = /^#?([0-9a-fA-F]{6})$/.exec(raw);
  if (!m) throw new Error(`Invalid chroma color: ${hex}`);
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, hex: `#${m[1].toUpperCase()}` };
}

function mimeFromPath(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.gif') return 'image/gif';
  return 'application/octet-stream';
}

function expandItems(manifest) {
  const list = Array.isArray(manifest) ? manifest : manifest.items;
  if (!Array.isArray(list)) {
    throw new Error('Manifest must be an array or { items: [] }');
  }
  const out = [];
  for (const item of list) {
    if (!item || !item.name) throw new Error('Each item needs a name');
    if (Array.isArray(item.variants) && item.variants.length) {
      for (const variant of item.variants) {
        const name = variant.name || `${item.name}-${variant.suffix || 'variant'}`;
        out.push({
          name,
          outPath: variant.outPath || item.outPath,
          prompt: [item.prompt, variant.prompt].filter(Boolean).join('\n'),
          width: variant.width ?? item.width ?? 256,
          height: variant.height ?? item.height ?? 256,
          refs: variant.refs || item.refs || [],
        });
      }
    } else {
      out.push({
        name: item.name,
        outPath: item.outPath,
        prompt: item.prompt || '',
        width: item.width ?? 256,
        height: item.height ?? 256,
        refs: item.refs || [],
      });
    }
  }
  for (const item of out) {
    if (!item.outPath) throw new Error(`Item ${item.name} missing outPath`);
  }
  return out;
}

async function loadStylePrefix() {
  const p = path.join(__dirname, 'style-prefix.txt');
  try {
    return (await fs.readFile(p, 'utf8')).trim();
  } catch {
    return '';
  }
}

async function resolveRefPath(ref) {
  const candidates = [
    path.resolve(__dirname, ref),
    path.resolve(REPO_ROOT, ref),
    path.resolve(process.cwd(), ref),
  ];
  for (const c of candidates) {
    try {
      await fs.access(c);
      return c;
    } catch {
      /* try next */
    }
  }
  throw new Error(`Reference image not found: ${ref}`);
}

async function chromaKeyToWebp(sharp, inputBuffer, width, height, chroma) {
  const { data, info } = await sharp(inputBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const threshold = Number(process.env.CHROMA_THRESHOLD || 72);
  const soft = Number(process.env.CHROMA_SOFTNESS || 28);
  const px = info.channels;
  for (let i = 0; i < data.length; i += px) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const dist = Math.sqrt(
      (r - chroma.r) ** 2 + (g - chroma.g) ** 2 + (b - chroma.b) ** 2
    );
    let alpha = 255;
    if (dist <= threshold) alpha = 0;
    else if (dist < threshold + soft) {
      alpha = Math.round(((dist - threshold) / soft) * 255);
    }
    data[i + 3] = Math.min(data[i + 3], alpha);
  }

  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .resize(width, height, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .webp({ quality: 80, alphaQuality: 90 })
    .toBuffer();
}

function extractInlineImage(response) {
  const parts = response?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return null;
  for (const part of parts) {
    if (part?.inlineData?.data) {
      return {
        data: Buffer.from(part.inlineData.data, 'base64'),
        mimeType: part.inlineData.mimeType || 'image/png',
      };
    }
  }
  return null;
}

async function loadSdk() {
  const require = createRequire(import.meta.url);
  try {
    require.resolve('@google/genai');
    require.resolve('sharp');
  } catch {
    throw new Error(
      'Missing dependencies. Run `npm install` inside tools/imagegen first.'
    );
  }
  const { GoogleGenAI } = await import('@google/genai');
  const sharp = (await import('sharp')).default;
  return { GoogleGenAI, sharp };
}

async function generateOne(ai, sharp, item, ctx) {
  const absOut = path.resolve(REPO_ROOT, item.outPath);
  const style = ctx.stylePrefix;
  const chromaLine = `Use a flat solid chroma-key background of exactly ${ctx.chroma.hex}. No other background elements.`;
  const fullPrompt = [style, chromaLine, item.prompt].filter(Boolean).join('\n\n');

  const parts = [{ text: fullPrompt }];
  for (const ref of item.refs) {
    const refPath = await resolveRefPath(ref);
    const bytes = await fs.readFile(refPath);
    parts.push({
      inlineData: {
        mimeType: mimeFromPath(refPath),
        data: bytes.toString('base64'),
      },
    });
    parts.push({
      text: `Match the art style, line weight, and palette of the reference image (${path.basename(refPath)}).`,
    });
  }

  const response = await ai.models.generateContent({
    model: ctx.model,
    contents: parts,
  });

  const image = extractInlineImage(response);
  if (!image) {
    throw new Error(`No image data returned for ${item.name}`);
  }

  const webp = await chromaKeyToWebp(
    sharp,
    image.data,
    item.width,
    item.height,
    ctx.chroma
  );
  await fs.mkdir(path.dirname(absOut), { recursive: true });
  await fs.writeFile(absOut, webp);
  return absOut;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    printHelp();
    return;
  }

  const chroma = parseHexColor(process.env.CHROMA_KEY || DEFAULT_CHROMA);
  const model = process.env.GEMINI_IMAGE_MODEL || DEFAULT_MODEL;
  const stylePrefix = await loadStylePrefix();
  const raw = JSON.parse(await fs.readFile(opts.manifest, 'utf8'));
  let items = expandItems(raw);

  if (opts.only.size) {
    items = items.filter((it) => opts.only.has(it.name));
    if (!items.length) {
      console.error('No items matched --only filter.');
      process.exitCode = 1;
      return;
    }
  }

  console.log(`Manifest: ${opts.manifest}`);
  console.log(`Model: ${model}`);
  console.log(`Chroma: ${chroma.hex}`);
  console.log(`Items: ${items.length}${opts.dryRun ? ' (dry-run)' : ''}`);
  console.log('');

  const plan = [];
  for (const item of items) {
    const absOut = path.resolve(REPO_ROOT, item.outPath);
    let exists = false;
    try {
      await fs.access(absOut);
      exists = true;
    } catch {
      exists = false;
    }
    const action = exists && !opts.force ? 'skip' : opts.dryRun ? 'plan' : 'generate';
    plan.push({ item, absOut, exists, action });
    console.log(
      `- ${item.name} → ${item.outPath} [${item.width}x${item.height}] refs=${item.refs.length} => ${action}`
    );
  }

  if (opts.dryRun) {
    console.log('\nDry-run complete. No API calls.');
    return;
  }

  const toRun = plan.filter((p) => p.action === 'generate');
  if (!toRun.length) {
    console.log('\nNothing to generate.');
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY is required for generation (not for --dry-run).');
    process.exitCode = 1;
    return;
  }

  const { GoogleGenAI, sharp } = await loadSdk();
  const ai = new GoogleGenAI({ apiKey });
  const ctx = { model, stylePrefix, chroma };

  let ok = 0;
  let fail = 0;
  for (const row of toRun) {
    process.stdout.write(`Generating ${row.item.name}... `);
    try {
      const out = await generateOne(ai, sharp, row.item, ctx);
      console.log(`ok (${path.relative(REPO_ROOT, out)})`);
      ok += 1;
    } catch (err) {
      console.log('FAIL');
      console.error(err?.message || err);
      fail += 1;
    }
  }

  console.log(`\nDone. ok=${ok} fail=${fail} skipped=${plan.length - toRun.length}`);
  if (fail) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err?.message || err);
  process.exitCode = 1;
});
