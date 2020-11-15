import React, { useState, useEffect } from 'react';

import Alert from 'react-bootstrap/Alert'
import Spinner from 'react-bootstrap/Spinner'

function ArtistContent(props) {
  const artists = props.data;

  return (
    artists.map(
      (artist, i) => {
        return (
          <div key={i}>
            {artist.name}
          </div>
        )
      }
    )
  )
}

function AlbumsContentSpotify(props) {
  const albums = props.data;

  return (
    albums.map(
      (album, i) => {
        return (
          <div key={i}>
            {album.album.artists[0].name} -  {album.album.name}
          </div>
        )
      }
    )
  )
}

function AlbumsContentLastFm(props) {
  const albums = props.data;

  return (
    albums.map(
      (album, i) => {
        return (
          <div key={i}>
            {album.artist.name} - {album.name}
          </div>
        )
      }
    )
  )
}

function TracksContentSpotify(props) {
  const tracks = props.data;

  return (
    tracks.map(
      (track, i) => {
        return (
          <div key={i}>
            {track.track.artists[0].name} -  {track.track.name}
          </div>
        )
      }
    )
  )
}

function TracksContentLastFm(props) {
  const tracks = props.data;

  return (
    tracks.map(
      (track, i) => {
        return (
          <div key={i}>
            {track.artist.name} - {track.name}
          </div>
        )
      }
    )
  )
}

function ContentList(props) {
  const [data, setData] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const request = props.request;
  const convert = props.convert ? props.convert : (response) => response;
  const returnError = props.onError ? props.onError : (error) => console.error(error);
  const type = props.type ? props.type : "artists"
  const target = props.target

  // API call
  useEffect(() => {
    request()
    .then(response => {
      // DEBUG
      console.log(response)
      setData(convert(response))
      setLoading(false)
    })
    .catch(error => {
      setLoading(false)
      setError(error)
      returnError(error)
    });
  }, [])

  // check if loading
  if (loading) {
    return (
      <div style={{width: '20rem'}} className="bg-light m-2 p-2">
        <Spinner animation="border" variant="info"/>
      </div>
    )
  }

  // check if error
  // note: error status 401 is unauthorized
  else if (error) {
    return (
      <div style={{width: '20rem'}} className="bg-light m-2 p-2">
        <Alert variant="danger" className="pt-auto">{error.message}.</Alert>
      </div>
    )
  }

  let table
  if (!loading && !error && data) {
    switch (type) {
      case "artists":
        table = <ArtistContent data={data}/>
        break;
      
      case "albums":
        switch (target) {
          case "Spotify":
            table = <AlbumsContentSpotify data={data}/>
            break;
          
          case "Last.fm":
            table = <AlbumsContentLastFm data={data}/>
            break;
      
          default:
            break;
        }
        break;
      
      case "tracks":
        switch (target) {
          case "Spotify":
            table = <TracksContentSpotify data={data}/>
            break;
          
          case "Last.fm":
            table = <TracksContentLastFm data={data}/>
            break;
      
          default:
            break;
        }
  
      default:
        break;
    }
  }

  // otherwise success
  return (
    <div style={{width: '20rem'}} className="bg-light m-2 p-2 text-left">
      <b>{target}</b>
      <br></br>
      <br></br>
      {table}
    </div>
  )
}

export default ContentList;