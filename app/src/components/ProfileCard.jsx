import React from 'react'

import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card'

// A profile card component
function ProfileCard(props) {
  const profile = props.data;
  const target = props.target;

  return (
    <Card style={{ width: '18rem', height: '30rem'}} className="m-2">
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

// A profile card placeholder component when loading...
export function ProfileCardPlaceholder(props) {

  return (
    <Card style={{ width: '18rem', height: '30rem'}} className="m-2">
    </Card>
  )
}

export default ProfileCard;