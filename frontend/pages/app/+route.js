// Matches /app and everything under it; the SPA does its own internal routing.
export default (pageContext) => pageContext.urlPathname.startsWith('/app');
