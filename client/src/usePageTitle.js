import { useEffect } from 'react';
import { STRINGS } from './strings';

// Sets the browser tab title for the current page: "<title> — Rijisha Jewellers".
export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} — ${STRINGS.common.brand}` : STRINGS.common.brand;
    return () => { document.title = STRINGS.common.brand; };
  }, [title]);
}
