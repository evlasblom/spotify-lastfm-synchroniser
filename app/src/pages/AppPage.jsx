import React from 'react';

import * as spotifyApi from '../services/spotifyApi'
import * as lastfmApi from '../services/lastfmApi'
import useLocalStorage from '../hooks/useLocalStorage'

import * as constants from '../constants'

function AppPage(props) {
  const [stored_token, ] = useLocalStorage(constants.token_key, null)

  return "..."
}

export default AppPage;