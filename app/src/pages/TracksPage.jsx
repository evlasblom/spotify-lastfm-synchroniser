import React from 'react';

import * as spotifyApi from '../services/spotifyApi'
import * as lastfmApi from '../services/lastfmApi'

import ContentPage from '../components/ContentPage'

import { compareTracks, normalizeArtistName, normalizeTrackName } from '../filters'

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
  let ids = tracks.map(album => album.id);
  while (ids.length > 0) {
    const options = {ids: ids.splice(0, spotifyApi.LIMIT_PER_PAGE)};
    await spotifyApi.removeSavedTracks(access_token, options);
  }
  return {};
}

const importSpotifyTracks = async (access_token, tracks) => {
  const ids = tracks.map(track => track.results[track.match].id);
  while (ids.length > 0) {
    const options = {ids: ids.splice(0, spotifyApi.LIMIT_PER_PAGE)};
    await spotifyApi.setSavedTracks(access_token, options);
  }
  return {};
}

const searchSpotifyTracks = async (access_token, tracks) => {
  let items = [];
  for (const track of tracks) {
    let query = '"' + normalizeArtistName(track.artist[0].name) + '" "' + normalizeTrackName(track.name) + '"';
    let response = await spotifyApi.searchTrack(access_token, { q: query });
    if (response.status !== 200) console.log(response);
    items.push(spotifyApi.parseTracks(response.data.tracks.items));
  }
  return items;
}

const searchLastFmTracks = async (access_token, tracks) => {
  let items = [];
  for (const track of tracks) {
    let query = normalizeTrackName(track.name);
    let response = await lastfmApi.searchTrack(access_token, { q: query, limit: 10 });
    if (response.status !== 200) console.log(response);
    items.push(lastfmApi.parseTracks(response.data.results.trackmatches.track));
  }
  return items;
}

function TracksPage(props) {

  return (
    <ContentPage 
      title="Tracks"
      selection={initial_selection} 
      compare={compareTracks}
      searchSpotify={searchSpotifyTracks}
      searchLastFm={searchLastFmTracks}
      clearSpotify={clearSpotifyTracks}
      importSpotify={importSpotifyTracks}
      getSpotify={getSpotifyTracks}
      getLastFm={getLastFmTracks} />
  )
}

export default TracksPage;