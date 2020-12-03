import React, { useEffect } from 'react';
import { Link } from 'react-router-dom'

import useScroll from '../hooks/useScroll'

import Container from 'react-bootstrap/Container';

import logo_lastfm from '../assets/logo_lastfm.svg';
import logo_spotify from '../assets/logo_spotify.svg';

const smallLogoStyle = {
  height: "60px",
  padding: "5px"
}

const smallHeaderStyle = {
  height: "80px",
  padding: "10px",
  backgroundColor: "#222",
};

const normalLogoStyle = {
  height: "80px",
  padding: "5px"
}

const normalHeaderStyle = {
  height: "120px",
  padding: "20px",
  backgroundColor: "#222",
};

const largeLogoStyle = {
  height: "120px",
  padding: "10px"
}

const largeHeaderStyle = {
  height: "200px",
  padding: "40px",
  backgroundColor: "#222",
};

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

  let logo = normalLogoStyle;
  let header = normalHeaderStyle;

  switch (props.size) {
    case "small":
      logo = smallLogoStyle;
      header = smallHeaderStyle;
      break;
    case "normal":
      logo = normalLogoStyle;
      header = normalHeaderStyle;
      break;
    case "large":
      logo = largeLogoStyle;
      header = largeHeaderStyle;
      break;
    default:
      logo = normalLogoStyle;
      header = normalHeaderStyle;
  }
  
  return (
    <Container fluid className="App-header" style={header}>
      <Link to="/"><img src={logo_spotify} className="App-logo" style={logo} alt="Spotify" /></Link>
      <Link to="/"><img src={logo_lastfm} className="App-logo" style={logo} alt="Last.fm" /></Link>
    </Container>
  )
}

export default AppHeader;