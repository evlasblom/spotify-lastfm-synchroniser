import React from 'react';
import { Link } from 'react-router-dom'
import { useAsync } from 'react-async-hook'

import * as spotifyApi from '../services/spotifyApi'
import * as lastfmApi from '../services/lastfmApi'
import useLocalStorage from '../hooks/useLocalStorage'

import ProfileCard from '../components/ProfileCard'
import * as constants from '../constants'

// ========== FUNCTIONS ==================================================

const getProfileSpotify = async (access_token, opts) => {
  let response = await spotifyApi.getProfile(access_token, opts);
  return spotifyApi.parseProfile(response.data);
}

const getProfileLastFm = async (access_key, opts) => {
  let response = await lastfmApi.getProfile(access_key, opts);
  return lastfmApi.parseProfile(response.data.user);
}

// ========== COMPONENTS ==================================================

// ...

// ========== MAIN ==================================================

function ProfilePage(props) {
  const [access_token, ] = useLocalStorage(constants.token_key, null);
  const [username, ] = useLocalStorage(constants.user_key, null);

  const access_key = process.env.REACT_APP_LASTFM_ACCESS_KEY

  const asyncProfileSpotify = useAsync(
    () => getProfileSpotify(access_token, {}), [access_token]);
  const asyncProfileLastFm = useAsync(
    () => getProfileLastFm(access_key, {user: username}), [username]);

  return (
    <>
      <h2>User</h2>
      Click <Link to="/auth">here</Link> to reauthenticate.
      <br></br>
      <br></br>
      <div className="d-flex flex-row flex-wrap justify-content-center align-items-center">

        <ProfileCard 
          target="Spotify"
          loading={asyncProfileSpotify.loading}
          error={asyncProfileSpotify.error}
          data={asyncProfileSpotify.result} />
        
        <ProfileCard 
          target="Last.fm"
          loading={asyncProfileLastFm.loading}
          error={asyncProfileLastFm.error}
          data={asyncProfileLastFm.result} />

      </div>
    </>
  )
}

export default ProfilePage;
