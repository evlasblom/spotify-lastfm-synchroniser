import React from 'react';

import * as spotifyApi from '../services/spotifyApi'
import * as lastfmApi from '../services/lastfmApi'
import useLocalStorage from '../hooks/useLocalStorage'

import ContentList from '../components/ContentList';
import * as constants from '../constants'

// ========== COMPONENTS ==================================================

// ...

// ========== MAIN ==================================================

function TracksPage(props) {
  const [_access_token, ] = useLocalStorage(constants.token_key, null)
  const [_username, ] = useLocalStorage(constants.user_key, null)

  const access_key = process.env.REACT_APP_LASTFM_ACCESS_KEY

  return (
    <>
      <h2>Tracks</h2>
      <br></br>
      <br></br>
      <div className="d-flex flex-row flex-wrap justify-content-center">

        <ContentList 
          type="tracks"
          target="Spotify"
          request={() => spotifyApi.getSavedTracks(_access_token, {limit : 50})}
          parse={(response) => spotifyApi.parseTracks(response.data.items)}/>

        <ContentList 
          type="tracks"
          target="Last.fm"
          request={() => lastfmApi.getTopTracks(access_key, {user : _username})}
          parse={(response) => lastfmApi.parseTracks(response.data.toptracks.track)}/>

      </div>
    </>
  )
}

export default TracksPage;