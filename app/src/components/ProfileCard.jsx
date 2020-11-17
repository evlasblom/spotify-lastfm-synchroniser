import React from 'react';

import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card'
import Error from '../components/Error'
import Loading from '../components/Loading'

function ProfileCard(props) {
  const loading = props.loading;
  const error = props.error;
  const profile = props.data;
  const target = props.target;

  // check if loading
  if (loading) {
    return <Loading style={{ width: '18rem', height: '30rem'}} className="mr-2 ml-2" />
  }

  // check if error
  else if (error) {
    return <Error style={{ width: '18rem', height: '30rem'}} className="mr-2 ml-2" error={error} />
  }

  // otherwise success
  return (
    <Card style={{ width: '18rem', height: '30rem'}} className="mr-2 ml-2">
      <Card.Img variant="top" src={profile.image} />
      <Card.Body>
        <Card.Title>{profile.name}</Card.Title>
        <Card.Subtitle className="mb-2 text-muted">ID: {profile.id}</Card.Subtitle>
        <Card.Text>
          A {profile.product} {profile.type}.
        </Card.Text>
        <Button className
          variant="success" 
          href={profile.url}
          target="_blank">View on {target}</Button>
      </Card.Body>
    </Card>
  )
}

export default ProfileCard;