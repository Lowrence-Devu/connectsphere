import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import 'stream-browserify';

// Polyfill for process in browser (for simple-peer and dependencies)
window.process = window.process || {};
window.process.env = window.process.env || { NODE_ENV: 'development' };
// Polyfill for process.nextTick
window.process.nextTick = function (cb) {
  return Promise.resolve().then(cb);
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
serviceWorkerRegistration.register();
