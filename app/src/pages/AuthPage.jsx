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

  const setValue = props.setValue

  const onSubmit = (e) => {
    e.preventDefault();
    const generated = generateRandomString(16);
    setValue(generated); // set initial state in local storage
    authSpotifyImplicit(generated); // pass initial state to spotify
  }

  return (
    <Form onSubmit={onSubmit} className="d-flex flex-column justify-content-center align-content-center">
      
      <Button variant="primary" type="submit">Authorize via Spotify</Button>
    
    </Form>
  )
}

function LoginLastfm(props) {
  const [username, setUsername] = useState("")

  const setValue = props.setValue;

  const onSubmit = (e) => {
    e.preventDefault();
    setValue(username);
  }

  return (
    <Form onSubmit={onSubmit} className="d-flex flex-column justify-content-center align-content-center">

      <Form.Group controlId="validationUsername">
        <Form.Control
          type="text"
          placeholder="Username on Last.fm"
          text={username}
          onChange={(e) => setUsername(e.currentTarget.value)}
        />
      </Form.Group>

      <Button variant="primary" type="submit" >Select username Last.fm</Button>

    </Form>
  )
}

function AuthPage(props) {
  const {state, access_token} = useHashParams()
  const [initial_state, setInitialState] = useLocalStorage(state_key, null)
  const [username, setUsername] = useState(null)

  // 1. spotify authentication

  // show login if not authenticated
  if (!access_token) {
    return (
      <LoginSpotify setValue={setInitialState}/>
    )
  }

  // show error if authentication somehow failed
  else if (state == null || state !== initial_state) {
    return (
      <Alert variant="danger">
        There was an error during authentication, please try again.
      </Alert>
    )
  }

  // 2. last.fm authentication

  // show login if not authenticated
  if (!username) {
    return (
      <LoginLastfm setValue={setUsername}/>
    )
  }

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
          request={() => lastfmApi.requestProfileLastFm(username, access_key)}
          convert={lastfmApi.convertProfileLastFM} />
    </div>
  )
}

export default AuthPage;