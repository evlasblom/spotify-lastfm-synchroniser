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

const initial_form = {period: 'overall', number: 20, playcount: 250 };

const access_key = process.env.REACT_APP_LASTFM_ACCESS_KEY;

// ========== FUNCTIONS ==================================================

const getArtistsSpotify = async (access_token, opts) => {
  let response = await spotifyApi.getFollowingArtists(access_token, opts);
  return spotifyApi.parseArtists(response.data.artists.items);
}

const getArtistsLastFm = async (access_key, opts) => {
  let response = await lastfmApi.getTopArtists(access_key, opts);
  return lastfmApi.parseArtists(response.data.topartists.artist);
}

// ========== COMPONENTS ==================================================

function ArtistsList(props) {
  const loading = props.loading;
  const error = props.error;
  const artists = props.data;
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
      {artists.map((artist, i) => {
        return (
          <p key={i} className={artist.playcount < limit ? "text-muted" : ""}>
            {i + 1}. {artist.name} 
            {artist.playcount ? (" - " + artist.playcount) : ""}
          </p>
        )
      })}
    </div>
  )
}

// ========== MAIN ==================================================

function ArtistsPage(props) {
  const [access_token, ] = useLocalStorage(constants.token_key, null);
  const [username, ] = useLocalStorage(constants.user_key, null);

  const [form, setForm] = useState(initial_form);

  const asyncArtistsSpotify = useAsync(
    () => getArtistsSpotify(access_token, {}), []);
  const asyncArtistsLastFm = useAsync(
    () => getArtistsLastFm(access_key, createOpts()), [form.period, form.number]);
      
  const createOpts = () => { return {user: username, period: form.period, limit: form.number}};

  return (
    <>
      <h2>Artists</h2>
      <br></br>
      <SelectionForm onSubmit={setForm} initial={initial_form} />
      <br></br>
      <br></br>
      <div className="d-flex flex-row flex-wrap justify-content-center">

        <ArtistsList 
          target="Spotify"
          playcount={form.playcount}
          loading={asyncArtistsSpotify.loading}
          error={asyncArtistsSpotify.error}
          data={asyncArtistsSpotify.result} />
        
        <ArtistsList 
          target="Last.fm"
          playcount={form.playcount}
          loading={asyncArtistsLastFm.loading}
          error={asyncArtistsLastFm.error}
          data={asyncArtistsLastFm.result} />

      </div>
    </>
  )
}

export default ArtistsPage;