import React from 'react';

import * as spotifyApi from '../services/spotifyApi'
import * as lastfmApi from '../services/lastfmApi'

import ContentPage from '../components/ContentPage'

import { filterOnPlaycount, filterExclusiveId, compareTracks, normalizeArtistName, normalizeTrackName } from '../filters'

const initial_selection = {period: 'overall', number: 1000, playcount: 30 };

const getSpotifyTracks = async (access_token, opts) => {
  let items = [];
  let offset = 0;
  let total = 1;
  while (total > offset) {
    let response = await spotifyApi.getSavedTracks(access_token, {...opts, offset: offset});
    total = response.data.total;
    offset = offset + opts.limit;
    items = [...items, ...response.data.items];
  }
  return spotifyApi.parseTracks(items);
}

const getLastFmTracks = async (access_key, opts) => {
  let items = [];
  let page = 0;
  while (opts.number > page * opts.limit) {
    let index = Math.min(opts.limit, opts.number - page * opts.limit)
    let response = await lastfmApi.getTopTracks(access_key, {...opts, page: ++page});
    items = [...items, ...response.data.toptracks.track.slice(0, index)];
  }
  return lastfmApi.parseTracks(items);
}

const clearSpotifyTracks = async (access_token, tracks) => {
  let ids = tracks.map(track => track.id);
  while (ids.length > 0) {
    let options = {ids: ids.splice(0, spotifyApi.LIMIT_PER_PAGE)};
    await spotifyApi.removeSavedTracks(access_token, options);
  }
  return {};
}

const importSpotifyTracks = async (access_token, tracks) => {
  let ids = tracks.map(track => track.id);
  while (ids.length > 0) {
    let options = {ids: ids.splice(0, spotifyApi.LIMIT_PER_PAGE)};
    await spotifyApi.setSavedTracks(access_token, options);
  }
  return {};
}

const searchSpotifyTrack = async (access_token, track) => {
  let query = '"' + normalizeArtistName(track.artist[0].name) + '" "' + normalizeTrackName(track.name) + '"';
  let response = await spotifyApi.searchTrack(access_token, { q: query});
  if (response.status === 429) console.log(response);
  return spotifyApi.parseTracks(response.data.tracks.items);
}

// @TODO: move to ContentPage?
const computeExclusiveTracks = async (access_token, tracksSpotify, tracksLastFm, playcount) => {
  // filter lastfm tracks by playcount
  let filteredLastFm = tracksLastFm.filter(filterOnPlaycount(playcount));
  // search for corresponding spotify ids
  for (const track of filteredLastFm) {
    let results = await searchSpotifyTrack(access_token, track);
    track.id = undefined;
    for (const result of results) {
      if (compareTracks(track, result)) {
        track.id = result.id;
        break;
      }
    }
    if (results.length === 0) {
      console.log("Could not find track " + track.name);
    }
    else if (!track.id) {
      console.log("Could not match track " + track.name + " / " + results[0].name);
    }
  }
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
      computeExclusive={computeExclusiveTracks}
      clearSpotify={clearSpotifyTracks}
      importSpotify={importSpotifyTracks}
      getSpotify={getSpotifyTracks}
      getLastFm={getLastFmTracks}
      list={<TracksList />} />
  )
}

export default TracksPage;