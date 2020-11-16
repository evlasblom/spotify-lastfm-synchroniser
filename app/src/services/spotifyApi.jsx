import axios from 'axios';
import qs from 'qs';
import { ApiError } from '../exceptions'

// ---------- CONSTANTS -------------------------------------------------- 

const ALLOWED_METHODS = ['me', 'me/following', 'me/albums', 'me/tracks'];

// ---------- BASE -------------------------------------------------- 

function _baseApi(access_token, method, params) {
  if (!ALLOWED_METHODS.includes(method)) throw new ApiError("Invalid argument selected: method.");

  const config = {
    url: method + '?' + qs.stringify(params),
    baseURL: 'https://api.spotify.com/v1/',
    method: 'GET',
    timeout: 4000,
    headers: {
      'Authorization': 'Bearer ' + access_token
    }
  };

  console.log(config.baseURL + config.url)

  return axios(config)
}

// ---------- API -------------------------------------------------- 

export function getProfile(access_token, opts) {
  return _baseApi(access_token, 'me', {})
}

export function getFollowingArtists(access_token, opts) { 
  const params = {
    type: 'artist',
    after: opts.after,
    limit: opts.limit
  }

  return _baseApi(access_token, 'me/following', params)
}

export function getSavedAlbums(access_token, opts) {
  if (opts.market && opts.market.length !== 2) throw new ApiError("Invalid option selected: market.")

  const params = {
    type: 'albums',
    offset: opts.offset,
    limit: opts.limit,
    market: opts.market
  }

  return _baseApi(access_token, 'me/albums', params)
}

export function getSavedTracks(access_token, opts) {
  if (opts.market && opts.market.length !== 2) throw new ApiError("Invalid option selected: market.")

  const params = {
    type: 'tracks',
    offset: opts.offset,
    limit: opts.limit,
    market: opts.market
  }

  return _baseApi(access_token, 'me/tracks', params)
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
