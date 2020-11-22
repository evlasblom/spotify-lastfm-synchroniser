import React, { useState, useEffect } from 'react';
import { useAsync, useAsyncCallback } from 'react-async-hook'

import * as spotifyApi from '../services/spotifyApi'
import * as lastfmApi from '../services/lastfmApi'
import useLocalStorage from '../hooks/useLocalStorage'

import ActionForm from '../components/ActionForm'
import Error from '../components/Error'
import Loading from '../components/Loading'
import SelectionForm from '../components/SelectionForm'
import * as constants from '../constants'
import { filterOnPlaycount, filterExclusiveId, compareArtists, normalizeArtistName } from '../filters'

// ========== CONSTANTS ==================================================

const initial_selection = {period: 'overall', number: 20, playcount: 250 };

const access_key = process.env.REACT_APP_LASTFM_ACCESS_KEY;

// ========== FUNCTIONS ==================================================

const getSpotify = async (access_token, opts) => {
  let response = await spotifyApi.getFollowingArtists(access_token, opts);
  return spotifyApi.parseArtists(response.data.artists.items);
}

const getLastFm = async (access_key, opts) => {
  let response = await lastfmApi.getTopArtists(access_key, opts);
  return lastfmApi.parseArtists(response.data.topartists.artist);
}

const clearSpotify = async (access_token, artists) => {
  let ids = artists.map(artist => artist.id);
  if (ids.length === 0) return {};
  return await spotifyApi.removeFollowingArtists(access_token, {ids: ids});
}

const importSpotify = async (access_token, artists) => {
  let ids = artists.map(artist => artist.id);
  if (ids.length === 0) return {};
  return await spotifyApi.setFollowingArtists(access_token, {ids: ids});
}

const searchSpotify = async (access_token, artists) => {
  let updated = artists;
  for (const artist of updated) {
    let query = '"' + normalizeArtistName(artist.name) + '"';
    let response = await spotifyApi.searchArtist(access_token, { q: query});
    let results = spotifyApi.parseArtists(response.data.artists.items);

    // copy the spotify id of the search result
    artist.id = undefined;
    for (const result of results) {
      if (compareArtists(artist, result)) {
        artist.id = result.id;
        break;
      }
    }
    if (results.length === 0) {
      console.log("Could not find artist " + query);
    }
    else if (!artist.id) {
      console.log("Could not match artist " + artist.name + " / " + results[0].name);
    }
  }
  return updated;
}

const computeExclusive = async (access_token, artistsSpotify, artistsLastFm, playcount) => {
  // search for spotify ids and update the filtered lastfm artists
  const filteredLastFm = await searchSpotify(access_token, artistsLastFm.filter(filterOnPlaycount(playcount)));
  // cross-compare the ids of the spotify artists with the found spotify ids of the filtered lastfm artists
  const onlyOnSpotify = artistsSpotify.filter(filterExclusiveId(filteredLastFm));
  // cross-compare the found spotify ids of the filtered lastfm artists with with the ids of the spotify artists
  const onlyOnLastFm = filteredLastFm.filter(filterExclusiveId(artistsSpotify));
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
  const [access_token, ] = useLocalStorage(constants.token_key, null);
  const [username, ] = useLocalStorage(constants.user_key, null);

  const [selection, setSelection] = useState(initial_selection);
  
  const exclusiveAsync = useAsyncCallback(
    () => computeExclusive(access_token, artistsSpotify.result, artistsLastFm.result, selection.playcount)
  );
  const clearSpotifyAsync = useAsyncCallback(
    () => clearSpotify(access_token, onlyOnSpotify)
  );
  const importSpotifyAsync = useAsyncCallback(
    () => importSpotify(access_token, onlyOnLastFm)
  );

  const artistsSpotify = useAsync(
    () => getSpotify(access_token, {}), [clearSpotifyAsync.result, importSpotifyAsync.result]);
  const artistsLastFm = useAsync(
    () => getLastFm(access_key, createOpts()), [selection.period, selection.number]);

  const [onlyOnSpotify, setOnlyOnSpotify] = useState([]);
  const [onlyOnLastFm, setOnlyOnLastFm] = useState([]);

  const createOpts = () => { return {user: username, period: selection.period, limit: selection.number}};

  useEffect(() => {
    if (exclusiveAsync.result && !exclusiveAsync.loading && !exclusiveAsync.error) {
      setOnlyOnSpotify(exclusiveAsync.result.spotify);
      setOnlyOnLastFm(exclusiveAsync.result.lastfm);
    }
  }, [exclusiveAsync.result, exclusiveAsync.loading, exclusiveAsync.error])

  useEffect(() => {
    setOnlyOnSpotify([]);
  }, [clearSpotifyAsync.result, selection.period, selection.number])

  useEffect(() => {
    setOnlyOnLastFm([]);
  }, [importSpotifyAsync.result, selection.period, selection.number])

  return (
    <>
      <h2>Artists</h2>
      <br></br>

      <SelectionForm onSubmit={setSelection} initial={initial_selection} />
      <br></br>

      <ActionForm 
        text={exclusiveAsync.loading ? "..." : "Compare"}
        modal="This will cross-compare your Spotify and Last.fm artists. Proceed?"
        variant="primary" 
        disabled={!artistsSpotify.result || !artistsLastFm.result || artistsSpotify.error || artistsLastFm.error}
        onSubmit={exclusiveAsync.execute} />
      <br></br>

      <ActionForm 
        text={clearSpotifyAsync.loading ? "..." : "Clear"}
        modal="This will clear all artists from Spotify that are not in your current top artist selection on Last.fm. Are you sure?"
        variant="danger" 
        disabled={onlyOnSpotify.length === 0}
        onSubmit={clearSpotifyAsync.execute} />
      <br></br>

      <ActionForm 
        text={importSpotifyAsync.loading ? "..." : "Import"}
        modal="This will import all artists into Spotify that are in your current top artist selection on Last.fm. Are you sure?"
        variant="success" 
        disabled={onlyOnLastFm.length === 0}
        onSubmit={importSpotifyAsync.execute} />
      <br></br>

      <div style={{height: "2rem"}} className="p-1">
        {artistsSpotify.loading || artistsLastFm.loading ? "Loading data..." : ""}
        {exclusiveAsync.loading ? "Comparing data..." : ""}
        {clearSpotifyAsync.loading ? "Clearing data from Spotify..." : ""}
        {importSpotifyAsync.loading ? "Importing data into Spotify..." : ""}

        {exclusiveAsync.error ? <span className="text-danger">{exclusiveAsync.error.message}</span> : ""}
        {clearSpotifyAsync.error ? <span className="text-danger">{clearSpotifyAsync.error.message}</span> : ""}
        {importSpotifyAsync.error ? <span className="text-danger">{importSpotifyAsync.error.message}</span> : ""}
      </div>
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