// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import {themes as prismThemes} from 'prism-react-renderer';

const GTM_ID = 'GTM-NRRWS67W';

function googleTagManagerPlugin() {
  return {
    name: 'google-tag-manager-plugin',
    injectHtmlTags() {
      return {
        headTags: [
          {
            tagName: 'script',
            innerHTML: `
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');
            `,
          },
        ],
        preBodyTags: [
          {
            tagName: 'noscript',
            innerHTML: `<iframe src="https://www.googletagmanager.com/ns.html?id=${GTM_ID}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`,
          },
        ],
      };
    },
  };
}

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'TIER 0',
  tagline: 'Dinosaurs are cool',
  favicon: 'img/freezonex logo.svg',

  // Set the production url of your site here
  url: 'http://tier0edge.info',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: '2Emma-zhou', // Usually your GitHub org/user name.
  projectName: 'community', // Usually your repo name.

  onBrokenLinks: 'ignore',
  onBrokenMarkdownLinks: 'ignore',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'zh'],
    localeConfigs: {
      zh: {
        label: '简体中文', // 下拉菜单里显示的文字
        htmlLang: 'zh-CN',
        path: 'zh', // URL 路径前缀，例如 /zh/xxx
       
        
      },
      
  },
  
  },
  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      
      ({
        docs: {
          sidebarPath: './sidebars.js',
          routeBasePath: '/'
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          // editUrl:
          //   'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
        },
        
        blog:
      {
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          // editUrl:
          //   'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
          // Useful options to enforce blogging best practices
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'ignore',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],
  // themes: ['@docusaurus/theme-search-algolia'],
  plugins: [
    require.resolve("plugin-image-zoom"),  //zoom images in document
    googleTagManagerPlugin,
  ],
  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      algolia: {
        appId: 'HJQ6MHWT3P',
        apiKey: '943d2f22d7bfae936119d9922fc689f5',
        indexName: 'tier0',
        contextualSearch: true,
        externalUrlRegex: 'external\\.com|domain\\.com',
        searchParameters: {},
        searchPagePath: 'search',
      },
      // Replace with your project's social card
      // image: 'img/docusaurus-social-card.jpg',
      zoom: {  //image zoom config
        selector: '.mdx img',
        config: {
          // options you can specify via https://github.com/francoischalifour/medium-zoom#usage
          background: {
            light: 'rgb(255, 255, 255)',
            dark: 'rgb(50, 50, 50)'
          }
        }
      },
      navbar: {
        title: '',
        logo: {
          alt: 'Tier0',
          src: 'img/black logo.svg',
          href: 'https://tier0.app',
          srcDark: 'img/white logo.svg',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'tutorialSidebar',
            position: 'left',
            label: 'Doc',
          },
          {
            type: 'docSidebar',
            sidebarId: 'usecase',
            position: 'left',
            label: 'Use Case',
          },
          {to: '/openapi', label: 'Open API', position: 'left'},
          // {to: '/blog', label: 'Blog', position: 'left'},
          {
          type: 'localeDropdown',
          position: 'right',
        },
        ],
      },
      footer: {
  style: 'dark',
  links: [
    {
      title: 'Docs',
      items: [
        {
          label: 'Tutorial',
          to: '/',
        },
      ],
    },
    {
      title: 'Community',
      items: [
        {
          label: 'Discord',
          href: 'https://lnkd.in/egT8aFE3',
        },
        {
          label: 'GitHub',
          href: 'https://github.com/FREEZONEX/Tier0-Edge',
        },
      ],
    },
    {
      title: 'More',
      items: [
        {
          label: 'LinkedIn',
          href: 'https://www.linkedin.com/uas/login?session_redirect=%2Fcompany%2F91136833',
        },
      ],
    },
  ],

  copyright: `
    Copyright © ${new Date().getFullYear()} FreezoneX, Inc.
  `,
},
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
      },
    }),
};

export default config;
