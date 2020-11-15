import React from 'react';
import {
    BrowserRouter as Router,
    Switch,
    Route,
    Redirect
  } from "react-router-dom";

import AuthPage from './pages/AuthPage'
import ArtistsPage from './pages/ArtistsPage'
import AlbumsPage from './pages/AlbumsPage'
import TracksPage from './pages/TracksPage'

function AppRoutes(props) {

  return (
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
  )
}

export default AppRoutes;