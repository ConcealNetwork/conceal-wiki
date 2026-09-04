'use client';

import { useState } from 'react';

export function CopyMarkdownButton({ markdownUrl }: { markdownUrl: string }) {
  const [copied, setCopied] = useState(false);

  async function copyMarkdown() {
    const response = await fetch(markdownUrl);
    const markdown = await response.text();
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
  }

  return (
    <button
      type="button"
      className="inline-flex h-8 items-center rounded-md border border-fd-border bg-fd-secondary px-3 text-sm font-medium text-fd-secondary-foreground hover:bg-fd-accent"
      onClick={copyMarkdown}
    >
      {copied ? 'Copied' : 'Copy Markdown'}
    </button>
  );
}
