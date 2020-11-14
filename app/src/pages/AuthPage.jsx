import React, { useState } from 'react';

import * as spotifyApi from '../services/spotifyApi'
import * as lastfmApi from '../services/lastfmApi'
import useHashParams from '../hooks/useHashParams'
import useLocalStorage from '../hooks/useLocalStorage'

import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSyncAlt } from '@fortawesome/free-solid-svg-icons'

import ProfileCard from '../components/ProfileCard'

const state_key = 'lastify.spotify_auth_state';
const token_key = 'lastify.spotify_auth_token';

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
function generateRandomString(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

/**
 * Authorizes via Spotify using the implicit grant flow
 */
function authSpotifyImplicit(state) {
  // set the authorization scope
  const scope = 'user-read-private user-read-email';

  // create the authorization url
  let url = 'https://accounts.spotify.com/authorize';
  url += '?response_type=token';
  url += '&client_id=' + encodeURIComponent(process.env.REACT_APP_SPOTIFY_CLIENT_ID);
  url += '&redirect_uri=' + encodeURIComponent(process.env.REACT_APP_SPOTIFY_REDIRECT_URI);
  url += '&scope=' + encodeURIComponent(scope);
  url += '&state=' + encodeURIComponent(state);

  // and redirect to the spotify authorization page
  window.location = url;
}

// ========== COMPONENTS ==================================================

function LoginSpotify(props) {

  return (
    <Button 
        variant="primary" 
        onClick={props.onClick}>
      Login to Spotify
    </Button>
  )
}

function LoginLastfm(props) {

  return (
    <Button 
        variant="primary" 
        onClick={props.onClick}>
      Login to Spotify
    </Button>
  )
}

function AuthPage(props) {
  const {state, access_token} = useHashParams()
  const [initial_state, setInitialState] = useLocalStorage(state_key, null)

  // 1. spotify authentication

  // show login if not authenticated
  if (!access_token) {
    return (
      <LoginSpotify 
          onClick={(e) => { 
            const generated = generateRandomString(16);
            setInitialState(generated); // set initial state in local storage
            authSpotifyImplicit(generated); // pass initial state to spotify
          }}/>
    )
  }
  // show error if authentication somehow failed
  else if (state == null || state !== initial_state) {
    return (
      <Alert variant="danger">There was an error during authentication, please try again.</Alert>
    )
  }

  // 2. last.fm authentication

  const access_key = process.env.REACT_APP_LASTFM_ACCESS_KEY

  // 3. confirm
  
  return (
    <div className="d-flex flex-row justify-content-center align-items-center">
      <ProfileCard 
          target="Spotify"
          request={() => spotifyApi.requestProfileSpotify(access_token)}
          convert={spotifyApi.convertProfileSpotify} />
      <div className="m-4"><h2><FontAwesomeIcon icon={faSyncAlt} /></h2></div>
      <ProfileCard 
          target="Last.fm"
          request={() => lastfmApi.requestProfileLastFm(access_key)}
          convert={lastfmApi.convertProfileLastFM} />
    </div>
  )
}

export default AuthPage;