// Client entry point mounting React application root onto HTML DOM element.
// Wraps application inside BrowserRouter context for react-router-dom SPA routing.
// Imports global CSS styles file containing Tailwind directives.

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/globals.css';

// Mounts React root component into #root DOM node.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
