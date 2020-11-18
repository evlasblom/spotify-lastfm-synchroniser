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

// ========== CONSTANTS ==================================================

const initial_form = {period: 'overall', number: 20, playcount: 100 };

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

function compareAlbums(one, two) {
  return one && two && one.name === two.name && one.artist[0].name === two.artist[0].name
}

function comparePlaycount(album, limit) {
  return album && album.playcount < limit
}

function compareWith(otherArray) {
  return function(current) {
    return otherArray.filter(function(other) {
      return compareAlbums(other, current)
    }).length === 0;
  }
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
        if (comparePlaycount(album, limit)) class_name = "text-muted";
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

  const [form, setForm] = useState(initial_form);

  const albumsSpotify = useAsync(
    () => getAlbumsSpotify(access_token, {}), []);
  const albumsLastFm = useAsync(
    () => getAlbumsLastFm(access_key, createOpts()), [form.period, form.number]);

  const [onlyOnSpotify, setOnlyOnSpotify] = useState([]);
  const [onlyOnLastFm, setOnlyOnLastFm] = useState([]);
      
  useEffect(() => {
    if (!albumsSpotify.result || !albumsLastFm.result) return
    let onlyOnSpotify = albumsSpotify.result.filter(compareWith(albumsLastFm.result));
    setOnlyOnSpotify(onlyOnSpotify); // this list may removed from spotify
    let onlyOnLastFm = albumsLastFm.result.filter(compareWith(albumsSpotify.result));
    setOnlyOnLastFm(onlyOnLastFm); // this list may be added to spotify
  }, [albumsSpotify.result, albumsLastFm.result])

  const createOpts = () => { return {user: username, period: form.period, limit: form.number}};


  return (
    <>
      <h2>Albums</h2>
      <br></br>
      <SelectionForm onSubmit={setForm} initial={initial_form} />
      <br></br>
      <ActionForm onClear={console.log} onImport={console.log} />
      <br></br>
      <br></br>
      <div className="d-flex flex-row flex-wrap justify-content-center">

        <AlbumsList 
          target="Spotify"
          playcount={form.playcount}
          loading={albumsSpotify.loading}
          error={albumsSpotify.error}
          data={albumsSpotify.result}
          exclusive={onlyOnSpotify}
          exclusiveClass="text-danger" />
        
        <AlbumsList 
          target="Last.fm"
          playcount={form.playcount}
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