import React, { useState } from 'react';
import { useAsync } from 'react-async-hook'

import * as spotifyApi from '../services/spotifyApi'
import * as lastfmApi from '../services/lastfmApi'
import useLocalStorage from '../hooks/useLocalStorage'

import Alert from 'react-bootstrap/Alert'
import Spinner from 'react-bootstrap/Spinner'

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

// ========== COMPONENTS ==================================================

function AlbumsList(props) {
  const loading = props.loading;
  const error = props.error;
  const albums = props.data;
  const target = props.target;
  const limit = props.playcount ? props.playcount : 0;

  // check if loading
  if (loading) {
    return (
    <div style={{ width: '25rem'}} className="mr-2, ml-2">
          <Spinner animation="border" variant="info"/>
      </div>
    )
  }

  // check if error
  else if (error) {
    return (
    <div style={{ width: '25rem'}} className="mr-2, ml-2">
        <Alert variant="danger" className="pt-auto">{error.message}.</Alert>
      </div>
    )
  }

  // otherwise success
  return (
    <div style={{ width: '25rem'}} className="mr-2, ml-2">
      <b>{target}</b>
      <br></br>
      <br></br>
      {albums.map((album, i) => {
        return (<p key={i} className={album.playcount < limit ? "text-muted" : ""}>
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

  const asyncAlbumsSpotify = useAsync(
    () => getAlbumsSpotify(access_token, {}), []);
  const asyncAlbumsLastFm = useAsync(
    () => getAlbumsLastFm(access_key, createOpts()), [form.period, form.number]);

  const createOpts = () => { return {user: username, period: form.period, limit: form.number}};

  return (
    <>
      <h2>Albums</h2>
      <br></br>
      <SelectionForm onSubmit={setForm} initial={initial_form} />
      <br></br>
      <br></br>
      <div className="d-flex flex-row flex-wrap justify-content-center">

        <AlbumsList 
          target="Spotify"
          playcount={form.playcount}
          loading={asyncAlbumsSpotify.loading}
          error={asyncAlbumsSpotify.error}
          data={asyncAlbumsSpotify.result} />
        
        <AlbumsList 
          target="Last.fm"
          playcount={form.playcount}
          loading={asyncAlbumsLastFm.loading}
          error={asyncAlbumsLastFm.error}
          data={asyncAlbumsLastFm.result} />

      </div>
    </>
  )
}

export default AlbumsPage;