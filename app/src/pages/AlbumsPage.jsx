import React, { useState } from 'react';
import { useAsync } from 'react-async-hook'

import * as spotifyApi from '../services/spotifyApi'
import * as lastfmApi from '../services/lastfmApi'
import useLocalStorage from '../hooks/useLocalStorage'

import ActionForm from '../components/ActionForm'
import Error from '../components/Error'
import Loading from '../components/Loading'
import SelectionForm from '../components/SelectionForm'
import * as constants from '../constants'
import { filterOnPlaycount, filterExclusiveId, compareAlbums } from '../filters'

// ========== CONSTANTS ==================================================

const initial_selection = {period: 'overall', number: 20, playcount: 100 };

const access_key = process.env.REACT_APP_LASTFM_ACCESS_KEY;

// ========== FUNCTIONS ==================================================

const getAlbumsSpotify = async (access_token, opts) => {
  let response = await spotifyApi.getSavedAlbums(access_token, opts);
  return spotifyApi.parseAlbums(response.data.items);
}

const getAlbumsLastFm = async (access_key, opts) => {
  let response = await lastfmApi.getTopAlbums(access_key, opts);
  return lastfmApi.parseAlbums(response.data.topalbums.album);
}

const clearAlbumsSpotify = async (access_token, albums) => {
  let ids = albums.map(album => album.id);
  return await spotifyApi.removeSavedAlbums(access_token, {ids: ids});
}

const importAlbumsSpotify = async (access_token, albums) => {
  let ids = albums.map(album => album.id);
  return await spotifyApi.setSavedAlbums(access_token, {ids: ids});
}

const searchAlbumsSpotify = async (access_token, albums) => {
  let updated = albums;
  for (let album of updated) {
    let query = 'artist:"' + album.artist[0].name + '" album:"' + album.name + '"';
    let response = await spotifyApi.searchAlbum(access_token, { q: query});
    let results = spotifyApi.parseAlbums(response.data.albums.items);

    // copy the spotify id of the search result
    if (results.length >= 1) {
      if (compareAlbums(album, results[0])) {
        album.id = results[0].id;
      }
      else {
        console.log("Could not match album " + album.name + " / " + results[0].name);
      }
    }
    else {
      console.log("Could not find album " + query);
    }
  }
  return updated;
}

const computeExclusiveAlbums = async (access_token, albumsSpotify, albumsLastFm, playcount) => {
  // search for spotify ids and update the filtered lastfm albums
  const tmpLastfm = await searchAlbumsSpotify(access_token, albumsLastFm.filter(filterOnPlaycount(playcount)));
  // cross-compare the ids of the spotify albums with the found spotify ids of the filtered lastfm albums
  const onlyOnSpotify = albumsSpotify.filter(filterExclusiveId(tmpLastfm));
  // cross-compare the found spotify ids of the filtered lastfm albums with with the ids of the spotify albums
  const onlyOnLastFm = tmpLastfm.filter(filterExclusiveId(albumsSpotify));
  // return results
  return {
    spotify: onlyOnSpotify,
    lastfm: onlyOnLastFm
  };
}

// ========== COMPONENTS ==================================================

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

// ========== MAIN ==================================================

function AlbumsPage(props) {
  const [access_token, ] = useLocalStorage(constants.token_key, null);
  const [username, ] = useLocalStorage(constants.user_key, null);

  const [selection, setSelection] = useState(initial_selection);
  const [computing, setComputing] = useState(false);

  const albumsSpotify = useAsync(
    () => getAlbumsSpotify(access_token, {}), []);
  const albumsLastFm = useAsync(
    () => getAlbumsLastFm(access_key, createOpts()), [selection.period, selection.number]);

  const [onlyOnSpotify, setOnlyOnSpotify] = useState([]);
  const [onlyOnLastFm, setOnlyOnLastFm] = useState([]);

  const createOpts = () => { return {user: username, period: selection.period, limit: selection.number}};

  return (
    <>
      <h2>Albums</h2>
      <br></br>

      <SelectionForm 
        onSubmit={(val) => {
          setSelection(val);
          setOnlyOnSpotify([]); 
          setOnlyOnLastFm([]); 
        }}
        initial={initial_selection} />
      <br></br>

      <ActionForm 
        text="Compare" 
        modal="This will cross-compare your Spotify and Last.fm albums. Proceed?"
        variant="primary" 
        onSubmit={() => {
          setComputing(true);
          return computeExclusiveAlbums(access_token, albumsSpotify.result, albumsLastFm.result, selection.playcount)
        }}
        onResult={(res) => {
          setComputing(false);
          setOnlyOnSpotify(res.spotify); 
          setOnlyOnLastFm(res.lastfm); 
        }} />
      <br></br>

      <ActionForm 
        text="Clear" 
        modal="This will clear all albums from Spotify that are not in your current top album selection on Last.fm."
        variant="danger" 
        onSubmit={() => clearAlbumsSpotify(access_token, onlyOnSpotify)}
        onResult={(res) => albumsSpotify.execute()} />
      <br></br>

      <ActionForm 
        text="Import" 
        modal="This will import all albums into Spotify that are in your current top album selection on Last.fm."
        variant="success" 
        onSubmit={() => importAlbumsSpotify(access_token, onlyOnLastFm)}
        onResult={(res) => albumsSpotify.execute()} />
      <br></br>
      <br></br>

      <div style={{height: "2rem"}}>
        {/* {computing ? "Computing differences..." : ""} */}
      </div>
      <br></br>

      <div className="d-flex flex-row flex-wrap justify-content-center">

        <AlbumsList 
          target="Spotify"
          playcount={selection.playcount}
          loading={albumsSpotify.loading || computing}
          error={albumsSpotify.error}
          data={albumsSpotify.result}
          exclusive={onlyOnSpotify}
          exclusiveClass="text-danger" />
        
        <AlbumsList 
          target="Last.fm"
          playcount={selection.playcount}
          loading={albumsLastFm.loading || computing}
          error={albumsLastFm.error}
          data={albumsLastFm.result} 
          exclusive={onlyOnLastFm}
          exclusiveClass="text-success" />

      </div>
    </>
  )
}

export default AlbumsPage;