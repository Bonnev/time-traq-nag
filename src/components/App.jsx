import React, { useCallback, useEffect, useRef } from 'react';
import { useState } from 'react';
import reactLogo from '/react.svg';
import neutralinoLogo from '/neutralino-logo.gif';
import '../styles/App.css';
import Timer from './Timer';
import dayjs from 'dayjs';

Neutralino.filesystem.writeFile('./test.txt', 'random text');

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
				const file = await Neutralino.filesystem.readFile(dayjs().format('YY-MM-DD') + '-stats.txt') || '';
				const lines = file.split('\n');
				lines.forEach(l => result[l.split('\t')[0]] = { seconds: +l.split('\t')[1] });
				setInitialTasks(result);
				setAllTaskNames(Object.keys(result));
			} catch (e) { /* dasd */ }
		})();
	}, []);

	const onSecondPassed = useCallback(task => {
		if (!currentTask) {
			return;
		}

		seconds.current = task.seconds;

		const currentTime = dayjs();
		if (currentTime.second() === 0 && (currentTime.minute() === 25 || currentTime.minute() === 55 )) {
			var audio = new Audio('timer-short.mp3');
			audio.volume = 0.75;
			audio.play();
		}

		const duration = dayjs.duration(seconds.current * 1000);
		if (duration.seconds() % 10 === 0) {
			Neutralino.filesystem.appendFile(dayjs().format('YY-MM-DD') + '.txt', `${dayjs().format('YY-MM-DDTHH:mm:ss')}\t${currentTask}\t${duration.format('HH:mm:ss')}\n`);
		}
		if (duration.seconds() % 60 === 0) {
			(async () => {
				let index = -1;
				let lines = [];
				try {
					const file = await Neutralino.filesystem.readFile(dayjs().format('YY-MM-DD') + '-stats.txt') || '';
					lines = file.split('\n');
					index = lines.findIndex(l => l.split('\t')[0] === currentTask);
				} catch (e) { /* dasd */ }

				const newLine = `${currentTask}\t${duration.asSeconds()}\t${duration.format('HH:mm:ss')}`;
				if (index === -1) {
					lines.push(newLine);
				} else {
					lines[index] = newLine;
				}
				Neutralino.filesystem.writeFile(dayjs().format('YY-MM-DD') + '-stats.txt', lines.join('\n'));
			})();
		}
	}, [currentTask]);

	const onEvent = useCallback((event) => {
		if (event === 'PAUSED' || event === 'RESUMED') {
			Neutralino.filesystem.appendFile(dayjs().format('YY-MM-DD') + '.txt', `${dayjs().format('YY-MM-DDTHH:mm:ss')}\t${event}\n`);
		}
	});

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
	}, [seconds]);

	return (<div className='flex-column'>
		{/* <input type='text' name='estimate' placeholder='1w 2d 3h 4m 5s' onChange={onChangeHandler} /> */}
		{/* {estimate} */}

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
	</div>);
};

export default App;
