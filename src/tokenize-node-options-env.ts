/**
 * Tokenize NODE_OPTIONS env var into an argv array.
 *
 * Reimplementation of Node.js's ParseNodeOptionsEnvVar:
 * https://github.com/nodejs/node/blob/v24.11.0/src/node_options.cc#L2164-L2203
 */
export const tokenizeNodeOptions = () => {
	const nodeOptions = process.env.NODE_OPTIONS;
	if (!nodeOptions) {
		return [];
	}

	const args: string[] = [];
	let inString = false;
	let willStartNewArgument = true;

	for (let index = 0; index < nodeOptions.length; index += 1) {
		let character = nodeOptions[index];

		if (character === '\\' && inString) {
			if (index + 1 === nodeOptions.length) {
				break;
			}
			index += 1;
			character = nodeOptions[index];
		} else if (character === ' ' && !inString) {
			willStartNewArgument = true;
			continue;
		} else if (character === '"') {
			inString = !inString;
			continue;
		}

		if (willStartNewArgument) {
			args.push(character);
			willStartNewArgument = false;
		} else {
			args[args.length - 1] += character;
		}
	}

	return args;
};
