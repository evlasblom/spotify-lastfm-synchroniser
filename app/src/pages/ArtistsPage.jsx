import React, { useState, useEffect } from 'react';
import { useAsync } from 'react-async-hook'

import * as spotifyApi from '../services/spotifyApi'
import * as lastfmApi from '../services/lastfmApi'
import useLocalStorage from '../hooks/useLocalStorage'

import ActionForm from '../components/ActionForm'
import Error from '../components/Error'
import Loading from '../components/Loading'
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

function compareArtists(one, two) {
  return one && two && one.name === two.name
}

function comparePlaycount(artist, limit) {
  return artist && artist.playcount < limit
}

function compareWith(otherArray) {
  return function(current) {
    return otherArray.filter(function(other) {
      return compareArtists(other, current)
    }).length === 0;
  }
}

// ========== COMPONENTS ==================================================

function ArtistsList(props) {
  const loading = props.loading;
  const error = props.error;
  const artists = props.data;
  const target = props.target;
  const limit = props.playcount ? props.playcount : 0;
  const exclusive = props.exclusive;

  // check if loading
  if (loading) {
    return <Loading style={{ width: '25rem'}} className="mr-2 ml-2" />
  }

  // check if error
  else if (error) {
    return <Error style={{ width: '25rem'}} className="mr-2 ml-2" error={error} />
  }

  // otherwise success
  let j = 0;
  return (
    <div style={{ width: '25rem'}} className="mr-2 ml-2">
      <b>{target}</b>
      <br></br>
      <br></br>
      {artists.map((artist, i) => {
        let class_name = ""
        if (compareArtists(artist, exclusive[j])) { j++; class_name = props.exclusiveClass}
        if (comparePlaycount(artist, limit)) class_name = "text-muted";
        return (
          <p key={i} className={class_name}>
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

  const artistsSpotify = useAsync(
    () => getArtistsSpotify(access_token, {}), []);
  const artistsLastFm = useAsync(
    () => getArtistsLastFm(access_key, createOpts()), [form.period, form.number]);

  const [onlyOnSpotify, setOnlyOnSpotify] = useState([]);
  const [onlyOnLastFm, setOnlyOnLastFm] = useState([]);
      
  useEffect(() => {
    if (!artistsSpotify.result || !artistsLastFm.result) return
    let onlyOnSpotify = artistsSpotify.result.filter(compareWith(artistsLastFm.result));
    setOnlyOnSpotify(onlyOnSpotify); // this list may removed from spotify
    let onlyOnLastFm = artistsLastFm.result.filter(compareWith(artistsSpotify.result));
    setOnlyOnLastFm(onlyOnLastFm); // this list may be added to spotify
  }, [artistsSpotify.result, artistsLastFm.result])

  const createOpts = () => { return {user: username, period: form.period, limit: form.number}};

  return (
    <>
      <h2>Artists</h2>
      <br></br>
      <SelectionForm onSubmit={setForm} initial={initial_form} />
      <br></br>
      <ActionForm onClear={console.log} onImport={console.log} />
      <br></br>
      <br></br>
      <div className="d-flex flex-row flex-wrap justify-content-center">

        <ArtistsList 
          target="Spotify"
          playcount={form.playcount}
          loading={artistsSpotify.loading}
          error={artistsSpotify.error}
          data={artistsSpotify.result}
          exclusive={onlyOnSpotify}
          exclusiveClass="text-danger" />
        
        <ArtistsList 
          target="Last.fm"
          playcount={form.playcount}
          loading={artistsLastFm.loading}
          error={artistsLastFm.error}
          data={artistsLastFm.result} 
          exclusive={onlyOnLastFm}
          exclusiveClass="text-success" />

      </div>
    </>
  )
}

export default ArtistsPage;