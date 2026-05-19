import { navigate } from 'vike/client/router';
import { getPathFromPage } from './routing';

// Marketing page components expect onNavigate/onGetStarted/onSignIn/currentPage.
// This adapts those callbacks onto Vike's client-side router.
export function marketingNavProps(currentPage) {
  return {
    currentPage,
    onNavigate: (page) => navigate(getPathFromPage(page)),
    onGetStarted: () => navigate('/app?mode=register'),
    onSignIn: () => navigate('/app?mode=login'),
  };
}
