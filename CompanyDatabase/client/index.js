import './style/App.css';

if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches || localStorage.getItem('theme') === 'light') document.documentElement.classList.add('light');

import React from 'react';
import ReactDOM from 'react-dom';

import App from './src/App.jsx';

ReactDOM.render(<App />, document.getElementById('react-root'));