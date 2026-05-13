import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const sidebarsModule = require('../sidebars.js');
const sidebars = sidebarsModule.default || sidebarsModule;

const BASE_URL = 'http://localhost:3002';
const SIDEBAR_KEY = 'tutorialSidebar';
const DOCS_BASE = '';

const ROUTE_MAP = {
  Introduction: '/',
};

const outputDir = path.resolve('pdf-dist');
fs.mkdirSync(outputDir, { recursive: true });

const sidebarItems = sidebars[SIDEBAR_KEY];

if (!Array.isArray(sidebarItems)) {
  console.log('Available sidebar keys:', Object.keys(sidebars));
  throw new Error(`Sidebar key "${SIDEBAR_KEY}" not found or is not an array.`);
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

const entries = collectEntries(sidebarItems);

const browser = await chromium.launch();
const page = await browser.newPage();

const sections = [];

for (const entry of entries) {
  if (entry.type === 'category') {
    const headingLevel = Math.min(entry.level, 3);

    sections.push(`
      <h${headingLevel} class="pdf-sidebar-category pdf-level-${entry.level}">
        ${entry.label}
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

    const title =
      article.querySelector('h1')?.textContent?.trim() ||
      document.title.replace(/ \| .+$/, '');

    // 删除 admonition 里的 SVG 图标，避免 PDF 中出现异常大括号/黑色残影
    // 重建 Docusaurus admonition，去掉异常引用线/括号，保留干净的小图标和有色底
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

    const content =
      box.querySelector('[class*="admonitionContent"]') || box;

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
  // 标记正文里的小图标，避免被当成大图截图换行显示
article.querySelectorAll('img, svg').forEach((el) => {
  // 只跳过我们自己生成的提示框标题图标；
  // 提示内容里的 img/svg 仍然要按 inline icon 处理
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

    // 去掉正文标题的 h 语义，避免正文 h2/h3/h4 进入 PDF 侧边书签；
    // 但保留 class，用 CSS 让它看起来仍然像标题。
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

  sections.push(`
    <section class="pdf-doc">
      <h${Math.min(doc.level, 3)} class="pdf-doc-title pdf-bookmark-only pdf-level-${doc.level}">
        ${doc.label || data.title}
      </h${Math.min(doc.level, 3)}>
      <div class="doc-content">
        ${data.html}
      </div>
    </section>
  `);
}

const html = `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>User Manual</title>

  <base href="${BASE_URL}/" />

  <style>
    body {
      font-family: Arial, "Microsoft YaHei", "Noto Sans CJK SC", sans-serif;
      line-height: 1.6;
      color: #222;
      max-width: 920px;
      margin: 0 auto;
      padding: 40px;
      font-size: 15px;
    }

    .cover-title {
      font-size: 38px;
      font-weight: 700;
      text-align: center;
      margin: 140px 0 100px;
      page-break-after: always;
    }

    .pdf-sidebar-category {
      color: #1f2937;
      font-weight: 700;
      margin-top: 36px;
      margin-bottom: 18px;
      line-height: 1.35;
    }

    .pdf-sidebar-category.pdf-level-1 {
      font-size: 30px;
      page-break-before: always;
    }

    .pdf-sidebar-category.pdf-level-1:first-of-type {
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

    /* 只用于 PDF 侧边书签，不在正文中显示 */
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

    @page {
      size: A4;
      margin: 18mm 16mm;
    }
  </style>
</head>
<body>
  <div class="cover-title">User Manual</div>
  ${sections.join('\n')}
</body>
</html>
`;

const htmlPath = path.join(outputDir, 'print.html');
const pdfPath = path.join(outputDir, `docs-${Date.now()}.pdf`);

fs.writeFileSync(htmlPath, html, 'utf8');

await page.goto(`file://${htmlPath}`, {
  waitUntil: 'networkidle',
});

await page.pdf({
  path: pdfPath,
  format: 'A4',
  printBackground: true,
  outline: true,
  tagged: true,
  margin: {
    top: '18mm',
    right: '16mm',
    bottom: '18mm',
    left: '16mm',
  },
});

await browser.close();

console.log(`PDF generated: ${pdfPath}`);