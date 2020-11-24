import React from 'react';

import * as spotifyApi from '../services/spotifyApi'
import * as lastfmApi from '../services/lastfmApi'

import ContentPage from '../components/ContentPage'

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
  const playcountFilter = filterOnPlaycount(opts.playcount)
  return lastfmApi.parseArtists(items).map(artist => {
    artist.status = {};
    if (playcountFilter(artist)) {
      artist.status.filtered = true;
    }
    return artist;
  });
}

const clearSpotifyArtists = async (access_token, artists) => {
  let ids = artists.map(artist => artist.id);
  while (ids.length > 0) {
    let options = {ids: ids.splice(0, spotifyApi.LIMIT_PER_PAGE)};
    await spotifyApi.removeFollowingArtists(access_token, options);
  }
  return {};
}

const importSpotifyArtists = async (access_token, artists) => {
  let ids = artists.map(artist => artist.id);
  while (ids.length > 0) {
    let options = {ids: ids.splice(0, spotifyApi.LIMIT_PER_PAGE)};
    await spotifyApi.setFollowingArtists(access_token, options);
  }
  return {};
}

const searchSpotifyArtist = async (access_token, artist) => {
  let query = '"' + normalizeArtistName(artist.name) + '"';
  let response = await spotifyApi.searchArtist(access_token, { q: query});
  if (response.status === 429) console.log(response);
  return spotifyApi.parseArtists(response.data.artists.items);
}

// @TODO: move to ContentPage?
const computeExclusiveArtists = async (access_token, artistsSpotify, artistsLastFm) => {
  // search for corresponding spotify ids
  for (const artist of artistsLastFm) {
    if (artist.status && !artist.status.filtered) continue;
    let results = await searchSpotifyArtist(access_token, artist);
    artist.id = undefined;
    for (const result of results) {
      if (compareArtists(artist, result)) {
        artist.id = result.id;
        break;
      }
    }
    if (results.length === 0) {
      console.log("Could not find artist " + artist.name);
    }
    else if (!artist.id) {
      console.log("Could not match artist " + artist.name + " / " + results[0].name);
    }
  }
  // cross-compare the ids of the spotify artists with the found spotify ids of the filtered lastfm artists
  const onlyOnSpotify = artistsSpotify.filter(filterExclusiveId(artistsLastFm));
  // cross-compare the found spotify ids of the filtered lastfm artists with with the ids of the spotify artists
  const onlyOnLastFm = artistsLastFm.filter(filterExclusiveId(artistsSpotify));
  // return results
  return {
    spotify: onlyOnSpotify,
    lastfm: onlyOnLastFm
  };
}

export function ArtistsList(props) {
  const artists = props.data;

  return (
    <div style={{ width: '25rem'}} className="mr-2 ml-2">
      <b>{props.title}</b>
      <br></br>
      <br></br>
      {artists.map((artist, i) => {
        let classname = artist.status && !artist.status.filtered ? "text-muted" : ""
        return (
          <p key={i} className={classname}>
            {i + 1}. {artist.name} 
            {artist.playcount ? (" - " + artist.playcount) : ""}
          </p>
        )
      })}
    </div>
  )
}

function ArtistsPage(props) {

  return (
    <ContentPage 
      title="Artists"
      selection={initial_selection} 
      computeExclusive={computeExclusiveArtists}
      clearSpotify={clearSpotifyArtists}
      importSpotify={importSpotifyArtists}
      getSpotify={getSpotifyArtists}
      getLastFm={getLastFmArtists}
      list={<ArtistsList />} />
  )
}

export default ArtistsPage;