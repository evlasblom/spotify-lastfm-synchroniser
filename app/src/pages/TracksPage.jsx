import React from 'react';
import { useAsync } from 'react-async-hook'

import Alert from 'react-bootstrap/Alert'
import Spinner from 'react-bootstrap/Spinner'

import * as spotifyApi from '../services/spotifyApi'
import * as lastfmApi from '../services/lastfmApi'
import useLocalStorage from '../hooks/useLocalStorage'

import * as constants from '../constants'

// ========== FUNCTIONS ==================================================

const getTracksSpotify = async (access_token) => {
  let response = await spotifyApi.getSavedTracks(access_token, {});
  return spotifyApi.parseTracks(response.data.items);
}

const getTracksLastFm = async (access_key, username) => {
  let response = await lastfmApi.getTopTracks(access_key, {user : username});
  return lastfmApi.parseTracks(response.data.toptracks.track);
}

// ========== COMPONENTS ==================================================

function TracksList(props) {
  const loading = props.loading;
  const error = props.error;
  const tracks = props.data;
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
      {tracks.map((track, i) => {
        return (<p key={i}>
          {track.name}
          <br></br>
          <i>{track.artist[0].name}</i>
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

  const asyncTracksSpotify = useAsync(getTracksSpotify, [access_token]);
  const asyncTracksLastFm = useAsync(getTracksLastFm, [access_key, username]);

  return (
    <>
      <h2>Albums</h2>
      <br></br>
      <br></br>
      <div className="d-flex flex-row flex-wrap justify-content-center">

        <TracksList 
          className="m-2"
          target="Spotify"
          loading={asyncTracksSpotify.loading}
          error={asyncTracksSpotify.error}
          data={asyncTracksSpotify.result} />
        
        <TracksList 
          className="m-2"
          target="Last.fm"
          loading={asyncTracksLastFm.loading}
          error={asyncTracksLastFm.error}
          data={asyncTracksLastFm.result} />

      </div>
    </>
  )
}

export default AlbumsPage;