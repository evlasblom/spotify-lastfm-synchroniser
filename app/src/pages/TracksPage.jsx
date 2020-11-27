import React from 'react';

import * as spotifyApi from '../services/spotifyApi'
import * as lastfmApi from '../services/lastfmApi'

import ContentPage, { ContentState, ContentAction, setContentStyle } from '../components/ContentPage'

import { filterOnPlaycount, filterExclusiveId, compareTracks, normalizeArtistName, normalizeTrackName } from '../filters'

const initial_selection = {period: 'overall', number: 1000, playcount: 30 };

const getSpotifyTracks = async (access_token, opts) => {
  let items = [];
  let offset = 0;
  let total = 1;
  while (total > offset) {
    let response = await spotifyApi.getSavedTracks(access_token, {...opts, offset: offset});
    total = response.data.total;
    offset = offset + opts.limit;
    items = [...items, ...response.data.items];
  }
  return spotifyApi.parseTracks(items).map(track => {
    return {...track, state: ContentState.CONFIRMED};
  });
}

const getLastFmTracks = async (access_key, opts) => {
  let items = [];
  let page = 0;
  while (opts.number > page * opts.limit) {
    let index = Math.min(opts.limit, opts.number - page * opts.limit)
    let response = await lastfmApi.getTopTracks(access_key, {...opts, page: ++page});
    items = [...items, ...response.data.toptracks.track.slice(0, index)];
  }
  const playcountFilter = filterOnPlaycount(opts.playcount)
  return lastfmApi.parseTracks(items).map(track => {
    return {...track, state: playcountFilter(track) ? ContentState.FILTERED : ContentState.FETCHED};
  });
}

const clearSpotifyTracks = async (access_token, tracks) => {
  let ids = tracks
    .filter(album => album.action === ContentAction.CLEAR)
    .map(album => album.id);
  while (ids.length > 0) {
    const options = {ids: ids.splice(0, spotifyApi.LIMIT_PER_PAGE)};
    await spotifyApi.removeSavedTracks(access_token, options);
  }
  return {};
}

const importSpotifyTracks = async (access_token, tracks) => {
  let ids = tracks
    .filter(track => track.action === ContentAction.IMPORT)
    .map(track => track.id);
  while (ids.length > 0) {
    const options = {ids: ids.splice(0, spotifyApi.LIMIT_PER_PAGE)};
    await spotifyApi.setSavedTracks(access_token, options);
  }
  return {};
}

const searchSpotifyTrack = async (access_token, track) => {
  let query = '"' + normalizeArtistName(track.artist[0].name) + '" "' + normalizeTrackName(track.name) + '"';
  let response = await spotifyApi.searchTrack(access_token, { q: query});
  if (response.status !== 200) console.log(response);
  return spotifyApi.parseTracks(response.data.tracks.items);
}

// @TODO: move to ContentPage?
const compareAllTracks = async (access_token, tracksSpotify, tracksLastFm) => {
  // find and confirm lastfm on spotify
  for (const track of tracksLastFm) {
    if (track.state && track.state < ContentState.FILTERED) continue;
    track.state = ContentState.SOUGHT;
    let results = await searchSpotifyTrack(access_token, track);
    for (const result of results) {
      track.state = ContentState.FOUND;
      if (compareTracks(track, result)) {
        track.id = result.id; // overwrite lastfm id with spotify id
        track.state = ContentState.CONFIRMED;
        break;
      }
    }
  };

  // import if confirmed and exlusively on lastfm
  const confirmedSpotify = tracksSpotify.filter(track => track.state === ContentState.CONFIRMED);
  const exclusiveLastFmFilter = filterExclusiveId(confirmedSpotify);
  let finalLastFm = tracksLastFm.map(track => {
    const action = track.state === ContentState.CONFIRMED && exclusiveLastFmFilter(track);
    return {
      ...track, 
      action: action ? ContentAction.IMPORT : ContentAction.NONE
    };
  })

  // clear if confirmed and exclusively on spotify
  const confirmedLastFm = tracksLastFm.filter(track => track.state === ContentState.CONFIRMED);
  const exclusiveSpotifyFilter = filterExclusiveId(confirmedLastFm);
  let finalSpotify = tracksSpotify.map(track => {
    const action = track.state === ContentState.CONFIRMED && exclusiveSpotifyFilter(track);
    return {
      ...track, 
      action: action ? ContentAction.CLEAR : ContentAction.NONE
    };
  })

  // return results
  return {
    spotify: finalSpotify,
    lastfm: finalLastFm
  };
}

function TracksList(props) {
  const tracks = props.data;

  return (
    <div style={{ width: '25rem'}} className="mr-2 ml-2">
      <b>{props.title}</b>
      <br></br>
      <br></br>
      {tracks.map((track, i) => {
        const [style, classname] = setContentStyle(track);        
        return (
          <p key={i} className={classname} style={style}>
            {i + 1}. {track.name}
            {track.playcount ? (" - " + track.playcount) : ""}
            <br></br>
            <i>{track.artist[0].name}</i>
          </p>)
      })}
    </div>
  )
}

function TracksPage(props) {

  return (
    <ContentPage 
      title="Tracks"
      selection={initial_selection} 
      compare={compareAllTracks}
      clearSpotify={clearSpotifyTracks}
      importSpotify={importSpotifyTracks}
      getSpotify={getSpotifyTracks}
      getLastFm={getLastFmTracks}
      list={<TracksList />} />
  )
}

export default TracksPage;