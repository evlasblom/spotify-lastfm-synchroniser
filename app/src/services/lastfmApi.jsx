import axios from 'axios';
import qs from 'qs';
import { ApiException } from '../exceptions'

// Partly based on: https://github.com/feross/last-fm

// ---------- CONSTANTS -------------------------------------------------- 

export const ALLOWED_METHODS = ['user.getinfo', 'user.getTopArtists', 'user.getTopAlbums', 'user.getTopTracks'];
export const ALLOWED_PERIODS = ['overall', '7day', '1month', '3month', '6month', '12month'];

export const LIMIT_PER_PAGE = 1000;

const IMAGE_SORT_WEIGHTS = {
  '': 1, // missing size is ranked last
  small: 2,
  medium: 3,
  large: 4,
  extralarge: 5,
  mega: 6
}

// ---------- BASE -------------------------------------------------- 

function _getApi(access_key, params) {
  if (!ALLOWED_METHODS.includes(params.method)) throw new ApiException("Invalid option selected: method");
  
  const base = {
    api_key: access_key,
    format: 'json'
  };

  const config = {
    url: '?' + qs.stringify({...params, ...base}),
    baseURL: 'https://ws.audioscrobbler.com/2.0/',
    method: 'GET',
    timeout: 10000,
    json: true
  };

  return axios(config);
}

// Note: untested
function _postApi(session_key, access_key, method_signature, params) {
  if (!ALLOWED_METHODS.includes(params.method)) throw new ApiException("Invalid option selected: method");
  
  const base = {
    sk: session_key,
    api_key: access_key,
    api_sig: method_signature
  };

  const config = {
    url: '',
    baseURL: 'https://ws.audioscrobbler.com/2.0/',
    method: 'GET',
    timeout: 10000,
    json: true,
    data: {...params, ...base}
  };

  return axios(config);
}


// ---------- API -------------------------------------------------- 

export function getProfile(access_key, opts) {
  if (!opts) throw new ApiException("Missing required argument: opts");
  if (!opts.user) throw new ApiException("Missing required option: user");

  const params = {
    method: 'user.getinfo',
    user: opts.user,
  }

  return _getApi(access_key, params);
}

export function getTopArtists(access_key, opts) {
  if (!opts) throw new ApiException("Missing required argument: opts");
  if (!opts.user) throw new ApiException("Missing required option: user");
  if (opts.period && !ALLOWED_PERIODS.includes(opts.period)) throw new ApiException("Invalid option selected: period");
  if (opts.limit && opts.limit > LIMIT_PER_PAGE) throw new ApiException("Option exceeds max size: limit");

  const params = {
    method: 'user.getTopArtists',
    user: opts.user,
    period: opts.period,
    limit: opts.limit,
    page: opts.page
  }

  return _getApi(access_key, params);
}

export function getTopAlbums(access_key, opts) {
  if (!opts) throw new ApiException("Missing required argument: opts");
  if (!opts.user) throw new ApiException("Missing required option: user");
  if (opts.period && !ALLOWED_PERIODS.includes(opts.period)) throw new ApiException("Invalid option selected: period");
  if (opts.limit && opts.limit > LIMIT_PER_PAGE) throw new ApiException("Option exceeds max size: limit");

  const params = {
    method: 'user.getTopAlbums',
    user: opts.user,
    period: opts.period,
    limit: opts.limit,
    page: opts.page
  }

  return _getApi(access_key, params);
}

export function getTopTracks(access_key, opts) {
  if (!opts) throw new ApiException("Missing required argument: opts");
  if (!opts.user) throw new ApiException("Missing required option: user");
  if (opts.period && !ALLOWED_PERIODS.includes(opts.period)) throw new ApiException("Invalid option selected: period");
  if (opts.limit && opts.limit > LIMIT_PER_PAGE) throw new ApiException("Option exceeds max size: limit");

  const params = {
    method: 'user.getTopTracks',
    user: opts.user,
    period: opts.period,
    limit: opts.limit,
    page: opts.page
  }

  return _getApi(access_key, params);
}

// Note: untested
export function setTopTrack(session_key, access_key, method_signature, opts) {
  if (!opts) throw new ApiException("Missing required argument: opts");
  if (!opts.track) throw new ApiException("Missing required option: track");
  if (!opts.artist) throw new ApiException("Missing required option: artist");

  const params = {
    method: 'track.love',
    track: opts.track,
    artist: opts.artist,
  }

  return _postApi(session_key, access_key, method_signature, params);
}

// Note: untested
export function deleteTopTrack(session_key, access_key, method_signature, opts) {
  if (!opts) throw new ApiException("Missing required argument: opts");
  if (!opts.track) throw new ApiException("Missing required option: track");
  if (!opts.artist) throw new ApiException("Missing required option: artist");

  const params = {
    method: 'track.unlove',
    track: opts.track,
    artist: opts.artist,
  }

  return _postApi(session_key, access_key, method_signature, params);
}

// ---------- PARSERS -------------------------------------------------- 

function _parseImages(images) {
  return images
    .sort((a, b) => IMAGE_SORT_WEIGHTS[a.size] - IMAGE_SORT_WEIGHTS[b.size]) // sort small to large
    .filter(image => image.size !== '')
    .map(image => image['#text'])
    .filter(image => image && image.length > 0)
}

// Input: response.data.user;
export function parseProfile(profile) {
  return {
    image: _parseImages(profile.image).slice(-1),
    name: profile.realname,
    id: profile.name,
    type: profile.type,
    product: profile.subscriber === 1 ? "premium" : "free",
    url: profile.url
  }
}

// Input: response.data.topartists.artist
export function parseArtists(artists) {
  return artists
    .map(artist => {
      return {
        type: 'artist',
        rank: artist['@attr'] && Number(artist['@attr'].rank), // optional
        id: artist.mbid,
        name: artist.name,
        playcount: artist.playcount && Number(artist.playcount), // optional
        url: artist.url
      }
    })
}

// Input: response.data.topalbums.album
export function parseAlbums(albums) {
  return albums
    .map(album => {
      return {
        type: 'album',
        rank: album['@attr'] && Number(album['@attr'].rank), // optional
        id: album.mbid,
        name: album.name,
        artist: parseArtists([album.artist]),
        playcount: album.playcount && Number(album.playcount), // optional
        url: album.url
      }
    })
}

// Input: response.data.toptracks.track
export function parseTracks(tracks) {
  return tracks
    .map(track => {
      return {
        type: 'track',
        rank: track['@attr'] && Number(track['@attr'].rank), // optional
        id: track.mbid,
        name: track.name,
        artist: parseArtists([track.artist]),
        playcount: track.playcount && Number(track.playcount), // optional
        duration: track.duration && Number(track.duration), // optional
        url: track.url
      }
    })
}
