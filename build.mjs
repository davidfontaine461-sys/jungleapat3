#!/usr/bin/env node
/**
 * Build statique Jungle à Pat' — zéro dépendance.
 *
 *   src/data/infos.json   source unique des infos répétées
 *   src/partials/*.html   blocs partagés (head, header, footer, scripts…)
 *   src/pages/*.html      une page = un en-tête meta JSON + un corps
 *          ↓  node build.mjs
 *   index.html, ecoles-groupes/index.html, jardin-botanique-reunion/index.html
 *   sitemap.xml, llms.txt, et le bloc horaires de script.js
 *
 * Le résultat est commité : Vercel reste un déploiement statique sans build.
 *
 * Syntaxe des gabarits :
 *   {{> nomDuPartial }}   inclut src/partials/nomDuPartial.html (récursif)
 *   {{ chemin.vers.cle }} interpole depuis le contexte (données + meta de page)
 *   {{{ chemin }}}        idem, sans échappement HTML (pour les blocs générés)
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const SRC = join(ROOT, 'src');

const read = (p) => readFileSync(p, 'utf8');
const data = JSON.parse(read(join(SRC, 'data', 'infos.json')));

/* ── Utilitaires ─────────────────────────────────────────── */

const escapeHtml = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const lookup = (ctx, path) =>
  path.split('.').reduce((o, k) => (o === undefined || o === null ? undefined : o[k]), ctx);

/** Résout {{> partial }}, {{{ brut }}} et {{ échappé }}. */
function render(tpl, ctx, depth = 0) {
  if (depth > 10) throw new Error('Inclusion de partials trop profonde (boucle ?)');

  const withPartials = tpl.replace(/\{\{>\s*([\w-]+)\s*\}\}/g, (_, name) => {
    const file = join(SRC, 'partials', `${name}.html`);
    if (!existsSync(file)) throw new Error(`Partial introuvable : src/partials/${name}.html`);
    return render(read(file), ctx, depth + 1);
  });

  return withPartials
    .replace(/\{\{\{\s*([\w.]+)\s*\}\}\}/g, (m, path) => {
      const v = lookup(ctx, path);
      if (v === undefined) throw new Error(`Clé inconnue dans le gabarit : {{{ ${path} }}}`);
      return String(v);
    })
    .replace(/\{\{\s*([\w.]+)\s*\}\}/g, (m, path) => {
      const v = lookup(ctx, path);
      if (v === undefined) throw new Error(`Clé inconnue dans le gabarit : {{ ${path} }}`);
      return escapeHtml(v);
    });
}

/* ── Blocs dérivés de infos.json ─────────────────────────── */

const fmtHour = (h) => `${h}h`;
const openDays = data.hours.week.filter((d) => d.open !== null);

/** Liste <li> des horaires, telle qu'affichée dans la carte « Infos pratiques ». */
const hoursListHtml = data.hours.week
  .map((d) =>
    d.open === null
      ? `            <li class="closed"><span>${d.label}</span><em>Fermé</em></li>`
      : `            <li><span>${d.label}</span><em>${fmtHour(d.open)} — ${fmtHour(d.close)}</em></li>`
  )
  .join('\n');

/** Tableau openingHoursSpecification pour le JSON-LD, groupé par plage identique. */
const DOW_SCHEMA = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const bySlot = new Map();
for (const d of openDays) {
  const key = `${d.open}-${d.close}`;
  if (!bySlot.has(key)) bySlot.set(key, { open: d.open, close: d.close, days: [] });
  bySlot.get(key).days.push(DOW_SCHEMA[d.dow]);
}
const pad = (h) => String(h).padStart(2, '0') + ':00';
const openingHoursSpecJson = JSON.stringify(
  [...bySlot.values()].map((s) => ({
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: s.days,
    opens: pad(s.open),
    closes: pad(s.close),
  })),
  null,
  2
).split('\n').map((l, i) => (i === 0 ? l : '        ' + l)).join('\n');

/** Offers pour le JSON-LD. */
const offersJson = JSON.stringify(
  [
    { '@type': 'Offer', name: 'Entrée adulte', price: data.prices.adult.amount, priceCurrency: 'EUR' },
    { '@type': 'Offer', name: 'Entrée enfant (3–12 ans)', price: data.prices.child.amount, priceCurrency: 'EUR' },
    { '@type': 'Offer', name: 'Entrée enfant (moins de 3 ans)', price: data.prices.toddler.amount, priceCurrency: 'EUR' },
  ],
  null,
  2
).split('\n').map((l, i) => (i === 0 ? l : '        ' + l)).join('\n');

/** Grille des plantes mises en avant, depuis src/data/plantes.json. */
const plantes = JSON.parse(read(join(SRC, 'data', 'plantes.json')));
const plantesGridHtml = plantes
  .map(
    (p) => `        <figure class="plante-card">
          <picture>
            <source srcset="/${p.image}.webp" type="image/webp" />
            <img src="/${p.image}.jpeg" alt="${escapeHtml(p.alt)}" width="600" height="800" loading="lazy"/>
          </picture>
          <figcaption>
            <strong>${escapeHtml(p.name)}</strong>
            <em>${escapeHtml(p.latin)}</em>${p.location ? `\n            <span class="plante-loc">${escapeHtml(p.location)}</span>` : ''}${p.note ? `\n            <span>${escapeHtml(p.note)}</span>` : ''}
          </figcaption>
        </figure>`
  )
  .join('\n');

const addr = data.address;
const MIN_PLANTES = 5;
const plantesTodoHtml =
  plantes.length >= MIN_PLANTES
    ? ''
    : `      <div class="todo-box">
        <strong>À compléter — ${plantes.length} plante(s) sur ${MIN_PLANTES} à 8</strong>
        <p>La grille se remplit depuis <code>src/data/plantes.json</code>. Il manque encore
        les photos légendées des autres plantes à mettre en avant.</p>
      </div>`;

const derived = {
  plantesGridHtml,
  plantesTodoHtml,
  plantesCount: plantes.length,
  hoursListHtml,
  openingHoursSpecJson,
  offersJson,
  addressInline: `${addr.street}, ${addr.postalCode} ${addr.locality}`,
  addressHtml: `${addr.street}<br/>\n            ${addr.postalCode} ${addr.locality}<br/>\n            ${addr.region}`,
  phoneHref: `tel:${data.contact.phoneE164}`,
  mailHref: `mailto:${data.contact.email}`,
  year: String(new Date().getFullYear()),
};

/* ── Pages ───────────────────────────────────────────────── */

const META_RE = /^<!--meta\s*([\s\S]*?)-->\s*/;

/** HTML → texte brut, pour recopier une réponse de FAQ dans le JSON-LD. */
const toPlainText = (html) =>
  html
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

const FAQ_RE =
  /<details class="faq-item">\s*<summary>([\s\S]*?)<\/summary>\s*<div class="faq-answer">([\s\S]*?)<\/div>\s*<\/details>/g;

/** FAQPage (issu du rendu) + BreadcrumbList, pour une page donnée. */
function pageSchema(html, meta) {
  const graph = [];

  const faqs = [...html.matchAll(FAQ_RE)].map(([, q, a]) => ({
    '@type': 'Question',
    name: toPlainText(q),
    acceptedAnswer: { '@type': 'Answer', text: toPlainText(a) },
  }));
  if (faqs.length) graph.push({ '@type': 'FAQPage', mainEntity: faqs });

  if (meta.path !== '/') {
    graph.push({
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: `${data.site.baseUrl}/` },
        { '@type': 'ListItem', position: 2, name: meta.breadcrumb || meta.title, item: data.site.baseUrl + meta.path },
      ],
    });
  }

  if (!graph.length) return '';
  return (
    '  <script type="application/ld+json">\n  ' +
    JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }, null, 2).split('\n').join('\n  ') +
    '\n  </script>'
  );
}

function buildPage(file) {
  const raw = read(join(SRC, 'pages', file));
  const m = raw.match(META_RE);
  if (!m) throw new Error(`${file} : bloc <!--meta { … } --> manquant en tête de fichier`);

  let meta;
  try {
    meta = JSON.parse(m[1]);
  } catch (e) {
    throw new Error(`${file} : bloc meta JSON invalide — ${e.message}`);
  }
  for (const k of ['out', 'title', 'description', 'path']) {
    if (!meta[k]) throw new Error(`${file} : champ meta « ${k} » manquant`);
  }

  const body = raw.slice(m[0].length);
  const faqCount = (body.match(/<details class="faq-item">/g) || []).length;
  const ctx = { ...data, ...derived, faqCount, page: { ...meta, url: data.site.baseUrl + meta.path } };
  let html = render(body, ctx);

  // Schémas propres à la page, dérivés du HTML effectivement rendu : le FAQPage ne
  // peut donc jamais annoncer autre chose que ce que le visiteur lit à l'écran.
  html = html.replace('<!--PAGE_SCHEMA-->', () => pageSchema(html, meta));

  const outPath = join(ROOT, meta.out);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, html, 'utf8');
  return { ...meta, bytes: Buffer.byteLength(html) };
}

const pages = readdirSync(join(SRC, 'pages'))
  .filter((f) => f.endsWith('.html') && !f.startsWith('_'))
  .sort()
  .map(buildPage);

/* ── sitemap.xml ─────────────────────────────────────────── */

const today = new Date().toISOString().slice(0, 10);
const sitemap =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  pages
    .map(
      (p) =>
        `  <url>\n    <loc>${data.site.baseUrl}${p.path}</loc>\n` +
        `    <lastmod>${today}</lastmod>\n` +
        `    <changefreq>${p.changefreq || 'monthly'}</changefreq>\n` +
        `    <priority>${p.priority || '0.8'}</priority>\n  </url>`
    )
    .join('\n') +
  `\n</urlset>\n`;
writeFileSync(join(ROOT, 'sitemap.xml'), sitemap, 'utf8');

/* ── Horaires injectés dans script.js (entre marqueurs) ──── */

const SCRIPT = join(ROOT, 'script.js');
const START = '  /* BUILD:DATA:START — généré par build.mjs, ne pas éditer à la main */';
const END = '  /* BUILD:DATA:END */';

const generatedJs = [
  START,
  `  const PUBLIC_HOLIDAYS_REUNION = new Set(${JSON.stringify(data.closures.publicHolidays)});`,
  `  const OPENING_HOURS = ${JSON.stringify(
    Object.fromEntries(
      data.hours.week
        .slice()
        .sort((a, b) => a.dow - b.dow)
        .map((d) => [d.dow, d.open === null ? null : { open: d.open, close: d.close }])
    )
  )};`,
  `  const EXCEPTIONAL_CLOSURES = new Set(${JSON.stringify(data.closures.exceptional)});`,
  END,
].join('\n');

let js = read(SCRIPT);
const si = js.indexOf(START.trim().slice(0, 22));
if (si === -1) {
  console.warn('  ! script.js : marqueurs BUILD:DATA absents — horaires JS non régénérés.');
} else {
  const a = js.indexOf(START);
  const b = js.indexOf(END);
  if (a === -1 || b === -1) throw new Error('script.js : marqueurs BUILD:DATA incomplets');
  js = js.slice(0, a) + generatedJs + js.slice(b + END.length);
  writeFileSync(SCRIPT, js, 'utf8');
}

/* ── llms.txt (UTF-8 propre, depuis la source unique) ────── */

const llms = read(join(SRC, 'partials', 'llms.txt.tpl'));
writeFileSync(join(ROOT, 'llms.txt'), render(llms, { ...data, ...derived, pages }), 'utf8');

/* ── Rapport ─────────────────────────────────────────────── */

console.log('Build OK');
for (const p of pages) {
  console.log(`  ${p.path.padEnd(30)} → ${p.out.padEnd(38)} ${(p.bytes / 1024).toFixed(1)} Ko`);
}
console.log(`  sitemap.xml : ${pages.length} URL · llms.txt · script.js (horaires)`);
