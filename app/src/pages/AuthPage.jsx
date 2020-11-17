import React, { useState } from 'react';
import { Redirect } from 'react-router-dom'

import useHashParams from '../hooks/useHashParams'
import useLocalStorage from '../hooks/useLocalStorage'

import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert'

import * as constants from '../constants'

// ========== FUNCTIONS ==================================================

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
  const scope = 'user-read-private user-read-email user-follow-read user-library-read';

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
      
      <Button variant="primary" type="submit">Continue</Button>
    
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
          placeholder="Username"
          text={username}
          onChange={(e) => setUsername(e.currentTarget.value)}
        />
      </Form.Group>

      <Button variant="primary" type="submit" >Continue</Button>

    </Form>
  )
}

function Step(props) {

  return(
    <>
      <h2>{props.title}</h2>
      {props.subtitle ? <i>{props.subtitle}</i> : ""}
      <br></br>
      <br></br>
      {props.children}
    </>
  )
}

// ========== MAIN ==================================================

function AuthPage(props) {
  const [_state, _setState] = useLocalStorage(constants.state_key, null)
  const [_access_token, _setAccessToken] = useLocalStorage(constants.token_key, null)
  const [_username, _setUsername] = useLocalStorage(constants.user_key, null)
  const {state, access_token} = useHashParams()
  const [username, setUsername] = useState(null)

  // 1. spotify authentication

  // show login if not authenticated
  if (!access_token) {
    return (
      <Step title="Authenticate via Spotify">
        <LoginSpotify setValue={_setState}/>
      </Step>
    )
  }

  // show error if authentication somehow failed
  if (state == null || state !== _state) {
    return (
      <Alert variant="danger">
        There was an error during authentication, please try again.
      </Alert>
    )
  }

  if (_access_token !== access_token) {
    _setAccessToken(access_token)
  }

  // 2. last.fm authentication

  // show login if not authenticated
  if (!username) {
    return (
      <Step title="Authenticate via Last.fm" subtitle="No password needed">
        <LoginLastfm setValue={setUsername}/>
      </Step>
    )
  }

  if (_username !== username) {
    _setUsername(username)
  }

  // 3. redirect
  
  return (
    <Redirect to="/user" />    
  )
}

export default AuthPage;