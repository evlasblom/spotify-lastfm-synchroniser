import React from 'react';

import * as spotifyApi from '../services/spotifyApi'
import * as lastfmApi from '../services/lastfmApi'

import ContentPage from '../components/ContentPage'

import { compareTracks, normalizeArtistName, normalizeTrackName } from '../filters'

// Initial tracks selection state
const initial_selection = {period: 'overall', number: 1000, playcount: 50 };

// Fetches and parses all tracks in the Spotify library
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

// Fetches and parses the provided number of Last.fm tracks
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

// Adds all of the provided tracks to the Spotify library
const clearSpotifyTracks = async (access_token, tracks) => {
  let ids = tracks.map(album => album.id);
  while (ids.length > 0) {
    const options = {ids: ids.splice(0, spotifyApi.LIMIT_PER_PAGE)};
    await spotifyApi.removeSavedTracks(access_token, options);
  }
  return {};
}

// Removes all of the provided tracks from the Spotify library
const importSpotifyTracks = async (access_token, tracks) => {
  const ids = tracks.map(track => track.results[track.match].id);
  while (ids.length > 0) {
    const options = {ids: ids.splice(0, spotifyApi.LIMIT_PER_PAGE)};
    await spotifyApi.setSavedTracks(access_token, options);
  }
  return {};
}

// Searches Spotify for the given tracks, and sets the search progress
const searchSpotifyTracks = async (access_token, tracks, setProgress = () => {}) => {
  let num = 0;
  let items = [];
  for (const track of tracks) {
    let query = '"' + normalizeArtistName(track.artist[0].name) + '" "' + normalizeTrackName(track.name) + '"';
    let response = await spotifyApi.searchTrack(access_token, { q: query });
    items.push(spotifyApi.parseTracks(response.data.tracks.items));
    setProgress(Math.ceil(++num/tracks.length*100));
  }
  return items;
}

// Searches Last.fm for the given tracks, and sets the search progress
const searchLastFmTracks = async (access_token, tracks, setProgress = () => {}) => {
  let num = 0;
  let items = [];
  for (const track of tracks) {
    let query = normalizeTrackName(track.name);
    let response = await lastfmApi.searchTrack(access_token, { q: query, limit: 10 });
    items.push(lastfmApi.parseTracks(response.data.results.trackmatches.track));
    setProgress(Math.ceil(++num/tracks.length*100));
  }
  return items;
}

// Tracks page component, using the generalized content page
function TracksPage(props) {

  return (
    <ContentPage 
      what="tracks"
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