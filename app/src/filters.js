import * as ss from 'string-similarity'

// filter factories
export function createExclusiveFilter1(comparisonFunction) {
  return function(otherArray) {
    return function(currentElement) {
      return otherArray.filter(function(otherElement) {
        return comparisonFunction(otherElement, currentElement)
      }).length === 0;
    }
  }
}

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

export function createFindIndex(comparisonFunction) {
  return function(otherArray) {
    return function(currentElement) {
      return otherArray.findIndex(function(otherElement) {
        if (otherElement && currentElement && otherElement.name === "Opeth" && currentElement.name === "Opeth") {
        }
        return comparisonFunction(otherElement, currentElement);
      })
    }
  }
}

// filter functions
export const filterExclusiveIds = createExclusiveFilter(compareIds);
export const filterExclusiveMatchedIds = createExclusiveFilter(compareMatchedIds);
export const filterExclusiveArtists = createExclusiveFilter(compareArtists);
export const filterExclusiveAlbums = createExclusiveFilter(compareAlbums);
export const filterExclusiveTracks = createExclusiveFilter(compareTracks);

export const findIndexOfId = createFindIndex(compareIds);
export const findIndexOfMatchedId = createFindIndex(compareMatchedIds);
export const findIndexOfArtist = createFindIndex(compareArtists);
export const findIndexOfAlbum = createFindIndex(compareAlbums);
export const findIndexOfTrack = createFindIndex(compareTracks);

export function filterOnPlaycount(limit) {
  return function(input) {
    return input && (!input.playcount || input.playcount >= limit);    
  }
}

// comparison functions
// use a similarity function to somewhat account for different spellings
export function compareIds(one, two) {
  return one && two && one.id === two.id;
}

export function compareMatchedIds(one, two) {
  return one && two && (
    (one.match >= 0 && one.results && one.results[one.match].id === two.id)
      ||
    (two.match >= 0 && two.results && two.results[two.match].id === one.id)
  )
}

export function compareArtists(one, two) {
  return one && two 
    && (
      ss.compareTwoStrings(one.name, two.name) >= 0.9
        ||
      ss.compareTwoStrings(normalizeArtistName(one.name), normalizeArtistName(two.name))  >= 0.9
    )
}

export function compareAlbums(one, two) {
  return one && two 
    && (
      ss.compareTwoStrings(one.name, two.name) >= 0.9
        ||
      ss.compareTwoStrings(normalizeAlbumName(one.name), normalizeAlbumName(two.name))  >= 0.9
    ) 
    && compareArtists(one.artist[0], two.artist[0]);
}

export function compareTracks(one, two) {
  return one && two 
  && (
    ss.compareTwoStrings(one.name, two.name) >= 0.9
      ||
    ss.compareTwoStrings(normalizeTrackName(one.name), normalizeTrackName(two.name))  >= 0.9
  ) 
    && compareArtists(one.artist[0], two.artist[0]);
}

// normalization functions
// not in the mathematical sense, but more like, making it normal
// for normalizing accentuated characters, we can use es6 normalization
// see: https://stackoverflow.com/questions/990904/remove-accents-diacritics-in-a-string-in-javascript
export function normalizeArtistName(name) {
  return name
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

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
