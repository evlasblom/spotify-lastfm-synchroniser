import axios from 'axios';
import qs from 'qs';
import { ApiError } from '../exceptions'

// ---------- CONSTANTS -------------------------------------------------- 

const ALLOWED_METHODS = ['me', 'me/following', 'me/albums', 'me/tracks'];

// ---------- BASE -------------------------------------------------- 

function _getApi(access_token, method, params) {
  if (!ALLOWED_METHODS.includes(method)) throw new ApiError("Invalid argument selected: method.");

  const config = {
    url: method + '?' + qs.stringify(params),
    baseURL: 'https://api.spotify.com/v1/',
    method: 'GET',
    timeout: 4000,
    json: true,
    headers: {
      'Authorization': 'Bearer ' + access_token
    }
  };

  return axios(config)
}

function _putApi(access_token, method, params) {
  if (!ALLOWED_METHODS.includes(method)) throw new ApiError("Invalid argument selected: method.");

  const config = {
    url: method,
    baseURL: 'https://api.spotify.com/v1/',
    method: 'PUT',
    timeout: 4000,
    json: true,
    data: params,
    headers: {
      'Authorization': 'Bearer ' + access_token
    }
  };

  return axios(config)
}

function _deleteApi(access_token, method, params) {
  if (!ALLOWED_METHODS.includes(method)) throw new ApiError("Invalid argument selected: method.");

  const config = {
    url: method,
    baseURL: 'https://api.spotify.com/v1/',
    method: 'DELETE',
    timeout: 4000,
    json: true,
    data: params,
    headers: {
      'Authorization': 'Bearer ' + access_token
    }
  };

  return axios(config)
}

// ---------- API -------------------------------------------------- 

export function getProfile(access_token, opts) {
  return _getApi(access_token, 'me', {})
}

export function getFollowingArtists(access_token, opts) { 
  if (!opts) throw new ApiError("Missing required argument: opts.")

  const params = {
    type: 'artist',
    after: opts.after,
    limit: opts.limit // min 1 max 50 default 20
  }

  return _getApi(access_token, 'me/following', params)
}

export function getSavedAlbums(access_token, opts) {
  if (!opts) throw new ApiError("Missing required argument: opts.")
  if (opts.market && opts.market.length !== 2) throw new ApiError("Invalid option selected: market.")

  const params = {
    type: 'albums',
    offset: opts.offset,
    limit: opts.limit, // min 1 max 50 default 20
    market: opts.market
  }

  return _getApi(access_token, 'me/albums', params)
}

export function getSavedTracks(access_token, opts) {
  if (!opts) throw new ApiError("Missing required argument: opts.")
  if (opts.market && opts.market.length !== 2) throw new ApiError("Invalid option selected: market.")

  const params = {
    type: 'tracks',
    offset: opts.offset,
    limit: opts.limit, // min 1 max 50 default 20
    market: opts.market
  }

  return _getApi(access_token, 'me/tracks', params)
}

export function setFollowingArtists(access_token, opts) { 
  if (!opts) throw new ApiError("Missing required argument: opts.")
  if (!opts.ids) throw new ApiError("Missing required option: ids.");

  const params = {
    type: 'artist',
    ids: opts.ids, // max 50
  }

  return _putApi(access_token, 'me/following', params)
}

export function setSavedAlbums(access_token, opts) { 
  if (!opts) throw new ApiError("Missing required argument: opts.")
  if (!opts.ids) throw new ApiError("Missing required option: ids.");

  const params = {
    ids: opts.ids, // max 50
  }

  return _putApi(access_token, 'me/albums', params)
}

export function setSavedTracks(access_token, opts) { 
  if (!opts) throw new ApiError("Missing required argument: opts.")
  if (!opts.ids) throw new ApiError("Missing required option: ids.");

  const params = {
    ids: opts.ids, // max 50
  }

  return _putApi(access_token, 'me/tracks', params)
}

export function removeFollowingArtists(access_token, opts) { 
  if (!opts) throw new ApiError("Missing required argument: opts.")
  if (!opts.ids) throw new ApiError("Missing required option: ids.");

  const params = {
    type: 'artist',
    ids: opts.ids, // max 50
  }

  return _deleteApi(access_token, 'me/following', params)
}

export function removeSavedAlbums(access_token, opts) { 
  if (!opts) throw new ApiError("Missing required argument: opts.")
  if (!opts.ids) throw new ApiError("Missing required option: ids.");

  const params = {
    ids: opts.ids, // max 50
  }

  return _deleteApi(access_token, 'me/albums', params)
}

export function removeSavedTracks(access_token, opts) { 
  if (!opts) throw new ApiError("Missing required argument: opts.")
  if (!opts.ids) throw new ApiError("Missing required option: ids.");

  const params = {
    ids: opts.ids, // max 50
  }

  return _deleteApi(access_token, 'me/tracks', params)
}

// ---------- PARSERS -------------------------------------------------- 

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
export function parseArtists(artists) {
  return artists
    .map(artist => {
      return {
        type: 'artist', // === artist.type
        id: artist.id,
        name: artist.name,
        url: artist.external_urls.spotify
      }
    })
}

// Input: response.data.items
export function parseAlbums(albums) {
  return albums
    .map(album => {
      return {
        type: 'album', // === album.album.type
        id: album.album.id,
        name: album.album.name,
        artist: parseArtists(album.album.artists),
        url: album.album.external_urls.spotify
      }
    })
}

// Input: response.data.items
export function parseTracks(tracks) {
  return tracks
    .map(track => {
      return {
        type: 'track', // === track.track.type
        id: track.track.id,
        name: track.track.name,
        artist: parseArtists(track.track.artists),
        duration: track.track.duration_ms && Number(track.track.duration_ms), // optional
        url: track.track.external_urls.spotify
      }
    })
}
