import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import 'stream-browserify';
import { Buffer } from 'buffer';
import 'util';

// Polyfill for process and Buffer in browser (for simple-peer and dependencies)
window.Buffer = Buffer;
window.process = window.process || {};
window.process.env = window.process.env || { NODE_ENV: 'development' };
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
