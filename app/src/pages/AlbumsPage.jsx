import React from 'react';

import * as spotifyApi from '../services/spotifyApi'
import * as lastfmApi from '../services/lastfmApi'

import ContentPage from '../components/ContentPage'

import { compareAlbums, normalizeArtistName, normalizeAlbumName } from '../filters'

// Initial albums selection state
const initial_selection = {period: 'overall', number: 500, playcount: 75 };

// Fetches and parses all albums in the Spotify library
const getSpotifyAlbums = async (access_token, opts) => {
  let items = [];
  let offset = 0;
  let total = 1;
  while (total > offset) {
    let response = await spotifyApi.getSavedAlbums(access_token, {...opts, offset: offset});
    total = response.data.total;
    offset = offset + opts.limit;
    items = [...items, ...response.data.items];
  }
  return spotifyApi.parseAlbums(items);
}

// Fetches and parses the provided number of Last.fm albums
const getLastFmAlbums = async (access_key, opts) => {
  let items = [];
  let page = 0;
  while (opts.number > page * opts.limit) {
    let index = Math.min(opts.limit, opts.number - page * opts.limit)
    let response = await lastfmApi.getTopAlbums(access_key, {...opts, page: ++page});
    items = [...items, ...response.data.topalbums.album.slice(0, index)];
  }
  return lastfmApi.parseAlbums(items);
}

// Adds all of the provided albums to the Spotify library
const clearSpotifyAlbums = async (access_token, albums) => {
  let ids = albums.map(album => album.id);
  while (ids.length > 0) {
    const options = {ids: ids.splice(0, spotifyApi.LIMIT_PER_PAGE)};
    await spotifyApi.removeSavedAlbums(access_token, options);
  }
  return {};
}

// Removes all of the provided albums from the Spotify library
const importSpotifyAlbums = async (access_token, albums) => {
  const ids = albums.map(album => album.results[album.match].id);
  while (ids.length > 0) {
    const options = {ids: ids.splice(0, spotifyApi.LIMIT_PER_PAGE)};
    await spotifyApi.setSavedAlbums(access_token, options);
  }
  return {};
}

// Searches Spotify for the given albums, and sets the search progress
const searchSpotifyAlbums = async (access_token, albums, setProgress = () => {}) => {
  let num = 0;
  let items = [];
  for (const album of albums) {
    let query = '"' + normalizeArtistName(album.artist[0].name) + '" "' + normalizeAlbumName(album.name) + '"';
    let response = await spotifyApi.searchAlbum(access_token, { q: query });
    items.push(spotifyApi.parseAlbums(response.data.albums.items));
    setProgress(Math.ceil(++num/albums.length*100));
  }
  return items;
}

// Searches Last.fm for the given albums, and sets the search progress
const searchLastFmAlbums = async (access_token, albums, setProgress = () => {}) => {
  let num = 0;
  let items = [];
  for (const album of albums) {
    let query = normalizeAlbumName(album.name);
    let response = await lastfmApi.searchAlbum(access_token, { q: query, limit: 10 });
    items.push(lastfmApi.parseAlbums(response.data.results.albummatches.album));
    setProgress(Math.ceil(++num/albums.length*100));
  }
  return items;
}

// Albums page component, using the generalized content page
function AlbumsPage(props) {

  return (
    <ContentPage 
      what="albums"
      selection={initial_selection} 
      compare={compareAlbums}
      searchSpotify={searchSpotifyAlbums}
      searchLastFm={searchLastFmAlbums}
      clearSpotify={clearSpotifyAlbums}
      importSpotify={importSpotifyAlbums}
      getSpotify={getSpotifyAlbums}
      getLastFm={getLastFmAlbums} />
  )
}

export default AlbumsPage;