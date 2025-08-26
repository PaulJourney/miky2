import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  // A list of all locales that are supported
  locales: ['en', 'it', 'es'],

  // Used when no locale matches
  defaultLocale: 'en',

  // Always redirect to locale-prefixed paths
  localePrefix: 'always'
});

export const config = {
  // Match all pathnames except for
  // - API routes
  // - _next static files
  // - _vercel internal files
  // - files with file extensions
  matcher: [
    '/((?!api|_next|_vercel|.*\\..*).*)'
  ]
};
