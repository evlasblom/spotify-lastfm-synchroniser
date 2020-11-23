import React from 'react';

import useLocation from '../hooks/useLocation'

import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';

function AppNavigation(props) {  
  const location = useLocation();
  const auth = true
  
  return (
    <Navbar bg="dark" variant="dark" className="App-navigation mb-2">
      <Nav activeKey={location.pathname} className="mr-auto ml-auto">
        <Nav.Item>
          <Nav.Link href="/user" disabled={!auth} >User</Nav.Link>
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

export default AppNavigation;
