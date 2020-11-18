import React from 'react';

import Container from 'react-bootstrap/Container';

import logo_lastfm from '../assets/logo_lastfm.svg';
import logo_spotify from '../assets/logo_spotify.svg';

function AppHeader(props) {
  
  return (
    <Container fluid className="App-header" >
      <img src={logo_spotify} className="App-logo" alt="Spotify" />
      <img src={logo_lastfm} className="App-logo" alt="Last.fm" />
    </Container>
  )
}

export default AppHeader;