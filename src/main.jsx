import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './components/App';
import './styles/index.css';

import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';

dayjs.extend(duration);

Neutralino.init();

ReactDOM.createRoot(document.body).render(
	<React.StrictMode>
		<App />
	</React.StrictMode>
);