import React from 'react';
import { useAsync } from 'react-async-hook'

import * as spotifyApi from '../services/spotifyApi'
import * as lastfmApi from '../services/lastfmApi'
import useLocalStorage from '../hooks/useLocalStorage'

import ProfileCard, { ProfileCardPlaceholder } from '../components/ProfileCard'

import * as constants from '../constants'

// Get the Last.fm access key from the environment variables
const access_key = process.env.REACT_APP_LASTFM_ACCESS_KEY;

// Fetches and parses the Spotify profile
const getProfileSpotify = async (access_token, opts) => {
  let response = await spotifyApi.getProfile(access_token, opts);
  return spotifyApi.parseProfile(response.data);
}

// Fetches and parses the Last.fm profile
const getProfileLastFm = async (access_key, opts) => {
  let response = await lastfmApi.getProfile(access_key, opts);
  return lastfmApi.parseProfile(response.data.user);
}

// Parse common errors
function parseErrors(error) {
  const text = error.toLowerCase();
  if (text.includes("401")) return "authentication expired, please restart from the home page.";
  if (text.includes("429")) return "too many requests, please try again later."
  return text;
}

// Profile page component
function ProfilePage(props) {
  const [access_token, ] = useLocalStorage(constants.token_key, null);
  const [username, ] = useLocalStorage(constants.user_key, null);

  const profileSpotify = useAsync(
    () => getProfileSpotify(access_token, {}), [access_token]);
  const profileLastFm = useAsync(
    () => getProfileLastFm(access_key, {user: username}), [username]);

  return (
    <>
      <div style={{height: "3rem"}} className="p-1">
        {profileSpotify.loading || profileLastFm.loading ? "Loading data... " : ""}

        {profileSpotify.error ? <p className="text-danger">Spotify load error: {parseErrors(profileSpotify.error.message)}</p> : ""}
        {profileLastFm.error ? <p className="text-danger">Last.fm load error: {parseErrors(profileLastFm.error.message)}</p> : ""}
      </div>
      <br></br>

      <div className="d-flex flex-row flex-wrap justify-content-center align-items-center">

        {!profileSpotify.loading && !profileSpotify.error ? 
        <ProfileCard 
          target="Spotify"
          data={profileSpotify.result} />
        : 
        <ProfileCardPlaceholder />
        }
        
        {!profileLastFm.loading && !profileLastFm.error ? 
        <ProfileCard 
          target="Last.fm"
          data={profileLastFm.result} />
        : 
        <ProfileCardPlaceholder />
        }

      </div>
    </>
  )
}

export default ProfilePage;
