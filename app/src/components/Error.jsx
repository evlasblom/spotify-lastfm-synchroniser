import React from 'react';
import Alert from 'react-bootstrap/Alert'

function AddendumAuthentication(props) {

  return(
    <Alert variant="danger">
      Click <Alert.Link href="/auth">here</Alert.Link> to authenticate.
    </Alert>
  )
}

function Error(props) {
  const error401 = props.error.message.includes("401");
  const missing_option_user = props.error.message === "Missing required option: user";

  return(
    <div {...props}>
      <Alert variant="danger">
        {props.error.message}.
      </Alert>

      {error401 ? <AddendumAuthentication /> : ""}
      {missing_option_user ? <AddendumAuthentication /> : ""}
    </div>
  )
}

export default Error;