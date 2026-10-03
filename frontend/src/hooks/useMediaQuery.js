// Custom React hook measuring viewport width via matchMedia queries.
// Returns boolean flags for desktop (>=1024px) and mobile (<768px) layout switching.
// Enables adaptive responsive component rendering across devices per Section 11.

import { useState, useEffect } from 'react';

// Evaluates media query string and returns live boolean matching state.
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    const handler = (event) => setMatches(event.matches);

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

// Convenience hook returning boolean states for desktop and mobile viewports.
export function useScreenSize() {
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const isMobile = useMediaQuery('(max-width: 767px)');
  return { isDesktop, isMobile };
}
