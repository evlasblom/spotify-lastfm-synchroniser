import React, { useState, useEffect } from 'react';
import { useAsync, useAsyncCallback } from 'react-async-hook'

import useLocalStorage from '../hooks/useLocalStorage'
import * as spotifyApi from '../services/spotifyApi'
import * as lastfmApi from '../services/lastfmApi'

import ActionForm from '../components/ActionForm'
import SelectionForm from '../components/SelectionForm'
import * as constants from '../constants'

const access_key = process.env.REACT_APP_LASTFM_ACCESS_KEY;

const NOT_FOUND_STYLE = {
  textDecorationLine: 'line-through', 
  textDecorationStyle: 'solid', 
  textDecorationColor: 'gray'
};

const NOT_CONFIRMED_STYLE = {
  textDecorationLine: 'underline', 
  textDecorationStyle: 'wavy', 
  textDecorationColor: 'orange'
};

export const ContentState = {
  NONE: 0,
  FETCHED: 1,   // content fetched from server
  FILTERED: 2,  // content passed initial filter
  SOUGHT: 3,    // search on spotify executed
  FOUND: 4,     // search on spotify succeeded
  CONFIRMED: 5, // search on spotify confirmed as correct
}

export const ContentAction = {
  CLEAR: -1,
  NONE: 0,
  IMPORT: 1
}

export function setContentStyle(content) {
let style = {};
let classname = "";
if (content.state) {
  switch(content.state) {
    case ContentState.FETCHED:
      classname = "text-muted";
      break;
    case ContentState.FILTERED:
      classname = "text-dark";
      break;
    case ContentState.SOUGHT:
      style = NOT_FOUND_STYLE;
      break;
    case ContentState.FOUND:
      style = NOT_CONFIRMED_STYLE;
      break;
    case ContentState.CONFIRMED:
      classname = "text-dark";
      break;
    default:
      style = {};
      classname = "";
  }
}
if (content.action) {
  switch(content.action) {
    case ContentAction.IMPORT:
      classname = "text-success"
      break;
    case ContentAction.CLEAR:
      classname = "text-danger"
      break;
    default:
      classname = ""
  }
}
return [style, classname];
}

function ContentPage(props) {
  const [access_token, ] = useLocalStorage(constants.token_key, null);
  const [username, ] = useLocalStorage(constants.user_key, null);

  const [selection, setSelection] = useState(props.selection);
  
  const compareAsync = useAsyncCallback(
    () => props.compare(access_token, getSpotify.result, getLastFm.result)
  );
  const clearSpotifyAsync = useAsyncCallback(
    () => props.clearSpotify(access_token, updatedSpotify)
  );
  const importSpotifyAsync = useAsyncCallback(
    () => props.importSpotify(access_token, updatedLastFm)
  );

  const getSpotify = useAsync(
    () => props.getSpotify(access_token, optsSpotify()), [clearSpotifyAsync.result, importSpotifyAsync.result]);
  const getLastFm = useAsync(
    () => props.getLastFm(access_key, optsLastFm()), [selection.period, selection.number, selection.playcount]);

  const [updatedSpotify, setUpdatedSpotify] = useState(null);
  const [updatedLastFm, setUpdatedLastFm] = useState(null);

  const optsSpotify = () => { 
    return {limit: spotifyApi.LIMIT_PER_PAGE}
  };
  const optsLastFm = () => { 
    return {user: username, limit: lastfmApi.LIMIT_PER_PAGE, ...selection}
  };

  useEffect(() => {
    if (compareAsync.result && !compareAsync.loading && !compareAsync.error) {
      setUpdatedSpotify(compareAsync.result.spotify);
      setUpdatedLastFm(compareAsync.result.lastfm);
    }
  }, [compareAsync.result, compareAsync.loading, compareAsync.error])

  useEffect(() => {
    setUpdatedSpotify(null);
  }, [clearSpotifyAsync.result, selection.period, selection.number, selection.playcount])

  useEffect(() => {
    setUpdatedLastFm(null);
  }, [importSpotifyAsync.result, selection.period, selection.number, selection.playcount])

  return (
    <>
      {/* <h2>{props.title}</h2> */}
      {/* <br></br> */}

      <SelectionForm onSubmit={setSelection} initial={props.selection} />
      <br></br>

      <ActionForm 
        text={compareAsync.loading ? "..." : "Compare"}
        modal="This will cross-compare your Spotify and Last.fm data. Proceed?"
        variant="primary" 
        disabled={!getSpotify.result || !getLastFm.result || getSpotify.error || getLastFm.error}
        onSubmit={compareAsync.execute} />
      <br></br>

      <ActionForm 
        text={clearSpotifyAsync.loading ? "..." : "Clear"}
        modal="This will clear all data from Spotify that are not in your current selection on Last.fm. Are you sure?"
        variant="danger" 
        disabled={!updatedSpotify}
        onSubmit={clearSpotifyAsync.execute} />
      <br></br>

      <ActionForm 
        text={importSpotifyAsync.loading ? "..." : "Import"}
        modal="This will import all data into Spotify that are in your current selection on Last.fm. Are you sure?"
        variant="success" 
        disabled={!updatedLastFm}
        onSubmit={importSpotifyAsync.execute} />
      <br></br>

      <div style={{height: "2rem"}} className="p-1">
        {getSpotify.loading || getLastFm.loading ? "Loading data... " : ""}
        {compareAsync.loading ? "Comparing data..." : ""}
        {clearSpotifyAsync.loading ? "Clearing data from Spotify... " : ""}
        {importSpotifyAsync.loading ? "Importing data into Spotify... " : ""}

        {getSpotify.error ? <span className="text-danger">{getSpotify.error.message}</span> : ""}
        {getLastFm.error ? <span className="text-danger">{getLastFm.error.message}</span> : ""}
        {compareAsync.error ? <span className="text-danger">{compareAsync.error.message}</span> : ""}
        {clearSpotifyAsync.error ? <span className="text-danger">{clearSpotifyAsync.error.message}</span> : ""}
        {importSpotifyAsync.error ? <span className="text-danger">{importSpotifyAsync.error.message}</span> : ""}
      </div>
      <br></br>

      <div className="d-flex flex-row flex-wrap justify-content-center">

        {!getSpotify.loading && !getSpotify.error && !compareAsync.loading ?
        React.cloneElement(props.list, { 
          title: "Spotify",
          data: updatedSpotify ? updatedSpotify : getSpotify.result
        })
        : null }

        {!getLastFm.loading && !getLastFm.error && !compareAsync.loading ?
        React.cloneElement(props.list, { 
          title: "Last.fm",
          data: updatedLastFm ? updatedLastFm : getLastFm.result
        })
        : null }

      </div>
    </>
  )
}

export default ContentPage;