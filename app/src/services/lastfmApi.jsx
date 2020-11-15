import axios from 'axios';

// ---------- FUNCTIONS -------------------------------------------------- 

function requestTop(method, access_key, opts) {
  if (['Artists','Albums','Tracks'].indexOf(method) < 0) throw "Invalid method selected.";
  if (!opts.user) throw "The user option is required.";
  if (opts.period && ['7day','1month','3month','6month','12month'].indexOf(opts.period) < 0) throw "Invalid period option.";
  
  let url = ''
  url += '?method=user.getTop' + method
  url += '&user=' + opts.user
  if (opts.period) url += '&period=' + opts.period
  if (opts.limit) url += '&limit=' + opts.limit
  if (opts.page) url += '&page=' + opts.page
  url += '&api_key=' + access_key
  url += '&format=json'
  const options = {
    url: url,
    baseURL: 'https://ws.audioscrobbler.com/2.0/',
    method: 'GET',
    timeout: 4000,
  };
  return axios(options)
}

// ---------- REQUESTS -------------------------------------------------- 

export function requestProfile(access_key, opts) {
  if (!opts.user) throw "The user option is required.";

  let url = ''
  url += '?method=user.getinfo'
  url += '&user=' + opts.user
  url += '&api_key=' + access_key
  url += '&format=json'
  const options = {
    url: url,
    baseURL: 'https://ws.audioscrobbler.com/2.0/',
    method: 'GET',
    timeout: 4000,
  };
  return axios(options)
}

export function requestTopArtists(access_key, opts) {
  return (requestTop('Artists', access_key, opts))
}

export function requestTopAlbums(access_key, opts) {
  return (requestTop('Albums', access_key, opts))
}

export function requestTopTracks(access_key, opts) {
  return (requestTop('Tracks', access_key, opts))
}

// ---------- CONVERTERS -------------------------------------------------- 

export function convertProfile(response) {
  const profile = response.data.user;
  const product = profile.subscriber === 1 ? "premium" : "free";
  return {
    url: profile.image[2]['#text'],
    name: profile.realname,
    id: profile.name,
    text: "A " + product + " " + profile.type + " from " + profile.country + ".",
    href: profile.url
  }
}

export function convertArtists(response) {
  const artists = response.data.topartists.artist;
  return artists;
}

export function convertAlbums(response) {
  const albums = response.data.topalbums.album;
  return albums;
}

export function convertTracks(response) {
  const tracks = response.data.toptracks.track;
  return tracks;
}