import React from 'react';

import * as spotifyApi from '../services/spotifyApi'
import * as lastfmApi from '../services/lastfmApi'

import ContentPage from '../components/ContentPage'

import { filterOnPlaycount, filterExclusiveId, compareArtists, normalizeArtistName } from '../filters'

const initial_selection = {period: 'overall', number: 200, playcount: 250 };

const getSpotify = async (access_token, opts) => {
  let items = [];
  let after = undefined;
  while (after !== null) {
    let response = await spotifyApi.getFollowingArtists(access_token, {...opts, after: after});
    after = response.data.artists.cursors.after; // returns null on last batch
    items = [...items, ...response.data.artists.items];
  }
  return spotifyApi.parseArtists(items);
}

const getLastFm = async (access_key, opts) => {
  let items = [];
  let page = 0;
  while (opts.number > page * opts.limit) {
    let index = Math.min(opts.limit, opts.number - page * opts.limit)
    let response = await lastfmApi.getTopArtists(access_key, {...opts, page: ++page});
    items = [...items, ...response.data.topartists.artist.slice(0, index)];
  }
  return lastfmApi.parseArtists(items);
}

const clearSpotify = async (access_token, artists) => {
  let ids = artists.map(artist => artist.id);
  while (ids.length > 0) {
    let options = {ids: ids.splice(0, spotifyApi.LIMIT_PER_PAGE)};
    await spotifyApi.removeFollowingArtists(access_token, options);
  }
  return {};
}

const importSpotify = async (access_token, artists) => {
  let ids = artists.map(artist => artist.id);
  while (ids.length > 0) {
    let options = {ids: ids.splice(0, spotifyApi.LIMIT_PER_PAGE)};
    await spotifyApi.setFollowingArtists(access_token, options);
  }
  return {};
}

const searchSpotify = async (access_token, artist) => {
  let query = '"' + normalizeArtistName(artist.name) + '"';
  let response = await spotifyApi.searchArtist(access_token, { q: query});
  return spotifyApi.parseArtists(response.data.artists.items);
}

// @TODO: move to ContentPage?
const computeExclusive = async (access_token, artistsSpotify, artistsLastFm, playcount) => {
  // filter lastfm artists by playcount
  let filteredLastFm = artistsLastFm.filter(filterOnPlaycount(playcount));
  // search for corresponding spotify ids
  for (const artist of filteredLastFm) {
    let results = await searchSpotify(access_token, artist);
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
  const onlyOnSpotify = artistsSpotify.filter(filterExclusiveId(filteredLastFm));
  // cross-compare the found spotify ids of the filtered lastfm artists with with the ids of the spotify artists
  const onlyOnLastFm = filteredLastFm.filter(filterExclusiveId(artistsSpotify));
  // return results
  return {
    spotify: onlyOnSpotify,
    lastfm: onlyOnLastFm
  };
}

export function ArtistsList(props) {
  const artists = props.data;
  const target = props.target;
  const limit = props.playcount ? props.playcount : 0;
  const exclusive = props.exclusive;

  let j = 0;
  return (
    <div style={{ width: '25rem'}} className="mr-2 ml-2">
      <b>{target}</b>
      <br></br>
      <br></br>
      {artists.map((artist, i) => {
        let class_name = ""
        if (compareArtists(artist, exclusive[j])) { j++; class_name = props.exclusiveClass}
        if (!filterOnPlaycount(limit)(artist)) class_name = "text-muted";
        return (
          <p key={i} className={class_name}>
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
      computeExclusive={computeExclusive}
      clearSpotify={clearSpotify}
      importSpotify={importSpotify}
      getSpotify={getSpotify}
      getLastFm={getLastFm}
      list={<ArtistsList />} />
  )
}

export default ArtistsPage;