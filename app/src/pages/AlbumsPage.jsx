import React from 'react';

import * as spotifyApi from '../services/spotifyApi'
import * as lastfmApi from '../services/lastfmApi'

import ContentPage from '../components/ContentPage'
import Error from '../components/Error'
import Loading from '../components/Loading'
import { filterOnPlaycount, filterExclusiveId, compareAlbums, normalizeArtistName, normalizeAlbumName } from '../filters'

const initial_selection = {period: 'overall', number: 20, playcount: 100 };

const getSpotify = async (access_token, opts) => {
  let response = await spotifyApi.getSavedAlbums(access_token, opts);
  return spotifyApi.parseAlbums(response.data.items);
}

const getLastFm = async (access_key, opts) => {
  let response = await lastfmApi.getTopAlbums(access_key, opts);
  return lastfmApi.parseAlbums(response.data.topalbums.album);
}

const clearSpotify = async (access_token, albums) => {
  let ids = albums.map(album => album.id);
  return await spotifyApi.removeSavedAlbums(access_token, {ids: ids});
}

const importSpotify = async (access_token, albums) => {
  let ids = albums.map(album => album.id);
  return await spotifyApi.setSavedAlbums(access_token, {ids: ids});
}

const searchSpotify = async (access_token, albums) => {
  let updated = albums;
  for (const album of updated) {
    let query = '"' + normalizeArtistName(album.artist[0].name) + '" "' + normalizeAlbumName(album.name) + '"';
    let response = await spotifyApi.searchAlbum(access_token, { q: query});
    let results = spotifyApi.parseAlbums(response.data.albums.items);

    // copy the spotify id of the search result
    album.id = undefined;
    for (const result of results) {
      if (compareAlbums(album, result)) {
        album.id = result.id;
        break;
      }
    }
    if (results.length === 0) {
      console.log("Could not find album " + query);
    }
    else if (!album.id) {
      console.log("Could not match album " + album.name + " / " + results[0].name);
    }
  }
  return updated;
}

const computeExclusive = async (access_token, albumsSpotify, albumsLastFm, playcount) => {
  // search for spotify ids and update the filtered lastfm albums
  const filteredLastFm = await searchSpotify(access_token, albumsLastFm.filter(filterOnPlaycount(playcount)));
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
  const loading = props.loading;
  const error = props.error;
  const albums = props.data;
  const target = props.target;
  const limit = props.playcount ? props.playcount : 0;
  const exclusive = props.exclusive;

  // check if loading
  if (loading) {
    return <Loading style={{ width: '25rem'}} className="mr-2 ml-2" />
  }

  // check if error
  else if (error) {
    return <Error style={{ width: '25rem'}} className="mr-2 ml-2" error={error} />
  }

  // otherwise success
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
      computeExclusive={computeExclusive}
      clearSpotify={clearSpotify}
      importSpotify={importSpotify}
      getSpotify={getSpotify}
      getLastFm={getLastFm}
      list={<AlbumsList />} />
  )
}

export default AlbumsPage;