import axios from 'axios';
import qs from 'qs';
import { ApiError } from '../exceptions'

// Partly based on: https://github.com/feross/last-fm

// ---------- CONSTANTS -------------------------------------------------- 

const ALLOWED_METHODS = ['user.getinfo', 'user.getTopArtists', 'user.getTopAlbums', 'user.getTopTracks'];
const ALLOWED_PERIODS = ['7day', '1month', '3month', '6month', '12month'];

const IMAGE_SORT_WEIGHTS = {
  '': 1, // missing size is ranked last
  small: 2,
  medium: 3,
  large: 4,
  extralarge: 5,
  mega: 6
}

// ---------- BASE -------------------------------------------------- 

function _baseApi(access_key, params) {
  if (!ALLOWED_METHODS.includes(params.method)) throw new ApiError("Invalid option selected: method.");
  
  const base = {
    api_key: access_key,
    format: 'json'
  };

  const config = {
    url: '?' + qs.stringify({...params, ...base}),
    baseURL: 'https://ws.audioscrobbler.com/2.0/',
    method: 'GET',
    timeout: 4000,
    json: true
  };

  return axios(config);
}

// ---------- API -------------------------------------------------- 

export function getProfile(access_key, opts) {
  if (!opts.user) throw new ApiError("Missing required option: user.");

  const params = {
    method: 'user.getinfo',
    user: opts.user,
  }

  return _baseApi(access_key, params);
}

export function getTopArtists(access_key, opts) {
  if (!opts.user) throw new ApiError("Missing required option: user.");
  if (opts.period && !ALLOWED_PERIODS.includes(opts.period)) throw new ApiError("Invalid option selected: period.");

  const params = {
    method: 'user.getTopArtists',
    user: opts.user,
    period: opts.period,
    limit: opts.limit,
    page: opts.page
  }

  return _baseApi(access_key, params);
}

export function getTopAlbums(access_key, opts) {
  if (!opts.user) throw new ApiError("Missing required option: user.");
  if (opts.period && !ALLOWED_PERIODS.includes(opts.period)) throw new ApiError("Invalid option selected: period.");

  const params = {
    method: 'user.getTopAlbums',
    user: opts.user,
    period: opts.period,
    limit: opts.limit,
    page: opts.page
  }

  return _baseApi(access_key, params);
}

export function getTopTracks(access_key, opts) {
  if (!opts.user) throw new ApiError("Missing required option: user.");
  if (opts.period && !ALLOWED_PERIODS.includes(opts.period)) throw new ApiError("Invalid option selected: period.");

  const params = {
    method: 'user.getTopTracks',
    user: opts.user,
    period: opts.period,
    limit: opts.limit,
    page: opts.page
  }

  return _baseApi(access_key, params);
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
        id: artist.mbid,
        name: artist.name,
        playcount: artist.playcount || Number(artist.playcount), // optional
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
        id: album.mbid,
        name: album.name,
        artist: album.artist.name || album.artist,
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
        id: track.mbid,
        name: track.name,
        artist: track.artist.name || track.artist,
        playcount: track.playcount && Number(track.playcount), // optional
        duration: track.duration && Number(track.duration), // optional
        url: track.url
      }
    })
}
