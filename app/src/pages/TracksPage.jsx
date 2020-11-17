import React, { useState } from 'react';
import { useAsync } from 'react-async-hook'

import * as spotifyApi from '../services/spotifyApi'
import * as lastfmApi from '../services/lastfmApi'
import useLocalStorage from '../hooks/useLocalStorage'

import ActionForm from '../components/ActionForm'
import Error from '../components/Error'
import Loading from '../components/Loading'
import SelectionForm from '../components/SelectionForm'
import * as constants from '../constants'

// ========== CONSTANTS ==================================================

const initial_form = {period: 'overall', number: 20, playcount: 25 };

const initial_action = 'add';

const access_key = process.env.REACT_APP_LASTFM_ACCESS_KEY;

// ========== FUNCTIONS ==================================================

const getTracksSpotify = async (access_token, opts) => {
  let response = await spotifyApi.getSavedTracks(access_token, opts);
  return spotifyApi.parseTracks(response.data.items);
}

const getTracksLastFm = async (access_key, opts) => {
  let response = await lastfmApi.getTopTracks(access_key, opts);
  return lastfmApi.parseTracks(response.data.toptracks.track);
}

// ========== COMPONENTS ==================================================

function TracksList(props) {
  const loading = props.loading;
  const error = props.error;
  const tracks = props.data;
  const target = props.target;
  const limit = props.playcount ? props.playcount : 0;

  // check if loading
  if (loading) {
    return <Loading style={{ width: '25rem'}} className="mr-2 ml-2" />
  }

  // check if error
  else if (error) {
    return <Error style={{ width: '25rem'}} className="mr-2 ml-2" error={error} />
  }
  
  // otherwise success
  return (
    <div style={{ width: '25rem'}} className="mr-2 ml-2">
      <b>{target}</b>
      <br></br>
      <br></br>
      {tracks.map((track, i) => {
        const class_name = track.playcount < limit ? "text-muted" : ""
        return (
          <p key={i} className={class_name}>
            {i + 1}. {track.name}
            {track.playcount ? (" - " + track.playcount) : ""}
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

  const [form, setForm] = useState(initial_form);
  const [action, setAction] = useState(initial_action);

  const tracksSpotify = useAsync(
    () => getTracksSpotify(access_token, {}), []);
  const tracksLastFm = useAsync(
    () => getTracksLastFm(access_key, createOpts()), [form.period, form.number]);

  const createOpts = () => { return {user: username, period: form.period, limit: form.number}};

  return (
    <>
      <h2>Albums</h2>
      <br></br>
      <SelectionForm onSubmit={setForm} initial={initial_form} />
      <br></br>
      <ActionForm onSubmit={setAction} initial={initial_action} />
      <br></br>
      <br></br>
      <div className="d-flex flex-row flex-wrap justify-content-center">

        <TracksList 
          target="Spotify"
          playcount={form.playcount}
          loading={tracksSpotify.loading}
          error={tracksSpotify.error}
          data={tracksSpotify.result} />
        
        <TracksList 
          target="Last.fm"
          playcount={form.playcount}
          loading={tracksLastFm.loading}
          error={tracksLastFm.error}
          data={tracksLastFm.result} />

      </div>
    </>
  )
}

export default AlbumsPage;