import React from 'react';
import Spinner from 'react-bootstrap/Spinner'

function Loader(props) {

  return(
    <div {...props}>
      <Spinner animation="border" variant="info"/>
    </div>
  )
}

export default Loader;