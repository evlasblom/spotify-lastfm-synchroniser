import React from 'react';

import * as spotifyApi from '../services/spotifyApi'
import * as lastfmApi from '../services/lastfmApi'

import ContentPage, { ContentState, ContentAction, setContentStyle } from '../components/ContentPage'

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
    return {...album, state: ContentState.CONFIRMED};
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
    return {...album, state: playcountFilter(album) ? ContentState.FILTERED : ContentState.FETCHED};
  });
}

const clearSpotifyAlbums = async (access_token, albums) => {
  let ids = albums
    .filter(album => album.action === ContentAction.CLEAR)
    .map(album => album.id);
  while (ids.length > 0) {
    const options = {ids: ids.splice(0, spotifyApi.LIMIT_PER_PAGE)};
    await spotifyApi.removeSavedAlbums(access_token, options);
  }
  return {};
}

const importSpotifyAlbums = async (access_token, albums) => {
  let ids = albums
    .filter(album => album.action === ContentAction.IMPORT)
    .map(album => album.id);
  while (ids.length > 0) {
    const options = {ids: ids.splice(0, spotifyApi.LIMIT_PER_PAGE)};
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
const compareAllAlbums = async (access_token, albumsSpotify, albumsLastFm) => {
  // find and confirm lastfm on spotify
  for (const album of albumsLastFm) {
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

  // import if confirmed and exlusively on lastfm
  const confirmedSpotify = albumsSpotify.filter(album => album.state === ContentState.CONFIRMED);
  const exclusiveLastFmFilter = filterExclusiveId(confirmedSpotify);
  let finalLastFm = albumsLastFm.map(album => {
    const action = album.state === ContentState.CONFIRMED && exclusiveLastFmFilter(album);
    return {
      ...album, 
      action: action ? ContentAction.IMPORT : ContentAction.NONE
    };
  })

  // clear if confirmed and exclusively on spotify
  const confirmedLastFm = albumsLastFm.filter(album => album.state === ContentState.CONFIRMED);
  const exclusiveSpotifyFilter = filterExclusiveId(confirmedLastFm);
  let finalSpotify = albumsSpotify.map(album => {
    const action = album.state === ContentState.CONFIRMED && exclusiveSpotifyFilter(album);
    return {
      ...album, 
      action: action ? ContentAction.CLEAR : ContentAction.NONE
    };
  })

  // return results
  return {
    spotify: finalSpotify,
    lastfm: finalLastFm
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
        const [style, classname] = setContentStyle(album);        
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
      compare={compareAllAlbums}
      clearSpotify={clearSpotifyAlbums}
      importSpotify={importSpotifyAlbums}
      getSpotify={getSpotifyAlbums}
      getLastFm={getLastFmAlbums}
      list={<AlbumsList />} />
  )
}

export default AlbumsPage;