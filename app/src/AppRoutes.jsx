import React from 'react';
import {
    BrowserRouter as Router,
    Switch,
    Route
  } from "react-router-dom";

import AppHeader from './components/AppHeader'
import AppNavigation from './components/AppNavigation'
import AppContent from './components/AppContent'
import HomeContent from './components/HomeContent'

import HomePage from './pages/HomePage'
import AuthPage from './pages/AuthPage'
import ProfilePage from './pages/ProfilePage'
import ArtistsPage from './pages/ArtistsPage'
import AlbumsPage from './pages/AlbumsPage'
import TracksPage from './pages/TracksPage'

/**
 * The application routes.
 * Shows different layouts and pages based on the current route.
 */
function AppRoutes() {

  return (
    <Router>
      <Switch>

        {/* home */}
        <Route exact path="/">
          <HomeLayout><HomePage /></HomeLayout>
        </Route>

        {/* auth */}
        <Route exact path="/auth">
          <AuthLayout><AuthPage /></AuthLayout>
        </Route>

        {/* app */}
        <Route exact path="/user">
          <MainLayout><ProfilePage /></MainLayout>
        </Route>
        <Route exact path="/artists">
          <MainLayout><ArtistsPage /></MainLayout>
        </Route>
        <Route exact path="/albums">
          <MainLayout><AlbumsPage /></MainLayout>
        </Route>
        <Route exact path="/tracks">
          <MainLayout><TracksPage /></MainLayout>
        </Route>

      </Switch>
    </Router>
  )
}

// Layout of the home page.
function HomeLayout(props) {

  return (
    <>
      <AppHeader size={"large"} />
      <HomeContent>
        {props.children}
      </HomeContent>
    </>
  )
}

// Layout of the auth page.
function AuthLayout(props) {

  return (
    <>
      <AppHeader size={"large"} />
      <AppContent>
        {props.children}
      </AppContent>
    </>
  )
}

// Layout of the main application pages.
function MainLayout(props) {

  return (
    <>
      <AppHeader size={"normal"} />
      <AppNavigation />
      <AppContent>
        {props.children}
      </AppContent>
    </>
  )
}

export default AppRoutes;