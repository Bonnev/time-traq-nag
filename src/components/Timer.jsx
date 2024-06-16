import React, { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import dayjs from 'dayjs';
import '../styles/Timer.css';
import usePrevValue from '../utils/usePrevValue.ts';

const Timer = ({ initialSeconds, initialGoingDown, onSecondPassed, currentTask = '', onEvent, initialTasks = [] }) => {
	// const [seconds, setSeconds] = useState(initialSeconds);
	// const [goingDown, setGoingDown] = useState(initialGoingDown);
	// const [enabled, setEnabled] = useState(true);
	const enabled = useRef(true);
	const pausedBlinkTimeoutId = useRef();
	const timerRef = useRef();
	const [tasks, setTasks] = useState({ [currentTask]: initialSeconds });

	useEffect(() => {
		setTasks(initialTasks);
	}, [initialTasks]);

	useEffect(() => {
		setTasks(ts => {
			const task = { ...ts[currentTask] } || {};
			task.seconds ||= initialSeconds;
			ts[currentTask] = task;
			return ts;
		});
	}, [initialSeconds, currentTask]);

	useEffect(() => {
		const id = setTimeout(() => {
			if (!enabled.current) {
				return;
			}

			const task = tasks[currentTask] || {};

			// if (goingDown && task.seconds === 0) {
			// 	setSeconds(1);
			// 	// setGoingDown(false);
			// 	return;
			// }

			// task.seconds = seconds;

			task.seconds++;
			setTasks(ts => ({ ...ts, [currentTask]: task }));

			// if (goingDown) {
			// 	setTasks(ts => ({ ...ts, [currentTask]: task }));
			// 	setSeconds((s) => s - 1);
			// } else {
			// 	setSeconds((s) => s + 1);
			// }

			onSecondPassed(task);
		}, 1000);

		return () => clearTimeout(id);
	}, [tasks, onSecondPassed]);

	const timerClickHandler = useCallback(() => {
		if (!enabled.current) {
			setTasks(ts => {
				const task = ts[currentTask] || {};
				return { ...ts, [currentTask]: task };
			});
			onEvent('RESUMED');
			timerRef.current.classList.remove('paused');
			timerRef.current.classList.remove('paused-blink');
			pausedBlinkTimeoutId.current && clearTimeout(pausedBlinkTimeoutId.current);
		} else {
			onEvent('PAUSED');
			timerRef.current.classList.add('paused');
			timerRef.current.classList.remove('paused-blink');
			pausedBlinkTimeoutId.current = setTimeout(() => {
				timerRef.current.classList.add('paused-blink');
			}, 2 * 60 * 1000); // 2 minutes
		}
		enabled.current = !enabled.current;
	}, [currentTask]);

	const formatTime = (seconds) => {
		return dayjs.duration(seconds * 1000).format('HH:mm:ss');
	};

	const title = Object.keys(tasks)
		.map(t => `${t}: ${formatTime(tasks[t].seconds)}`)
		.join('\n');

	return (
		<span className='big-label timer up' ref={timerRef}
			title={title} onClick={timerClickHandler}>
			{formatTime((tasks[currentTask]?.seconds || 0))}
		</span>
	);
};

Timer.propTypes = {
	initialSeconds: PropTypes.number.isRequired,
	initialGoingDown: PropTypes.bool.isRequired,
	currentTask: PropTypes.string,
	onSecondPassed: PropTypes.func.isRequired,
	onEvent: PropTypes.func.isRequired,
	initialTasks: PropTypes.objectOf(
		PropTypes.shape({
			seconds: PropTypes.number.isRequired
		}))
};

export default Timer;