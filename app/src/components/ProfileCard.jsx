import React, { useState, useEffect } from 'react';

import Alert from 'react-bootstrap/Alert'
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card'
import Spinner from 'react-bootstrap/Spinner'

function ProfileCard(props) {
  const [profile, setProfile] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const request = props.request;
  const convert = props.convert;
  const returnError = props.onError ? props.onError : (error) => console.error(error);

  // API call
  useEffect(() => {
    request()
    .then(response => {
      setProfile(convert(response))
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
      <div style={{ width: '18rem', height: '30rem' }}>
          <Spinner animation="border" variant="info"/>
      </div>
    )
  }

  // check if error
  // note: error status 401 is unauthorized
  else if (error) {
    return (
      <div style={{ width: '18rem', height: '30rem' }}>
        <Alert variant="danger" className="pt-auto">{error.message}.</Alert>
      </div>
    )
  }

  // otherwise success
  return (
    <Card style={{ width: '18rem', height: '30rem' }}>
      <Card.Img variant="top" src={profile.url} />
      <Card.Body>
        <Card.Title>{profile.name}</Card.Title>
        <Card.Subtitle className="mb-2 text-muted">ID: {profile.id}</Card.Subtitle>
        <Card.Text>
          {profile.text}
        </Card.Text>
        <Button className
          variant="success" 
          href={profile.href}
          target="_blank">View on {props.target}</Button>
      </Card.Body>
    </Card>
  )
}

export default ProfileCard;