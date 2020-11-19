import React, { useState, useEffect } from 'react';
import { useAsync } from 'react-async-hook'

import * as spotifyApi from '../services/spotifyApi'
import * as lastfmApi from '../services/lastfmApi'
import useLocalStorage from '../hooks/useLocalStorage'

import ActionForm from '../components/ActionForm'
import Error from '../components/Error'
import Loading from '../components/Loading'
import SelectionForm from '../components/SelectionForm'
import * as constants from '../constants'
import { filterOnPlaycount, filterExclusiveAlbums, compareAlbums } from '../filters'

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
  let ids = albums.map(artist => artist.id);
  return await spotifyApi.removeSavedAlbums(access_token, {ids: ids});
}

const importAlbumsSpotify = async (access_token, albums) => {
  let ids = [];
  // get the spotify ids by performing a search
  for (const album of albums) {
    let query = 'artist:"' + album.artist[0].name + '" album:"' + album.name + '"';
    let response = await spotifyApi.searchAlbum(access_token, { q: query});
    let results = spotifyApi.parseAlbums(response.data.albums.items);
    // lets assume the top result is always correct
    if (results) {
      ids.push(results[0].id);
    }
    else {
      console.log("Could not find album " + query);
    }
  }
  // save matched albums
  return await spotifyApi.setSavedAlbums(access_token, {ids: ids});
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
      
  useEffect(() => {
    if (!albumsSpotify.result || !albumsLastFm.result) return
    setComputing(true);
    async function computeExclusive() {
      // cross-compare spotify albums with filtered lastfm albums
      let onlyOnSpotify = 
        albumsSpotify.result.filter(filterExclusiveAlbums(albumsLastFm.result.filter(filterOnPlaycount(selection.playcount))));
      // save exclusive list
      setOnlyOnSpotify(onlyOnSpotify);
      // cross-compare lastm fm albums with spotify albums and filter
      let onlyOnLastFm = 
        albumsLastFm.result.filter(filterExclusiveAlbums(albumsSpotify.result)).filter(filterOnPlaycount(selection.playcount));
      // save exclusive list
      setOnlyOnLastFm(onlyOnLastFm);
      // reset computing state
      setComputing(false);
    }
    computeExclusive();
  }, [albumsSpotify.result, albumsLastFm.result, selection.playcount])

  const createOpts = () => { return {user: username, period: selection.period, limit: selection.number}};


  return (
    <>
      <h2>Albums</h2>
      <br></br>
      <SelectionForm onSubmit={setSelection} initial={initial_selection} />
      <br></br>
      <ActionForm 
        text="Clear" 
        modal="This will clear all albums from Spotify that are not in your current top album selection on Last.fm."
        variant="danger" 
        onSubmit={() => clearAlbumsSpotify(access_token, onlyOnSpotify)}
        onResult={albumsSpotify.execute} />
      <br></br>
      <ActionForm 
        text="Import" 
        modal="This will import all albums into Spotify that are in your current top album selection on Last.fm."
        variant="success" 
        onSubmit={() => importAlbumsSpotify(access_token, onlyOnLastFm)}
        onResult={albumsSpotify.execute} />
      <br></br>
      <br></br>
      <div style={{height: "2rem"}}>
        {computing ? "Computing differences..." : ""}
      </div>
      <br></br>
      <div className="d-flex flex-row flex-wrap justify-content-center">

        <AlbumsList 
          target="Spotify"
          playcount={selection.playcount}
          loading={albumsSpotify.loading}
          error={albumsSpotify.error}
          data={albumsSpotify.result}
          exclusive={onlyOnSpotify}
          exclusiveClass="text-danger" />
        
        <AlbumsList 
          target="Last.fm"
          playcount={selection.playcount}
          loading={albumsLastFm.loading}
          error={albumsLastFm.error}
          data={albumsLastFm.result} 
          exclusive={onlyOnLastFm}
          exclusiveClass="text-success" />

      </div>
    </>
  )
}

export default AlbumsPage;