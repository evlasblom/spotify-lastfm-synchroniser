import React from 'react';

import * as spotifyApi from '../services/spotifyApi'
import * as lastfmApi from '../services/lastfmApi'

import ContentPage from '../components/ContentPage'
import { filterOnPlaycount, filterExclusiveId, compareTracks, normalizeArtistName, normalizeTrackName } from '../filters'

const initial_selection = {period: 'overall', number: 20, playcount: 25 };

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

function TracksList(props) {
  const tracks = props.data;
  const target = props.target;
  const limit = props.playcount ? props.playcount : 0;
  const exclusive = props.exclusive;

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

function TracksPage(props) {

  return (
    <ContentPage 
      title="Tracks"
      selection={initial_selection} 
      computeExclusive={computeExclusive}
      clearSpotify={clearSpotify}
      importSpotify={importSpotify}
      getSpotify={getSpotify}
      getLastFm={getLastFm}
      list={<TracksList />} />
  )
}

export default TracksPage;