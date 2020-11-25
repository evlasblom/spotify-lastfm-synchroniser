import React from 'react';

import * as spotifyApi from '../services/spotifyApi'
import * as lastfmApi from '../services/lastfmApi'

import ContentPage, { ContentState } from '../components/ContentPage'

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
  return spotifyApi.parseAlbums(items).map(album => {
    album.state = ContentState.FILTERED;
    return album;
  });
}

const getLastFmAlbums = async (access_key, opts) => {
  let items = [];
  let page = 0;
  while (opts.number > page * opts.limit) {
    let index = Math.min(opts.limit, opts.number - page * opts.limit)
    let response = await lastfmApi.getTopAlbums(access_key, {...opts, page: ++page});
    items = [...items, ...response.data.topalbums.album.slice(0, index)];
  }
  const playcountFilter = filterOnPlaycount(opts.playcount)
  return lastfmApi.parseAlbums(items).map(album => {
    album.state = ContentState.FETCHED;
    if (playcountFilter(album)) {
      album.state = ContentState.FILTERED;
    }
    return album;
  });
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
  if (response.status !== 200) console.log(response);
  return spotifyApi.parseAlbums(response.data.albums.items);
}

// @TODO: move to ContentPage?
const matchAlbums = async (access_token, albumsSpotify, albumsLastFm) => {
  // add lastfm match status
  // find and confirm on spotify
  let matchedLastFm = albumsLastFm;
  for (const album of matchedLastFm) {
    if (album.state && album.state < ContentState.FILTERED) continue;
    album.state = ContentState.SOUGHT;
    let results = await searchSpotifyAlbum(access_token, album);
    for (const result of results) {
      album.state = ContentState.FOUND;
      if (compareAlbums(album, result)) {
        album.id = result.id; // overwrite lastfm id with spotify id
        album.state = ContentState.CONFIRMED;
        break;
      }
    }
  };

  // cross-compare the ids of the spotify albums with the found spotify ids of the filtered lastfm albums
  // const onlyOnSpotify = albumsSpotify.filter(filterExclusiveId(albumsLastFm));
  // cross-compare the found spotify ids of the filtered lastfm albums with with the ids of the spotify albums
  // const onlyOnLastFm = albumsLastFm.filter(filterExclusiveId(albumsSpotify));

  // return results
  return {
    spotify: albumsSpotify,
    lastfm: matchedLastFm
  };
}

function AlbumsList(props) {
  const albums = props.data;

  return (
    <div style={{ width: '25rem'}} className="mr-2 ml-2">
      <b>{props.title}</b>
      <br></br>
      <br></br>
      {albums.map((album, i) => {
        let style = {};
        let classname = "";
        switch(album.state) {
          case ContentState.FETCHED:
            classname = "text-muted";
            break;
          case ContentState.SOUGHT:
            style = {textDecorationLine: 'line-through', textDecorationStyle: 'solid', textDecorationColor: 'gray'};
            break;
          case ContentState.FOUND:
            style = {textDecorationLine: 'underline', textDecorationStyle: 'wavy', textDecorationColor: 'orange'};
            break;
          default:
            style = {};
            classname = "";
        }
        return (
          <p key={i} className={classname} style={style}>
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
      match={matchAlbums}
      clearSpotify={clearSpotifyAlbums}
      importSpotify={importSpotifyAlbums}
      getSpotify={getSpotifyAlbums}
      getLastFm={getLastFmAlbums}
      list={<AlbumsList />} />
  )
}

export default AlbumsPage;