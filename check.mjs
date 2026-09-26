#!/usr/bin/env node
/**
 * Contrôles avant mise en ligne — `npm run check`.
 * Vérifie le HTML *généré* (pas les sources) : c'est lui qui est déployé.
 */

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(readFileSync(join(ROOT, 'src/data/infos.json'), 'utf8'));
const BASE = data.site.baseUrl;

const PAGES = readdirSync(join(ROOT, 'src/pages'))
  .filter((f) => f.endsWith('.html') && !f.startsWith('_'))
  .map((f) => {
    const meta = JSON.parse(readFileSync(join(ROOT, 'src/pages', f), 'utf8').match(/^<!--meta\s*([\s\S]*?)-->/)[1]);
    return { ...meta, file: join(ROOT, meta.out) };
  });

let fail = 0, warn = 0;
const err = (m) => { console.log(`  ✗ ${m}`); fail++; };
const wrn = (m) => { console.log(`  ! ${m}`); warn++; };
const ok = (m) => console.log(`  ✓ ${m}`);

const titles = new Map(), descs = new Map();

for (const p of PAGES) {
  console.log(`\n── ${p.path}`);

  if (!existsSync(p.file)) { err(`fichier absent : ${p.out} — lancer npm run build`); continue; }
  const html = readFileSync(p.file, 'utf8');

  // Gabarits non résolus
  if (/\{\{/.test(html)) err('placeholder {{ }} non résolu dans le HTML généré');
  else ok('aucun placeholder résiduel');

  // H1 unique
  const h1 = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)];
  if (h1.length !== 1) err(`${h1.length} balise(s) H1 — il en faut exactement une`);
  else ok(`H1 unique : « ${h1[0][1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 70)} »`);

  // Title / description uniques entre les pages
  const title = (html.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '';
  const desc = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '';
  if (!title) err('title absent');
  else if (titles.has(title)) err(`title identique à ${titles.get(title)}`);
  else { titles.set(title, p.path); ok(`title (${title.length} car.)`); }
  if (title.length > 65) wrn(`title long (${title.length} car.) — risque de troncature en SERP`);
  if (!desc) err('meta description absente');
  else if (descs.has(desc)) err(`description identique à ${descs.get(desc)}`);
  else { descs.set(desc, p.path); ok(`description (${desc.length} car.)`); }
  if (desc.length > 160) wrn(`description longue (${desc.length} car.)`);

  // Canonical
  const canon = (html.match(/<link rel="canonical" href="([^"]*)"/) || [])[1];
  if (canon !== BASE + p.path) err(`canonical = ${canon} (attendu ${BASE + p.path})`);
  else ok('canonical correct');

  // Pas de noindex
  if (/noindex/i.test(html)) err('directive noindex présente');

  // Hiérarchie des titres : pas de saut de niveau
  const levels = [...html.matchAll(/<h([1-6])\b/g)].map((m) => +m[1]);
  let bad = null, prev = levels[0];
  for (const l of levels.slice(1)) { if (l > prev + 1) { bad = `H${prev} → H${l}`; break; } prev = l; }
  if (bad) wrn(`saut de niveau de titre (${bad})`);
  else ok(`hiérarchie des titres cohérente (${levels.length} titres)`);

  // Contenu principal dans le HTML initial (hors scripts/styles)
  const visible = html
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (visible.length < 1500) err(`texte initial trop court (${visible.length} car.) — contenu injecté en JS ?`);
  else ok(`texte présent dans le HTML initial (${visible.length} car.)`);

  // JSON-LD valide
  const lds = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  let types = [];
  for (const [, raw] of lds) {
    try {
      const j = JSON.parse(raw);
      for (const n of j['@graph'] || [j]) types.push(Array.isArray(n['@type']) ? n['@type'].join('+') : n['@type']);
    } catch (e) { err(`JSON-LD invalide : ${e.message}`); }
  }
  if (types.length) ok(`JSON-LD : ${types.join(', ')}`);
  if (/aggregateRating/.test(html)) err('aggregateRating auto-déclaré — interdit par Google pour LocalBusiness');

  // Images : fichiers présents + alt non vide
  for (const [, src] of html.matchAll(/<img[^>]+src="([^"]+)"/g)) {
    if (src.startsWith('http')) continue;
    if (!existsSync(join(ROOT, src.replace(/^\//, '')))) err(`image absente : ${src}`);
  }
  const noAlt = [...html.matchAll(/<img(?![^>]*\balt=)[^>]*>/g)].length;
  if (noAlt) err(`${noAlt} image(s) sans attribut alt`);

  // Liens internes
  for (const [, href] of html.matchAll(/href="(\/[^"#?]*)"/g)) {
    const target = href.endsWith('/') ? join(ROOT, href, 'index.html') : join(ROOT, href);
    if (!existsSync(target)) err(`lien interne cassé : ${href}`);
  }

  // Équilibre des balises (attrape un partial qui refermerait <body> ou <div> en trop)
  const VOID = new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
  const stripped = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '').replace(/<!--[\s\S]*?-->/g, '');
  const stack = [];
  let imbalance = null;
  for (const [, close, tag, selfClose] of stripped.matchAll(/<(\/?)([a-zA-Z][\w-]*)\b[^>]*?(\/?)>/g)) {
    const t = tag.toLowerCase();
    if (VOID.has(t)) continue;
    if (close) {
      if (!stack.length) { imbalance = `</${t}> sans ouverture`; break; }
      if (stack[stack.length - 1] !== t) { imbalance = `</${t}> ferme <${stack[stack.length - 1]}>`; break; }
      stack.pop();
    } else if (!selfClose) stack.push(t);
  }
  if (imbalance) err(`balises déséquilibrées : ${imbalance}`);
  else if (stack.length) err(`balise(s) jamais fermée(s) : <${stack.join('>, <')}>`);
  else ok('balises HTML équilibrées');

  // TODO restants
  const todos = (html.match(/class="todo-box"/g) || []).length;
  if (todos) wrn(`${todos} encadré(s) TODO visible(s) — à résoudre AVANT publication`);
}

// Sitemap ↔ pages
console.log('\n── sitemap.xml');
const sm = readFileSync(join(ROOT, 'sitemap.xml'), 'utf8');
const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const expected = PAGES.map((p) => BASE + p.path);
if (locs.length !== expected.length || !expected.every((u) => locs.includes(u)))
  err(`URL du sitemap ≠ pages construites\n     sitemap : ${locs.join(', ')}`);
else ok(`${locs.length} URL, toutes canoniques`);

console.log('\n── robots.txt');
const robots = readFileSync(join(ROOT, 'robots.txt'), 'utf8');
if (/Disallow: \/\s*$/m.test(robots)) err('robots.txt bloque tout le site');
else ok('aucun Disallow global');
if (!robots.includes('sitemap.xml')) err('robots.txt ne référence pas le sitemap');
else ok('sitemap référencé');

console.log(`\n${fail ? '✗' : '✓'} ${fail} erreur(s), ${warn} avertissement(s)\n`);
process.exit(fail ? 1 : 0);
