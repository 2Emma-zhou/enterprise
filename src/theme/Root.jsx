import React from 'react';
import DocChatBot from '@site/src/components/DocChatBot';

export default function Root({children}) {
  return (
    <>
      {children}
      <DocChatBot />
    </>
  );
}