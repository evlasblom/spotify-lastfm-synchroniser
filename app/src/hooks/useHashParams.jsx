import { useState } from 'react';
import qs from 'qs';

/**
 * React hook for using parameters from the hash of the URL.
 * @return An object with the hash parameters.
 */
function useHashParams() {
  const [params, ] = useState(() => {
    return qs.parse(window.location.hash.substring(1))
  })
  return params;
}

export default useHashParams;