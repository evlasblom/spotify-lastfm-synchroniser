import React from 'react';

import * as spotifyApi from '../services/spotifyApi'
import * as lastfmApi from '../services/lastfmApi'

import ContentPage from '../components/ContentPage'

import { compareArtists, normalizeArtistName } from '../filters'

// Initial artists selection state
const initial_selection = {period: 'overall', number: 250, playcount: 100 };

// Fetches and parses all artists in the Spotify library
const getSpotifyArtists = async (access_token, opts) => {
  let items = [];
  let after = undefined;
  while (after !== null) {
    let response = await spotifyApi.getFollowingArtists(access_token, {...opts, after: after});
    after = response.data.artists.cursors.after; // returns null on last batch
    items = [...items, ...response.data.artists.items];
  }
  return spotifyApi.parseArtists(items);
}

// Fetches and parses the provided number of Last.fm artists
const getLastFmArtists = async (access_key, opts) => {
  let items = [];
  let page = 0;
  while (opts.number > page * opts.limit) {
    let index = Math.min(opts.limit, opts.number - page * opts.limit)
    let response = await lastfmApi.getTopArtists(access_key, {...opts, page: ++page});
    items = [...items, ...response.data.topartists.artist.slice(0, index)];
  }
  return lastfmApi.parseArtists(items);
}

// Unfollows all of the provided artists on Spotify
const clearSpotifyArtists = async (access_token, artists) => {
  const ids = artists.map(artist => artist.id);
  while (ids.length > 0) {
    const options = {ids: ids.splice(0, spotifyApi.LIMIT_PER_PAGE)};
    await spotifyApi.removeFollowingArtists(access_token, options);
  }
  return {};
}

// Follows all of the provided artists on Spotify
const importSpotifyArtists = async (access_token, artists) => {
  const ids = artists.map(artist => artist.results[artist.match].id);
  while (ids.length > 0) {
    const options = {ids: ids.splice(0, spotifyApi.LIMIT_PER_PAGE)};
    await spotifyApi.setFollowingArtists(access_token, options);
  }
  return {};
}

// Searches Spotify for the given artists, and sets the search progress
const searchSpotifyArtists = async (access_token, artists, setProgress = () => {}) => {
  let num = 0;
  let items = [];
  for (const artist of artists) {
    let query = '"' + normalizeArtistName(artist.name) + '"';
    let response = await spotifyApi.searchArtist(access_token, { q: query });
    items.push(spotifyApi.parseArtists(response.data.artists.items));
    setProgress(Math.ceil(++num/artists.length*100));
  }
  return items;
}

// Searches Last.fm for the given artists, and sets the search progress
const searchLastFmArtists = async (access_token, artists, setProgress = () => {}) => {
  let num = 0;
  let items = [];
  for (const artist of artists) {
    let query = normalizeArtistName(artist.name);
    let response = await lastfmApi.searchArtist(access_token, { q: query, limit: 10 });
    items.push(lastfmApi.parseArtists(response.data.results.artistmatches.artist));
    setProgress(Math.ceil(++num/artists.length*100));
  }
  return items;
}

// Artists page component, using the generalized content page
function ArtistsPage(props) {

  return (
    <ContentPage 
      what="artists"
      selection={initial_selection} 
      compare={compareArtists}
      searchSpotify={searchSpotifyArtists}
      searchLastFm={searchLastFmArtists}
      clearSpotify={clearSpotifyArtists}
      importSpotify={importSpotifyArtists}
      getSpotify={getSpotifyArtists}
      getLastFm={getLastFmArtists} />
  )
}

export default ArtistsPage;