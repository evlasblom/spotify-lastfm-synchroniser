import { useState } from 'react';
import qs from 'qs';

/**
 * React hook for using parameters from the search of the URL.
 * @return An object with the search parameters.
 */
function useSearchParams() {
  const [params, ] = useState(() => {
    return qs.parse(window.location.search.substring(1))
  })
  return params;
}

export default useSearchParams;