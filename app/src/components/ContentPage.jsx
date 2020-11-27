import React, { useState, useEffect } from 'react';
import { useAsync, useAsyncCallback } from 'react-async-hook'

import useLocalStorage from '../hooks/useLocalStorage'
import * as spotifyApi from '../services/spotifyApi'
import * as lastfmApi from '../services/lastfmApi'

import ActionForm from '../components/ActionForm'
import SelectionForm from '../components/SelectionForm'
import * as constants from '../constants'

const access_key = process.env.REACT_APP_LASTFM_ACCESS_KEY;

const NOT_FILTERED_STYLE = {
  color: 'gray'
}

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

function setContentStyle(content) {
let style = {};
let classname = "";
if (content.state) {
  switch(content.state) {
    case ContentState.FETCHED:
      style = NOT_FILTERED_STYLE;
      break;
    case ContentState.SOUGHT:
      style = NOT_FOUND_STYLE;
      break;
    case ContentState.FOUND:
      style = NOT_CONFIRMED_STYLE;
      break;
    default:
      style = {};
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

function ContentList(props) {

  return (
    <div style={{ width: '25rem'}} className="mr-2 ml-2">
      <b>{props.title}</b>
      <br></br>
      <br></br>
      {props.data.map((content, i) => {
        const [style, classname] = setContentStyle(content);        
        return (
          <p key={i} className={classname} style={style}>
            {content.rank ? (content.rank + ". ") : ""}
            {content.name}
            {content.playcount ? (" - " + content.playcount) : ""}
            {content.artist ? (
              <>
                <br></br>
                <i>{content.artist[0].name}</i>
              </>
            ) : ""}
          </p>
        )
      })}
    </div>
  )
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
        {getSpotify.loading ? <p className="text-dark">Loading Spotify data... </p> : ""}
        {getLastFm.loading ? <p className="text-dark">Loading Last.fm data... </p> : ""}
        {compareAsync.loading ? <p className="text-dark">Comparing data... </p> : ""}
        {clearSpotifyAsync.loading ? <p className="text-dark">Clearing data from Spotify... </p> : ""}
        {importSpotifyAsync.loading ? <p className="text-dark">Importing data into Spotify... </p> : ""}

        {getSpotify.error ? <p className="text-danger">{getSpotify.error.message}</p> : ""}
        {getLastFm.error ? <p className="text-danger">{getLastFm.error.message}</p> : ""}
        {compareAsync.error ? <p className="text-danger">{compareAsync.error.message}</p> : ""}
        {clearSpotifyAsync.error ? <p className="text-danger">{clearSpotifyAsync.error.message}</p> : ""}
        {importSpotifyAsync.error ? <p className="text-danger">{importSpotifyAsync.error.message}</p> : ""}
      </div>
      <br></br>

      <div className="d-flex flex-row flex-wrap justify-content-center">

        {!getSpotify.loading && !getSpotify.error && !compareAsync.loading ?
        <ContentList  
          title="Spotify"
          data={updatedSpotify ? updatedSpotify : getSpotify.result} />
        : null }

        {!getLastFm.loading && !getLastFm.error && !compareAsync.loading ?
        <ContentList  
          title="Last.fm"
          data={updatedLastFm ? updatedLastFm : getLastFm.result} />
        : null }

      </div>
    </>
  )
}

export default ContentPage;