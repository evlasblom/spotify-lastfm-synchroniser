import React from 'react'

import Container from 'react-bootstrap/Container';

function HomeContent(props) {

  return (
    <div className="Home-content">
      <Container>
        {props.children}
      </Container>
    </div>
  )
}

export default HomeContent;