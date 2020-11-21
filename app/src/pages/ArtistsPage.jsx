import React, { useState } from 'react';
import { useAsync } from 'react-async-hook'

import * as spotifyApi from '../services/spotifyApi'
import * as lastfmApi from '../services/lastfmApi'
import useLocalStorage from '../hooks/useLocalStorage'

import ActionForm from '../components/ActionForm'
import Error from '../components/Error'
import Loading from '../components/Loading'
import SelectionForm from '../components/SelectionForm'
import * as constants from '../constants'
import { filterOnPlaycount, filterExclusiveId, compareArtists } from '../filters'

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

const importArtistsSpotify = async (access_token, artists) => {
  let ids = artists.map(artist => artist.id);
  return await spotifyApi.setFollowingArtists(access_token, {ids: ids});
}

const searchArtistsSpotify = async (access_token, artists) => {
  let updated = artists;
  for (let artist of updated) {
    let query = '"' + artist.name + '"';
    let response = await spotifyApi.searchArtist(access_token, { q: query});
    let results = spotifyApi.parseArtists(response.data.artists.items);

    // copy the spotify id of the search result
    if (results.length >= 1) {
      if (compareArtists(artist, results[0])) {
        artist.id = results[0].id;
      }
      else {
        console.log("Could not match artist " + artist.name + " / " + results[0].name);
      }
    }
    else {
      console.log("Could not find artist " + query);
    }
  }
  return updated;
}

const computeExclusiveArtists = async (access_token, artistsSpotify, artistsLastFm, playcount) => {
  // search for spotify ids and update the filtered lastfm artists
  const tmpLastfm = await searchArtistsSpotify(access_token, artistsLastFm.filter(filterOnPlaycount(playcount)));
  // cross-compare the ids of the spotify artists with the found spotify ids of the filtered lastfm artists
  const onlyOnSpotify = artistsSpotify.filter(filterExclusiveId(tmpLastfm));
  // cross-compare the found spotify ids of the filtered lastfm artists with with the ids of the spotify artists
  const onlyOnLastFm = tmpLastfm.filter(filterExclusiveId(artistsSpotify));
  // return results
  return {
    spotify: onlyOnSpotify,
    lastfm: onlyOnLastFm
  };
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
  const [computing, setComputing] = useState(false);

  const artistsSpotify = useAsync(
    () => getArtistsSpotify(access_token, {}), []);
  const artistsLastFm = useAsync(
    () => getArtistsLastFm(access_key, createOpts()), [selection.period, selection.number]);

  const [onlyOnSpotify, setOnlyOnSpotify] = useState([]);
  const [onlyOnLastFm, setOnlyOnLastFm] = useState([]);

  const createOpts = () => { return {user: username, period: selection.period, limit: selection.number}};

  return (
    <>
      <h2>Artists</h2>
      <br></br>

      <SelectionForm 
        onSubmit={(val) => {
          setSelection(val);
          setOnlyOnSpotify([]); 
          setOnlyOnLastFm([]); 
        }}
        initial={initial_selection} />
      <br></br>

      <ActionForm 
        text="Compare" 
        modal="This will cross-compare your Spotify and Last.fm artists. Proceed?"
        variant="primary" 
        onSubmit={() => {
          setComputing(true);
          return computeExclusiveArtists(access_token, artistsSpotify.result, artistsLastFm.result, selection.playcount)
        }}
        onResult={(res) => {
          setComputing(false);
          setOnlyOnSpotify(res.spotify); 
          setOnlyOnLastFm(res.lastfm); 
        }} />
      <br></br>

      <ActionForm 
        text="Clear" 
        modal="This will clear all artists from Spotify that are not in your current top artist selection on Last.fm. Are you sure?"
        variant="danger" 
        onSubmit={() => clearAristsSpotify(access_token, onlyOnSpotify)}
        onResult={(res) => artistsSpotify.execute()} />
      <br></br>

      <ActionForm 
        text="Import" 
        modal="This will import all artists into Spotify that are in your current top artist selection on Last.fm. Are you sure?"
        variant="success" 
        onSubmit={() => importArtistsSpotify(access_token, onlyOnLastFm)}
        onResult={(res) => artistsSpotify.execute()} />
      <br></br>
      <br></br>

      <div style={{height: "2rem"}}>
        {/* {computing ? "Computing differences..." : ""} */}
      </div>
      <br></br>

      <div className="d-flex flex-row flex-wrap justify-content-center">

        <ArtistsList 
          target="Spotify"
          playcount={selection.playcount}
          loading={artistsSpotify.loading || computing}
          error={artistsSpotify.error}
          data={artistsSpotify.result}
          exclusive={onlyOnSpotify}
          exclusiveClass="text-danger" />
        
        <ArtistsList 
          target="Last.fm"
          playcount={selection.playcount}
          loading={artistsLastFm.loading || computing}
          error={artistsLastFm.error}
          data={artistsLastFm.result} 
          exclusive={onlyOnLastFm}
          exclusiveClass="text-success" />

      </div>
    </>
  )
}

export default ArtistsPage;