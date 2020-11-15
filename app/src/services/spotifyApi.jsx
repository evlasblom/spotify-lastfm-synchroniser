import axios from 'axios';

// ---------- FUNCTIONS -------------------------------------------------- 

export function requestUser(method, access_token, opts) {
  if (['albums','tracks'].indexOf(method) < 0) throw "Invalid method selected.";
  
  let url = 'me/'
  url += method + '?'
  if (opts.limit) url += '&limit=' + opts.limit
  if (opts.offset) url += '&offset=' + opts.offset
  const options = {
    url: url,
    baseURL: 'https://api.spotify.com/v1/',
    method: 'GET',
    timeout: 4000,
    headers: {
      'Authorization': 'Bearer ' + access_token
    }
  };
  return axios(options)
}

// ---------- REQUESTS -------------------------------------------------- 

export function requestProfile(access_token, opts) {
  let url = 'me'
  const options = {
    url: url,
    baseURL: 'https://api.spotify.com/v1/',
    method: 'GET',
    timeout: 4000,
    headers: {
      'Authorization': 'Bearer ' + access_token
    }
  };
  return axios(options)
}

export function requestFollowingArtists(access_token, opts) {
  let url = 'me/following?'
  url += '&type=' + 'artist'
  if (opts.after) url += '&after=' + opts.after
  if (opts.limit) url += '&limit=' + opts.limit
  const options = {
    url: url,
    baseURL: 'https://api.spotify.com/v1/',
    method: 'GET',
    timeout: 4000,
    headers: {
      'Authorization': 'Bearer ' + access_token
    }
  };
  return axios(options)
}

export function requestUserAlbums(access_token, opts) {
  return requestUser('albums', access_token, opts)
}

export function requestUserTracks(access_token, opts) {
  return requestUser('tracks', access_token, opts)
}

// ---------- CONVERTERS -------------------------------------------------- 

export function convertProfile(response) {
  const profile = response.data;
  return {
    url: profile.images[0].url,
    name: profile.display_name,
    id: profile.id,
    text: "A " + profile.product + " " + profile.type + " from " + profile.country + ".",
    href: profile.external_urls.spotify
  }
}

export function convertArtists(response) {
  return response.data.artists.items;
}

export function convertAlbums(response) {
  return response.data.items;
}

export function convertTracks(response) {
  return response.data.items;
}
