import React, { useState } from 'react';
import { Redirect } from 'react-router-dom'
import qs from 'qs';

import useHashParams from '../hooks/useHashParams'
import useLocalStorage from '../hooks/useLocalStorage'
import useLocation from '../hooks/useLocation'

import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert'

import * as constants from '../constants'

// @TODO: move authorization functions to spotify api and lastfm api files

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
function generateRandomString(length) {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

/**
 * Uses the Spotify implicit grant flow for authorization.
 * @param {object} opts An object with the redirect parameters.
 */
function temporaryUserAuthorization(opts) {
  const params = {
    response_type: 'token',
    ...opts
  }

  let baseUrl = 'https://accounts.spotify.com/authorize';
  let url = '?' + qs.stringify(params);

  return baseUrl + url;
}

function LoginSpotify(props) {
  const location = useLocation();

  const state = generateRandomString(16);

  const opts = {
    client_id: process.env.REACT_APP_SPOTIFY_CLIENT_ID,
    redirect_uri: location.origin + location.pathname,
    scope: `user-read-private 
      user-read-email 
      user-follow-read 
      user-library-read 
      user-follow-modify 
      user-library-modify`,
    state: state,
    show_dialog: false,
  }

  const onSubmit = (e) => {
    e.preventDefault();
    props.onSubmit(state);
    window.location = temporaryUserAuthorization(opts);
  }

  return (
    <Form onSubmit={onSubmit} className="d-flex flex-column justify-content-center align-content-center">
      <Button variant="primary" type="submit">Continue</Button>
    </Form>
  )
}

function LoginLastfm(props) {
  const [username, setUsername] = useState("")

  const onSubmit = (e) => {
    e.preventDefault();
    props.onSubmit(username);
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
      {props.subtitle ? props.subtitle : ""}
      <br></br>
      <br></br>
      {props.children}
    </>
  )
}

function AuthPage(props) {
  const [_state, _setState] = useLocalStorage(constants.state_key, null)
  const [_access_token, _setAccessToken] = useLocalStorage(constants.token_key, null)
  const [_username, _setUsername] = useLocalStorage(constants.user_key, null)
  
  const {state} = useHashParams()
  const {access_token} = useHashParams()
  const [username, setUsername] = useState(null)

  // 1. spotify authentication

  // show login if not authenticated
  if (!access_token) {
    return (
      <Step title="Authenticate via Spotify" subtitle="Valid for one hour.">
        <LoginSpotify onSubmit={_setState}/>
      </Step>
    )
  }

  // show error if authentication somehow failed
  if (!state || state !== _state) {
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
      <Step title="Authenticate via Last.fm" subtitle="No password needed.">
        <LoginLastfm onSubmit={setUsername}/>
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