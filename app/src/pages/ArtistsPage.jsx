import React from 'react';
import { useAsync } from 'react-async-hook'

import Alert from 'react-bootstrap/Alert'
import Spinner from 'react-bootstrap/Spinner'

import * as spotifyApi from '../services/spotifyApi'
import * as lastfmApi from '../services/lastfmApi'
import useLocalStorage from '../hooks/useLocalStorage'

import * as constants from '../constants'

// ========== FUNCTIONS ==================================================

const getArtistsSpotify = async (access_token) => {
  let response = await spotifyApi.getFollowingArtists(access_token, {});
  return spotifyApi.parseArtists(response.data.artists.items);
}

const getArtistsLastFm = async (access_key, username) => {
  let response = await lastfmApi.getTopArtists(access_key, {user : username});
  return lastfmApi.parseArtists(response.data.topartists.artist);
}

// ========== COMPONENTS ==================================================

function ArtistsList(props) {
  const loading = props.loading;
  const error = props.error;
  const artists = props.data;
  const target = props.target;

  // check if loading
  if (loading) {
    return (
      <div style={{ width: '25rem', margin: '2rem'}}>
          <Spinner animation="border" variant="info"/>
      </div>
    )
  }

  // check if error
  else if (error) {
    return (
      <div style={{ width: '25rem', margin: '2rem'}}>
        <Alert variant="danger" className="pt-auto">{error.message}.</Alert>
      </div>
    )
  }

  // otherwise success
  return (
    <div style={{ width: '25rem', margin: '2rem'}}>
      <b>{target}</b>
      <br></br>
      <br></br>
      {artists.map((artist, i) => {
        return <p key={i}>{artist.name}</p>
      })}
    </div>
  )
}

// ========== MAIN ==================================================

function ArtistsPage(props) {
  const [access_token, ] = useLocalStorage(constants.token_key, null);
  const [username, ] = useLocalStorage(constants.user_key, null);

  const access_key = process.env.REACT_APP_LASTFM_ACCESS_KEY

  const asyncArtistsSpotify = useAsync(getArtistsSpotify, [access_token]);
  const asyncArtistsLastFm = useAsync(getArtistsLastFm, [access_key, username]);

  return (
    <>
      <h2>Artists</h2>
      <br></br>
      <br></br>
      <div className="d-flex flex-row flex-wrap justify-content-center">

        <ArtistsList 
          className="m-2"
          target="Spotify"
          loading={asyncArtistsSpotify.loading}
          error={asyncArtistsSpotify.error}
          data={asyncArtistsSpotify.result} />
        
        <ArtistsList 
          className="m-2"
          target="Last.fm"
          loading={asyncArtistsLastFm.loading}
          error={asyncArtistsLastFm.error}
          data={asyncArtistsLastFm.result} />

      </div>
    </>
  )
}

export default ArtistsPage;