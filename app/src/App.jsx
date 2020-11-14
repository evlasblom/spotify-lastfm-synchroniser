import React from 'react';

import Container from 'react-bootstrap/Container';

import AppHeader from './components/AppHeader'
import AppRoutes from './AppRoutes'
import './App.css';

function App() {
  
  return (
    <div className="App">
      <AppHeader />
      <br></br>
      <Container className="App-content">
        <AppRoutes />
      </Container>
    </div>
  );
}

export default App;
