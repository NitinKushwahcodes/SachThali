// Custom React hook detecting whether the web app is running in installed PWA standalone mode.
// Safely queries display-mode: standalone media query within useEffect for SSR compliance.
// Used by layout components to adjust navigation presentation for PWA users.

import { useState, useEffect } from 'react';

// Checks whether window display-mode is standalone installed PWA.
export function useInstalledState() {
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
      setIsInstalled(!!isStandalone);
    }
  }, []);

  return isInstalled;
}
