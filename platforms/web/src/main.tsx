import React from 'react';
import ReactDOM from 'react-dom/client';
import { setPersistence } from '@openpatch/java-memory-playground';
import '@openpatch/java-memory-playground/index.css';

import App from './App';

import './index.css';

// The standalone app owns its URL, so the diagram is kept in `location.hash`.
// Embedded usages leave this off — see packages/web-component.
setPersistence(true);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
