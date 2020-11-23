import React, { useState, useEffect } from 'react';
import { useAsync, useAsyncCallback } from 'react-async-hook'

import useLocalStorage from '../hooks/useLocalStorage'
import * as spotifyApi from '../services/spotifyApi'
import * as lastfmApi from '../services/lastfmApi'

import ActionForm from '../components/ActionForm'
import SelectionForm from '../components/SelectionForm'
import * as constants from '../constants'

const access_key = process.env.REACT_APP_LASTFM_ACCESS_KEY;

function ContentPage(props) {
  const [access_token, ] = useLocalStorage(constants.token_key, null);
  const [username, ] = useLocalStorage(constants.user_key, null);

  const [selection, setSelection] = useState(props.selection);
  
  const exclusiveAsync = useAsyncCallback(
    () => props.computeExclusive(access_token, getSpotify.result, getLastFm.result, selection.playcount)
  );
  const clearSpotifyAsync = useAsyncCallback(
    () => props.clearSpotify(access_token, onlyOnSpotify)
  );
  const importSpotifyAsync = useAsyncCallback(
    () => props.importSpotify(access_token, onlyOnLastFm)
  );

  const getSpotify = useAsync(
    () => props.getSpotify(access_token, optsSpotify()), [clearSpotifyAsync.result, importSpotifyAsync.result]);
  const getLastFm = useAsync(
    () => props.getLastFm(access_key, optsLastFm()), [selection.period, selection.number]);

  const [onlyOnSpotify, setOnlyOnSpotify] = useState([]);
  const [onlyOnLastFm, setOnlyOnLastFm] = useState([]);

  const optsSpotify = () => { 
    return {limit: spotifyApi.LIMIT_PER_PAGE}
  };
  const optsLastFm = () => { 
    return {user: username, period: selection.period, number: selection.number, limit: lastfmApi.LIMIT_PER_PAGE}
  };

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
      <h2>{props.title}</h2>
      <br></br>

      <SelectionForm onSubmit={setSelection} initial={props.selection} />
      <br></br>

      <ActionForm 
        text={exclusiveAsync.loading ? "..." : "Compare"}
        modal="This will cross-compare your Spotify and Last.fm data. Proceed?"
        variant="primary" 
        disabled={!getSpotify.result || !getLastFm.result || getSpotify.error || getLastFm.error}
        onSubmit={exclusiveAsync.execute} />
      <br></br>

      <ActionForm 
        text={clearSpotifyAsync.loading ? "..." : "Clear"}
        modal="This will clear all data from Spotify that are not in your current selection on Last.fm. Are you sure?"
        variant="danger" 
        disabled={onlyOnSpotify.length === 0}
        onSubmit={clearSpotifyAsync.execute} />
      <br></br>

      <ActionForm 
        text={importSpotifyAsync.loading ? "..." : "Import"}
        modal="This will import all data into Spotify that are in your current selection on Last.fm. Are you sure?"
        variant="success" 
        disabled={onlyOnLastFm.length === 0}
        onSubmit={importSpotifyAsync.execute} />
      <br></br>

      <div style={{height: "2rem"}} className="p-1">
        {getSpotify.loading || getLastFm.loading ? "Loading data... " : ""}
        {exclusiveAsync.loading ? "Comparing data..." : ""}
        {clearSpotifyAsync.loading ? "Clearing data from Spotify... " : ""}
        {importSpotifyAsync.loading ? "Importing data into Spotify... " : ""}

        {getSpotify.error ? <span className="text-danger">{getSpotify.error.message}</span> : ""}
        {getLastFm.error ? <span className="text-danger">{getLastFm.error.message}</span> : ""}
        {exclusiveAsync.error ? <span className="text-danger">{exclusiveAsync.error.message}</span> : ""}
        {clearSpotifyAsync.error ? <span className="text-danger">{clearSpotifyAsync.error.message}</span> : ""}
        {importSpotifyAsync.error ? <span className="text-danger">{importSpotifyAsync.error.message}</span> : ""}
      </div>
      <br></br>

      <div className="d-flex flex-row flex-wrap justify-content-center">

        {!getSpotify.loading && !getSpotify.error ?
        React.cloneElement(props.list, { 
          target: "Spotify",
          playcount: selection.playcount,
          data: getSpotify.result,
          exclusive: onlyOnSpotify,
          exclusiveClass: "text-danger"
        })
        : null }

        {!getLastFm.loading && !getLastFm.error ?
        React.cloneElement(props.list, { 
          target: "Last.fm",
          playcount: selection.playcount,
          data: getLastFm.result,
          exclusive: onlyOnLastFm,
          exclusiveClass: "text-success"
        })
        : null }

      </div>
    </>
  )
}

export default ContentPage;