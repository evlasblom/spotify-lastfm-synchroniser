import React, { useState, useReducer, useEffect } from 'react';
import { useAsync, useAsyncCallback } from 'react-async-hook'

import useLocalStorage from '../hooks/useLocalStorage'
import * as spotifyApi from '../services/spotifyApi'
import * as lastfmApi from '../services/lastfmApi'

import ContentList, { ContentListPlaceholder } from './ContentList'
import ActionForm from './forms/ActionForm'
import SelectionForm from './forms/SelectionForm'
import * as constants from '../constants'
import { ContentStatus, ContentAction, ContentSource } from '../enums'
import { filterOnPlaycount, findIndexOfMatchedId } from '../filters'

/**
 * Spotify and Last.fm synchronisation procedure.
 * 
 * --> SELECT:
 * 
 * 1. When using the "select" button, all of the content receives the FETCHED status.
 * 2. Subsequently, a part of the content gets filtered and receives the FILTERED status,
 *    Currently, filtering is only done based on the Last.fm playcount.
 * 
 * --> COMPARE:
 * 
 * 3. When using the "compare" button, all filtered content will be searched for and gets the SOUGHT status.
 *    This is needed because names and ids on Spotify and Last.fm may differ. To match the content correctly, 
 *    either search for Last.fm content on Spotify, for Spotify content on Last.fm, or both, and save the ids. 
 *    In a later step, the ids can be compared to make sure the correct artists, albums and tracks are used.
 *    Here, a search for Last.fm content on Spotify is done, because it is the fastest way to perform the search.
 * 4. All content that yields search results gets the FOUND status.
 * 5. All content for which one of the search results can be confirmed to be correct gets the CONFIRMED status.
 *    Confirmation is done using a set of simple regular expressions. This ensures no wrong content is accidentally
 *    removed or added. If it cannot be confirmed using simple rules, it is better to leave it alone for the user.
 *    Note: the Last.fm content passes through SOUGHT, FOUND, CONFIRMED, the Spotify is automatically CONFIRMED.
 * 6. Subsequently, the Spotify and Last.fm content is compared to find the content that is unique in each list.
 *    The unique content gets the MARKED status. The marked Spotify content will be cleared, the marked Last.fm content
 *    will be imported. To find unique content, the confirmed search result ids of the Last.fm data are compared with
 *    the ids of the Spotify data.
 * 7. All content that is already on both Spotify and Last.fm receives the RESOLVED status.
 */

 // Get the Last.fm access key from the environment variables
const access_key = process.env.REACT_APP_LASTFM_ACCESS_KEY;

// Select the search engine for cross-comparing the content
const search_on = ContentSource.SPOTIFY;

// The content initial value
const initial = null;

// Parse common errors
function parseErrors(error) {
  const text = error.toLowerCase();
  if (text.includes("401")) return "authentication expired, please restart from the home page.";
  if (text.includes("429")) return "too many requests, please try again later."
  if (text.includes("500")) return "remote server experienced an internal error, please try again."
  return text;
}

// The content reducer
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
          // if the search results may be incorrect, keep status as found
          return {...content, status: ContentStatus.FOUND, results: results, match: 0}
        }
        else {
          // if the search results are confirmed to be correct, set status to confirmed and save the correct one
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
          // if it exists in the other content, but it may be incorrect, set as found
          return {...content, status: ContentStatus.FOUND, index: index};
        }
        else {
          // otherwise, nothing needs to be done, resolve
          return {...content, status: ContentStatus.RESOLVED, index: index};
        }
      })
    
    // resolve status
    case 'RESOLVE_CONTENT':
      return state.map(content => {
        // resolve only marked content
        if (content.status !== ContentStatus.MARKED) return content;
        return {...content, status: ContentStatus.RESOLVED, action: ContentAction.NONE};
      })

    default:
      return state;

  }
}

// Content page component, used for artists, albums and tracks.
function ContentPage(props) {
  // account
  const [access_token, ] = useLocalStorage(constants.token_key, null);
  const [username, ] = useLocalStorage(constants.user_key, null);

  // content
  const [contentSpotify, dispatchSpotify] = useReducer(contentReducer, initial);
  const [contentLastFm, dispatchLastFm] = useReducer(contentReducer, initial);

  // state
  const [gotSearchResults, setGotSearchResults] = useState(false);
  const [didCrossComparison, setDidCrossComparison] = useState(false);
  const [finishedAction, setFinishedAction] = useState({clear: false, import: false});
  const [currentProgress, setCurrentProgress] = useState(0);

  // props
  const { compare } = props;

  // select button
  const [selection, setSelection] = useState(props.selection);

  // compare button
  const searchSpotifyAsync = useAsyncCallback(
    () => props.searchSpotify(access_token, contentLastFm.filter(c => c.status === ContentStatus.FILTERED), setCurrentProgress)
  );
  
  const searchLastFmAsync = useAsyncCallback(
    () => props.searchLastFm(access_key, contentSpotify.filter(c => c.status === ContentStatus.FILTERED), setCurrentProgress)
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

  // reset state when changing selection
  useEffect(() => {
    setGotSearchResults(false);
    setDidCrossComparison(false);
    setFinishedAction({clear: false, import: false});
  }, [selection.period, selection.number, selection.playcount])

  // filter content after fetching
  useEffect(() => {
    if (!getSpotify.result || getSpotify.loading || getSpotify.error) return;
    dispatchSpotify({type: "SET_CONTENT", payload: getSpotify.result});
    dispatchSpotify({type: "APPLY_FILTER", function: () => true}); // no filter
  }, [getSpotify.result, getSpotify.loading, getSpotify.error, selection.period, selection.number, selection.playcount]);

  useEffect(() => {
    if (!getLastFm.result || getLastFm.loading || getLastFm.error) return;
    dispatchLastFm({type: "SET_CONTENT", payload: getLastFm.result});
    dispatchLastFm({type: "APPLY_FILTER", function: filterOnPlaycount(selection.playcount)}); // playcount filter
  }, [getLastFm.result, getLastFm.loading, getLastFm.error, selection.period, selection.number, selection.playcount]);
  
  // -----------------------------
  
  // confirm content after searching
  // note: only one of these effects is needed, the other is there for testing
  // since searching lastfm content via spotify is faster, that corresponding effect will be used
  useEffect(() => {
    if (search_on === ContentSource.LASTFM) return;
    if (!searchSpotifyAsync.result || searchSpotifyAsync.loading || searchSpotifyAsync.error) return;
    dispatchLastFm({type: "CONFIRM_SEARCH", payload: searchSpotifyAsync.result, function: compare})
    setCurrentProgress(0);
    setGotSearchResults(true);
  }, [searchSpotifyAsync.result, searchSpotifyAsync.loading, searchSpotifyAsync.error, compare])

  useEffect(() => {
    if (search_on === ContentSource.LASTFM) return;
    const areConfirmedAtLeast = (content) => content.status >= ContentStatus.CONFIRMED;
    if (!contentSpotify || contentSpotify.some(areConfirmedAtLeast)) return;
    dispatchSpotify({type: "CONFIRM_CONTENT"}); // auto-confirm all filtered content
  }, [contentSpotify])

  useEffect(() => {
    if (search_on === ContentSource.SPOTIFY) return;
    if (!searchLastFmAsync.result || searchLastFmAsync.loading || searchLastFmAsync.error) return;
    dispatchSpotify({type: "CONFIRM_SEARCH", payload: searchLastFmAsync.result, function: compare})
    setCurrentProgress(0);
    setGotSearchResults(true);
  }, [searchLastFmAsync.result, searchLastFmAsync.loading, searchLastFmAsync.error, compare])

  useEffect(() => {
    if (search_on === ContentSource.SPOTIFY) return;
    const areConfirmedAtLeast = (content) => content.status >= ContentStatus.CONFIRMED;
    if (!contentLastFm || contentLastFm.some(areConfirmedAtLeast)) return;
    dispatchLastFm({type: "CONFIRM_CONTENT"}); // auto-confirm all filtered content
  }, [contentLastFm])

  // compare content after searching
  useEffect(() => {
    if (!gotSearchResults) return;
    if (!contentSpotify || !contentLastFm) return;
    const areMarkedAtLeast = (content) => content.status >= ContentStatus.MARKED;
    if (contentSpotify.some(areMarkedAtLeast) && contentLastFm.some(areMarkedAtLeast)) return;
    dispatchSpotify({type: "CROSS_COMPARE", payload: contentLastFm, marker: ContentAction.CLEAR});
    dispatchLastFm({type: "CROSS_COMPARE", payload: contentSpotify, marker: ContentAction.IMPORT});
    setDidCrossComparison(true);
  }, [contentSpotify, contentLastFm, gotSearchResults])

  // -----------------------------

  // resolve when finished
  useEffect(() => {
    if (!clearSpotifyAsync.result || clearSpotifyAsync.loading || clearSpotifyAsync.error) return;
    dispatchSpotify({type: "RESOLVE_CONTENT"}); // resolve all marked content on success
    setFinishedAction(previous => { return {...previous, clear: true}});
  }, [clearSpotifyAsync.result, clearSpotifyAsync.loading, clearSpotifyAsync.error])

  useEffect(() => {
    if (!importSpotifyAsync.result || importSpotifyAsync.loading || importSpotifyAsync.error) return;
    dispatchLastFm({type: "RESOLVE_CONTENT"}); // resolve all marked content on success
    setFinishedAction(previous => { return {...previous, import: true}});
  }, [importSpotifyAsync.result, importSpotifyAsync.loading, importSpotifyAsync.error])

  return (
    <>
      <SelectionForm 
        onSubmit={setSelection} 
        initial={props.selection} />
      <br></br>

      <ActionForm 
        text={searchSpotifyAsync.loading ? "..." : "Search"}
        modal="This will perform a thorough Spotify search in order to compare your Spotify and Last.fm data. Proceed?"
        variant="primary" 
        disabled={!contentSpotify || !contentLastFm || getSpotify.error || getLastFm.error || gotSearchResults}
        onSubmit={() => {
          switch (search_on) {
            case ContentSource.SPOTIFY:
              searchSpotifyAsync.execute();
              break;
            case ContentSource.LASTFM:
              searchLastFmAsync.execute();
              break;
            default:
              break;
          }
        }} />
      <br></br>

      <ActionForm 
        text={clearSpotifyAsync.loading ? "..." : "Clear"}
        modal="This will clear all data from Spotify that are not in your current selection on Last.fm. Are you sure?"
        variant="danger" 
        disabled={!contentSpotify || !didCrossComparison || finishedAction.clear}
        onSubmit={clearSpotifyAsync.execute} />
      <br></br>

      <ActionForm 
        text={importSpotifyAsync.loading ? "..." : "Import"}
        modal="This will import all data into Spotify that are in your current selection on Last.fm. Are you sure?"
        variant="success" 
        disabled={!contentLastFm || !didCrossComparison || finishedAction.import}
        onSubmit={importSpotifyAsync.execute} />
      <br></br>

      <div style={{height: "3rem"}} className="p-1">
        {getSpotify.loading ? <p className="text-dark">Loading Spotify data... </p> : ""}
        {getLastFm.loading ? <p className="text-dark">Loading Last.fm data... </p> : ""}
        {searchSpotifyAsync.loading ? <p className="text-dark">Searching Spotify... ({currentProgress}%) </p> : ""}
        {searchLastFmAsync.loading ? <p className="text-dark">Searching Last.fm... ({currentProgress}%) </p> : ""}
        {clearSpotifyAsync.loading ? <p className="text-dark">Clearing data from Spotify... </p> : ""}
        {importSpotifyAsync.loading ? <p className="text-dark">Importing data into Spotify... </p> : ""}

        {getSpotify.error ? <p className="text-danger">Spotify load error: {parseErrors(getSpotify.error.message)}</p> : ""}
        {getLastFm.error ? <p className="text-danger">Last.fm load error: {parseErrors(getLastFm.error.message)}</p> : ""}
        {searchSpotifyAsync.error ? <p className="text-danger">Spotify search error: {parseErrors(searchSpotifyAsync.error.message)}</p> : ""}
        {searchLastFmAsync.error ? <p className="text-danger">Last.fm search error: {parseErrors(searchLastFmAsync.error.message)}</p> : ""}
        {clearSpotifyAsync.error ? <p className="text-danger">Clear error: {parseErrors(clearSpotifyAsync.error.message)}</p> : ""}
        {importSpotifyAsync.error ? <p className="text-danger">Import error: {parseErrors(importSpotifyAsync.error.message)}</p> : ""}

        {finishedAction.clear && finishedAction.import && !getSpotify.loading && !getLastFm.loading ? <p className="text-success">Synchronisation finished!</p> : ""}
      </div>
      <br></br>

      <div className="d-flex flex-row flex-wrap justify-content-center">

        {!getSpotify.loading && !getSpotify.error && contentSpotify ?
        <ContentList  
          from={ContentSource.SPOTIFY}
          what={props.what}
          data={contentSpotify}
          readyForAction={didCrossComparison} />
        : 
        <ContentListPlaceholder />
        }

        {!getLastFm.loading && !getLastFm.error && contentLastFm ?
        <ContentList  
          from={ContentSource.LASTFM}
          what={props.what}
          data={contentLastFm}
          readyForAction={didCrossComparison} />
        : 
        <ContentListPlaceholder />
        }

      </div>
    </>
  )
}

export default ContentPage;