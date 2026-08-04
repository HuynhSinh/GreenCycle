import React from 'react';
import { HashRouter } from 'react-router-dom';
import AppRoutes from './app/routes';
import { QueryProvider } from './app/providers/QueryProvider';

function App() {
  return (
    <QueryProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </QueryProvider>
  );
}

export default App;
