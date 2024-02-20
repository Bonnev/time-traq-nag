import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './components/App';
import './styles/index.css';

import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';

dayjs.extend(duration);

Neutralino.init();

Neutralino.events.on('serverOffline',function() {
	const date = new Date();
	const timestamp = date.toLocaleString('en-US');
	console.log('server offline ' + timestamp );
	window.location.reload();
});

ReactDOM.createRoot(document.getElementById('root')).render(
	<React.StrictMode>
		<App />
	</React.StrictMode>
);