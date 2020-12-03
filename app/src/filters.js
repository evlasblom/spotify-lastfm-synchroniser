import * as ss from 'string-similarity'

// ---------- Filter factories -------------------------------------------------- 

/**
 * Factory that helps create exclusive filters given a comparison function.
 * @param {Function} comparisonFunction A function that accepts two variables of the same type to check if they are equal.
 * @return {Function} A function that accepts an array of elements and returns a function to be used in a filter call.
 */
export function createExclusiveFilter1(comparisonFunction) {
  return function(otherArray) {
    return function(currentElement) {
      return otherArray.filter(function(otherElement) {
        return comparisonFunction(otherElement, currentElement)
      }).length === 0;
    }
  }
}

/**
 * Factory that helps create exclusive filters given a comparison function.
 * @param {Function} comparisonFunction A function that accepts two variables of the same type to check if they are equal.
 * @return {Function} A function that accepts an array of elements and returns a function to be used in a filter call.
 */
export function createExclusiveFilter2(comparisonFunction) {
  return function(otherArray) {
    return function(currentElement) {
      return otherArray.findIndex(function(otherElement) {
        return comparisonFunction(otherElement, currentElement)
      }) === -1;
    }
  }
}

export const createExclusiveFilter = createExclusiveFilter2; // version two should be slightly faster

/**
 * Factory that helps create find index function given a comparison function.
 * @param {Function} comparisonFunction A function that accepts two variables of the same type to check if they are equal.
 * @return {Function} A function that accepts an array of elements and returns a function to be used to find ids.
 */
export function createFindIndex(comparisonFunction) {
  return function(otherArray) {
    return function(currentElement) {
      return otherArray.findIndex(function(otherElement) {
        return comparisonFunction(otherElement, currentElement);
      })
    }
  }
}

// ---------- Filter functions -------------------------------------------------- 

// Some exclusive filter function for common data types within this app, made using the factory method
//
// For example, given two arrays A and B of artists:
//
// let onlyInA = A.filter(filterExclusiveArtists(B))
// let onlyInB = B.filter(filterExclusiveArtists(A))
//
// Will return the artists exclusively in A and B respectively.

export const filterExclusiveIds = createExclusiveFilter(compareIds);
export const filterExclusiveMatchedIds = createExclusiveFilter(compareMatchedIds);
export const filterExclusiveArtists = createExclusiveFilter(compareArtists);
export const filterExclusiveAlbums = createExclusiveFilter(compareAlbums);
export const filterExclusiveTracks = createExclusiveFilter(compareTracks);

// Some find index functions for common data types within this app, made using the factory method
//
// For example, given an array of artists A and an artist a:
//
// let aIndex = findIndexOfArtist(a)
//
// Will return the index of artist a.

export const findIndexOfId = createFindIndex(compareIds);
export const findIndexOfMatchedId = createFindIndex(compareMatchedIds);
export const findIndexOfArtist = createFindIndex(compareArtists);
export const findIndexOfAlbum = createFindIndex(compareAlbums);
export const findIndexOfTrack = createFindIndex(compareTracks);

/**
 * A filter function to get the artists, albums or tracks with a minimum number of plays.
 * @param {Number} limit The playcount limit.
 * @return {Function} A function to be used in a filter call.
 */
export function filterOnPlaycount(limit) {
  return function(input) {
    return input && (!input.playcount || input.playcount >= limit);    
  }
}

// ---------- Comparison functions -------------------------------------------------- 

// Functions to compare artists, albums and tracks. They are used in the functions above
// but can also be used independently. Inside, a string similarity function is used
// to somewhat account for different spellings (up until a certain amount).

/**
 * Determine if objects are the same by comparing if their ids are equal.
 * @param {Object} one The first object.
 * @param {Object} two The second object.
 */
export function compareIds(one, two) {
  return one && two && one.id === two.id;
}

/**
 * Determine if objects are the same by comparing if an id is equal to a matched id.
 * @param {Object} one The first object.
 * @param {Object} two The second object.
 */
export function compareMatchedIds(one, two) {
  return one && two && (
    (one.match >= 0 && one.results && one.results[one.match].id === two.id)
      ||
    (two.match >= 0 && two.results && two.results[two.match].id === one.id)
  )
}

/**
 * Determine if artists are the same by comparing if the artist names are equal.
 * @param {Object} one The first artist.
 * @param {Object} two The second artist.
 */
export function compareArtists(one, two) {
  return one && two 
    && (
      ss.compareTwoStrings(one.name, two.name) >= 0.9
        ||
      ss.compareTwoStrings(normalizeArtistName(one.name), normalizeArtistName(two.name))  >= 0.9
    )
}

/**
 * Determine if albums are the same by comparing if the album names are equal and if their artists are equal.
 * @param {Object} one The first album.
 * @param {Object} two The second album.
 */
export function compareAlbums(one, two) {
  return one && two 
    && (
      ss.compareTwoStrings(one.name, two.name) >= 0.9
        ||
      ss.compareTwoStrings(normalizeAlbumName(one.name), normalizeAlbumName(two.name))  >= 0.9
    ) 
    && compareArtists(one.artist[0], two.artist[0]);
}

/**
 * Determine if tracks are the same by comparing if the track names are equal and if their artists are equal.
 * @param {Object} one The first track.
 * @param {Object} two The second track.
 */
export function compareTracks(one, two) {
  return one && two 
  && (
    ss.compareTwoStrings(one.name, two.name) >= 0.9
      ||
    ss.compareTwoStrings(normalizeTrackName(one.name), normalizeTrackName(two.name))  >= 0.9
  ) 
    && compareArtists(one.artist[0], two.artist[0]);
}

// ---------- Normalization functions -------------------------------------------------- 

// Not in the mathematical sense, but more like, making it normal
// For normalizing accentuated characters, we can use es6 normalization
// see: https://stackoverflow.com/questions/990904/remove-accents-diacritics-in-a-string-in-javascript

/**
 * Normalize artist names using character normalization.
 * @param {String} name The artist name.
 */
export function normalizeArtistName(name) {
  return name
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * Normalize album names using character normalization and several regular expressions.
 * @param {String} name The album name.
 */
export function normalizeAlbumName(name) {
  const regex1 = / \(.+\)$/; // matches " (2020 special edition)" suffixes
  const regex2 = / -.+$/; // matches " - obscure album subtitle" suffixes
  const regex3 = / pt.? ([1-9])/; // matches " pt #" strings to be replaced by " part #"
  return name
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/ & /g, " and ")
    .replace(/'/g, "")
    .replace(/–/g, "-")
    .replace(/[.,:] /g, " ")
    .replace(regex1, "")
    .replace(regex2, "")
    .replace(regex3, "part $1");
}

/**
 * Normalize track names using character normalization and several regular expressions.
 * @param {String} name The track name.
 */
export function normalizeTrackName(name) {
  const regex1 = / \(.+\)$/; // matches " (2020 remastered)" suffixes
  const regex2 = / -.+$/; // matches " - obscure track subtitle" suffixes
  return name
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/ & /g, " and ")
    .replace(/'/g, "")
    .replace(/–/g, "-")
    .replace(/[.,:] /g, " ")
    .replace(regex1, "")
    .replace(regex2, "");
}
