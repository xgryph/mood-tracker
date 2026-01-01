import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import Storage from './api/storage';
import './index.css';

// Initialize storage before rendering
if (!window.storage) {
  window.storage = new Storage();
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
