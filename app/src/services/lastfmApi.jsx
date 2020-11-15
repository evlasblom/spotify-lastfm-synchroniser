import axios from 'axios';

// ---------- FUNCTIONS -------------------------------------------------- 

function requestTop(method, access_key, opts) {
  const allowed_methods = ['Artists','Albums','Tracks'];
  const allowed_periods = ['7day','1month','3month','6month','12month'];
  if (allowed_methods.indexOf(method) < 0) throw new Error("Invalid method selected.");
  if (!opts.user) throw new Error("The user option is required.");
  if (opts.period && allowed_periods.indexOf(opts.period) < 0) throw new Error("Invalid period option.");
  
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
  if (!opts.user) throw new Error("The user option is required.");

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
    text: "A " + product + " " + profile.type + ".",
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