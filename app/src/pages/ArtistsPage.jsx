import React from 'react';

import * as spotifyApi from '../services/spotifyApi'
import * as lastfmApi from '../services/lastfmApi'

import ContentPage from '../components/ContentPage'

import { compareArtists, normalizeArtistName } from '../filters'

const initial_selection = {period: 'overall', number: 500, playcount: 100 };

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

const clearSpotifyArtists = async (access_token, artists) => {
  const ids = artists.map(artist => artist.id);
  while (ids.length > 0) {
    const options = {ids: ids.splice(0, spotifyApi.LIMIT_PER_PAGE)};
    await spotifyApi.removeFollowingArtists(access_token, options);
  }
  return {};
}

const importSpotifyArtists = async (access_token, artists) => {
  const ids = artists.map(artist => artist.id);
  while (ids.length > 0) {
    const options = {ids: ids.splice(0, spotifyApi.LIMIT_PER_PAGE)};
    await spotifyApi.setFollowingArtists(access_token, options);
  }
  return {};
}

const searchSpotifyArtists = async (access_token, artists) => {
  let items = [];
  for (const artist of artists) {
    let query = '"' + normalizeArtistName(artist.name) + '"';
    let response = await spotifyApi.searchArtist(access_token, { q: query });
    if (response.status !== 200) console.log(response);
    items.push(spotifyApi.parseArtists(response.data.artists.items));
  }
  return items;
}

const searchLastFmArtists = async (access_token, artists) => {
  let items = [];
  for (const artist of artists) {
    let query = normalizeArtistName(artist.name);
    let response = await lastfmApi.searchArtist(access_token, { q: query, limit: 10 });
    if (response.status !== 200) console.log(response);
    items.push(lastfmApi.parseArtists(response.data.results.artistmatches.artist));
  }
  return items;
}

function ArtistsPage(props) {

  return (
    <ContentPage 
      title="Artists"
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