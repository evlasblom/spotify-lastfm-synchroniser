import React from 'react';

import * as spotifyApi from '../services/spotifyApi'
import * as lastfmApi from '../services/lastfmApi'

import ContentPage from '../components/ContentPage'
import Error from '../components/Error'
import Loading from '../components/Loading'
import { filterOnPlaycount, filterExclusiveId, compareArtists, normalizeArtistName } from '../filters'

const initial_selection = {period: 'overall', number: 20, playcount: 250 };

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

export function ArtistsList(props) {
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

function ArtistsPage(props) {

  return (
    <ContentPage 
      title="Artists"
      selection={initial_selection} 
      computeExclusive={computeExclusive}
      clearSpotify={clearSpotify}
      importSpotify={importSpotify}
      getSpotify={getSpotify}
      getLastFm={getLastFm}
      list={<ArtistsList />} />
  )
}

export default ArtistsPage;