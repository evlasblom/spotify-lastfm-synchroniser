import React from 'react';

import * as spotifyApi from '../services/spotifyApi'
import * as lastfmApi from '../services/lastfmApi'

import ContentPage, { ContentState, ContentAction } from '../components/ContentPage'

import { filterOnPlaycount, filterExclusiveId, compareArtists, normalizeArtistName } from '../filters'

const initial_selection = {period: 'overall', number: 500, playcount: 100 };

const getSpotifyArtists = async (access_token, opts) => {
  let items = [];
  let after = undefined;
  while (after !== null) {
    let response = await spotifyApi.getFollowingArtists(access_token, {...opts, after: after});
    after = response.data.artists.cursors.after; // returns null on last batch
    items = [...items, ...response.data.artists.items];
  }
  return spotifyApi.parseArtists(items).map(artist => {
    return {...artist, state: ContentState.CONFIRMED};
  });
}

const getLastFmArtists = async (access_key, opts) => {
  let items = [];
  let page = 0;
  while (opts.number > page * opts.limit) {
    let index = Math.min(opts.limit, opts.number - page * opts.limit)
    let response = await lastfmApi.getTopArtists(access_key, {...opts, page: ++page});
    items = [...items, ...response.data.topartists.artist.slice(0, index)];
  }
  const playcountFilter = filterOnPlaycount(opts.playcount)
  return lastfmApi.parseArtists(items).map(artist => {
    return {...artist, state: playcountFilter(artist) ? ContentState.FILTERED : ContentState.FETCHED};
  });
}

const clearSpotifyArtists = async (access_token, artists) => {
  const ids = artists
    .filter(artist => artist.action === ContentAction.CLEAR)
    .map(artist => artist.id);
  while (ids.length > 0) {
    const options = {ids: ids.splice(0, spotifyApi.LIMIT_PER_PAGE)};
    await spotifyApi.removeFollowingArtists(access_token, options);
  }
  return {};
}

const importSpotifyArtists = async (access_token, artists) => {
  const ids = artists
    .filter(artist => artist.action === ContentAction.IMPORT)
    .map(artist => artist.id);
  while (ids.length > 0) {
    const options = {ids: ids.splice(0, spotifyApi.LIMIT_PER_PAGE)};
    await spotifyApi.setFollowingArtists(access_token, options);
  }
  return {};
}

const searchSpotifyArtist = async (access_token, artist) => {
  let query = '"' + normalizeArtistName(artist.name) + '"';
  let response = await spotifyApi.searchArtist(access_token, { q: query});
  if (response.status !== 200) console.log(response);
  return spotifyApi.parseArtists(response.data.artists.items);
}

// @TODO: move to ContentPage?
const compareAllArtists = async (access_token, artistsSpotify, artistsLastFm) => {
  // find and confirm lastfm on spotify
  for (const artist of artistsLastFm) {
    if (artist.state && artist.state < ContentState.FILTERED) continue;
    artist.state = ContentState.SOUGHT;
    let results = await searchSpotifyArtist(access_token, artist);
    for (const result of results) {
      artist.state = ContentState.FOUND;
      if (compareArtists(artist, result)) {
        artist.id = result.id; // overwrite lastfm id with spotify id
        artist.state = ContentState.CONFIRMED;
        break;
      }
    }
  }

  // import if confirmed and exlusively on lastfm
  const confirmedSpotify = artistsSpotify.filter(artist => artist.state === ContentState.CONFIRMED);
  const exclusiveLastFmFilter = filterExclusiveId(confirmedSpotify);
  let finalLastFm = artistsLastFm.map(artist => {
    const action = artist.state === ContentState.CONFIRMED && exclusiveLastFmFilter(artist);
    return {
      ...artist, 
      action: action ? ContentAction.IMPORT : ContentAction.NONE
    };
  })

  // clear if confirmed and exclusively on spotify
  const confirmedLastFm = artistsLastFm.filter(artist => artist.state === ContentState.CONFIRMED);
  const exclusiveSpotifyFilter = filterExclusiveId(confirmedLastFm);
  let finalSpotify = artistsSpotify.map(artist => {
    const action = artist.state === ContentState.CONFIRMED && exclusiveSpotifyFilter(artist);
    return {
      ...artist, 
      action: action ? ContentAction.CLEAR : ContentAction.NONE
    };
  })

  // return results
  return {
    spotify: finalSpotify,
    lastfm: finalLastFm
  };
}

function ArtistsPage(props) {

  return (
    <ContentPage 
      title="Artists"
      selection={initial_selection} 
      compare={compareAllArtists}
      clearSpotify={clearSpotifyArtists}
      importSpotify={importSpotifyArtists}
      getSpotify={getSpotifyArtists}
      getLastFm={getLastFmArtists} />
  )
}

export default ArtistsPage;