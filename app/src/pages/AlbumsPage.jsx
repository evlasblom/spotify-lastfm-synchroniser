import React from 'react';

import * as spotifyApi from '../services/spotifyApi'
import * as lastfmApi from '../services/lastfmApi'
import useLocalStorage from '../hooks/useLocalStorage'

import ContentList from '../components/ContentList';
import * as constants from '../constants'

// ========== COMPONENTS ==================================================

// ...

// ========== MAIN ==================================================

function AlbumsPage(props) {
  const [_access_token, ] = useLocalStorage(constants.token_key, null)
  const [_username, ] = useLocalStorage(constants.user_key, null)

  const access_key = process.env.REACT_APP_LASTFM_ACCESS_KEY

  return (
    <>
      <h2>Albums</h2>
      <br></br>
      <br></br>
      <div className="d-flex flex-row flex-wrap justify-content-center">

        <ContentList 
          type="albums"
          target="Spotify"
          request={() => spotifyApi.requestSavedAlbums(_access_token, {limit : 50})}
          convert={spotifyApi.convertAlbums}/>

        <ContentList 
          type="albums"
          target="Last.fm"
          request={() => lastfmApi.requestTopAlbums(access_key, {user : _username})}
          convert={lastfmApi.convertAlbums}/>

      </div>
    </>
  )
}

export default AlbumsPage;