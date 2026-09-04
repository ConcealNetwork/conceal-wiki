const projectPath = process.env.GITHUB_PAGES === 'true' ? '/conceal-wiki' : '';

/**
 * Maps a root-relative application route to its public GitHub Pages route.
 * Local development intentionally keeps the application at the domain root.
 */
export function toPublicProjectPath(pathname: string) {
  if (!pathname.startsWith('/') || pathname.startsWith('//')) return pathname;
  if (pathname === projectPath || pathname.startsWith(`${projectPath}/`)) return pathname;

  return `${projectPath}${pathname}`;
}

/**
 * Updates root-relative Markdown links while preserving external URLs.
 */
export function toPublicProjectMarkdown(markdown: string) {
  return markdown.replace(/\]\((\/[^)]+)\)/g, (_match, pathname: string) => {
    return `](${toPublicProjectPath(pathname)})`;
  });
}
