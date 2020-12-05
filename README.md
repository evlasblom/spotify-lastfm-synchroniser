# Lastify Synchroniser

This is a simple web application that lets users synchronise their [Spotify](https://spotify.com) library with their [Last.fm](https://last.fm) charts.

Moreover, this repository contains basic JavaScript interfaces for both APIs.

## Getting started

To get started running the app locally, use the following commands.

```bash
# install dependencies
npm install

# start development server
npm start
```

Your app should now be running on http://localhost:3000.

Note that the APIs will not work until you provide the right access information. You can create an account on the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/login), accept the terms and create your application. You can create a [Last.fm API account](https://www.last.fm/api/account/create) as well. Once that's done, create the following _.env_ file in the _app_ directory and replace _xxx_ with the correct values.

```bash
REACT_APP_SPOTIFY_CLIENT_ID=xxx
REACT_APP_LASTFM_ACCESS_KEY=xxx
```

Restart the development server. The app should now be fully functional.
