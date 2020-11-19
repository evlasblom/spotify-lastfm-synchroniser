import React, { useState, useEffect } from 'react';
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

const initial_selection = {period: 'overall', number: 20, playcount: 25 };

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

function compareTracks(one, two) {
  return one && two && one.name === two.name && one.artist[0].name === two.artist[0].name
}

function comparePlaycount(track, limit) {
  return track && track.playcount < limit
}

function compareWith(otherArray) {
  return function(current) {
    return otherArray.filter(function(other) {
      return compareTracks(other, current)
    }).length === 0;
  }
}

// ========== COMPONENTS ==================================================

function TracksList(props) {
  const loading = props.loading;
  const error = props.error;
  const tracks = props.data;
  const target = props.target;
  const limit = props.playcount ? props.playcount : 0;
  const exclusive = props.exclusive;

  // check if loading
  if (loading) {
    return <Loading style={{ width: '25rem'}} className="mr-2 ml-2" />
  }

  // check if error
  else if (error) {
    return <Error style={{ width: '25rem'}} className="mr-2 ml-2" error={error} />
  }
  
  // otherwise success
  let j = 0;
  return (
    <div style={{ width: '25rem'}} className="mr-2 ml-2">
      <b>{target}</b>
      <br></br>
      <br></br>
      {tracks.map((track, i) => {
        let class_name = ""
        if (compareTracks(track, exclusive[j])) { j++; class_name = props.exclusiveClass}
        if (comparePlaycount(track, limit)) class_name = "text-muted";
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

  const [selection, setSelection] = useState(initial_selection);

  const tracksSpotify = useAsync(
    () => getTracksSpotify(access_token, {}), []);
  const tracksLastFm = useAsync(
    () => getTracksLastFm(access_key, createOpts()), [selection.period, selection.number]);

  const [onlyOnSpotify, setOnlyOnSpotify] = useState([]);
  const [onlyOnLastFm, setOnlyOnLastFm] = useState([]);
      
  useEffect(() => {
    if (!tracksSpotify.result || !tracksLastFm.result) return
    let onlyOnSpotify = tracksSpotify.result.filter(compareWith(tracksLastFm.result));
    setOnlyOnSpotify(onlyOnSpotify); // this list may removed from spotify
    let onlyOnLastFm = tracksLastFm.result.filter(compareWith(tracksSpotify.result));
    setOnlyOnLastFm(onlyOnLastFm); // this list may be added to spotify
  }, [tracksSpotify.result, tracksLastFm.result])

  const createOpts = () => { return {user: username, period: selection.period, limit: selection.number}};

  return (
    <>
      <h2>Albums</h2>
      <br></br>
      <SelectionForm onSubmit={setSelection} initial={initial_selection} />
      <br></br>
      <ActionForm onClear={console.log} onImport={console.log} />
      <br></br>
      <br></br>
      <div className="d-flex flex-row flex-wrap justify-content-center">

        <TracksList 
          target="Spotify"
          playcount={selection.playcount}
          loading={tracksSpotify.loading}
          error={tracksSpotify.error}
          data={tracksSpotify.result}
          exclusive={onlyOnSpotify}
          exclusiveClass="text-danger" />
        
        <TracksList 
          target="Last.fm"
          playcount={selection.playcount}
          loading={tracksLastFm.loading}
          error={tracksLastFm.error}
          data={tracksLastFm.result} 
          exclusive={onlyOnLastFm}
          exclusiveClass="text-success" />

      </div>
    </>
  )
}

export default AlbumsPage;