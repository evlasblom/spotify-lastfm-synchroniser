import React from 'react';
import { useAsync } from 'react-async-hook'

import * as spotifyApi from '../services/spotifyApi'
import * as lastfmApi from '../services/lastfmApi'
import useLocalStorage from '../hooks/useLocalStorage'

import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card'

import * as constants from '../constants'

// Get the Last.fm access key from the environment variables
const access_key = process.env.REACT_APP_LASTFM_ACCESS_KEY;

/**
 * Fetches and parses the Spotify profile.
 * @param {String} access_token Spotify access token.
 * @param {Object} opts Spotify api options.
 */
const getProfileSpotify = async (access_token, opts) => {
  let response = await spotifyApi.getProfile(access_token, opts);
  return spotifyApi.parseProfile(response.data);
}

/**
 * Fetches and perses the Last.fm profile.
 * @param {String} access_key The last.fm access key.
 * @param {Object} opts The Last.fm api options.
 */
const getProfileLastFm = async (access_key, opts) => {
  let response = await lastfmApi.getProfile(access_key, opts);
  return lastfmApi.parseProfile(response.data.user);
}

// A profile card component.
function ProfileCard(props) {
  const profile = props.data;
  const target = props.target;

  return (
    <Card style={{ width: '18rem', height: '30rem'}} className="m-2">
      <Card.Img variant="top" src={profile.image} />
      <Card.Body>
        <Card.Title>{profile.name}</Card.Title>
        <Card.Subtitle className="mb-2 text-muted">ID: {profile.id}</Card.Subtitle>
        <Card.Text>
          A {profile.product} {profile.type}.
        </Card.Text>
        <Button className
          variant="success" 
          href={profile.url}
          target="_blank">View on {target}</Button>
      </Card.Body>
    </Card>
  )
}

// A profile card placeholder component when loading...
function ProfileCardPlaceholder(props) {

  return (
    <Card style={{ width: '18rem', height: '30rem'}} className="m-2">
    </Card>
  )
}

// Profile page component.
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

        {profileSpotify.error ? <p className="text-danger">Spotify load error: {profileSpotify.error.message.toLowerCase()}</p> : ""}
        {profileLastFm.error ? <p className="text-danger">Last.fm load error: {profileLastFm.error.message.toLowerCase()}</p> : ""}
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
