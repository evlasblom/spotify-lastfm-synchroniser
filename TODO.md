# Todo

Last details:

- Improve usability:
  - Extra explanation of how everything works.
  - Add `WelcomePage` with link to `AuthPage`.
  - Redirect to authorization when token has expired.
- Versioning and release.
  - Add comments to javascript functions.
  - Add changelog and set app version in app json and in app footer.
  - Add to github and add link to github in app footer.
- Completeness:
  - Linting?
  - Unit tests?
- Spend a little time making it look better:
  - Add favicons.
  - Turn the lists into paginated tables?
  - Improve overall styling?

## Usability

- Add option to sort content on name?
- Add option to filter content on status?
- Remember the user's selection from last time?
- Add links to Spotify and Last.fm, in particular for unfound and uncofirmed content.

## Authentication

- Display timer when authentication expires?
- Move authentication data from local storage to React context?
- Also authenticate with Last.fm to love and unlove tracks?

## Selection

- Filter artists, albums and tracks on last time listened?
- Optionally select corresponding artist, albums and tracks?
  - Also follow artist of a selected album.
  - Also follow artist of a selected track.
  - Also save album of a selected track.
  - Also save tracks of a selected album.
