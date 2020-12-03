import React, { useState, useReducer, useEffect } from 'react'
import { useAsync } from 'react-async-hook'

import * as spotifyApi from '../services/spotifyApi'
import * as lastfmApi from '../services/lastfmApi'

// NOTE: this file is not (yet) used!

const getProfileSpotify = async (access_token) => {
  let response = await spotifyApi.getProfile(access_token, {});
  let profile = spotifyApi.parseProfile(response.data);
  return { 
    spotify: { 
      user: profile,
      access_token: access_token
    }
  };
}

const getProfileLastFm = async (access_key, id) => {
  let response = await lastfmApi.getProfile(access_key, {user: id });
  let profile = lastfmApi.parseProfile(response.data.user);
  return {  
    lastfm: { 
      user: profile,
      access_key: access_key
    } 
  };
}

const initial_state = {
  spotify: {
    user: {
      name: null,
      id: null
    }, // spotify user profile
    access_token: null,
    authenticated: false,
    loading: true
  },
  lastfm: {
    user: {
      name: null,
      id: null
    }, // lastfm user profile
    access_key: null,
    authenticated: false,
    loading: true
  }
}

const reducer = (state, action) => {
  switch(action.type) {
    case 'SPOTIFY_AUTH':
      return {
        ...state,
        spotify: {
          ...state.spotify, 
          access_token: action.payload.access_token,
          user: { id: action.payload.id }
        }
      }
    case 'LASTFM_AUTH':
      return {
        ...state,
        lastfm: {
          ...state.lastfm, 
          access_key: action.payload.access_key,
          user: { id: action.payload.id }
        }
      }
    case 'FINALIZE':
      return {
        ...state,
        ...action.payload
      }
    case 'LOGOUT':
      return {
        ...state,
        spotify: {
          ...state.spotify,
          authenticated: false
        },
        lastfm: {
          ...state.lastfm,
          authenticated: false
        }
      }
    default:
      return state;
  }
}

const initial_context = {
  ...initial_state,
  setSpotifyAccessToken: () => {},
  setLastmFmUsername: () => {},
}

export const AccountContext = React.createContext(initial_context)

export const AccountProvider = ({ children }) => {
  const [expiresSpotify, setExpiresSpotify] = useState(-1);
  const [expiresLastFm, setExpiresLastFm] = useState(-1);
  const [state, dispatch] = useReducer(reducer, initial_state);

  // @TODO: initialize auth from local storage if available
  // const [_spotifyAuth, _setSpotifyAuth] = useLocalStorage(constants.spotify_key, null)
  // const [_lastFmAuth, _setLastFmAuth] = useLocalStorage(constants.lastm_key, null)

  // Async calls to fetch the profiles, in order to verify if authentication succeeded
  const profileSpotify = useAsync(
    () => getProfileSpotify(state.spotify.access_token), [state.spotify.access_token]
  )
  const profileLastFm = useAsync(
    () => getProfileLastFm(state.lastfm.access_key, state.lastfm.user.id), [state.lastfm.user.id]
  )

  // Side effect if async calls succeeded, to finalize the whole context
  useEffect(() => {
    if (!profileSpotify.result || !profileLastFm.result) return;
    dispatch({action: 'FINALIZE', payload: {
      spotify: {
        ...profileSpotify.result.spotify,
        authenticated: profileSpotify.result && !profileSpotify.error,
        loading: profileSpotify.loading
      },
      lastfm: {
        ...profileLastFm.result.lastfm,
        authenticated: profileLastFm.result && !profileLastFm.error,
        loading: profileLastFm.loading
      }
    }})
  }, [profileSpotify.result, profileLastFm.result])

  // Side effect if authentication expires
  useEffect(() => {
    if (expiresSpotify < 0) return;
    const timeout = expiresSpotify - 5; // just to be on the safe side
    const timer = setTimeout(() => dispatch({action: 'LOGOUT'}), timeout);
    return () => clearTimeout(timer);
  }, [expiresSpotify])

  useEffect(() => {
    if (expiresLastFm < 0) return;
    const timeout = expiresLastFm - 5; // just to be on the safe side
    const timer = setTimeout(() => dispatch({action: 'LOGOUT'}), timeout);
    return () => clearTimeout(timer);
  }, [expiresLastFm])

  // This method will be triggered from the auth page
  const setSpotify = (access_token, id, expires) => {
    // first set authentication expiration
    setExpiresSpotify(expires);
    // then dispatch spotify auth data
    dispatch({action: 'SPOTIFY_AUTH', payload: {access_token: access_token, id: id}})
    // and manually trigger fetching the profile
    profileSpotify.execute();
    // the resulting response will automatically trigger the earlier side effect
  }

  // This method will be triggered from the auth page
  const setLastFm = (access_key, id, expires) => {
    // first set authentication expiration
    setExpiresLastFm(expires);
    // then dispatch spotify auth data
    dispatch({action: 'LASTFM_AUTH', payload: {access_key: access_key, id: id}})
    // and manually trigger fetching the profile
    profileLastFm.execute();
    // the resulting response will automatically trigger the earlier side effect
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

export const AccountConsumer = AccountContext.Consumer
