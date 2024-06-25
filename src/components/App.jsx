import React, { useCallback, useEffect, useRef } from 'react';
import { useState } from 'react';
import settingsIcon from '/src/images/settings.svg';
import volumeOnIcon from '/src/images/volume.svg';
import volumeMuteIcon from '/src/images/volume-mute.svg';
import { filesystem, storage } from '@neutralinojs/lib';
import '../styles/App.css';
import Timer from './Timer';
import dayjs from 'dayjs';
import ReactModal from 'react-modal';
import { JSONEditor } from '@json-editor/json-editor';
import Cron from 'croner';

filesystem.writeFile('./test.txt', 'random text');

const SETTINGS_NAME = 'settings';

const settingsSchema = {
	title: 'App settings',
	type: 'object',
	properties: {
		soundOn: {
			type: 'boolean',
			description: 'Whether sound is enabled',
			default: false
		},
		alarmCron: {
			type: 'string',
			description: 'The Cron expression for the alarm. The alarm works only when sound is enabled.',
			default: '25,55 * * * *'
		}
	}
};

const App = () => {
	// const [estimate, setEstimate] = useState('');
	// const [tasks, setTasks] = useState({});
	const [allTaskNames, setAllTaskNames] = useState([]);
	// const currentTask = useRef(null);
	const [currentTask, setCurrentTask] = useState(null);
	const taskInputRef = useRef(null);
	const taskSpanRef = useRef(null);
	const seconds = useRef(0);
	const [initialTasks, setInitialTasks] = useState({});

	const [settings, setSettings] = useState({});
	const settingsJsonEditor = useRef(null);
	const [settingsModalOpen, setSettingsModalOpen] = useState(false);
	const handleSettingsModalClose = useCallback(() => setSettingsModalOpen(false), []);
	const openSettingsModal =  useCallback(() => setSettingsModalOpen(true), []);

	const soundOn = (typeof settings.soundOn !== 'undefined') ? !!settings.soundOn : true;
	const alarmJob = useRef();
	const volumeIcon = soundOn ? volumeOnIcon : volumeMuteIcon;

	const updateTimerJob = useCallback((alarmJob, cron, soundOn) => {
		alarmJob && alarmJob.stop();

		if (soundOn) {
			return Cron(cron, () => {
				var audio = new Audio('timer-short.mp3');
				audio.volume = 0.75;
				audio.play();
			});
		}
	}, []);

	const toggleSound = useCallback(() => {
		setSettings(prevSettings => {
			const settingsJson = Object.assign({}, prevSettings);
			settingsJson.soundOn = !soundOn;
			// update settings file
			storage
				.setData(SETTINGS_NAME, `/* {"version":1} */\n${JSON.stringify(settingsJson)}`)
				.catch((e) => console.error(e));
			setSettings(settingsJson);

			alarmJob.current = updateTimerJob(alarmJob.current, settingsJson.alarmCron, settingsJson.soundOn);
			return settingsJson;
		});
	}, [soundOn, updateTimerJob]);

	const storeSettings = useCallback(() => {
		const settingsJson = settingsJsonEditor.current.getValue();
		storage
			.setData(SETTINGS_NAME, `/* {"version":1} */\n${JSON.stringify(settingsJson)}`)
			.catch((e) => console.error(e));
		setSettings(settingsJson);

		alarmJob.current = updateTimerJob(alarmJob.current, settingsJson.alarmCron, settingsJson.soundOn);
		handleSettingsModalClose();
	}, [handleSettingsModalClose, updateTimerJob]);

	const modalInit = useCallback(async () => {
		if (document.getElementById('settingsJsonEditor') == null) return;

		const data = await storage.getData(SETTINGS_NAME);
		const newLineIndex = data.indexOf('\n');
		// const metadata = data.substring(0, newLineIndex + 1);
		const settingsString = data.substring(newLineIndex + 1);
		const settings = JSON.parse(settingsString);

		var editor = new JSONEditor(document.getElementById('settingsJsonEditor'), {
			schema: settingsSchema,
			no_additional_properties: true,
			required_by_default: true,
			disable_edit_json: true,
			disable_properties: true,
			startval: settings
		});

		settingsJsonEditor.current = editor;
	}, []);

	// const onChangeHandler = useCallback((event) => {
	// 	setEstimate(event.target.value);
	// },[setEstimate]);

	useEffect(() => {
		fetch('https://bing.biturl.top?format=image&resolution=1366')
			.then(i=>i.blob())
			.then(data => {
				document.body.style.backgroundImage = `url("${URL.createObjectURL(data)}"`;
			});

		//Neutralino.window.setDraggableRegion(document.querySelector('#move-icon'));

		(async () => {
			try {
				const result = {};
				const file = await filesystem.readFile(dayjs().format('YY-MM-DD') + '-stats.txt') || '';
				const lines = file.split('\n');
				lines.forEach(l => result[l.split('\t')[0]] = { seconds: +l.split('\t')[1] });
				setInitialTasks(result);
				setAllTaskNames(Object.keys(result));
			} catch (e) { console.error(e); }
		})();

		(async () => {
			try {
				const data = await storage.getData(SETTINGS_NAME);
				const newLineIndex = data.indexOf('\n');
				// const metadata = data.substring(0, newLineIndex + 1);
				const settingsString = data.substring(newLineIndex + 1);
				const settingsJson = JSON.parse(settingsString);
				setSettings(settingsJson);

				const cron = settingsJson.alarmCron || '0 25,55 * * *';
				alarmJob.current = updateTimerJob(alarmJob.current, cron, settingsJson.soundOn);
				//alarmJob.current.schedule(alarmJob.current);
			} catch (e) { console.error(e); }
		})();
	}, []);

	const onSecondPassed = useCallback(task => {
		if (!currentTask) {
			return;
		}

		seconds.current = task.seconds;

		const currentTime = dayjs();
		// if (soundOn && currentTime.second() % 10 === 0) { // every 10 seconds (for testing)
		/*if (soundOn && currentTime.second() === 0 && (currentTime.minute() === 25 || currentTime.minute() === 55 )) {
			var audio = new Audio('timer-short.mp3');
			audio.volume = 0.75;
			audio.play();
		}*/

		const duration = dayjs.duration(seconds.current * 1000);
		if (duration.seconds() % 10 === 0) {
			filesystem.appendFile(dayjs().format('YY-MM-DD') + '.txt', `${dayjs().format('YY-MM-DDTHH:mm:ss')}\t${currentTask}\t${duration.format('HH:mm:ss')}\n`);
		}
		if (duration.seconds() % 60 === 0) {
			(async () => {
				let index = -1;
				let lines = [];
				try {
					const file = await filesystem.readFile(dayjs().format('YY-MM-DD') + '-stats.txt') || '';
					lines = file.split('\n');
					index = lines.findIndex(l => l.split('\t')[0] === currentTask);
				} catch (e) { console.error(e); }

				const newLine = `${currentTask}\t${duration.asSeconds()}\t${duration.format('HH:mm:ss')}`;
				if (index === -1) {
					lines.push(newLine);
				} else {
					lines[index] = newLine;
				}
				filesystem.writeFile(dayjs().format('YY-MM-DD') + '-stats.txt', lines.join('\n'));
			})();
		}
	}, [currentTask, soundOn]);

	const onEvent = useCallback((event) => {
		if (event === 'PAUSED' || event === 'RESUMED') {
			filesystem.appendFile(dayjs().format('YY-MM-DD') + '.txt', `${dayjs().format('YY-MM-DDTHH:mm:ss')}\t${event}\n`);
		}
	}, []);

	const taskSubmitHandler = useCallback((event) => {
		// const task = tasks[currentTask.current] || {};
		// task.seconds = seconds;
		// setTasks(ts => ({ ...ts, [currentTask.current]: task }));

		const currentTaskLocal = event.target['task'].value;
		setCurrentTask(event.target['task'].value);
		taskSpanRef.current.innerText = currentTaskLocal;
		taskInputRef.current.value = '';
		setAllTaskNames(all => all.includes(currentTaskLocal) ? all : [...all, currentTaskLocal]);

		event.preventDefault();
		return false;
	}, []);

	const configContainersStyle = {
		backgroundColor: 'rgba(255, 255, 255, 0.4)',
		display: 'inline-block',
		height: 40,
		cursor: 'pointer',
		borderRadius: 7,
		marginRight: 7
	};

	return (<div className='flex-column'>
		{/* <input type='text' name='estimate' placeholder='1w 2d 3h 4m 5s' onChange={onChangeHandler} /> */}
		{/* {estimate} */}
		<div id='configs' style={{
			position: 'absolute',
			top: 7,
			left: 7
		}}>
			<span id='soundOnContainer' style={configContainersStyle}>
				<img src={volumeIcon} onClick={toggleSound} height="40" />
			</span>
			<span id='soundOnContainer' style={configContainersStyle}>
				<img src={settingsIcon} onClick={openSettingsModal} height="40" />
			</span>
		</div>

		<form onSubmit={taskSubmitHandler}>
			<input type='text' list='tasks' name='task' placeholder='Task' ref={taskInputRef} />
			<datalist id='tasks'>
				{allTaskNames.map(taskName =>
					<option key={taskName} value={taskName} />
				)}
			</datalist>

			<button type='submit'>Submit</button>
		</form>

		<span className='big-label current-task' ref={taskSpanRef}>{currentTask}</span>
		<Timer initialSeconds={0} currentTask={currentTask} onEvent={onEvent} initialTasks={initialTasks} onSecondPassed={onSecondPassed} initialGoingDown={false} />
		{/* <img src='/move-icon.png' id="move-icon" alt="move-icon" /> */}

		<ReactModal
			isOpen={settingsModalOpen}
			onAfterOpen={modalInit}
			contentLabel="Settings modal"
			onRequestClose={handleSettingsModalClose}>
			<div id='settingsJsonEditor' style={{ textAlign: 'left' }} />
			<button type="button" onClick={storeSettings} style={{ padding: '5px 10px' }}>Save</button>
		</ReactModal>
	</div>);
};

export default App;
