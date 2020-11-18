import React, { useState, useEffect } from 'react';

import useScroll from './hooks/useScroll'

import AppHeader from './components/AppHeader'
import AppNavigation from './components/AppNavigation'
import AppRoutes from './AppRoutes'
import './App.css';

function App() {
  const scroll = useScroll();
  const [, setHeaderStyle] = useState({});
  const [, setLogoStyle] = useState({});

  useEffect(() => {
    if (scroll.direction === "up") {
      if (scroll.y > 50) {
        // @TODO: before using this, add a debouncer
        setHeaderStyle({
          height: "70px",
          padding: "10px"
        })
        setLogoStyle({
          height: "50px"
        })
      }
    }
    else if (scroll.direction === "down") {
      if (scroll.y < 50) {
        // @TODO: before using this, add a debouncer
        setHeaderStyle({
          height: "120px",
          padding: "20px"
        })
        setLogoStyle({
          height: "80px"
        })
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
