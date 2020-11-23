import React from 'react';

import * as spotifyApi from '../services/spotifyApi'
import * as lastfmApi from '../services/lastfmApi'

import ContentPage from '../components/ContentPage'

import { filterOnPlaycount, filterExclusiveId, compareAlbums, normalizeArtistName, normalizeAlbumName } from '../filters'

const initial_selection = {period: 'overall', number: 500, playcount: 75 };

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

const clearSpotifyAlbums = async (access_token, albums) => {
  let ids = albums.map(album => album.id);
  while (ids.length > 0) {
    let options = {ids: ids.splice(0, spotifyApi.LIMIT_PER_PAGE)};
    await spotifyApi.removeSavedAlbums(access_token, options);
  }
  return {};
}

const importSpotifyAlbums = async (access_token, albums) => {
  let ids = albums.map(album => album.id);
  while (ids.length > 0) {
    let options = {ids: ids.splice(0, spotifyApi.LIMIT_PER_PAGE)};
    await spotifyApi.setSavedAlbums(access_token, options);
  }
  return {};
}

const searchSpotifyAlbum = async (access_token, album) => {
  let query = '"' + normalizeArtistName(album.artist[0].name) + '" "' + normalizeAlbumName(album.name) + '"';
  let response = await spotifyApi.searchAlbum(access_token, { q: query});
  if (response.status === 429) console.log(response);
  return spotifyApi.parseAlbums(response.data.albums.items);
}

// @TODO: move to ContentPage?
const computeExclusiveAlbums = async (access_token, albumsSpotify, albumsLastFm, playcount) => {
  // filter lastfm albums by playcount
  let filteredLastFm = albumsLastFm.filter(filterOnPlaycount(playcount));
  // search for corresponding spotify ids
  for (const album of filteredLastFm) {
    let results = await searchSpotifyAlbum(access_token, album);
    album.id = undefined;
    for (const result of results) {
      if (compareAlbums(album, result)) {
        album.id = result.id;
        break;
      }
    }
    if (results.length === 0) {
      console.log("Could not find album " + album.name);
    }
    else if (!album.id) {
      console.log("Could not match album " + album.name + " / " + results[0].name);
    }
  }
  // cross-compare the ids of the spotify albums with the found spotify ids of the filtered lastfm albums
  const onlyOnSpotify = albumsSpotify.filter(filterExclusiveId(filteredLastFm));
  // cross-compare the found spotify ids of the filtered lastfm albums with with the ids of the spotify albums
  const onlyOnLastFm = filteredLastFm.filter(filterExclusiveId(albumsSpotify));
  // return results
  return {
    spotify: onlyOnSpotify,
    lastfm: onlyOnLastFm
  };
}

function AlbumsList(props) {
  const albums = props.data;
  const target = props.target;
  const limit = props.playcount ? props.playcount : 0;
  const exclusive = props.exclusive;

  let j = 0;
  return (
    <div style={{ width: '25rem'}} className="mr-2 ml-2">
      <b>{target}</b>
      <br></br>
      <br></br>
      {albums.map((album, i) => {
        let class_name = ""
        if (compareAlbums(album, exclusive[j])) { j++; class_name = props.exclusiveClass}
        if (!filterOnPlaycount(limit)(album)) class_name = "text-muted";
        return (
          <p key={i} className={class_name}>
            {i + 1}. {album.name}
            {album.playcount ? (" - " + album.playcount) : ""}
            <br></br>
            <i>{album.artist[0].name}</i>
          </p>)
      })}
    </div>
  )
}

function AlbumsPage(props) {

  return (
    <ContentPage 
      title="Albums"
      selection={initial_selection} 
      computeExclusive={computeExclusiveAlbums}
      clearSpotify={clearSpotifyAlbums}
      importSpotify={importSpotifyAlbums}
      getSpotify={getSpotifyAlbums}
      getLastFm={getLastFmAlbums}
      list={<AlbumsList />} />
  )
}

export default AlbumsPage;