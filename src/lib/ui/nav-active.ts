/** Whether a sidebar nav item should show as current for the given pathname. */
export function isNavItemActive(pathname: string, href: string, basePath: string): boolean {
  const normalizedPath =
    pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  const normalizedHref =
    href.length > 1 && href.endsWith("/") ? href.slice(0, -1) : href;

  if (normalizedHref === "/") {
    return normalizedPath === "/";
  }

  if (normalizedHref === basePath) {
    return normalizedPath === basePath;
  }

  return (
    normalizedPath === normalizedHref ||
    normalizedPath.startsWith(`${normalizedHref}/`)
  );
}
