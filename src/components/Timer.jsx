import React, { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import dayjs from 'dayjs';
import '../styles/Timer.css';
import usePrevValue from '../utils/usePrevValue.ts';

const Timer = ({ initialSeconds, initialGoingDown, onSecondPassed, currentTask, onEvent, initialTasks }) => {
	// const [seconds, setSeconds] = useState(initialSeconds);
	// const [goingDown, setGoingDown] = useState(initialGoingDown);
	// const [enabled, setEnabled] = useState(true);
	const enabled = useRef(true);
	const [tasks, setTasks] = useState({ [currentTask]: initialSeconds });

	useEffect(() => {
		setTasks(initialTasks);
	}, [initialTasks]);

	useEffect(() => {
		const task = tasks[currentTask] || {};
		task.seconds = task.seconds || initialSeconds;
		setTasks(ts => ({ ...ts, [currentTask]: task }));
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
		} else {
			onEvent('PAUSED');
		}
		enabled.current = !enabled.current;
	}, [currentTask]);

	const formatTime = (seconds) => {
		return dayjs.duration(seconds * 1000).format('HH:mm:ss');
	};

	const title = Object.keys(tasks)
		.map(t => `${t}: ${formatTime(tasks[t].seconds)}`)
		.join('\n');

	return <span className={'big-label timer up'}
			title={title} onClick={timerClickHandler}>
		{formatTime((tasks[currentTask]?.seconds || 0))}
	</span>;
};

Timer.propTypes = {
	initialSeconds: PropTypes.number.isRequired,
	initialGoingDown: PropTypes.bool.isRequired,
	currentTask: PropTypes.string.isRequired,
	onSecondPassed: PropTypes.func.isRequired,
	onEvent: PropTypes.func.isRequired,
	initialTasks: PropTypes.arrayOf(PropTypes.object)
}

export default Timer;