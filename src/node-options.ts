import { parseArgs } from 'node:util';
import { tokenizeNodeOptions } from './tokenize-node-options-env.ts';

/**
 * Node treats `_` as interchangeable with `-` in option names
 * (values are untouched):
 * https://github.com/nodejs/node/blob/v24.15.0/src/node_options-inl.h#L369-L373
 */
const normalizeFlagName = (argument: string) => {
	if (!argument.startsWith('--')) {
		return argument;
	}

	const equalsIndex = argument.indexOf('=');
	if (equalsIndex === -1) {
		return argument.replaceAll('_', '-');
	}

	return argument.slice(0, equalsIndex).replaceAll('_', '-') + argument.slice(equalsIndex);
};

const parseNodeFlags = (args: string[]) => {
	const { values, tokens } = parseArgs({
		args: args.map(normalizeFlagName),
		options: {
			// https://nodejs.org/api/cli.html#-c-condition---conditionscondition
			conditions: {
				type: 'string' as const,
				multiple: true,
				short: 'C',
			},

			// https://nodejs.org/api/cli.html#--no-addons
			addons: { type: 'boolean' as const },
			'no-addons': { type: 'boolean' as const },
		},
		strict: false,
		allowPositionals: true,
		tokens: true,
	});

	/**
	 * Node ignores values on boolean flags (`--no-addons=false` still
	 * disables addons) and the last flag wins (`--no-addons --addons`
	 * keeps addons enabled):
	 * https://github.com/nodejs/node/blob/v24.15.0/src/node_options-inl.h#L375-L380
	 */
	let addons = true;
	for (const token of tokens) {
		if (token.kind === 'option') {
			if (token.name === 'addons') {
				addons = true;
			} else if (token.name === 'no-addons') {
				addons = false;
			}
		}
	}

	return {
		// In non-strict mode, a valueless --conditions parses as a boolean
		conditions: (
			values.conditions as (string | boolean)[] | undefined
		)?.filter((value): value is string => typeof value === 'string'),
		addons,
	};
};

let nodeFlags: ReturnType<typeof parseNodeFlags> | undefined;

/**
 * Parsed lazily on first access so importing this module has no
 * side effects (e.g. node:util's parseArgs only exists in
 * Node.js >=18.3.0)
 *
 * NODE_OPTIONS is processed before argv so argv flags win:
 * https://github.com/nodejs/node/blob/v24.15.0/src/node.cc#L954-L967
 */
export const getNodeFlags = () => {
	nodeFlags ??= parseNodeFlags([
		...tokenizeNodeOptions(),
		...process.execArgv,
	]);
	return nodeFlags;
};
