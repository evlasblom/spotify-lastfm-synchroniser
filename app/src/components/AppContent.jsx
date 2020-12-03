import React from 'react'

import Container from 'react-bootstrap/Container';

function AppContent(props) {

  return (
    <div className="App-content">
      <Container>
        {props.children}
      </Container>
    </div>
  )
}

export default AppContent;