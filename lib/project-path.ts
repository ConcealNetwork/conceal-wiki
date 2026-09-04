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
 * Maps an application page route to the canonical, trailing-slash Pages URL.
 */
export function toPublicPagePath(pathname: string) {
  const publicPath = toPublicProjectPath(pathname);
  return publicPath.endsWith('/') ? publicPath : `${publicPath}/`;
}

/**
 * Updates root-relative Markdown links while preserving external URLs.
 */
export function toPublicProjectMarkdown(markdown: string) {
  return markdown.replace(/\]\((\/[^)]+)\)/g, (_match, pathname: string) => {
    return `](${toPublicPagePath(pathname)})`;
  });
}
