/* eslint-disable no-undef */
const dayjs = require('dayjs');
const duration = require('dayjs/plugin/duration');
dayjs.extend(duration);

const fs = require('fs');

const file = fs.readFileSync('22-10-20.txt').toString();
const lines = file.split('\n');

let offsets = {};

const maxes = {};

function getSeconds(str) {
	const parts = str.split(':');
	return +parts[0] * 3600 + +parts[1] * 60 + +parts[2];
}

function toDuration(str) {
	return dayjs.duration(1000 * getSeconds(str));
}

for (let i = 1; i < lines.length; i++){
	let previousLine = lines[i - 1];
	const line = lines[i];

	let previousParts = previousLine.split('\t');
	const parts = line.split('\t');

	if (previousParts[1] === parts[1]) {
		lines.splice(i - 1, 1);
		i--;
	}

	if (i == 0) continue;

	if (parts[1] === 'PAUSED') {
		lines.splice(i, 1);
		i--;
		continue;
	}

	previousLine = lines[i - 1];
	previousParts = previousLine.split('\t');

	if (toDuration(parts[2]).asSeconds() + (offsets[parts[1]] || 0) < (maxes[parts[1]]?.asSeconds() || 0)) {
		offsets[parts[1]] = maxes[parts[1]].asSeconds();
	}
	maxes[parts[1]] = dayjs.duration(1000*(getSeconds(parts[2]) + (offsets[parts[1]]||0)));
	
	parts.push(maxes[parts[1]].format('HH:mm:ss'));

	//parts.push(dayjs.duration(1000 * (+parts[2] + offset - +previousParts[2])).format('HH:mm:ss'));

	lines[i] = parts.join('\t');
}

// for (let i = 1; i < lines.length; i++) {
// 	let previousLine = lines[i - 1];
// 	const line = lines[i];

// 	let previousParts = previousLine.split('\t');
// 	const parts = line.split('\t');
	
// 	if (toDuration(parts[2]).asSeconds() + (offsets[parts[1]] || 0) < (maxes[parts[1]]?.asSeconds() || 0)) {
// 		offsets[parts[1]] = maxes[parts[1]].asSeconds();
// 	}
// 	maxes[parts[1]] = dayjs.duration(1000*(getSeconds(parts[2]) + (offsets[parts[1]]||0)));
	
// 	parts.push(maxes[parts[1]].format('HH:mm:ss'));

// 	//parts.push(dayjs.duration(1000 * (+parts[2] + offset - +previousParts[2])).format('HH:mm:ss'));

// 	lines[i] = parts.join('\t');
// }

fs.writeFileSync('22-10-20-transformed.txt', lines.join('\n'));