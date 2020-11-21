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
import { filterOnPlaycount, filterExclusiveId, compareTracks } from '../filters'

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
  let ids = tracks.map(track => track.id);
  return await spotifyApi.setSavedTracks(access_token, {ids: ids});
}

const searchTracksSpotify = async (access_token, tracks) => {
  let updated = tracks;
  for (let track of updated) {
    let query = 'artist:"' + track.artist[0].name + '" track:"' + track.name + '"';
    let response = await spotifyApi.searchTrack(access_token, { q: query});
    let results = spotifyApi.parseTracks(response.data.tracks.items);

    // copy the spotify id of the search result
    if (results.length >= 1) {
      if (compareTracks(track, results[0])) {
        track.id = results[0].id;
      }
      else {
        console.log("Could not match track " + track.name + " / " + results[0].name);
      }
    }
    else {
      console.log("Could not find track " + query);
    }
  }
  return updated;
}

const computeExclusiveTracks = async (access_token, tracksSpotify, tracksLastFm, playcount) => {
  // search for spotify ids and update the filtered lastfm tracks
  const tmpLastfm = await searchTracksSpotify(access_token, tracksLastFm.filter(filterOnPlaycount(playcount)));
  // cross-compare the ids of the spotify tracks with the found spotify ids of the filtered lastfm tracks
  const onlyOnSpotify = tracksSpotify.filter(filterExclusiveId(tmpLastfm));
  // cross-compare the found spotify ids of the filtered lastfm tracks with with the ids of the spotify tracks
  const onlyOnLastFm = tmpLastfm.filter(filterExclusiveId(tracksSpotify));
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
  const [computing, setComputing] = useState(false);

  const tracksSpotify = useAsync(
    () => getTracksSpotify(access_token, {}), []);
  const tracksLastFm = useAsync(
    () => getTracksLastFm(access_key, createOpts()), [selection.period, selection.number]);

  const [onlyOnSpotify, setOnlyOnSpotify] = useState([]);
  const [onlyOnLastFm, setOnlyOnLastFm] = useState([]);
      
  const createOpts = () => { return {user: username, period: selection.period, limit: selection.number}};

  return (
    <>
      <h2>Tracks</h2>
      <br></br>

      <SelectionForm 
        onSubmit={(val) => {
          setSelection(val);
          setOnlyOnSpotify([]); 
          setOnlyOnLastFm([]); 
        }}
        initial={initial_selection} />
      <br></br>

      <ActionForm 
        text="Compare" 
        modal="This will cross-compare your Spotify and Last.fm tracks. Proceed?"
        variant="primary" 
        onSubmit={() => {
          setComputing(true);
          return computeExclusiveTracks(access_token, tracksSpotify.result, tracksLastFm.result, selection.playcount)
        }}
        onResult={(res) => {
          setComputing(false);
          setOnlyOnSpotify(res.spotify); 
          setOnlyOnLastFm(res.lastfm); 
        }} />
      <br></br>

      <ActionForm 
        text="Clear" 
        modal="This will clear all tracks from Spotify that are not in your current top track selection on Last.fm."
        variant="danger" 
        onSubmit={() => clearTracksSpotify(access_token, onlyOnSpotify)}
        onResult={(res) => tracksSpotify.execute()} />
      <br></br>

      <ActionForm 
        text="Import" 
        modal="This will import all tracks into Spotify that are in your current top track selection on Last.fm."
        variant="success" 
        onSubmit={() => importTracksSpotify(access_token, onlyOnLastFm)}
        onResult={(res) => tracksSpotify.execute()} />
      <br></br>
      <br></br>

      <div style={{height: "2rem"}}>
        {/* {computing ? "Computing differences..." : ""} */}
      </div>
      <br></br>

      <div className="d-flex flex-row flex-wrap justify-content-center">

        <TracksList 
          target="Spotify"
          playcount={selection.playcount}
          loading={tracksSpotify.loading || computing}
          error={tracksSpotify.error}
          data={tracksSpotify.result}
          exclusive={onlyOnSpotify}
          exclusiveClass="text-danger" />
        
        <TracksList 
          target="Last.fm"
          playcount={selection.playcount}
          loading={tracksLastFm.loading || computing}
          error={tracksLastFm.error}
          data={tracksLastFm.result} 
          exclusive={onlyOnLastFm}
          exclusiveClass="text-success" />

      </div>
    </>
  )
}

export default TracksPage;