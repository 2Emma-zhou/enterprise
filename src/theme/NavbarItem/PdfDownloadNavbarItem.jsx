import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

export default function PdfDownloadNavbarItem({mobile}) {
  const {siteConfig, i18n} = useDocusaurusContext();
  const locale = i18n.currentLocale;
  const localePath = locale === i18n.defaultLocale ? '' : `${siteConfig.i18n?.localeConfigs?.[locale]?.path || locale}/`;
  const base = (localePath && siteConfig.baseUrl.endsWith(localePath)
    ? siteConfig.baseUrl.slice(0, -localePath.length)
    : siteConfig.baseUrl).replace(/\/?$/, '/');
  const link = <a
    className={mobile ? 'menu__link' : 'navbar__item navbar__link'}
    href={`${base}downloads/tier0-enterprise-manual-${locale}.pdf`}
    download
  >{locale === 'zh' ? '导出 PDF' : 'Export PDF'}</a>;

  return mobile ? <li className="menu__list-item">{link}</li> : link;
}
