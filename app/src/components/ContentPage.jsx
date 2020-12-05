import React, { useState, useReducer, useEffect } from 'react';
import { useAsync, useAsyncCallback } from 'react-async-hook'

import useLocalStorage from '../hooks/useLocalStorage'
import * as spotifyApi from '../services/spotifyApi'
import * as lastfmApi from '../services/lastfmApi'

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faQuestionCircle } from '@fortawesome/free-regular-svg-icons'
import Tooltip from 'react-bootstrap/Tooltip'
import OverlayTrigger from 'react-bootstrap/OverlayTrigger'

import ActionForm from './forms/ActionForm'
import SelectionForm from './forms/SelectionForm'
import * as constants from '../constants'
import { filterOnPlaycount, findIndexOfMatchedId } from '../filters'

// Get the Last.fm access key from the environment variables
const access_key = process.env.REACT_APP_LASTFM_ACCESS_KEY;

// When true, it allows you to click on each item in the lists to print its details in the console
const DEBUG_CONTENT = false;

/**
 * Content status enum.
 * 
 * Note: content means artists, albums or tracks, and all content receives a status.
 * 
 * The content status is used as follows:
 * 
 * SELECT:
 * 
 * 1. When using the "select" button, all of the content receives the FETCHED status.
 * 2. Subsequently, a part of the content gets filtered and receives the FILTERED status,
 *    Currently, this is only based on playcount.
 * 
 * COMPARE:
 * 
 * 3. When using the "compare" button, all filtered content will be searched for and gets the SOUGHT status.
 *    This is needed because names and ids on Spotify and Last.fm may differ and we want to be sure we match
 *    the content from both lists correctly. To match the content, either search for Last.fm content on Spotify,
 *    for Spotify content on Last.fm, or both. Then, compare the ids for matching (done in a later step).
 *    Here, we search for Last.fm content on Spotify, because it is the fastest.
 * 4. All content that yields search results gets the FOUND status.
 * 5. All content for which we can confirm one of the search results to be correct gets the CONFIRMED status.
 *    Confirmation is done using a set of simple rules. This is needed to be sure to not accidentally import or clear
 *    content that we don't want to. If we are uncertain, it is better to leave it alone for manual action.
 *    Note: the Last.fm content passes through SOUGHT, FOUND, CONFIRMED, the Spotify is automatically CONFIRMED.
 * 6. Subsequently, the Spotify and Last.fm content is compared to find the content that is unique in each list.
 *    The unique content gets the MARKED status. The marked Spotify content will be cleared, the marked Last.fm content
 *    will be imported. To find unique content, we get the best Spotify search result for all Last.fm content and compare
 *    the id with the Spotify ids and vice versa.
 * 7. All content that is already on both Spotify and Last.fm receives the RESOLVED status.
 */
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

/**
 * Content action enum.
 * 
 * The content action enum is used as follows:
 * 
 * -1: Spotify content that is marked get the CLEAR action.
 * 0:  To reset an action when it receives the resolved status.
 * 1:  Last.fm content that is marked get the IMPORT action.
 */
export const ContentAction = {
  CLEAR: -1,    //< clear content
  NONE: 0,      //< do nothing
  IMPORT: 1     //< import content
}

/**
 * Returns the css class name based on the content status and/or action.
 * @param {Object} content Either an artist, album or track.
 * @return {String} A css class name.
 */
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

// Content item component to display in a content list.
function ContentItem(props) {
  const content = props.content;

  if (!content) return null;
  
  let debug = {};
  if (DEBUG_CONTENT) debug = {role: "button", onClick: () => console.log(content)}

  return (
    <div className="d-block" {...debug}>
      {content.rank ? (content.rank + ". ") : ""}
      {content.name}
      {content.playcount ? (" - " + content.playcount) : ""}
      {content.artist ? (
        <>
          <br></br>
          <i>{content.artist[0].name}</i>
        </>
      ) : ""}
    </div>
  )
}

// Content icon component to display in a content list.
function ContentIcon(props) {
  const content = props.content;

  if (!content) return null;

  return (
    <div className="d-block">
      {content.status === ContentStatus.SOUGHT ? "?" : ""}
      {content.status === ContentStatus.FOUND ? "?" : ""}
      {content.status === ContentStatus.MARKED && content.action === ContentAction.IMPORT ? "✓" : ""}
      {content.status === ContentStatus.MARKED && content.action === ContentAction.CLEAR ? "×" : ""}
    </div>
  )
}

// Content statistics to display on top of a content list.
function ContentTotals(props) {
  const num_total = props.data.filter(c => c.status > ContentStatus.FETCHED).length;
  const num_clear = props.data.filter(c => c.action === ContentAction.CLEAR).length;
  const num_import = props.data.filter(c => c.action === ContentAction.IMPORT).length;
  const num_unfound = props.data.filter(c => c.status === ContentStatus.SOUGHT).length;
  const num_unconfirmed = props.data.filter(c => c.status === ContentStatus.FOUND).length;
  const num_resolved = props.data.filter(c => c.status === ContentStatus.RESOLVED).length;

  const text_total = "All " + props.what + " in your " + props.from;
  const text_clear = "These " + props.what + " will be removed from Spotify";
  const text_import = "These " + props.what + " will be imported into Spotify";
  const text_unfound = "These " + props.what + " from your Last.fm selection could not be found on Spotify so may be removed."
  const text_unconfirmed = "These " + props.what + " from your Last.fm selection were found on Spotify, but could not be confirmed and will be ignored."
  const text_resolved = "These " + props.what + " already exist on both Spotify and in your Last.fm selection.";

  return (
    <div className="d-block">
      {num_total > 0 ? 
        <p className="filtered">
          <b>{num_total} total</b> <FontAwesomeIconWithTooltip icon={faQuestionCircle} text={text_total} />
        </p> 
      : ""}
      {num_clear > 0 ? 
        <p className="clear">
          {num_clear} to be cleared <FontAwesomeIconWithTooltip icon={faQuestionCircle} text={text_clear} />
        </p> 
      : ""}
      {num_import > 0 ? 
        <p className="import">
          {num_import} to be imported <FontAwesomeIconWithTooltip icon={faQuestionCircle} text={text_import} />
        </p> 
      : ""}
      {num_unfound > 0 ? 
        <p className="not-found">
          {num_unfound} not found <FontAwesomeIconWithTooltip icon={faQuestionCircle} text={text_unfound} />
        </p> 
      : ""}
      {num_unconfirmed > 0 ? 
        <p className="not-confirmed">
          {num_unconfirmed} not confirmed <FontAwesomeIconWithTooltip icon={faQuestionCircle} text={text_unconfirmed} />
        </p> 
      : ""}
      {num_resolved > 0 ? 
        <p className="resolved">
          {num_resolved} resolved <FontAwesomeIconWithTooltip icon={faQuestionCircle} text={text_resolved} />
        </p> 
      : ""}
      <hr color="black" />
    </div>
  )
}

// A component that wrap a font awesome icon with a tooltip.
// Note: this particular piece of code gives an error in strict mode!
function FontAwesomeIconWithTooltip(props) {
  const text = props.text;

  const renderTooltip = (props) => (
    <Tooltip {...props}>
      {text}
    </Tooltip>
  );

  return (
    <OverlayTrigger
        placement="right"
        delay={{ show: 250, hide: 400 }}
        overlay={renderTooltip}
        text={props.text}>
      <FontAwesomeIcon icon={props.icon} />
    </OverlayTrigger>
  )
}

// A content list component.
function ContentList(props) {

  return (
    <table className="content-list">
      <thead>
        <tr>
          <th style={{width: '5%'}}></th>
          <th style={{width: '95%'}}><h3>{props.from}</h3></th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td></td>
          <td>
            <ContentTotals data={props.data} what={props.what} from={props.from}/>
          </td>
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

// A content list placeholder component when loading...
function ContentListPlaceholder(props) {

  return (
    <div className="content-list">
      
    </div>
  )
}

// Initial content state value
const initial = null;

/**
 * The content state reducer.
 * @param {Object} state The content state: a list of artists, albums or tracks.
 * @param {Object} action The state action has: type, payload (optional), function (optional), marker (optional).
 */
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

// Content page component, used for artists, albums and tracks.
function ContentPage(props) {
  // account
  const [access_token, ] = useLocalStorage(constants.token_key, null);
  const [username, ] = useLocalStorage(constants.user_key, null);

  // content
  const [contentSpotify, dispatchSpotify] = useReducer(contentReducer, initial);
  const [contentLastFm, dispatchLastFm] = useReducer(contentReducer, initial);

  // state
  const [readyForAction, setReadyForAction] = useState({clear: false, import: false});
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

  // disallow actions when changing selection
  useEffect(() => {
    setReadyForAction({clear: false, import: false});
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
  
  // confirm content after searching
  // note: only one of these effects is needed, the other is there for testing
  // since searching lastfm content via spotify is faster, that corresponding effect will be used
  useEffect(() => {
    if (!searchSpotifyAsync.result || searchSpotifyAsync.loading || searchSpotifyAsync.error) return;
    dispatchSpotify({type: "CONFIRM_CONTENT"}); // auto-confirm all
    dispatchLastFm({type: "CONFIRM_SEARCH", payload: searchSpotifyAsync.result, function: compare})
    setCurrentProgress(0);
  }, [searchSpotifyAsync.result, searchSpotifyAsync.loading, searchSpotifyAsync.error, compare])

  useEffect(() => {
    if (!searchLastFmAsync.result || searchLastFmAsync.loading || searchLastFmAsync.error) return;
    dispatchSpotify({type: "CONFIRM_SEARCH", payload: searchLastFmAsync.result, function: compare})
    dispatchLastFm({type: "CONFIRM_CONTENT"}); // auto-confirm all
    setCurrentProgress(0);
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
      <SelectionForm onSubmit={setSelection} initial={props.selection} />
      <br></br>

      <ActionForm 
        text={searchSpotifyAsync.loading ? "..." : "Compare"}
        modal="This will perform a thorough Spotify search in order to compare your Spotify and Last.fm data. Proceed?"
        variant="primary" 
        disabled={!contentSpotify || !contentLastFm || getSpotify.error || getLastFm.error}
        onSubmit={searchSpotifyAsync.execute} /> {/* <-- we use just the spotify search here */}
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

      <div style={{height: "3rem"}} className="p-1">
        {getSpotify.loading ? <p className="text-dark">Loading Spotify data... </p> : ""}
        {getLastFm.loading ? <p className="text-dark">Loading Last.fm data... </p> : ""}
        {searchSpotifyAsync.loading ? <p className="text-dark">Searching Spotify... ({currentProgress}%) </p> : ""}
        {searchLastFmAsync.loading ? <p className="text-dark">Searching Last.fm... ({currentProgress}%) </p> : ""}
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

        {!getSpotify.loading && !getSpotify.error && contentSpotify ?
        <ContentList  
          from="Spotify library"
          what={props.what}
          data={contentSpotify} />
        : 
        <ContentListPlaceholder />
        }

        {!getLastFm.loading && !getLastFm.error && contentLastFm ?
        <ContentList  
          from="Last.fm selection"
          what={props.what}
          data={contentLastFm} />
        : 
        <ContentListPlaceholder />
        }

      </div>
    </>
  )
}

export default ContentPage;