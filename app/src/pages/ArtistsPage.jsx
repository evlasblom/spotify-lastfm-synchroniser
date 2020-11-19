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
import { filterOnPlaycount, filterExclusiveArtists, compareArtists } from '../filters'

// ========== CONSTANTS ==================================================

const initial_selection = {period: 'overall', number: 20, playcount: 250 };

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

const clearAristsSpotify = async (access_token, artists) => {
  let ids = artists.map(artist => artist.id);
  return await spotifyApi.removeFollowingArtists(access_token, {ids: ids});
}

const importAristsSpotify = async (access_token, artists) => {
  let ids = [];
  // get the spotify ids by performing a search
  for (const artist of artists) {
    let query = '"' + artist.name + '"';
    let response = await spotifyApi.searchArtist(access_token, { q: query});
    let results = spotifyApi.parseArtists(response.data.artists.items);
    for (const result of results) {
      if (compareArtists(result, artist)) {
        ids.push(result.id);
        break;
      }
      else {
        // what do do if no exact match was found?
        // this could be due to different spelling, for example
        console.log("Could not find artist " + query);
      }
    }
    ids.push(results[0].id);
  }
  // follow matched artists
  return await spotifyApi.setFollowingArtists(access_token, {ids: ids});
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
        if (!filterOnPlaycount(limit)(artist)) class_name = "text-muted";
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
  // @TODO: replace local storage with account context
  const [access_token, ] = useLocalStorage(constants.token_key, null);
  const [username, ] = useLocalStorage(constants.user_key, null);

  const [selection, setSelection] = useState(initial_selection);

  const artistsSpotify = useAsync(
    () => getArtistsSpotify(access_token, {}), []);
  const artistsLastFm = useAsync(
    () => getArtistsLastFm(access_key, createOpts()), [selection.period, selection.number]);

  const [onlyOnSpotify, setOnlyOnSpotify] = useState([]);
  const [onlyOnLastFm, setOnlyOnLastFm] = useState([]);
      
  useEffect(() => {
    if (!artistsSpotify.result || !artistsLastFm.result) return
    // cross-compare spotify artists with filtered lastfm artists
    let onlyOnSpotify = 
      artistsSpotify.result.filter(filterExclusiveArtists(artistsLastFm.result.filter(filterOnPlaycount(selection.playcount))));
    // save exclusive list
    setOnlyOnSpotify(onlyOnSpotify);
    // cross-compare lastm fm artists with spotify artists and filter
    let onlyOnLastFm = 
      artistsLastFm.result.filter(filterExclusiveArtists(artistsSpotify.result)).filter(filterOnPlaycount(selection.playcount));
    // save exclusive list
    setOnlyOnLastFm(onlyOnLastFm);
  }, [artistsSpotify.result, artistsLastFm.result, selection.playcount])

  const createOpts = () => { return {user: username, period: selection.period, limit: selection.number}};

  return (
    <>
      <h2>Artists</h2>
      <br></br>
      <SelectionForm onSubmit={setSelection} initial={initial_selection} />
      <br></br>
      <ActionForm 
        text="Clear" 
        modal="This will clear all artists from Spotify that is not in your current top artist selection on Lastfm."
        variant="danger" 
        onSubmit={() => clearAristsSpotify(access_token, onlyOnSpotify)}
        onResult={artistsSpotify.execute} />
      <br></br>
      <ActionForm 
        text="Import" 
        modal="This will import all artists to Spotify that is in your current top artist selection on Lastfm."
        variant="success" 
        onSubmit={() => importAristsSpotify(access_token, onlyOnLastFm)}
        onResult={artistsSpotify.execute} />
      <br></br>
      <br></br>
      <div className="d-flex flex-row flex-wrap justify-content-center">

        <ArtistsList 
          target="Spotify"
          playcount={selection.playcount}
          loading={artistsSpotify.loading}
          error={artistsSpotify.error}
          data={artistsSpotify.result}
          exclusive={onlyOnSpotify}
          exclusiveClass="text-danger" />
        
        <ArtistsList 
          target="Last.fm"
          playcount={selection.playcount}
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