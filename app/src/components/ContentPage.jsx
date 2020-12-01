import React, { useState, useReducer, useEffect } from 'react';
import { useAsync, useAsyncCallback } from 'react-async-hook'

import useLocalStorage from '../hooks/useLocalStorage'
import * as spotifyApi from '../services/spotifyApi'
import * as lastfmApi from '../services/lastfmApi'

import ActionForm from '../components/ActionForm'
import SelectionForm from '../components/SelectionForm'
import * as constants from '../constants'
import { filterOnPlaycount, filterExclusiveMatchedId } from '../filters'

const access_key = process.env.REACT_APP_LASTFM_ACCESS_KEY;

const NOT_FILTERED_STYLE = { color: 'gray' }

const FILTERED_STYLE = { color: 'black' }

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

const CONFIRMED_STYLE = { color: 'purple' };

const MARKED_STYLE = color => { return { color: color }; };

const RESOLVED_STYLE = { color: 'black' };

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

function setContentStyle(content, mark = "pink") {
  let style = {};
  if (content.status) {
    switch(content.status) {
      case ContentStatus.FETCHED:
        style = NOT_FILTERED_STYLE;
        break;
      case ContentStatus.FILTERED:
        style = FILTERED_STYLE;
        break;
      case ContentStatus.SOUGHT:
        style = NOT_FOUND_STYLE;
        break;
      case ContentStatus.FOUND:
        style = NOT_CONFIRMED_STYLE;
        break;
      case ContentStatus.CONFIRMED:
        style = CONFIRMED_STYLE;
        break;
      case ContentStatus.MARKED:
        style = MARKED_STYLE(mark);
        break;
      case ContentStatus.RESOLVED:
        style = RESOLVED_STYLE;
        break;
      default:
        style = {};
    }
  }
  return style;
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
        <tr>
          <td><i>({props.data.length} items)</i></td>
        </tr>
        {props.data.map((content, i) => {
          const style = setContentStyle(content, props.mark);        
          return (
            <tr key={i} style={style}>
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

const initial = null;

const reducer = (state, action) => {
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
        // search results only apply to filtered content (don't filter, we want to keep the rest!)
        if (content.status !== ContentStatus.FILTERED) return content;
        content.status = ContentStatus.SOUGHT;
        content.results = action.payload[i];
        for (let j = 0; j < content.results.length; j++) {
          content.status = ContentStatus.FOUND;
          if (action.function(content, content.results[j])) {
            content.status = ContentStatus.CONFIRMED;
            content.match = j;
            break;
          }
        }
        return content;
      });
    
    // cross-compare content, update the content status
    case 'CROSS_COMPARE':
      const otherContent = action.payload.filter(content => content.status === ContentStatus.CONFIRMED);
      const exclusiveFilter = filterExclusiveMatchedId(otherContent);
      return state.map(content => {
        // cross compare only confirmed content (don't filter, we want to keep the rest!)
        if (content.status !== ContentStatus.CONFIRMED) return content;
        return {...content, status: exclusiveFilter(content) ? ContentStatus.MARKED : ContentStatus.RESOLVED};
      })
    
    // resolve status
    case 'RESOLVE':
      return state.map(content => {
        // reset only marked content (don't filter, we want to keep the rest!)
        if (content.status !== ContentStatus.MARKED) return content;
        return {...content, status: ContentStatus.RESOLVED};
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
  const [contentSpotify, dispatchSpotify] = useReducer(reducer, initial);
  const [contentLastFm, dispatchLastFm] = useReducer(reducer, initial);

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
    dispatchSpotify({type: "CROSS_COMPARE", payload: contentLastFm});
    dispatchLastFm({type: "CROSS_COMPARE", payload: contentSpotify});
    setReadyForAction({clear: true, import: true});
  }, [contentSpotify, contentLastFm])

  // reset when restarting
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
        {searchLastFmAsync.loading ? <p className="text-dark">Comparing Last.fm... </p> : ""}
        {clearSpotifyAsync.loading ? <p className="text-dark">Clearing data from Spotify... </p> : ""}
        {importSpotifyAsync.loading ? <p className="text-dark">Importing data into Spotify... </p> : ""}

        {getSpotify.error ? <p className="text-danger">{getSpotify.error.message}</p> : ""}
        {getLastFm.error ? <p className="text-danger">{getLastFm.error.message}</p> : ""}
        {searchSpotifyAsync.error ? <p className="text-danger">{searchSpotifyAsync.error.message}</p> : ""}
        {searchLastFmAsync.error ? <p className="text-danger">{searchLastFmAsync.error.message}</p> : ""}
        {clearSpotifyAsync.error ? <p className="text-danger">{clearSpotifyAsync.error.message}</p> : ""}
        {importSpotifyAsync.error ? <p className="text-danger">{importSpotifyAsync.error.message}</p> : ""}
      </div>
      <br></br>

      <div className="d-flex flex-row flex-wrap justify-content-center">

        {!getSpotify.loading && !getSpotify.error && contentSpotify ?
        <ContentList  
          title="Spotify"
          data={contentSpotify}
          mark="red" />
        : null }

        {!getLastFm.loading && !getLastFm.error && contentLastFm ?
        <ContentList  
          title="Last.fm"
          data={contentLastFm}
          mark="green" />
        : null }

      </div>
    </>
  )
}

export default ContentPage;