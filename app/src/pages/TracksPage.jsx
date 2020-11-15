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
          request={() => spotifyApi.requestSavedTracks(_access_token, {limit : 50})}
          convert={spotifyApi.convertTracks}/>

        <ContentList 
          type="tracks"
          target="Last.fm"
          request={() => lastfmApi.requestTopTracks(access_key, {user : _username})}
          convert={lastfmApi.convertTracks}/>

      </div>
    </>
  )
}

export default TracksPage;