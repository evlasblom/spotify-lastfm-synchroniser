import React from 'react';

import * as spotifyApi from '../services/spotifyApi'
import * as lastfmApi from '../services/lastfmApi'
import useLocalStorage from '../hooks/useLocalStorage'

import ContentList from '../components/ContentList';
import * as constants from '../constants'

// ========== COMPONENTS ==================================================

// ...

// ========== MAIN ==================================================

function ArtistsPage(props) {
  const [_access_token, ] = useLocalStorage(constants.token_key, null)
  const [_username, ] = useLocalStorage(constants.user_key, null)

  const access_key = process.env.REACT_APP_LASTFM_ACCESS_KEY

  return (
    <>
      <h2>Artists</h2>
      <br></br>
      <br></br>
      <div className="d-flex flex-row flex-wrap justify-content-center">

        <ContentList 
          type="artists"
          target="Spotify"
          request={() => spotifyApi.getFollowingArtists(_access_token, {limit : 20})}
          parse={(response) => spotifyApi.parseArtists(response.data.artists.items)}/>

        <ContentList 
          type="artists"
          target="Last.fm"
          request={() => lastfmApi.getTopArtists(access_key, {user : _username, limit: 20})}
          parse={(response) => lastfmApi.parseArtists(response.data.topartists.artist)}/>

      </div>
    </>
  )
}

export default ArtistsPage;