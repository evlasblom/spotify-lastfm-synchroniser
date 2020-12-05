// Content status enumeration (for artists, albums or tracks)
export const ContentStatus = {
  NONE: 0,      //< no status set
  FETCHED: 1,   //< content fetched from server
  FILTERED: 2,  //< content passed initial filter
  SOUGHT: 3,    //< search on spotify executed
  FOUND: 4,     //< search on spotify succeeded
  CONFIRMED: 5, //< search on spotify confirmed as correct
  MARKED: 6,    //< content is marked, an action needs to be taken (import or clear)
  RESOLVED: 7   //< content is resolved, nothing more to do
}

// Content action enumeration (for artists, albums or tracks)
export const ContentAction = {
  CLEAR: -1,    //< clear content
  NONE: 0,      //< do nothing
  IMPORT: 1     //< import content
}

// Content source enumration
export const ContentSource = {
  SPOTIFY: 1,
  LASTFM: 2,
}

// Convert content status enumeration to a string
export const convertContentStatusToString = (status) => {
  if (status) {
    switch(status) {
      case ContentStatus.FETCHED:
        return "fetched";

      case ContentStatus.FILTERED:
        return "filtered";

      case ContentStatus.SOUGHT:
        return "sought";

      case ContentStatus.FOUND:
        return "found";

      case ContentStatus.CONFIRMED:
        return "confirmed";

      case ContentStatus.MARKED:
        return "marked";

      case ContentStatus.RESOLVED:
        return "resolved";

      default:
        return "none";
    }
  }
  return "none";
}

// Convert content action enumeration to a string
export const convertContentActionToString = (action) => {
  if (action) {
    switch(action) {
      case ContentAction.CLEAR:
        return "clear";

      case ContentAction.IMPORT:
        return "import";

      default:
        return "none";
    }
  }
  return "none";
}

// Convert content source enumeration to a string
export const convertContentSourceToString = (source) => {
  if (source) {
    switch(source) {
      case ContentSource.SPOTIFY:
        return "spotify";

      case ContentSource.LASTFM:
        return "lastfm";

      default:
        return "unknown";
    }
  }
  return "unknown";
}