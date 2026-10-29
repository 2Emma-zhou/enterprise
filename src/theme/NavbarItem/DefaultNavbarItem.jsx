import React from 'react';
import OriginalDefaultNavbarItem from '@theme-original/NavbarItem/DefaultNavbarItem';
import PdfDownloadNavbarItem from '@theme/NavbarItem/PdfDownloadNavbarItem';

export default function DefaultNavbarItem(props) {
  if (props.to === '/download') {
    return <PdfDownloadNavbarItem mobile={props.mobile} />;
  }
  return <OriginalDefaultNavbarItem {...props} />;
}
