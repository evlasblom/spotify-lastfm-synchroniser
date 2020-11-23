import { useState } from 'react';
import qs from 'qs';

/**
 * React hook for using location properties.
 * @return An object with the location properties.
 */
function useLocation() {
  const [properties, ] = useState(() => {
    return {
        ...window.location,
        hashParams: qs.parse(window.location.hash.substring(1)),
        searchParams: qs.parse(window.location.search.substring(1))
    };
  })
  return properties;
}

export default useLocation;