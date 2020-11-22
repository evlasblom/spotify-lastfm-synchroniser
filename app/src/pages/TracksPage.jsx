import React, { useState, useEffect } from 'react';
import { useAsync, useAsyncCallback } from 'react-async-hook'

import * as spotifyApi from '../services/spotifyApi'
import * as lastfmApi from '../services/lastfmApi'
import useLocalStorage from '../hooks/useLocalStorage'

import ActionForm from '../components/ActionForm'
import Error from '../components/Error'
import Loading from '../components/Loading'
import SelectionForm from '../components/SelectionForm'
import * as constants from '../constants'
import { filterOnPlaycount, filterExclusiveId, compareTracks, normalizeArtistName, normalizeTrackName } from '../filters'

// ========== CONSTANTS ==================================================

const initial_selection = {period: 'overall', number: 20, playcount: 25 };

const access_key = process.env.REACT_APP_LASTFM_ACCESS_KEY;

// ========== FUNCTIONS ==================================================

const getSpotify = async (access_token, opts) => {
  let response = await spotifyApi.getSavedTracks(access_token, opts);
  return spotifyApi.parseTracks(response.data.items);
}

const getLastFm = async (access_key, opts) => {
  let response = await lastfmApi.getTopTracks(access_key, opts);
  return lastfmApi.parseTracks(response.data.toptracks.track);
}

const clearSpotify = async (access_token, tracks) => {
  let ids = tracks.map(track => track.id);
  return await spotifyApi.removeSavedTracks(access_token, {ids: ids});
}

const importSpotify = async (access_token, tracks) => {
  let ids = tracks.map(track => track.id);
  return await spotifyApi.setSavedTracks(access_token, {ids: ids});
}

const searchSpotify = async (access_token, tracks) => {
  let updated = tracks;
  for (const track of updated) {
    let query = '"' + normalizeArtistName(track.artist[0].name) + '" "' + normalizeTrackName(track.name) + '"';
    let response = await spotifyApi.searchTrack(access_token, { q: query});
    let results = spotifyApi.parseTracks(response.data.tracks.items);

    // copy the spotify id of the search result
    track.id = undefined;
    for (const result of results) {
      if (compareTracks(track, result)) {
        track.id = result.id;
        break;
      }
    }
    if (results.length === 0) {
      console.log("Could not find track " + query);
    }
    else if (!track.id) {
      console.log("Could not match track " + track.name + " / " + results[0].name);
    }
  }
  return updated;
}

const computeExclusive = async (access_token, tracksSpotify, tracksLastFm, playcount) => {
  // search for spotify ids and update the filtered lastfm tracks
  const filteredLastFm = await searchSpotify(access_token, tracksLastFm.filter(filterOnPlaycount(playcount)));
  // cross-compare the ids of the spotify tracks with the found spotify ids of the filtered lastfm tracks
  const onlyOnSpotify = tracksSpotify.filter(filterExclusiveId(filteredLastFm));
  // cross-compare the found spotify ids of the filtered lastfm tracks with with the ids of the spotify tracks
  const onlyOnLastFm = filteredLastFm.filter(filterExclusiveId(tracksSpotify));
  // return results
  return {
    spotify: onlyOnSpotify,
    lastfm: onlyOnLastFm
  };
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
        if (!filterOnPlaycount(limit)(track)) class_name = "text-muted";
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

function TracksPage(props) {
  const [access_token, ] = useLocalStorage(constants.token_key, null);
  const [username, ] = useLocalStorage(constants.user_key, null);

  const [selection, setSelection] = useState(initial_selection);
  
  const exclusiveAsync = useAsyncCallback(
    () => computeExclusive(access_token, tracksSpotify.result, tracksLastFm.result, selection.playcount)
  );
  const clearSpotifyAsync = useAsyncCallback(
    () => clearSpotify(access_token, onlyOnSpotify)
  );
  const importSpotifyAsync = useAsyncCallback(
    () => importSpotify(access_token, onlyOnLastFm)
  );

  const tracksSpotify = useAsync(
    () => getSpotify(access_token, {}), [clearSpotifyAsync.result, importSpotifyAsync.result]);
  const tracksLastFm = useAsync(
    () => getLastFm(access_key, createOpts()), [selection.period, selection.number]);

  const [onlyOnSpotify, setOnlyOnSpotify] = useState([]);
  const [onlyOnLastFm, setOnlyOnLastFm] = useState([]);

  const createOpts = () => { return {user: username, period: selection.period, limit: selection.number}};

  useEffect(() => {
    if (exclusiveAsync.result && !exclusiveAsync.loading && !exclusiveAsync.error) {
      setOnlyOnSpotify(exclusiveAsync.result.spotify);
      setOnlyOnLastFm(exclusiveAsync.result.lastfm);
    }
  }, [exclusiveAsync.result, exclusiveAsync.loading, exclusiveAsync.error])

  useEffect(() => {
    setOnlyOnSpotify([]);
  }, [clearSpotifyAsync.result, selection.period, selection.number])

  useEffect(() => {
    setOnlyOnLastFm([]);
  }, [importSpotifyAsync.result, selection.period, selection.number])

  return (
    <>
      <h2>Tracks</h2>
      <br></br>

      <SelectionForm onSubmit={setSelection} initial={initial_selection} />
      <br></br>

      <ActionForm 
        text={exclusiveAsync.loading ? "..." : "Compare"}
        modal="This will cross-compare your Spotify and Last.fm tracks. Proceed?"
        variant="primary" 
        disabled={!tracksSpotify.result || !tracksLastFm.result || tracksSpotify.error || tracksLastFm.error}
        onSubmit={exclusiveAsync.execute} />
      <br></br>

      <ActionForm 
        text={clearSpotifyAsync.loading ? "..." : "Clear"}
        modal="This will clear all tracks from Spotify that are not in your current top track selection on Last.fm. Are you sure?"
        variant="danger" 
        disabled={onlyOnSpotify.length === 0}
        onSubmit={clearSpotifyAsync.execute} />
      <br></br>

      <ActionForm 
        text={importSpotifyAsync.loading ? "..." : "Import"}
        modal="This will import all tracks into Spotify that are in your current top track selection on Last.fm. Are you sure?"
        variant="success" 
        disabled={onlyOnLastFm.length === 0}
        onSubmit={importSpotifyAsync.execute} />
      <br></br>

      <div style={{height: "2rem"}} className="p-1">
        {tracksSpotify.loading || tracksLastFm.loading ? "Loading data..." : ""}
        {exclusiveAsync.loading ? "Comparing data..." : ""}
        {clearSpotifyAsync.loading ? "Clearing data from Spotify..." : ""}
        {importSpotifyAsync.loading ? "Importing data into Spotify..." : ""}

        {exclusiveAsync.error ? <span className="text-danger">{exclusiveAsync.error.message}</span> : ""}
        {clearSpotifyAsync.error ? <span className="text-danger">{clearSpotifyAsync.error.message}</span> : ""}
        {importSpotifyAsync.error ? <span className="text-danger">{importSpotifyAsync.error.message}</span> : ""}
      </div>
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

export default TracksPage;