import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {createRequire} from 'node:module';
import {chromium} from 'playwright';
import {PDFDocument, PDFName, PDFHexString} from 'pdf-lib';

const root = path.resolve(import.meta.dirname, '..');
const require = createRequire(import.meta.url);
const jiti = require('jiti')(import.meta.url);
const config = jiti(path.join(root, 'docusaurus.config.js')).default;
const sidebars = jiti(path.join(root, 'sidebars.js')).default;
const base = '/' + config.baseUrl.replace(/^\/+|\/+$/g, '') + (config.baseUrl === '/' ? '' : '/');
const locales = config.i18n.locales;
const requested = process.argv.find(x => x.startsWith('--locale='))?.split('=')[1];
if (requested && !locales.includes(requested)) throw new Error(`Unsupported locale: ${requested}`);
const selected = requested ? [requested] : locales;
const build = path.join(root, 'build');
if (!process.argv.includes('--from-build')) {
  const {spawnSync} = await import('node:child_process');
  const result = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'docusaurus', '--', 'build'], {cwd: root, stdio: 'inherit'});
  if (result.status !== 0) process.exit(result.status || 1);
}
const docsBase = path.join(root, 'docs');
const sourceFor = (id, locale) => {
  const dir = locale === config.i18n.defaultLocale ? docsBase : path.join(root, 'i18n', locale, 'docusaurus-plugin-content-docs', 'current');
  return ['.mdx', '.md'].map(ext => path.join(dir, id + ext)).find(fs.existsSync);
};
function flatten(items, depth = 1, out = []) {
  for (const item of items) {
    if (typeof item === 'string') out.push({type: 'doc', id: item, depth});
    else if (item.type === 'doc') out.push({type: 'doc', id: item.id, label: item.label, depth});
    else if (item.type === 'category') {
      out.push({type: 'category', label: item.label, depth});
      flatten(item.items || [], depth + 1, out);
    }
  }
  return out;
}
const entries = [{type: 'category', label: 'Tier0 Enterprise', depth: 1}, ...flatten(sidebars.tutorialSidebar, 2), ...Object.entries(sidebars).filter(([name]) => name !== 'tutorialSidebar').flatMap(([name, items]) => [{type: 'category', label: name === 'usecase' ? 'Use Case' : name, depth: 2}, ...flatten(items, 3)])];
const uniqueDocs = [...new Set(entries.filter(x => x.type === 'doc').map(x => x.id))];
const missing = Object.fromEntries(selected.map(locale => [locale, uniqueDocs.filter(id => !sourceFor(id, locale))]));
for (const locale of selected) {
  if (missing[locale].length) console.warn(`${locale} missing translations/chapters (${missing[locale].length}):\n${missing[locale].join('\n')}`);
}
const mime = {'.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.webp':'image/webp', '.woff2':'font/woff2', '.json':'application/json', '.pdf':'application/pdf'};
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
  if (pathname === '/__pdf_blank') {res.setHeader('Content-Type', 'text/html'); res.end('<!doctype html><title>Print</title>'); return;}
  const target = path.resolve(build, '.' + pathname);
  if (!(target === build || target.startsWith(build + path.sep))) {res.writeHead(403).end(); return;}
  const file = fs.existsSync(target) && fs.statSync(target).isDirectory() ? path.join(target, 'index.html') : target;
  if (!fs.existsSync(file)) {res.writeHead(404).end(pathname); return;}
  res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
try {
  for (const locale of selected) {
    const manualTitle = locale === 'zh' ? 'Tier0 企业版用户手册' : 'Tier0 Enterprise User Manual';
    const coverTitle = locale === 'zh' ? '<span>Tier0 企业版</span><span>用户手册</span>' : '<span>Tier0 Enterprise</span><span>User\'s Manual</span>';
    const localePrefix = locale === config.i18n.defaultLocale ? base : `${base}${config.i18n.localeConfigs?.[locale]?.path || locale}/`;
    const translationsFile = path.join(root, 'i18n', locale, 'docusaurus-plugin-content-docs', 'current.json');
    const translations = fs.existsSync(translationsFile) ? JSON.parse(fs.readFileSync(translationsFile, 'utf8')) : {};
    const metaFiles = fs.readdirSync(path.join(root, '.docusaurus/docusaurus-plugin-content-docs/default')).filter(x => x.endsWith('.json'));
    const docs = new Map();
    for (const file of metaFiles) {
      const m = JSON.parse(fs.readFileSync(path.join(root, '.docusaurus/docusaurus-plugin-content-docs/default', file), 'utf8'));
      const sourceRoot = locale === config.i18n.defaultLocale ? '@site/docs/' : `@site/i18n/${locale}/docusaurus-plugin-content-docs/current/`;
      if (m.id && m.source?.startsWith(sourceRoot) && m.permalink?.startsWith(localePrefix) && sourceFor(m.id, locale)) docs.set(m.id, m);
    }
    const unavailable = uniqueDocs.filter(id => sourceFor(id, locale) && !docs.has(id));
    if (unavailable.length) throw new Error(`${locale}: source chapters absent from built routes: ${unavailable.join(', ')}`);
    const page = await browser.newPage({viewport: {width: 1200, height: 900}});
    const failures = [];
    let stylesheets = '';
    page.on('response', r => {if (r.status() >= 400 && ['image','font','stylesheet','script'].includes(r.request().resourceType())) failures.push(`${r.status()} ${r.url()}`);});
    const chapters = [];
    for (const [index, entry] of entries.entries()) {
      if (entry.type === 'category') {chapters.push({...entry, sourceLabel: entry.label, label: entry.depth === 1 ? (locale === 'zh' ? 'Tier0 企业版用户手册' : 'Tier0 Enterprise User Manual') : translations[`sidebar.tutorialSidebar.category.${entry.label}`]?.message || entry.label, anchor: `manual-${index}`}); continue;}
      if (!sourceFor(entry.id, locale)) continue;
      const meta = docs.get(entry.id);
      const route = new URL(meta.permalink, origin);
      console.log(`${locale}: ${entry.id}`);
      await page.goto(route.href, {waitUntil: 'domcontentloaded'});
      await page.locator('article').waitFor({state: 'attached', timeout: 15000});
      if (!stylesheets) stylesheets = await page.evaluate(() => [...document.querySelectorAll('link[rel="stylesheet"]')].map(e => `<link rel="stylesheet" href="${e.href}">`).join(''));
      await page.waitForTimeout(600);
      const data = await page.evaluate(() => {
        const article = document.querySelector('article .theme-doc-markdown')
          || document.querySelector('article .markdown')
          || document.querySelector('article');
        if (!article) throw new Error('Document article missing');
        const clone = article.cloneNode(true);
        clone.querySelectorAll('.theme-doc-breadcrumbs,nav[aria-label="页面路径"],nav[aria-label="Breadcrumbs"],.theme-doc-footer,.theme-doc-toc-mobile,.pagination-nav,.table-of-contents,[class*="copyButton"],[class*="buttonGroup"]').forEach(e => e.remove());
        clone.querySelectorAll('[role="tabpanel"]').forEach(panel => {panel.hidden = false; panel.removeAttribute('hidden'); panel.style.display = 'block'; const tab = clone.querySelector(`[role="tab"][aria-controls="${panel.id}"]`); const label = document.createElement('div'); label.className = 'pdf-tab-label'; label.textContent = tab?.textContent?.trim() || panel.getAttribute('aria-label') || 'Tab'; panel.prepend(label);});
        clone.querySelectorAll('details').forEach(e => e.open = true);
        clone.querySelectorAll('img').forEach(img => {img.src = img.currentSrc || img.src; img.removeAttribute('loading');});
        clone.querySelectorAll('a[href]').forEach(a => a.href = new URL(a.getAttribute('href'), location.href).href);
        const hasContentH1 = Boolean(clone.querySelector('h1'));
        clone.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach(h => {const d = document.createElement('div'); d.className = `pdf-heading pdf-${h.tagName.toLowerCase()}`; d.id = h.id; d.innerHTML = h.innerHTML; h.replaceWith(d);});
        return {html: clone.innerHTML, title: document.querySelector('article h1')?.textContent?.trim() || document.title.split(' | ')[0], ids: [...clone.querySelectorAll('[id]')].map(e => e.id), hasContentH1};
      });
      chapters.push({...entry, anchor: `manual-${index}`, title: data.title, html: data.html, route: route.pathname, ids: data.ids, showGeneratedTitle: meta.frontMatter?.hide_title === true || !data.hasContentH1});
    }
    const byRoute = new Map(chapters.filter(x => x.route).map(x => [decodeURI(x.route).replace(/\/$/, ''), x]));
    for (const c of chapters.filter(x => x.route)) byRoute.set(`${localePrefix}${c.id}`.replace(/\/$/, ''), c);
    byRoute.set(base.replace(/\/$/, ''), chapters.find(x => x.type === 'doc'));
    byRoute.set(localePrefix.replace(/\/$/, ''), chapters.find(x => x.type === 'doc'));
    for (const c of chapters.filter(x => x.type === 'category')) {
      const slug = c.sourceLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      byRoute.set(`${localePrefix}category/${slug}`, c);
    }
    const idMap = new Map();
    for (const c of chapters.filter(x => x.route)) c.ids.forEach((id, index) => idMap.set(`${decodeURI(c.route).replace(/\/$/, '')}#${id}`, `${c.anchor}-h${index}`));
    const toc = chapters.slice(1).map(c => `<a class="pdf-toc-row depth-${c.depth} pdf-toc-${c.type}" href="#${c.anchor}">${esc(c.title || c.label || c.id.split('/').pop())}</a>`).join('');
    const sections = chapters.map((c, index) => c.type === 'category' ? `<h${Math.min(c.depth,6)} id="${c.anchor}" class="pdf-category${index === 0 ? ' pdf-bookmark-only' : ''}">${esc(c.label)}</h${Math.min(c.depth,6)}>` : `<section class="chapter"><h${Math.min(c.depth,6)} id="${c.anchor}" class="chapter-title${c.showGeneratedTitle ? '' : ' pdf-bookmark-only'}">${esc(c.title)}</h${Math.min(c.depth,6)}><div class="doc-content" data-route="${esc(c.route)}">${c.html}</div></section>`).join('');
    const css = fs.readFileSync(path.join(root, 'src/css/custom.css'), 'utf8');
    const coverData = name => `data:image/png;base64,${fs.readFileSync(path.join(root, 'static', 'pdf', name)).toString('base64')}`;
    const frontCover = coverData('tier0-manual-front-cover-light.png');
    const backCover = coverData('tier0-manual-back-cover-light.png');
    const coverLogo = coverData('tier0-logo-black.png');
    const coverCss = `
      @page pdf-cover { size: A4; margin: 0; }
      .pdf-cover { page: pdf-cover; position: relative; display: block; width: 210mm; height: 297mm; margin: 0; padding: 0; overflow: hidden; break-after: page; }
      .pdf-back-cover { break-before: page; break-after: auto; }
      .pdf-cover-art { display: block; position: absolute; inset: 0; width: 210mm !important; height: 297mm !important; max-width: none !important; object-fit: cover; }
      .pdf-cover-identity { position: absolute; inset: 0; color: #07111c; }
      .pdf-cover-logo { position: absolute; top: 5%; left: 8%; display: block; width: 58mm !important; height: auto !important; max-width: none !important; }
      .pdf-cover-manual-title { position: absolute; top: 72%; left: 8%; display: inline-flex; flex-direction: column; max-width: 84%; font-size: 42px; line-height: 1.08; font-weight: 600; letter-spacing: .005em; white-space: nowrap; }
      .pdf-cover-manual-title span:last-child { align-self: flex-end; margin-top: 5mm; font-size: 34px; }
      .pdf-bookmark-only { font-size: 1px !important; line-height: 1px !important; height: 1px !important; margin: 0 !important; padding: 0 !important; color: transparent !important; overflow: hidden !important; }
    `;
    const html = `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><title>${manualTitle}</title><base href="${origin}${localePrefix}">${stylesheets}<style>${css}\n@page{size:A4;margin:18mm 16mm 22mm}body{color:#24292f;font:13px/1.55 Arial,'Microsoft YaHei','Noto Sans CJK SC',sans-serif}.cover{height:235mm;display:flex;flex-direction:column;justify-content:center;border-top:12px solid #2e8555;break-after:page}.cover .cover-title{font-size:42px;color:#205d3b}.cover p{font-size:20px}.pdf-toc{break-after:page}.pdf-toc .pdf-toc-title{font-size:29px}.pdf-toc-row{display:block;color:#205d3b;text-decoration:none;padding:4px 0;border-bottom:1px solid #eee}.pdf-toc-row.pdf-toc-doc{padding-left:24px}.pdf-toc-row.depth-4{padding-left:42px}.pdf-category{color:#205d3b;break-after:avoid}.chapter{margin:20px 0}.chapter-title{color:#205d3b;break-after:avoid}.doc-content{overflow:visible}.pdf-heading{font-weight:700;break-after:avoid;margin:18px 0 8px}.pdf-h1{font-size:24px}.pdf-h2{font-size:20px}.pdf-h3{font-size:17px}.pdf-tab-label{font-weight:700;color:#205d3b;border-bottom:2px solid #2e8555;margin:14px 0 8px}[role="tablist"]{display:none!important}[role="tabpanel"]{display:block!important;visibility:visible!important}details{display:block!important}pre,code{white-space:pre-wrap!important;overflow-wrap:anywhere!important}pre{font-size:10px;background:#f6f8fa;padding:9px;break-inside:auto}table{width:100%;table-layout:fixed;border-collapse:collapse;font-size:10px}td,th{overflow-wrap:anywhere;border:1px solid #ddd;padding:5px}thead{display:table-header-group}tr,img,svg,.alert,.theme-admonition{break-inside:avoid}img,svg,video,iframe{max-width:100%!important;height:auto!important}a{color:#2e8555}p,li{orphans:3;widows:3}${coverCss}</style></head><body><section class="pdf-cover"><img class="pdf-cover-art" src="${frontCover}" alt=""><div class="pdf-cover-identity"><img class="pdf-cover-logo" src="${coverLogo}" alt="Tier0"><div class="pdf-cover-manual-title">${coverTitle}</div></div></section><section class="pdf-toc"><div class="pdf-toc-title">${locale === 'zh' ? '目录' : 'Table of Contents'}</div>${toc}</section><main>${sections}</main><section class="pdf-cover pdf-back-cover"><img class="pdf-cover-art" src="${backCover}" alt=""></section></body></html>`;
    const print = await browser.newPage({viewport: {width:1200,height:900}});
    await print.goto(`${origin}/__pdf_blank`, {waitUntil:'domcontentloaded'});
    await print.setContent(html, {waitUntil:'domcontentloaded'});
    await print.evaluate(title => {document.title = title;}, manualTitle);
    const linkErrors = await print.evaluate(({routes, mappings, publicOrigin}) => {
      const routeMap = new Map(routes), idMap = new Map(mappings), errors = [];
      for (const section of document.querySelectorAll('.doc-content')) {
        const route = decodeURI(section.dataset.route).replace(/\/$/, '');
        section.querySelectorAll('[id]').forEach(e => {e.id = idMap.get(`${route}#${e.id}`);});
        for (const a of section.querySelectorAll('a[href]')) {
          const u = new URL(a.href, document.baseURI);
          if (u.origin !== location.origin) continue;
          const key = `${decodeURI(u.pathname).replace(/\/$/, '')}#${decodeURIComponent(u.hash.slice(1))}`;
          const target = u.hash ? idMap.get(key) : routeMap.get(decodeURI(u.pathname).replace(/\/$/, ''));
          if (target) a.href = `#${target}`;
          else {errors.push(a.href); a.href = new URL(u.pathname + u.search + u.hash, publicOrigin).href;}
        }
      }
      return errors;
    }, {routes:[...byRoute].map(([k,v])=>[k,v.anchor]), mappings:[...idMap], publicOrigin: config.url});
    if (linkErrors.length) console.warn(`${locale}: externalized references not included in manual (${linkErrors.length}):\n${[...new Set(linkErrors)].join('\n')}`);
    const visibleToc = await print.evaluate(() => [...document.querySelectorAll('.pdf-toc-row')].filter(e => {const r=e.getBoundingClientRect(), s=getComputedStyle(e); return r.width > 0 && r.height > 0 && s.display !== 'none' && s.visibility !== 'hidden';}).length);
    if (visibleToc !== chapters.length - 1) throw new Error(`${locale}: only ${visibleToc}/${chapters.length - 1} table-of-contents entries are visible`);
    await print.evaluate(async () => {await Promise.race([Promise.all([document.fonts.ready, ...[...document.images].map(i => i.decode().catch(() => {}))]), new Promise(resolve => setTimeout(resolve, 60000))]);});
    let brokenImages = await print.evaluate(() => [...document.images].filter(i => !i.naturalWidth).map(i => i.src));
    for (const url of [...new Set(brokenImages)]) {
      let error;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const response = await fetch(url, {signal: AbortSignal.timeout(30000)});
          if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
          const data = `data:${response.headers.get('content-type') || 'image/png'};base64,${Buffer.from(await response.arrayBuffer()).toString('base64')}`;
          await print.evaluate(({url, data}) => [...document.images].filter(i => i.src === url).forEach(i => i.src = data), {url, data});
          error = null; break;
        } catch (e) {error = e;}
      }
      if (error) failures.push(`${url}: ${error.message}`);
    }
    brokenImages = await print.evaluate(async () => {await Promise.race([Promise.all([...document.images].map(i => i.decode().catch(() => {}))), new Promise(resolve => setTimeout(resolve, 30000))]); return [...document.images].filter(i => !i.naturalWidth).map(i => i.src);});
    if (brokenImages.length || failures.length) throw new Error(`${locale}: missing resources:\n${[...new Set([...brokenImages,...failures])].join('\n')}`);
    const pdfDir = path.join(build, 'downloads'); fs.mkdirSync(pdfDir,{recursive:true});
    const output = path.join(pdfDir, `tier0-enterprise-manual-${locale}.pdf`);
    await print.pdf({path:output, format:'A4', preferCSSPageSize:true, printBackground:true, outline:true, tagged:true, displayHeaderFooter:true, headerTemplate:'<span></span>', footerTemplate:'<div style="width:100%;text-align:center;font:9px Arial;color:#777"><span class="pageNumber"></span></div>'});
    const pdf = await PDFDocument.load(fs.readFileSync(output));
    pdf.setTitle(manualTitle);
    pdf.setAuthor('Tier0');
    pdf.setSubject(locale === 'zh' ? 'Tier0 企业版文档' : 'Tier0 Enterprise documentation');
    pdf.setKeywords(['Tier0', 'Enterprise', 'manual', locale]);
    const outlines = pdf.context.lookup(pdf.catalog.get(PDFName.of('Outlines')));
    const first = outlines && pdf.context.lookup(outlines.get(PDFName.of('First')));
    if (!first) throw new Error(`${locale}: PDF outline was not generated`);
    first.set(PDFName.of('Title'), PDFHexString.fromText(manualTitle));
    fs.writeFileSync(output, await pdf.save());
    const staticPdfDir = path.join(root, 'static', 'downloads');
    fs.mkdirSync(staticPdfDir, {recursive: true});
    fs.copyFileSync(output, path.join(staticPdfDir, path.basename(output)));
    console.log(`Generated ${output} (${chapters.filter(x=>x.type==='doc').length} chapters)`);
    await print.close(); await page.close();
  }
} finally {await browser.close(); await new Promise(resolve => server.close(resolve));}
