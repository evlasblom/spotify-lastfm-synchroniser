# Todo

Last details:

- Improve usability:
  - Redirect to authorization when token has expired.
- Completeness:
  - Linting?
- Versioning and release.
  - Add to github and add link to github in app footer.

## Bugs

- The bootstrap tooltips result in an error (in StrictMode, so it does not appear in the build version).

## Styling

- Add favicons.
- Add header animations (grow and shrink). _[work in progress]_
- Turn these long lists into paginated tables?

## Usability

- Add option to sort content on name?
- Add option to filter content on status?
- Remember the user's selection from last time?
- Add links to Spotify and Last.fm, in particular for unfound and uncofirmed content.

## Authentication

- Display timer when authentication expires?
- Move authentication data from local storage to React context? _[work in progress]_
- Also authenticate with Last.fm to love and unlove tracks?

## Selection

- Filter artists, albums and tracks on last time listened?
- Optionally select corresponding artist, albums and tracks?
  - Also follow artist of a selected album.
  - Also follow artist of a selected track.
  - Also save album of a selected track.
  - Also save tracks of a selected album.
