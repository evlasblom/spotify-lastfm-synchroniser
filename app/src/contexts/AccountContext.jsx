import React, { useReducer, useEffect } from 'react'

import * as spotifyApi from '../services/spotifyApi'
import * as lastfmApi from '../services/lastfmApi'

// NOTE: this file is not (yet) used.

const getProfileSpotify = async (access_token, opts) => {
  let response = await spotifyApi.getProfile(access_token, opts);
  return spotifyApi.parseProfile(response.data);
}

const getProfileLastFm = async (access_key, opts) => {
  let response = await lastfmApi.getProfile(access_key, opts);
  return lastfmApi.parseProfile(response.data.user);
}

const initial_state = {
  spotify: {
    user: null, // spotify user profile
    access_token: null,
    authenticated: false,
    loading: true
  },
  lastfm: {
    user: null, // lastfm user profile
    access_key: null,
    authenticated: false,
    loading: true
  }
}

const initial_context = {
  ...initial_state,
  setSpotifyAccessToken: () => {},
  setLastmFmUsername: () => {},
}

const reducer = (state, action) => {
  switch(action.type) {
    case 'SPOTIFY_AUTH':
      return {
        ...state,
        spotify: {...state.spotify, access_token: action.payload}
      }
    case 'LASTFM_AUTH':
      return {
        ...state,
        lastfm: {...state.lastfm, user: {id: action.payload}}
      }
    case 'FINALIZE':
      return {
        ...state,
        ...action.payload
      }
    default:
      return state;
  }
}

export const AccountContext = React.createContext(initial_context)

export const Provider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initial_state);
  const asyncProfileSpotify = useAsync(
    () => getProfileSpotify(state.spotify.access_token, {}));
  const asyncProfileLastFm = useAsync(
    () => getProfileLastFm(access_key, {user: state.lastfm.user.id}));

  useEffect(() => {
    dispatch({action: 'FINALIZE', payload: {
      spotify: {
        user: getProfileSpotify.result,
        access_token: state.spotify.access_token,
        authenticated: getProfileSpotify.result && !getProfileSpotify.error,
        loading: getProfileSpotify.loading
      },
      lastfm: {
        user: getProfileLastFm.result,
        access_key: process.env.REACT_APP_LASTFM_ACCESS_KEY,
        authenticated: getProfileLastFm.result && !getProfileLastFm.error,
        loading: getProfileLastFm.loading
      }
    }})
  }, [asyncProfileSpotify, asyncProfileLastFm])

  const setSpotify = (access_key) => {
    // this dispatch will be triggered from the auth page
    dispatch({action: 'SPOTIFY_AUTH', payload: access_key})
    // hereafter we will manually trigger fetching the profile
    asyncProfileSpotify.execute();
    // the resulting response will trigger a complete state update in the above side effect
  }

  const setLastFm = (username) => {
    // this dispatch will be triggered from the auth page
    dispatch({action: 'LASTFM_AUTH', payload: username})
    // hereafter we will manually trigger fetching the profile
    getProfileLastFm.execute();
    // the resulting response will trigger a complete state update in the above side effect
  }

  return (
    <AccountContext.Provider value={{
      ...state,
      setSpotifyAccessToken: setSpotify,
      setLastmFmUsername: setLastFm
    }}>
      {children}
    </AccountContext.Provider>
  )
}
