import React from 'react'

import Container from 'react-bootstrap/Container';

function AppContent(props) {

  return (
    <Container className="App-content">
      {props.children}
    </Container>
  )
}

export default AppContent;