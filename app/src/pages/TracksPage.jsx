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
import { filterOnPlaycount, filterExclusiveTracks, compareTracks } from '../filters'

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

const clearTracksSpotify = async (access_token, tracks) => {
  let ids = tracks.map(track => track.id);
  return await spotifyApi.removeSavedTracks(access_token, {ids: ids});
}

const importTracksSpotify = async (access_token, tracks) => {
  let ids = [];
  // get the spotify ids by performing a search
  for (const track of tracks) {
    let query = 'artist:"' + track.artist[0].name + '" track:"' + track.name + '"';
    let response = await spotifyApi.searchTrack(access_token, { q: query});
    let results = spotifyApi.parseTracks(response.data.tracks.items);
    // lets assume the top result is always correct
    if (results) {
      ids.push(results[0].id);
    }
    else {
      console.log("Could not find track " + query);
    }
  }
  // save matched tracks
  return await spotifyApi.setSavedTracks(access_token, {ids: ids});
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

function AlbumsPage(props) {
  const [access_token, ] = useLocalStorage(constants.token_key, null);
  const [username, ] = useLocalStorage(constants.user_key, null);

  const [selection, setSelection] = useState(initial_selection);
  const [computing, setComputing] = useState(false);

  const tracksSpotify = useAsync(
    () => getTracksSpotify(access_token, {}), []);
  const tracksLastFm = useAsync(
    () => getTracksLastFm(access_key, createOpts()), [selection.period, selection.number]);

  const [onlyOnSpotify, setOnlyOnSpotify] = useState([]);
  const [onlyOnLastFm, setOnlyOnLastFm] = useState([]);
      
  useEffect(() => {
    if (!tracksSpotify.result || !tracksLastFm.result) return
    setComputing(true);
    async function computeExclusive() {
      // cross-compare spotify tracks with filtered lastfm tracks
      let onlyOnSpotify = 
        tracksSpotify.result.filter(filterExclusiveTracks(tracksLastFm.result.filter(filterOnPlaycount(selection.playcount))));
      // save exclusive list
      setOnlyOnSpotify(onlyOnSpotify);
      // cross-compare lastm fm tracks with spotify tracks and filter
      let onlyOnLastFm = 
        tracksLastFm.result.filter(filterExclusiveTracks(tracksSpotify.result)).filter(filterOnPlaycount(selection.playcount));
      // save exclusive list
      setOnlyOnLastFm(onlyOnLastFm);
      // reset computing state
      setComputing(false);
    }
    computeExclusive();
  }, [tracksSpotify.result, tracksLastFm.result, selection.playcount])

  const createOpts = () => { return {user: username, period: selection.period, limit: selection.number}};

  return (
    <>
      <h2>Tracks</h2>
      <br></br>
      <SelectionForm onSubmit={setSelection} initial={initial_selection} />
      <br></br>
      <ActionForm 
        text="Clear" 
        modal="This will clear all tracks from Spotify that are not in your current top track selection on Last.fm."
        variant="danger" 
        onSubmit={() => clearTracksSpotify(access_token, onlyOnSpotify)}
        onResult={tracksSpotify.execute} />
      <br></br>
      <ActionForm 
        text="Import" 
        modal="This will import all tracks into Spotify that are in your current top track selection on Last.fm."
        variant="success" 
        onSubmit={() => importTracksSpotify(access_token, onlyOnLastFm)}
        onResult={tracksSpotify.execute} />
      <br></br>
      <br></br>
      <div style={{height: "2rem"}}>
        {computing ? "Computing differences..." : ""}
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

export default AlbumsPage;