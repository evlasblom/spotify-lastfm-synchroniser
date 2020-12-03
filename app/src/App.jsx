import React from 'react';

import AppHeader from './components/AppHeader'
import AppNavigation from './components/AppNavigation'
import AppRoutes from './AppRoutes'
import './App.css';

function App() {
  
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
