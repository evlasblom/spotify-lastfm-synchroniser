import React from 'react';
import {
    BrowserRouter as Router,
    Switch,
    Route,
    Redirect
  } from "react-router-dom";

import Container from 'react-bootstrap/Container';

import AuthPage from './pages/AuthPage'
import ProfilePage from './pages/ProfilePage'
import ArtistsPage from './pages/ArtistsPage'
import AlbumsPage from './pages/AlbumsPage'
import TracksPage from './pages/TracksPage'

function AppRoutes(props) {

  return (
    <Container className="App-content">
      <Router>
        <Switch>

          {/* home */}
          <Route exact path="/">
            <Redirect to="/auth" />
          </Route>

          {/* auth */}
          <Route exact path="/auth">
            <AuthPage />
          </Route>

          {/* app */}
          <Route exact path="/user">
            <ProfilePage />
          </Route>
          <Route exact path="/artists">
            <ArtistsPage />
          </Route>
          <Route exact path="/albums">
            <AlbumsPage />
          </Route>
          <Route exact path="/tracks">
            <TracksPage />
          </Route>

        </Switch>
      </Router>
    </Container>
  )
}

export default AppRoutes;