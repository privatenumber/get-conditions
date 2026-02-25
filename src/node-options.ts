import { parseArgs } from 'node:util';
import { tokenizeNodeOptions } from './tokenize-node-options-env.ts';

const parseNodeFlags = (args: string[]) => {
	const { values } = parseArgs({
		args,
		options: {
			// https://nodejs.org/api/cli.html#-c-condition---conditionscondition
			conditions: {
				type: 'string' as const,
				multiple: true,
				short: 'C',
			},

			// https://nodejs.org/api/cli.html#--no-addons
			'no-addons': { type: 'boolean' as const },
		},
		strict: false,
		allowPositionals: true,
	});
	return {
		conditions: values.conditions as string[] | undefined,
		'no-addons': values['no-addons'] as boolean | undefined,
	};
};

export const envFlags = parseNodeFlags(tokenizeNodeOptions());
export const cliFlags = parseNodeFlags(process.execArgv);
