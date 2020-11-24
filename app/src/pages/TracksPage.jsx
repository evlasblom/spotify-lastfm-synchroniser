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
  return spotifyApi.parseTracks(items).map(track => {
    track.status = { };
    return track;
  });
}

const getLastFmTracks = async (access_key, opts) => {
  let items = [];
  let page = 0;
  while (opts.number > page * opts.limit) {
    let index = Math.min(opts.limit, opts.number - page * opts.limit)
    let response = await lastfmApi.getTopTracks(access_key, {...opts, page: ++page});
    items = [...items, ...response.data.toptracks.track.slice(0, index)];
  }
  const playcountFilter = filterOnPlaycount(opts.playcount)
  return lastfmApi.parseTracks(items).map(track => {
    track.status = { filtered: false };
    if (playcountFilter(track)) {
      track.status.filtered = true;
    }
    return track;
  });
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
const matchTracks = async (access_token, tracksSpotify, tracksLastFm) => {
  // add lastfm match status
  let matchedLastFm = tracksLastFm;
  for (const track of matchedLastFm) {
    if (track.status && !track.status.filtered) continue;
    track.status.found = false;
    track.status.matched = false;
    let results = await searchSpotifyTrack(access_token, track);
    for (const result of results) {
      track.status.found = true;
      if (compareTracks(track, result)) {
        track.id = result.id; // overwrite lastfm id with spotify id
        track.status.matched = true;
        break;
      }
    }
  };

  // cross-compare the ids of the spotify tracks with the found spotify ids of the filtered lastfm tracks
  // const onlyOnSpotify = tracksSpotify.filter(filterExclusiveId(tracksLastFm));
  // cross-compare the found spotify ids of the filtered lastfm tracks with with the ids of the spotify tracks
  // const onlyOnLastFm = tracksLastFm.filter(filterExclusiveId(tracksSpotify));

  // return results
  return {
    spotify: tracksSpotify,
    lastfm: matchedLastFm
  };
}

function TracksList(props) {
  const tracks = props.data;

  return (
    <div style={{ width: '25rem'}} className="mr-2 ml-2">
      <b>{props.title}</b>
      <br></br>
      <br></br>
      {tracks.map((track, i) => {
        let style = 
        track.status && track.status.found === false ? 
        {textDecorationLine: "line-through", textDecorationStyle: "solid"} :
        track.status && track.status.matched === false ? 
        {textDecorationLine: "underline", textDecorationStyle: "wavy"} : {};
      let classname = track.status && track.status.filtered === false ? "text-muted" : "";
        return (
          <p key={i} className={classname} style={style}>
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
      match={matchTracks}
      clearSpotify={clearSpotifyTracks}
      importSpotify={importSpotifyTracks}
      getSpotify={getSpotifyTracks}
      getLastFm={getLastFmTracks}
      list={<TracksList />} />
  )
}

export default TracksPage;