import React from 'react';
import { HashRouter } from 'react-router-dom';
import AppRoutes from './app/routes';

function App() {
  return (
    <HashRouter>
      <AppRoutes />
    </HashRouter>
  );
}

export default App;
