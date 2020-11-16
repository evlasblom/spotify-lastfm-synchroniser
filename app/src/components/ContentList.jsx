import React, { useState, useEffect } from 'react';

import Alert from 'react-bootstrap/Alert'
import Spinner from 'react-bootstrap/Spinner'

function ContentList(props) {
  const [data, setData] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const request = props.request;
  const parse = props.parse ? props.parse : (response) => response;
  const returnError = props.onError ? props.onError : (error) => console.error(error);
  const returnResponse = props.onResponse ? props.onResponse : (response) => console.log(response);
  const type = props.type ? props.type : "artists"
  const target = props.target

  // API call
  useEffect(() => {
    request()
    .then(response => {
      setData(parse(response))
      setLoading(false)
      returnResponse(response)
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
      <div style={{width: '20rem'}} className="m-2 p-2">
        <Spinner animation="border" variant="info"/>
      </div>
    )
  }

  // check if error
  // note: error status 401 is unauthorized
  else if (error) {
    return (
      <div style={{width: '20rem'}} className="m-2 p-2">
        <Alert variant="danger" className="pt-auto">{error.message}.</Alert>
      </div>
    )
  }

  console.log(data)
  
  let table

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