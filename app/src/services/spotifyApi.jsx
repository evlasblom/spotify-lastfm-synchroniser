import axios from 'axios';
import qs from 'qs';

import { ApiException } from '../exceptions'

// ---------- CONSTANTS -------------------------------------------------- 

export const ALLOWED_METHODS = ['me', 'me/following', 'me/albums', 'me/tracks', 'search'];

export const LIMIT_PER_PAGE = 50;

// ---------- BASE -------------------------------------------------- 

// Base API methods used internally.

function _baseApi(access_token, rest_method, api_method, params) {
  if (!ALLOWED_METHODS.includes(api_method)) throw new ApiException("Invalid argument selected: method");

  const config = {
    url: api_method + '?' + qs.stringify(params),
    baseURL: 'https://api.spotify.com/v1/',
    method: rest_method,
    timeout: 4000,
    json: true,
    headers: {
      'Authorization': 'Bearer ' + access_token
    }
  };

  return axios(config)
}

function _getApi(access_token, method, params) {
  return _baseApi(access_token, 'GET', method, params)
}

function _putApi(access_token, method, params) {
  return _baseApi(access_token, 'PUT', method, params)
}

function _deleteApi(access_token, method, params) {
  return _baseApi(access_token, 'DELETE', method, params)
}

// ---------- API -------------------------------------------------- 

// Main API methods as used in this application, implemented using the base methods.
// These functions should speak for themselves. For details, please refer to
// the Spotify API reference: https://developer.spotify.com/documentation/web-api/reference/

export function getProfile(access_token, opts) {
  return _getApi(access_token, 'me', {})
}

export function getFollowingArtists(access_token, opts) { 
  if (!opts) throw new ApiException("Missing required argument: opts");
  if (opts.limit && opts.limit.length > LIMIT_PER_PAGE) throw new ApiException("Option exceeds max size: limit");

  const params = {
    type: 'artist',
    after: opts.after,
    limit: opts.limit // min 1 max 50 default 20
  }

  return _getApi(access_token, 'me/following', params)
}

export function getSavedAlbums(access_token, opts) {
  if (!opts) throw new ApiException("Missing required argument: opts");
  if (opts.market && opts.market.length !== 2) throw new ApiException("Invalid option selected: market");
  if (opts.limit && opts.limit.length > LIMIT_PER_PAGE) throw new ApiException("Option exceeds max size: limit");

  const params = {
    type: 'albums',
    offset: opts.offset,
    limit: opts.limit, // min 1 max 50 default 20
    market: opts.market
  }

  return _getApi(access_token, 'me/albums', params)
}

export function getSavedTracks(access_token, opts) {
  if (!opts) throw new ApiException("Missing required argument: opts");
  if (opts.market && opts.market.length !== 2) throw new ApiException("Invalid option selected: market");
  if (opts.limit && opts.limit.length > LIMIT_PER_PAGE) throw new ApiException("Option exceeds max size: limit");

  const params = {
    type: 'tracks',
    offset: opts.offset,
    limit: opts.limit, // min 1 max 50 default 20
    market: opts.market
  }

  return _getApi(access_token, 'me/tracks', params)
}

export function setFollowingArtists(access_token, opts) { 
  if (!opts) throw new ApiException("Missing required argument: opts");
  if (!opts.ids) throw new ApiException("Missing required option: ids");
  if (opts.ids.length > LIMIT_PER_PAGE) throw new ApiException("Option exceeds max size: ids");

  const params = {
    type: 'artist',
    ids: opts.ids.join(","), // max 50
  }

  return _putApi(access_token, 'me/following', params)
}

export function setSavedAlbums(access_token, opts) { 
  if (!opts) throw new ApiException("Missing required argument: opts");
  if (!opts.ids) throw new ApiException("Missing required option: ids");
  if (opts.ids.length > LIMIT_PER_PAGE) throw new ApiException("Option exceeds max size: ids");

  const params = {
    ids: opts.ids.join(","), // max 50
  }

  return _putApi(access_token, 'me/albums', params)
}

export function setSavedTracks(access_token, opts) { 
  if (!opts) throw new ApiException("Missing required argument: opts");
  if (!opts.ids) throw new ApiException("Missing required option: ids");
  if (opts.ids.length > LIMIT_PER_PAGE) throw new ApiException("Option exceeds max size: ids");

  const params = {
    ids: opts.ids.join(","), // max 50
  }

  return _putApi(access_token, 'me/tracks', params)
}

export function removeFollowingArtists(access_token, opts) { 
  if (!opts) throw new ApiException("Missing required argument: opts");
  if (!opts.ids) throw new ApiException("Missing required option: ids");
  if (opts.ids.length > LIMIT_PER_PAGE) throw new ApiException("Option exceeds max size: ids");

  const params = {
    type: 'artist',
    ids: opts.ids.join(","), // max 50
  }

  return _deleteApi(access_token, 'me/following', params)
}

export function removeSavedAlbums(access_token, opts) { 
  if (!opts) throw new ApiException("Missing required argument: opts");
  if (!opts.ids) throw new ApiException("Missing required option: ids");
  if (opts.ids.length > LIMIT_PER_PAGE) throw new ApiException("Option exceeds max size: ids");

  const params = {
    ids: opts.ids.join(","), // max 50
  }

  return _deleteApi(access_token, 'me/albums', params)
}

export function removeSavedTracks(access_token, opts) { 
  if (!opts) throw new ApiException("Missing required argument: opts");
  if (!opts.ids) throw new ApiException("Missing required option: ids");
  if (opts.ids.length > LIMIT_PER_PAGE) throw new ApiException("Option exceeds max size: ids");

  const params = {
    ids: opts.ids.join(","), // max 50
  }

  return _deleteApi(access_token, 'me/tracks', params)
}

export function search(access_token, opts) {
  if (!opts) throw new ApiException("Missing required argument: opts");
  if (!opts.type) throw new ApiException("Missing required option: type");
  if (!opts.q) throw new ApiException("Missing required option: q");
  if (opts.market && opts.market.length !== 2) throw new ApiException("Invalid option selected: market");
  if (opts.limit && opts.limit.length > LIMIT_PER_PAGE) throw new ApiException("Option exceeds max size: limit");

  const params = {
    type: opts.type,
    q: opts.q,
    offset: opts.offset,
    limit: opts.limit, // min 1 max 50 default 20
    market: opts.market,
    include_external: opts.include_external
  }

  return _getApi(access_token, 'search', params)
}

export function searchArtist(access_token, opts) {
  return search(access_token, {...opts, type: 'artist'})
}

export function searchAlbum(access_token, opts) {
  return search(access_token, {...opts, type: 'album'})
}

export function searchTrack(access_token, opts) {
  return search(access_token, {...opts, type: 'track'})
}

// ---------- PARSERS -------------------------------------------------- 

// Parsers for common response types. By using these we can ensure consistent 
// data formats for both Spotify and Last.fm API calls.

function _parseImages(images) {
  return images
    .sort((a, b) => a.width * a.height - b.width * b.height) // sort small to large
    .map(image => image.url)
    .filter(image => image && image.length > 0)
}

// Input: response.data
export function parseProfile(profile) {
  return {
    image: _parseImages(profile.images)[0],
    name: profile.display_name,
    id: profile.id,
    type: profile.type,
    product: profile.product,
    url: profile.external_urls.spotify
  }
}

// Input: response.data.artists.items
export function parseArtists(items) {
  return items
    .filter(item => !!item)
    .map(item => {
      return {
        type: 'artist', // === item.type
        id: item.id,
        name: item.name,
        url: item.external_urls.spotify
      }
    })
}

// Input: response.data.items
export function parseAlbums(items) {
  return items
    .filter(item => !!item)
    .map(item => {
      let album;
      if (item.album) album = item.album; // in library requests the album is nested
      else album = item; // in search requests get the album directly
      return {
        type: 'album', // === album.type
        id: album.id,
        name: album.name,
        artist: parseArtists(album.artists),
        url: album.external_urls.spotify
      }
    })
}

// Input: response.data.items
export function parseTracks(items) {
  return items
    .filter(item => !!item)
    .map(item => {
      let track;
      if (item.track) track = item.track; // in library requests the track is nested
      else track = item; // in search requests get the track directly
      return {
        type: 'track', // === track.type
        id: track.id,
        name: track.name,
        artist: parseArtists(track.artists),
        duration: track.duration_ms && Number(track.duration_ms), // optional
        url: track.external_urls.spotify
      }
    })
}
