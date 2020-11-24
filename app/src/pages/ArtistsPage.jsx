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
  return spotifyApi.parseArtists(items).map(artist => {
    artist.status = { };
    return artist;
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
    artist.status = { filtered: false };
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
const matchArtists = async (access_token, artistsSpotify, artistsLastFm) => {
  // add lastfm match status
  let matchedLastFm = artistsLastFm;
  for (const artist of matchedLastFm) {
    if (artist.status && !artist.status.filtered) continue;
    artist.status.found = false;
    artist.status.matched = false;
    let results = await searchSpotifyArtist(access_token, artist);
    for (const result of results) {
      artist.status.found = true;
      if (compareArtists(artist, result)) {
        artist.id = result.id; // overwrite lastfm id with spotify id
        artist.status.matched = true;
        break;
      }
    }
  };

  // // cross-compare the ids of the spotify artists with the found spotify ids of the filtered lastfm artists
  // const onlyOnSpotify = artistsSpotify.filter(filterExclusiveId(artistsLastFm));
  // // cross-compare the found spotify ids of the filtered lastfm artists with with the ids of the spotify artists
  // const onlyOnLastFm = artistsLastFm.filter(filterExclusiveId(artistsSpotify));

  // return results
  return {
    spotify: artistsSpotify,
    lastfm: matchedLastFm
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
        let style = 
          artist.status && artist.status.found === false ? 
          {textDecorationLine: 'line-through', textDecorationStyle: 'solid', textDecorationColor: 'gray'} :
          artist.status && artist.status.matched === false ? 
          {textDecorationLine: 'underline', textDecorationStyle: 'wavy', textDecorationColor: 'orange'} : {};
        let classname = artist.status && artist.status.filtered === false ? "text-muted" : "";
        return (
          <p key={i} className={classname} style={style}>
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
      match={matchArtists}
      clearSpotify={clearSpotifyArtists}
      importSpotify={importSpotifyArtists}
      getSpotify={getSpotifyArtists}
      getLastFm={getLastFmArtists}
      list={<ArtistsList />} />
  )
}

export default ArtistsPage;