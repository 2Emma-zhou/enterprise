import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const sidebarsModule = require('../sidebars.js');
const sidebars = sidebarsModule.default || sidebarsModule;

const BASE_URL = 'http://localhost:3001';
const SIDEBAR_KEY = 'tutorialSidebar';
const DOCS_BASE = '/zh';

const COVER_IMAGE_URL = 'http://enterpriseimage.oss-cn-hangzhou.aliyuncs.com/pdf-zh.png';

const ROUTE_MAP = {
  Introduction: '/zh/',
};

const outputDir = path.resolve('pdf-dist');
fs.mkdirSync(outputDir, { recursive: true });

const sidebarItems = sidebars[SIDEBAR_KEY];

if (!Array.isArray(sidebarItems)) {
  console.log('Available sidebar keys:', Object.keys(sidebars));
  throw new Error(`Sidebar key "${SIDEBAR_KEY}" not found or is not an array.`);
}

async function imageUrlToDataUrl(url) {
  const candidates = [
    url,
    url.replace(/^http:\/\//, 'https://'),
  ];

  let lastError;

  for (const candidate of candidates) {
    try {
      const response = await fetch(candidate);

      if (!response.ok) {
        throw new Error(`Failed to fetch ${candidate}: ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type') || 'image/png';
      const buffer = Buffer.from(await response.arrayBuffer());
      const base64 = buffer.toString('base64');

      return `data:${contentType};base64,${base64}`;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function slugify(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/gi, '-')
    .replace(/^-+|-+$/g, '');
}

function getDocLabel(id) {
  return decodeURIComponent(id.split('/').pop());
}

function getDocPath(id) {
  return ROUTE_MAP[id] || `${DOCS_BASE}/${encodeURI(id)}`;
}

function collectEntries(items, level = 1) {
  const entries = [];

  for (const item of items) {
    if (typeof item === 'string') {
      entries.push({
        type: 'doc',
        id: item,
        label: getDocLabel(item),
        path: getDocPath(item),
        level,
      });
      continue;
    }

    if (item.type === 'doc') {
      entries.push({
        type: 'doc',
        id: item.id,
        label: item.label || getDocLabel(item.id),
        path: getDocPath(item.id),
        level,
      });
      continue;
    }

    if (item.type === 'category') {
      entries.push({
        type: 'category',
        label: item.label,
        level,
      });

      entries.push(...collectEntries(item.items || [], level + 1));
      continue;
    }
  }

  return entries;
}

function buildToc(entries) {
  return entries
    .map((entry) => {
      const indent = Math.max(entry.level - 1, 0) * 18;
      const className = entry.type === 'category' ? 'toc-category' : 'toc-doc';

      return `
        <a class="toc-row ${className} toc-level-${entry.level}" href="#${entry.anchor}" style="padding-left: ${indent}px;">
          <span class="toc-title">${escapeHtml(entry.label)}</span>
        </a>
      `;
    })
    .join('\n');
}

async function getZhSidebarEntries(page) {
  await page.goto(`${BASE_URL}/zh/`, {
    waitUntil: 'networkidle',
  });

  await page.evaluate(() => {
    document
      .querySelectorAll('.menu__caret, .menu__list-item-collapsible button')
      .forEach((btn) => {
        const expanded = btn.getAttribute('aria-expanded');
        if (expanded === 'false') {
          btn.click();
        }
      });
  });

  await page.waitForTimeout(500);

  return await page.evaluate(() => {
    const root =
      document.querySelector('.theme-doc-sidebar-container ul.menu__list') ||
      document.querySelector('aside ul.menu__list') ||
      document.querySelector('nav.menu ul.menu__list');

    if (!root) {
      return [];
    }

    function cleanText(text) {
      return text.replace(/\s+/g, ' ').trim();
    }

    function readList(ul, level = 1) {
      const result = [];

      Array.from(ul.children).forEach((li) => {
        const collapsible = li.querySelector(':scope > .menu__list-item-collapsible');
        const subList = li.querySelector(':scope > ul.menu__list');

        if (collapsible) {
          const labelEl =
            collapsible.querySelector(':scope > a.menu__link') ||
            collapsible.querySelector(':scope > .menu__link');

          const label = cleanText(labelEl?.textContent || '');

          if (label) {
            result.push({
              type: 'category',
              label,
              level,
            });
          }

          if (subList) {
            result.push(...readList(subList, level + 1));
          }

          return;
        }

        const link = li.querySelector(':scope > a.menu__link');

        if (link) {
          const label = cleanText(link.textContent || '');

          if (label) {
            result.push({
              type: 'doc',
              label,
              level,
            });
          }
        }

        if (subList) {
          result.push(...readList(subList, level + 1));
        }
      });

      return result;
    }

    return readList(root);
  });
}

const coverImageDataUrl = await imageUrlToDataUrl(COVER_IMAGE_URL);

const entries = collectEntries(sidebarItems).map((entry, index) => ({
  ...entry,
  anchor: `${entry.type}-${index}-${slugify(entry.label || entry.id || index)}`,
}));

const browser = await chromium.launch();
const page = await browser.newPage();

const zhSidebarEntries = await getZhSidebarEntries(page);
const zhCategoryEntries = zhSidebarEntries.filter((item) => item.type === 'category');
let zhCategoryIndex = 0;

const sections = [];
const tocEntries = [];

for (const entry of entries) {
  if (entry.type === 'category') {
    const headingLevel = Math.min(entry.level, 3);

    const zhCategory = zhCategoryEntries[zhCategoryIndex];
    const categoryLabel = zhCategory?.label || entry.label;
    zhCategoryIndex += 1;

    const localizedCategory = {
      ...entry,
      label: categoryLabel,
    };

    tocEntries.push(localizedCategory);

    sections.push(`
      <h${headingLevel} id="${entry.anchor}" class="pdf-sidebar-category pdf-level-${entry.level}">
        ${escapeHtml(categoryLabel)}
      </h${headingLevel}>
    `);

    continue;
  }

  const doc = entry;
  const url = `${BASE_URL}${doc.path}`;

  console.log(`Reading ${url}`);

  await page.goto(url, {
    waitUntil: 'networkidle',
  });

  const data = await page.evaluate(() => {
    const article = document.querySelector('article');

    if (!article) {
      return null;
    }

    article
      .querySelectorAll(
        [
          '.theme-doc-footer',
          '.theme-doc-toc-mobile',
          '.pagination-nav',
          '.table-of-contents',
          'nav',
          '[class*="copyButton"]',
          '[class*="copyButtonContainer"]',
          '[class*="codeBlockButtons"]',
          '[class*="buttonGroup"]',
          'button[aria-label*="Copy"]',
          'button[title*="Copy"]',
        ].join(',')
      )
      .forEach((el) => el.remove());

    // 如果页面本身有 h1，就使用页面 h1。
    // 如果没有 h1，再用 document.title 补一个，避免 PDF 正文没标题。
    const existingH1 = article.querySelector('h1');

    if (!existingH1) {
      const h1 = document.createElement('h1');
      h1.textContent = document.title.replace(/ \| .+$/, '').trim();
      article.prepend(h1);
    }

    // 确保 HTML 表格有 thead，这样跨页时可以重复表头。
    article.querySelectorAll('table').forEach((table) => {
      if (table.querySelector('thead')) {
        return;
      }

      const firstRow = table.querySelector('tr');

      if (!firstRow || !firstRow.querySelector('th')) {
        return;
      }

      const thead = document.createElement('thead');
      const firstTbody = table.querySelector('tbody');

      table.insertBefore(thead, firstTbody || table.firstChild);
      thead.appendChild(firstRow);
    });

    const title =
      article.querySelector('h1')?.textContent?.trim() ||
      document.title.replace(/ \| .+$/, '').trim();

    // 重建 Docusaurus admonition，去掉异常引用线/括号，保留干净的小图标和有色底。
    article
      .querySelectorAll('.alert, .theme-admonition, [class*="admonition"]')
      .forEach((box) => {
        const className = box.className || '';

        let type = 'info';
        let icon = 'ⓘ';

        if (className.includes('warning')) {
          type = 'warning';
          icon = '⚠';
        } else if (className.includes('danger') || className.includes('caution')) {
          type = 'danger';
          icon = '!';
        } else if (className.includes('tip') || className.includes('success')) {
          type = 'tip';
          icon = '✓';
        }

        const heading =
          box.querySelector('[class*="admonitionHeading"]') ||
          box.querySelector('[class*="admonitionTitle"]');

        const content = box.querySelector('[class*="admonitionContent"]') || box;

        const titleText =
          heading?.textContent?.replace(/[ⓘ⚠✓!]/g, '').trim() ||
          type;

        const contentHtml = content.innerHTML;

        box.className = `pdf-admonition pdf-admonition-${type}`;

        box.innerHTML = `
          <div class="pdf-admonition-title">
            <span class="pdf-admonition-icon">${icon}</span>
            <span>${titleText}</span>
          </div>
          <div class="pdf-admonition-content">
            ${contentHtml}
          </div>
        `;
      });

    // 标记正文里的小图标，避免被当成大图截图换行显示。
    article.querySelectorAll('img, svg').forEach((el) => {
      if (el.closest('.pdf-admonition-title')) {
        return;
      }

      const rect = el.getBoundingClientRect();

      const width =
        rect.width ||
        Number(el.getAttribute('width')) ||
        Number(el.style.width?.replace('px', '')) ||
        0;

      const height =
        rect.height ||
        Number(el.getAttribute('height')) ||
        Number(el.style.height?.replace('px', '')) ||
        0;

      if (width <= 64 && height <= 64) {
        el.classList.add('pdf-inline-icon');
        el.style.display = 'inline-block';
        el.style.verticalAlign = 'middle';
        el.style.margin = '0 4px';
      }
    });

    // 正文标题不进 PDF 书签，但保留标题样式。
    article.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((heading) => {
      const div = document.createElement('div');
      div.className = `pdf-content-heading pdf-${heading.tagName.toLowerCase()}`;
      div.innerHTML = heading.innerHTML;
      heading.replaceWith(div);
    });

    const html = article.innerHTML;

    return {
      title,
      html,
    };
  });

  if (!data) {
    console.warn(`No article found: ${url}`);
    continue;
  }

  const docTitle = data.title || doc.label;

  tocEntries.push({
    ...doc,
    label: docTitle,
  });

  sections.push(`
    <section class="pdf-doc">
      <h${Math.min(doc.level, 3)} id="${doc.anchor}" class="pdf-doc-title pdf-bookmark-only pdf-level-${doc.level}">
        ${escapeHtml(docTitle)}
      </h${Math.min(doc.level, 3)}>
      <div class="doc-content">
        ${data.html}
      </div>
    </section>
  `);
}

const tocHtml = buildToc(tocEntries);

const html = `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Tier0 Enterprise 用户手册</title>

  <base href="${BASE_URL}/" />

  <style>
    @page {
      size: A4;
      margin: 22mm 18mm 28mm 18mm;
    }

    @page:first {
      size: A4;
      margin: 0;
    }

    html,
    body {
      margin: 0;
      padding: 0;
      color: #222;
      font-family: "SimSun", "Microsoft YaHei", Arial, sans-serif;
      font-size: 15px;
      line-height: 1.6;
      background: #fff;
      font-weight: 400;
      font-synthesis: none;
      -webkit-font-smoothing: antialiased;
    }

    .cover-page {
      width: 210mm;
      height: 297mm;
      margin: 0;
      padding: 0;
      page-break-after: always;
      break-after: page;
      overflow: hidden;
      background: #fff;
    }

    .cover-image {
      width: 210mm;
      height: 297mm;
      object-fit: cover;
      display: block;
    }

    .toc-page {
      page-break-after: always;
      break-after: page;
    }

    .manual-body,
    .toc-page {
      width: 100%;
      box-sizing: border-box;
      padding: 0;
    }

    .manual-content,
    .toc-content {
      max-width: 920px;
      margin: 0 auto;
    }

    .toc-title-main {
      font-size: 30px;
      line-height: 1.25;
      color: #111827;
      margin: 0 0 24px;
      font-weight: 700;
      font-family: "Microsoft YaHei", "SimHei", Arial, sans-serif;
    }

    .toc-list {
      border-top: 1px solid #e5e7eb;
      padding-top: 12px;
    }

    .toc-row {
      display: flex;
      align-items: center;
      min-height: 28px;
      color: #1f2937;
      text-decoration: none;
      border-bottom: 1px solid #f1f5f9;
      box-sizing: border-box;
    }

    .toc-row:hover {
      color: #73b200;
    }

    .toc-category {
      font-weight: 700;
      margin-top: 6px;
      font-family: "Microsoft YaHei", "SimHei", Arial, sans-serif;
    }

    .toc-doc {
      font-weight: 400;
      color: #4b5563;
    }

    .toc-title {
      display: inline-block;
    }

    .doc-content,
    .doc-content p,
    .doc-content li,
    .doc-content td,
    .doc-content th,
    .doc-content span,
    .doc-content div {
      font-family: "SimSun", "Microsoft YaHei", Arial, sans-serif !important;
      font-weight: 400 !important;
      font-synthesis: none !important;
    }

    .doc-content .pdf-content-heading,
    .doc-content .pdf-h1,
    .doc-content .pdf-h2,
    .doc-content .pdf-h3,
    .doc-content .pdf-h4,
    .doc-content .pdf-h5,
    .doc-content .pdf-h6,
    .pdf-sidebar-category,
    .pdf-doc-title {
      font-family: "Microsoft YaHei", "SimHei", Arial, sans-serif !important;
      font-weight: 700 !important;
    }

    .doc-content table th,
    .doc-content table th *,
    .doc-content thead th,
    .doc-content thead th * {
      font-family: "Microsoft YaHei", "SimHei", Arial, sans-serif !important;
      font-weight: 700 !important;
    }

    .doc-content strong,
    .doc-content b {
      font-weight: 600 !important;
    }

    .pdf-sidebar-category {
      color: #1f2937;
      font-weight: 700;
      margin-top: 36px;
      margin-bottom: 18px;
      line-height: 1.35;
      break-after: avoid;
      page-break-after: avoid;
    }

    .pdf-sidebar-category.pdf-level-1 {
      font-size: 30px;
      break-before: page;
      page-break-before: always;
      break-after: avoid;
      page-break-after: avoid;
    }

    .pdf-sidebar-category.pdf-level-1:first-of-type {
      break-before: auto;
      page-break-before: auto;
    }

    .pdf-sidebar-category.pdf-level-2 {
      font-size: 24px;
    }

    .pdf-sidebar-category.pdf-level-3 {
      font-size: 20px;
    }

    .pdf-doc {
      margin-top: 24px;
    }

    .pdf-doc-title {
      color: #374151;
      font-weight: 600;
      line-height: 1.35;
      margin-top: 22px;
      margin-bottom: 12px;
      break-after: avoid;
      page-break-after: avoid;
    }

    .pdf-doc-title.pdf-level-1 {
      font-size: 26px;
    }

    .pdf-doc-title.pdf-level-2 {
      font-size: 22px;
    }

    .pdf-doc-title.pdf-level-3 {
      font-size: 19px;
    }

    .pdf-bookmark-only {
      font-size: 1px !important;
      line-height: 1px !important;
      height: 1px !important;
      margin: 0 !important;
      padding: 0 !important;
      color: transparent !important;
      overflow: hidden !important;
    }

    .pdf-content-heading {
      line-height: 1.35;
      margin-top: 28px;
      margin-bottom: 12px;
      color: #1f2937;
      break-after: avoid;
      page-break-after: avoid;
    }

    .pdf-h1 {
      font-size: 26px;
      font-weight: 700;
    }

    .pdf-h2 {
      font-size: 23px;
      font-weight: 700;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 6px;
    }

    .pdf-h3 {
      font-size: 19px;
      font-weight: 700;
    }

    .pdf-h4,
    .pdf-h5,
    .pdf-h6 {
      font-size: 16px;
      font-weight: 700;
    }

    p {
      margin: 10px 0;
    }

    a {
      color: #0969da;
      text-decoration: none;
    }

    ul,
    ol {
      padding-left: 24px;
    }

    li {
      margin: 4px 0;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      font-size: 14px;
      break-inside: auto;
      page-break-inside: auto;
    }

    thead {
      display: table-header-group;
    }

    tfoot {
      display: table-footer-group;
    }

    tr {
      break-inside: avoid;
      page-break-inside: avoid;
    }

    th,
    td {
      border: 1px solid #d0d7de;
      padding: 8px 10px;
      vertical-align: top;
    }

    th {
      font-weight: 700;
      background: #f6f8fa;
    }

    img,
    svg {
      max-width: 100%;
      height: auto;
    }

    .doc-content img:not(.pdf-inline-icon) {
      display: block;
      margin: 14px 0;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .doc-content .pdf-inline-icon {
      display: inline-block !important;
      vertical-align: middle !important;
      margin: 0 4px !important;
      max-width: 1.4em !important;
      max-height: 1.4em !important;
      width: auto !important;
      height: auto !important;
    }

    .pdf-admonition-content img.pdf-inline-icon,
    .pdf-admonition-content svg.pdf-inline-icon {
      display: inline-block !important;
      vertical-align: middle !important;
      margin: 0 4px !important;
      max-width: 1.4em !important;
      max-height: 1.4em !important;
      width: auto !important;
      height: auto !important;
    }

    pre {
      background: #f6f8fa;
      padding: 12px;
      border-radius: 6px;
      overflow-x: auto;
      font-size: 13px;
      line-height: 1.45;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    code {
      font-family: Menlo, Consolas, Monaco, monospace;
      font-size: 0.92em;
    }

    pre code {
      background: transparent;
      padding: 0;
    }

    :not(pre) > code {
      background: #f6f8fa;
      padding: 2px 4px;
      border-radius: 4px;
    }

    .pdf-admonition {
      border-radius: 8px;
      padding: 14px 16px;
      margin: 16px 0;
      border-left: 5px solid;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .pdf-admonition-info {
      background: #eef6ff !important;
      border-left-color: #3b82f6 !important;
    }

    .pdf-admonition-tip {
      background: #ecfdf5 !important;
      border-left-color: #10b981 !important;
    }

    .pdf-admonition-warning {
      background: #fffbeb !important;
      border-left-color: #f59e0b !important;
    }

    .pdf-admonition-danger {
      background: #fef2f2 !important;
      border-left-color: #ef4444 !important;
    }

    .pdf-admonition-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 700;
      margin-bottom: 8px;
    }

    .pdf-admonition-icon {
      width: 16px;
      height: 16px;
      min-width: 16px;
      max-width: 16px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      line-height: 1;
    }

    .pdf-admonition-content > :first-child {
      margin-top: 0;
    }

    .pdf-admonition-content > :last-child {
      margin-bottom: 0;
    }

    .pdf-admonition blockquote,
    .pdf-admonition-content blockquote {
      border-left: none !important;
      margin: 0 !important;
      padding-left: 0 !important;
    }

    .pdf-admonition *::before,
    .pdf-admonition *::after,
    .pdf-admonition::before,
    .pdf-admonition::after {
      content: none !important;
      display: none !important;
    }

    button,
    .clean-btn,
    [class*="copyButton"],
    [class*="copyButtonContainer"],
    [class*="codeBlockButtons"],
    [class*="buttonGroup"] {
      display: none !important;
    }
  </style>
</head>
<body>
  <section class="cover-page">
    <img class="cover-image" src="${coverImageDataUrl}" alt="Tier0 Enterprise User Manual Cover" />
  </section>

  <section class="toc-page">
    <div class="toc-content">
      <div class="toc-title-main">目录</div>
      <div class="toc-list">
        ${tocHtml}
      </div>
    </div>
  </section>

  <main class="manual-body">
    <div class="manual-content">
      ${sections.join('\n')}
    </div>
  </main>
</body>
</html>
`;

const htmlPath = path.join(outputDir, 'print-zh.html');
const pdfPath = path.join(outputDir, `docs-zh-${Date.now()}.pdf`);

fs.writeFileSync(htmlPath, html, 'utf8');

await page.goto(`file://${htmlPath}`, {
  waitUntil: 'networkidle',
});

await page.waitForLoadState('networkidle');

await page.evaluate(async () => {
  await document.fonts.ready;

  const images = Array.from(document.images);
  await Promise.all(
    images.map((img) => {
      if (img.complete) return Promise.resolve();

      return new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });
    })
  );
});

await page.pdf({
  path: pdfPath,
  format: 'A4',
  printBackground: true,
  outline: true,
  tagged: true,
  preferCSSPageSize: true,
  displayHeaderFooter: true,
  headerTemplate: `<div></div>`,
  footerTemplate: `
    <div style="
      width: 100%;
      font-size: 9px;
      color: #8a8f98;
      text-align: center;
      font-family: Arial, 'Microsoft YaHei', sans-serif;
      margin-bottom: 8mm;
    ">
      <span style="
        display: inline-block;
        width: 28px;
        height: 1px;
        background: #cbd5e1;
        vertical-align: middle;
        margin-right: 8px;
      "></span>
      <span class="pageNumber" style="
        display: inline-block;
        min-width: 12px;
        color: #6b7280;
        vertical-align: middle;
      "></span>
      <span style="
        display: inline-block;
        width: 28px;
        height: 1px;
        background: #cbd5e1;
        vertical-align: middle;
        margin-left: 8px;
      "></span>
    </div>
  `,
});

await browser.close();

console.log(`PDF generated: ${pdfPath}`);