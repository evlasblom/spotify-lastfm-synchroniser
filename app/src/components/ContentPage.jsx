import React, { useState, useReducer, useEffect } from 'react';
import { useAsync, useAsyncCallback } from 'react-async-hook'

import useLocalStorage from '../hooks/useLocalStorage'
import * as spotifyApi from '../services/spotifyApi'
import * as lastfmApi from '../services/lastfmApi'

import ActionForm from '../components/ActionForm'
import SelectionForm from '../components/SelectionForm'
import * as constants from '../constants'
import { filterOnPlaycount, findIndexOfMatchedId } from '../filters'

const access_key = process.env.REACT_APP_LASTFM_ACCESS_KEY;

export const ContentStatus = {
  NONE: 0,
  FETCHED: 1,   //< content fetched from server
  FILTERED: 2,  //< content passed initial filter
  SOUGHT: 3,    //< search on spotify executed
  FOUND: 4,     //< search on spotify succeeded
  CONFIRMED: 5, //< search on spotify confirmed as correct
  MARKED: 6,    //< content is marked, an action needs to be taken (import or clear)
  RESOLVED: 7   //< content is resolved, nothing more to do
}

export const ContentAction = {
  CLEAR: -1,    //< clear content
  NONE: 0,      //< do nothing
  IMPORT: 1     //< import content
}

function getContentClass(content) {
  if (content.status) {
    switch(content.status) {
      case ContentStatus.FETCHED:
        return "not-filtered";
      case ContentStatus.FILTERED:
        return "filtered";
      case ContentStatus.SOUGHT:
        return "not-found";
      case ContentStatus.FOUND:
        return "not-confirmed";
      case ContentStatus.CONFIRMED:
        return "confirmed";
      case ContentStatus.MARKED:
        if (content.action === ContentAction.CLEAR) return "clear";
        if (content.action === ContentAction.IMPORT) return "import";
        return undefined;
      case ContentStatus.RESOLVED:
        return "resolved";
      default:
        return undefined;
    }
    }
  }

function ContentItem(props) {
  const content = props.content;

  if (!content) return null;

  return (
    <>
      {content.rank ? (content.rank + ". ") : ""}
      {content.name}
      {content.playcount ? (" - " + content.playcount) : ""}
      {content.artist ? (
        <>
          <br></br>
          <i>{content.artist[0].name}</i>
        </>
      ) : ""}
    </>
  )
}

function ContentIcon(props) {
  const content = props.content;

  if (!content) return null;

  return (
    <>
      {content.status === ContentStatus.SOUGHT ? "?" : ""}
      {content.status === ContentStatus.FOUND ? "?" : ""}
      {content.action === ContentAction.IMPORT ? "✓" : ""}
      {content.action === ContentAction.CLEAR ? "×" : ""}
    </>
  )
}

function ContentList(props) {

  return (
    <table className="content">
      <thead>
        <tr>
          <th style={{width: '5%'}}></th>
          <th style={{width: '95%'}}>{props.title}</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td></td>
          <td><i>({props.data.length} items)</i></td>
        </tr>
        {props.data.map((content, i) => {
          const classname = getContentClass(content);  
          return (
            <tr key={i}>
              <td className={classname}>
                <ContentIcon content={content} />
              </td>
              <td className={classname}>
                <ContentItem content={content} />
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

const initial = null;

const contentReducer = (state, action) => {
  switch(action.type) {

    // reset content to initial values
    case 'RESET_CONTENT':
      return initial;

    // set content after fetching, set the content status
    case 'SET_CONTENT':
      return action.payload.map(content => {
        return {...content, status: ContentStatus.FETCHED};
      });

    // apply filter after fetching, update the content status
    case 'APPLY_FILTER':
      return state.map(content => {
        return {...content, status: action.function(content) ? ContentStatus.FILTERED : ContentStatus.FETCHED};
      });

    // confirm all content, update the content status
    case 'CONFIRM_CONTENT':
      return state.map(content => {
        return {...content, status: ContentStatus.CONFIRMED};
      })
    
    // confirm search results, update the content status
    case 'CONFIRM_SEARCH':
      return state.map((content, i) => {
        // confirm only filtered content
        if (content.status !== ContentStatus.FILTERED) return content;
        const results = action.payload[i];
        if (!results || results.length === 0) {
          // if there are no search results, keep status as sought
          return {...content, status: ContentStatus.SOUGHT}
          }
        const j = results.findIndex(result => action.function(content, result));
        if (j < 0) {
          // if we are not sure if the search results are correct, keep status as found
          return {...content, status: ContentStatus.FOUND, results: results, match: 0}
        }
        else {
          // if we confirmed the search results to be correct, set status to confirmed and save the correct one
          return {...content, status: ContentStatus.CONFIRMED, results: results, match: j}
        }
      });
    
    // cross-compare content, update the content status
    case 'CROSS_COMPARE':
      const otherContent = action.payload.filter(c => c.status >= ContentStatus.FOUND);
      const findId = findIndexOfMatchedId(otherContent);
      return state.map(content => {
        // cross compare only confirmed content
        if (content.status !== ContentStatus.CONFIRMED) return content;
        const index = findId(content);
        if (index < 0) {
          // if it does not exist in the other content, mark for action
          return {...content, status: ContentStatus.MARKED, action: action.marker};
        }
        else if (otherContent[index].status === ContentStatus.FOUND) {
          // if it exists in the other content, but we are not sure if it is correct, set as found
          return {...content, status: ContentStatus.FOUND, index: index};
        }
        else {
          // otherwise, nothing needs to be done, resolve
          return {...content, status: ContentStatus.RESOLVED, index: index};
        }
      })
    
    // resolve status
    case 'RESOLVE':
      return state.map(content => {
        // resolve only marked content
        if (content.status !== ContentStatus.MARKED) return content;
        return {...content, status: ContentStatus.RESOLVED, action: ContentAction.NONE};
      })

    default:
      return state;

  }
}

function ContentPage(props) {
  // account
  const [access_token, ] = useLocalStorage(constants.token_key, null);
  const [username, ] = useLocalStorage(constants.user_key, null);

  // content
  const [contentSpotify, dispatchSpotify] = useReducer(contentReducer, initial);
  const [contentLastFm, dispatchLastFm] = useReducer(contentReducer, initial);

  // state
  const [readyForAction, setReadyForAction] = useState({clear: false, import: false});

  // props
  const { compare } = props;

  // select button
  const [selection, setSelection] = useState(props.selection);

  // compare button
  const searchSpotifyAsync = useAsyncCallback(
    () => props.searchSpotify(access_token, contentLastFm.filter(c => c.status === ContentStatus.FILTERED))
  );
  
  const searchLastFmAsync = useAsyncCallback(
    () => props.searchLastFm(access_key, contentSpotify.filter(c => c.status === ContentStatus.FILTERED))
  );

  // clear button
  const clearSpotifyAsync = useAsyncCallback(
    () => props.clearSpotify(access_token, contentSpotify.filter(c => c.status === ContentStatus.MARKED))
  );

  // import button
  const importSpotifyAsync = useAsyncCallback(
    () => props.importSpotify(access_token, contentLastFm.filter(c => c.status === ContentStatus.MARKED))
  );

  // fetch raw data
  const getSpotify = useAsync(
    () => props.getSpotify(access_token, optsSpotify()), [clearSpotifyAsync.result, importSpotifyAsync.result]
  );
  
  const getLastFm = useAsync(
    () => props.getLastFm(access_key, optsLastFm()), [selection.period, selection.number]
  );

  const optsSpotify = () => { 
    return {limit: spotifyApi.LIMIT_PER_PAGE} 
  };

  const optsLastFm = () => { 
    return {user: username, limit: lastfmApi.LIMIT_PER_PAGE, ...selection} 
  };

  // disallow actions when changing selection
  useEffect(() => {
    setReadyForAction({clear: false, import: false});
  }, [selection.period, selection.number, selection.playcount])

  // filter content after fetching
  useEffect(() => {
    if (!getSpotify.result || getSpotify.loading || getSpotify.error) return;
    dispatchSpotify({type: "SET_CONTENT", payload: getSpotify.result});
    dispatchSpotify({type: "APPLY_FILTER", function: () => true}); // no filter
  }, [getSpotify.result, getSpotify.loading, getSpotify.error])

  useEffect(() => {
    if (!getLastFm.result || getLastFm.loading || getLastFm.error) return;
    dispatchLastFm({type: "SET_CONTENT", payload: getLastFm.result});
    dispatchLastFm({type: "APPLY_FILTER", function: filterOnPlaycount(selection.playcount)}); // playcount filter
  }, [getLastFm.result, getLastFm.loading, getLastFm.error, selection.playcount])
  
  // confirm content after searching
  // note: only one of these effects is needed, the other is there for testing
  // since searching lastfm content via spotify is faster, that corresponding effect will be used
  useEffect(() => {
    if (!searchSpotifyAsync.result || searchSpotifyAsync.loading || searchSpotifyAsync.error) return;
    dispatchSpotify({type: "CONFIRM_CONTENT"}); // auto-confirm all
    dispatchLastFm({type: "CONFIRM_SEARCH", payload: searchSpotifyAsync.result, function: compare})
  }, [searchSpotifyAsync.result, searchSpotifyAsync.loading, searchSpotifyAsync.error, compare])

  useEffect(() => {
    if (!searchLastFmAsync.result || searchLastFmAsync.loading || searchLastFmAsync.error) return;
    dispatchSpotify({type: "CONFIRM_SEARCH", payload: searchLastFmAsync.result, function: compare})
    dispatchLastFm({type: "CONFIRM_CONTENT"}); // auto-confirm all
  }, [searchLastFmAsync.result, searchLastFmAsync.loading, searchLastFmAsync.error, compare])

  // compare content after searching
  useEffect(() => {
    if (!contentSpotify || !contentLastFm) return;
    const precondition = content => content.status === ContentStatus.CONFIRMED;
    if (!contentSpotify.some(precondition) || !contentLastFm.some(precondition)) return;
    dispatchSpotify({type: "CROSS_COMPARE", payload: contentLastFm, marker: ContentAction.CLEAR});
    dispatchLastFm({type: "CROSS_COMPARE", payload: contentSpotify, marker: ContentAction.IMPORT});
    setReadyForAction({clear: true, import: true});
  }, [contentSpotify, contentLastFm])

  // resolve when finished
  useEffect(() => {
    if (!clearSpotifyAsync.result) return;
    dispatchSpotify({type: "RESOLVE"});
    setReadyForAction(previous => { return {...previous, clear: false}});
  }, [clearSpotifyAsync.result])

  useEffect(() => {
    if (!importSpotifyAsync.result) return;
    dispatchLastFm({type: "RESOLVE"});
    setReadyForAction(previous => { return {...previous, import: false}});
  }, [importSpotifyAsync.result])

  return (
    <>
      {/* <h2>{props.title}</h2> */}
      {/* <br></br> */}

      <SelectionForm onSubmit={setSelection} initial={props.selection} />
      <br></br>

      <ActionForm 
        text={searchSpotifyAsync.loading ? "..." : "Compare"}
        modal="This will perform an thorough Spotify search in order to compare your Spotify and Last.fm data. Proceed?"
        variant="primary" 
        disabled={!contentSpotify || !contentLastFm || getSpotify.error || getLastFm.error}
        onSubmit={searchSpotifyAsync.execute} /> {/* <-- we use the spotify search here */}
      <br></br>

      <ActionForm 
        text={clearSpotifyAsync.loading ? "..." : "Clear"}
        modal="This will clear all data from Spotify that are not in your current selection on Last.fm. Are you sure?"
        variant="danger" 
        disabled={!contentSpotify || !readyForAction.clear}
        onSubmit={clearSpotifyAsync.execute} />
      <br></br>

      <ActionForm 
        text={importSpotifyAsync.loading ? "..." : "Import"}
        modal="This will import all data into Spotify that are in your current selection on Last.fm. Are you sure?"
        variant="success" 
        disabled={!contentLastFm || !readyForAction.import}
        onSubmit={importSpotifyAsync.execute} />
      <br></br>

      <div style={{height: "2rem"}} className="p-1">
        {getSpotify.loading ? <p className="text-dark">Loading Spotify data... </p> : ""}
        {getLastFm.loading ? <p className="text-dark">Loading Last.fm data... </p> : ""}
        {searchSpotifyAsync.loading ? <p className="text-dark">Searching Spotify... </p> : ""}
        {searchLastFmAsync.loading ? <p className="text-dark">Searching Last.fm... </p> : ""}
        {clearSpotifyAsync.loading ? <p className="text-dark">Clearing data from Spotify... </p> : ""}
        {importSpotifyAsync.loading ? <p className="text-dark">Importing data into Spotify... </p> : ""}

        {getSpotify.error ? <p className="text-danger">Spotify load error: {getSpotify.error.message.toLowerCase()}</p> : ""}
        {getLastFm.error ? <p className="text-danger">Last.fm load error: {getLastFm.error.message.toLowerCase()}</p> : ""}
        {searchSpotifyAsync.error ? <p className="text-danger">Spotify search error: {searchSpotifyAsync.error.message.toLowerCase()}</p> : ""}
        {searchLastFmAsync.error ? <p className="text-danger">Last.fm search error: {searchLastFmAsync.error.message.toLowerCase()}</p> : ""}
        {clearSpotifyAsync.error ? <p className="text-danger">Clear error: {clearSpotifyAsync.error.message.toLowerCase()}</p> : ""}
        {importSpotifyAsync.error ? <p className="text-danger">Import error: {importSpotifyAsync.error.message.toLowerCase()}</p> : ""}
      </div>
      <br></br>

      <div className="d-flex flex-row flex-wrap justify-content-center">

        {contentSpotify && contentLastFm ?
        <ContentList  
          title="Spotify"
          data={contentSpotify} />
        : null }

        {contentSpotify && contentLastFm ?
        <ContentList  
          title="Last.fm"
          data={contentLastFm} />
        : null }

      </div>
    </>
  )
}

export default ContentPage;