import React, { useEffect } from 'react';
import { Link } from 'react-router-dom'

import useScroll from '../hooks/useScroll'

import Container from 'react-bootstrap/Container';

import logo_lastfm from '../assets/logo_lastfm.svg';
import logo_spotify from '../assets/logo_spotify.svg';

function AppHeader(props) {
  const scroll = useScroll();

  useEffect(() => {
    if (scroll.direction === "up") {
      if (scroll.y > 50) {
        // @TODO: 
        // - before using this, add a debouncer
        // - set header animation upon scrolling up
      }
    }
    else if (scroll.direction === "down") {
      if (scroll.y < 50) {
        // @TODO: 
        // - before using this, add a debouncer
        // - set header animation upon scrolling down
      }
    }
  }, [scroll.direction, scroll.y])
  
  return (
    <Container fluid className="App-header" >
      <Link to="/"><img src={logo_spotify} className="App-logo" alt="Spotify" /></Link>
      <Link to="/"><img src={logo_lastfm} className="App-logo" alt="Last.fm" /></Link>
    </Container>
  )
}

export default AppHeader;