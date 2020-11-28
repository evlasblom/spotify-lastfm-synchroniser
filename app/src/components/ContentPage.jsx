import React, { useState, useEffect } from 'react';
import { useAsync, useAsyncCallback } from 'react-async-hook'

import useLocalStorage from '../hooks/useLocalStorage'
import * as spotifyApi from '../services/spotifyApi'
import * as lastfmApi from '../services/lastfmApi'

import ActionForm from '../components/ActionForm'
import SelectionForm from '../components/SelectionForm'
import * as constants from '../constants'
import { filterOnPlaycount } from '../filters'

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
    <table style={{ width: '25rem'}} className="mr-2 ml-2">
      <thead>
        <tr>
          <th>{props.title}</th>
        </tr>
      </thead>
      <tbody>
        {props.data.map((content, i) => {
          const [style, classname] = setContentStyle(content);        
          return (
            <tr key={i} className={classname} style={style}>
              <td>
                {content.rank ? (content.rank + ". ") : ""}
                {content.name}
                {content.playcount ? (" - " + content.playcount) : ""}
                {content.artist ? (
                  <>
                    <br></br>
                    <i>{content.artist[0].name}</i>
                  </>
                ) : ""}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function ContentPage(props) {
  const [access_token, ] = useLocalStorage(constants.token_key, null);
  const [username, ] = useLocalStorage(constants.user_key, null);

  // select button
  const [selection, setSelection] = useState(props.selection);

  // compare button
  const compareAsync = useAsyncCallback(
    () => props.compare(access_token, getSpotify.result, getLastFm.result)
  );

  // clear button
  const clearSpotifyAsync = useAsyncCallback(
    () => props.clearSpotify(access_token, updatedSpotify)
  );

  // import button
  const importSpotifyAsync = useAsyncCallback(
    () => props.importSpotify(access_token, updatedLastFm)
  );

  // fetch raw data
  const getSpotify = useAsync(
    () => props.getSpotify(access_token, optsSpotify()), [clearSpotifyAsync.result, importSpotifyAsync.result]);
  const getLastFm = useAsync(
    () => props.getLastFm(access_key, optsLastFm()), [selection.period, selection.number]);

  // update raw data with a state
  const [updatedSpotify, setUpdatedSpotify] = useState(null);
  const [updatedLastFm, setUpdatedLastFm] = useState(null);

  const optsSpotify = () => { 
    return {limit: spotifyApi.LIMIT_PER_PAGE}
  };
  const optsLastFm = () => { 
    return {user: username, limit: lastfmApi.LIMIT_PER_PAGE, ...selection}
  };

  // update state after fetching
  useEffect(() => {
    if (!getSpotify.result || getSpotify.loading || getSpotify.error) return;
    setUpdatedSpotify(getSpotify.result.map(artist => {
      return {...artist, state: ContentState.FILTERED};
    }));
  }, [getSpotify.result, getSpotify.loading, getSpotify.error])
  useEffect(() => {
    if (!getLastFm.result || getLastFm.loading || getLastFm.error) return;
    const playcountFilter = filterOnPlaycount(selection.playcount)
    setUpdatedLastFm(getLastFm.result.map(artist => {
      return {...artist, state: playcountFilter(artist) ? ContentState.FILTERED : ContentState.FETCHED};
    }));
  }, [getLastFm.result, getLastFm.loading, getLastFm.error, selection.playcount])
  
  useEffect(() => {
    if (compareAsync.result && !compareAsync.loading && !compareAsync.error) {
      setUpdatedSpotify(compareAsync.result.spotify);
      setUpdatedLastFm(compareAsync.result.lastfm);
    }
  }, [compareAsync.result, compareAsync.loading, compareAsync.error])

  useEffect(() => {
    setUpdatedSpotify(null);
  }, [clearSpotifyAsync.result])

  useEffect(() => {
    setUpdatedLastFm(null);
  }, [importSpotifyAsync.result])

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

        {!getSpotify.loading && !getSpotify.error && updatedSpotify ?
        <ContentList  
          title="Spotify"
          data={updatedSpotify} />
        : null }

        {!getLastFm.loading && !getLastFm.error && updatedLastFm ?
        <ContentList  
          title="Last.fm"
          data={updatedLastFm} />
        : null }

      </div>
    </>
  )
}

export default ContentPage;