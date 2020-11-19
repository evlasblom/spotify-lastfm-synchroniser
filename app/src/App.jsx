import React, { useEffect } from 'react';

import useScroll from './hooks/useScroll'

import AppHeader from './components/AppHeader'
import AppNavigation from './components/AppNavigation'
import AppRoutes from './AppRoutes'
import './App.css';

function App() {
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
    <div className="App">
        <AppHeader />
        <AppNavigation />
        <br></br>
        <AppRoutes />
    </div>
  );
}

export default App;
