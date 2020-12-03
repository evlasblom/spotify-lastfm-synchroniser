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

function AppRoutes(props) {

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