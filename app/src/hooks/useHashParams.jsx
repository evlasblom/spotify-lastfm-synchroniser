import { useState } from 'react';

/**
 * React hook for using parameters from the hash of the URL.
 * @return An object with the hash parameters.
 */
function useHashParams() {
  const [params, ] = useState(() => {
    let hashParams = {};
    let e, r = /([^&;=]+)=?([^&;]*)/g;
    let q = window.location.hash.substring(1);
    while ( e = r.exec(q)) {
      hashParams[e[1]] = decodeURIComponent(e[2]);
    }
    return hashParams;
  })
  return params;
}

export default useHashParams;