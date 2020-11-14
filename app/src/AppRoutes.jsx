import React from 'react';
import {
    BrowserRouter as Router,
    Switch,
    Route,
    Redirect
  } from "react-router-dom";

import AuthPage from './pages/AuthPage'
import AppPage from './pages/AppPage'

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
        <Route exact path="/app">
          <AppPage />
        </Route>

      </Switch>
    </Router>
  )
}

export default AppRoutes;