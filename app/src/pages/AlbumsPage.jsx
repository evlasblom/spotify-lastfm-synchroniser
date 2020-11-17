import React from 'react';
import { useAsync } from 'react-async-hook'

import Alert from 'react-bootstrap/Alert'
import Spinner from 'react-bootstrap/Spinner'

import * as spotifyApi from '../services/spotifyApi'
import * as lastfmApi from '../services/lastfmApi'
import useLocalStorage from '../hooks/useLocalStorage'

import * as constants from '../constants'

// ========== FUNCTIONS ==================================================

const getAlbumsSpotify = async (access_token) => {
  let response = await spotifyApi.getSavedAlbums(access_token, {});
  return spotifyApi.parseAlbums(response.data.items);
}

const getAlbumsLastFm = async (access_key, username) => {
  let response = await lastfmApi.getTopAlbums(access_key, {user : username});
  return lastfmApi.parseAlbums(response.data.topalbums.album);
}

// ========== COMPONENTS ==================================================

function AlbumsList(props) {
  const loading = props.loading;
  const error = props.error;
  const albums = props.data;
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
      {albums.map((album, i) => {
        return (<p key={i}>
          {album.name}
          <br></br>
          <i>{album.artist[0].name}</i>
          </p>)
      })}
    </div>
  )
}

// ========== MAIN ==================================================

function AlbumsPage(props) {
  const [access_token, ] = useLocalStorage(constants.token_key, null);
  const [username, ] = useLocalStorage(constants.user_key, null);

  const access_key = process.env.REACT_APP_LASTFM_ACCESS_KEY

  const asyncAlbumsSpotify = useAsync(getAlbumsSpotify, [access_token]);
  const asyncAlbumsLastFm = useAsync(getAlbumsLastFm, [access_key, username]);

  return (
    <>
      <h2>Albums</h2>
      <br></br>
      <br></br>
      <div className="d-flex flex-row flex-wrap justify-content-center">

        <AlbumsList 
          className="m-2"
          target="Spotify"
          loading={asyncAlbumsSpotify.loading}
          error={asyncAlbumsSpotify.error}
          data={asyncAlbumsSpotify.result} />
        
        <AlbumsList 
          className="m-2"
          target="Last.fm"
          loading={asyncAlbumsLastFm.loading}
          error={asyncAlbumsLastFm.error}
          data={asyncAlbumsLastFm.result} />

      </div>
    </>
  )
}

export default AlbumsPage;