import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { initDB, migrateFromLocalStorage } from './services/indexedDBService';

// Initialize IndexedDB and migrate data on app start
initDB()
  .then(() => {
    return migrateFromLocalStorage();
  })
  .then(() => {
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  })
  .catch((error) => {
    console.error('Failed to initialize database:', error);
    // Still render app even if DB init fails
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  });


