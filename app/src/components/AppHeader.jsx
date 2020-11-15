import React from 'react';

import Container from 'react-bootstrap/Container';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';

import logo_lastfm from '../assets/logo_lastfm.svg';
import logo_spotify from '../assets/logo_spotify.svg';

function Header(props) {
  
  return (
    <Container fluid className="App-header">
      <img src={logo_spotify} className="App-logo" alt="Spotify" />
      <img src={logo_lastfm} className="App-logo" alt="Last.fm" />
    </Container>
  )
}

function Navigation(props) {
  const auth = true
  
  return (
    <Navbar bg="dark" variant="dark" className="mb-2">
      <Nav className="mr-auto ml-auto">
        <Nav.Item>
          <Nav.Link href="/auth">Authenticate</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link href="/artists" disabled={!auth} >Artists</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link href="/albums" disabled={!auth} >Albums</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link href="/tracks" disabled={!auth} >Tracks</Nav.Link>
        </Nav.Item>
      </Nav>
    </Navbar>
  )
}

function AppHeader(props) {

  return (
    <>
      <Header />
      <Navigation />
    </>
  )
}

export default AppHeader;