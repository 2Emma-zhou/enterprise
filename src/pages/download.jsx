import React from 'react';
import Layout from '@theme/Layout';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

export default function Download() {
  const {siteConfig, i18n} = useDocusaurusContext();
  const localePath = i18n.currentLocale === i18n.defaultLocale ? '' : `${siteConfig.i18n?.localeConfigs?.[i18n.currentLocale]?.path || i18n.currentLocale}/`;
  const base = localePath && siteConfig.baseUrl.endsWith(localePath)
    ? siteConfig.baseUrl.slice(0, -localePath.length)
    : siteConfig.baseUrl;
  return <Layout title={i18n.currentLocale === 'zh' ? '导出 PDF' : 'Export PDF'} description="Download the Tier0 Enterprise manual">
    <main className="container margin-vert--xl" style={{maxWidth: 760}}>
      <h1>{i18n.currentLocale === 'zh' ? '下载用户手册' : 'Download user manual'}</h1>
      <p>{i18n.currentLocale === 'zh' ? '按当前文档侧栏顺序生成的完整手册。' : 'The complete manual in documentation sidebar order.'}</p>
      <p><a className="button button--primary button--lg" href={`${base}downloads/tier0-enterprise-manual-${i18n.currentLocale}.pdf`} download>
        {i18n.currentLocale === 'zh' ? '导出 PDF' : 'Export PDF'}
      </a></p>
      <p><a href={`${base}downloads/tier0-enterprise-manual-en.pdf`}>English</a> · <a href={`${base}downloads/tier0-enterprise-manual-zh.pdf`}>简体中文</a></p>
    </main>
  </Layout>;
}
