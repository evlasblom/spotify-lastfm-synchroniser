import * as ss from 'string-similarity'

// filter factories
function createExclusiveFilter(compareFunction) {
  return function(otherArray) {
    return function(currentElement) {
      return otherArray.filter(function(otherElement) {
        return compareFunction(otherElement, currentElement)
      }).length === 0;
    }
  }
}

// filter functions
export const filterExclusiveId = createExclusiveFilter(compareId);

export const filterExclusiveArtists = createExclusiveFilter(compareArtists);

export const filterExclusiveAlbums = createExclusiveFilter(compareAlbums);

export const filterExclusiveTracks = createExclusiveFilter(compareTracks);

export function filterOnPlaycount(limit) {
  return function(input) {
    return input && (!input.playcount || input.playcount >= limit);    
  }
}

// comparison functions
// use a similarity function to somewhat account for different spellings
export function compareId(one, two) {
  return one && two && one.id === two.id;
}

export function compareArtists(one, two) {
  return one && two && 
    ss.compareTwoStrings(one.name.toLowerCase(), two.name.toLowerCase()) >= 0.9;
}

export function compareAlbums(one, two) {
  return one && two 
    && ss.compareTwoStrings(one.name.toLowerCase(), two.name.toLowerCase()) >= 0.9 
    && compareArtists(one.artist[0], two.artist[0]);
}

export function compareTracks(one, two) {
  return one && two 
    && ss.compareTwoStrings(one.name.toLowerCase(), two.name.toLowerCase()) >= 0.9 
    && compareArtists(one.artist[0], two.artist[0]);
}
