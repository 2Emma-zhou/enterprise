import React from 'react';
import Translate, {translate} from '@docusaurus/Translate';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import PaginatorNavLink from '@theme/PaginatorNavLink';
import zhDocTranslations from '@site/i18n/zh/docusaurus-plugin-content-docs/current.json';

const SIDEBAR_IDS = ['tutorialSidebar', 'usecase'];

function translateCategoryTitle(title, currentLocale) {
  if (currentLocale !== 'zh') {
    return title;
  }

  for (const sidebarId of SIDEBAR_IDS) {
    const translatedTitle =
      zhDocTranslations[`sidebar.${sidebarId}.category.${title}`]?.message;

    if (translatedTitle) {
      return translatedTitle;
    }
  }

  return title;
}

function translatePaginationLink(link, currentLocale) {
  if (!link) {
    return link;
  }

  return {
    ...link,
    title: translateCategoryTitle(link.title, currentLocale),
  };
}

export default function DocPaginator(props) {
  const {previous, next} = props;
  const {
    i18n: {currentLocale},
  } = useDocusaurusContext();

  return (
    <nav
      className="pagination-nav docusaurus-mt-lg"
      aria-label={translate({
        id: 'theme.docs.paginator.navAriaLabel',
        message: 'Docs pages',
        description: 'The ARIA label for the docs pagination',
      })}>
      {previous && (
        <PaginatorNavLink
          {...translatePaginationLink(previous, currentLocale)}
          subLabel={
            <Translate
              id="theme.docs.paginator.previous"
              description="The label used to navigate to the previous doc">
              Previous
            </Translate>
          }
        />
      )}
      {next && (
        <PaginatorNavLink
          {...translatePaginationLink(next, currentLocale)}
          subLabel={
            <Translate
              id="theme.docs.paginator.next"
              description="The label used to navigate to the next doc">
              Next
            </Translate>
          }
          isNext
        />
      )}
    </nav>
  );
}
