import React from 'react'

import Container from 'react-bootstrap/Container';

// The application content component
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