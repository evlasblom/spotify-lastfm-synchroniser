import React from 'react';
import Alert from 'react-bootstrap/Alert'

function Addendum401(props) {

  return(
    <Alert variant="danger">
      Click <Alert.Link href="/auth">here</Alert.Link> to reauthenticate.
    </Alert>
  )
}

function Error(props) {
  const error401 = props.error.message.includes("401");

  return(
    <div {...props}>
      <Alert variant="danger">
        {props.error.message}.
      </Alert>

      {error401 ? <Addendum401 /> : ""}
    </div>
  )
}

export default Error;