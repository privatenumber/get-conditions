import { typeFlag } from 'type-flag';
import { tokenizeNodeOptions } from './tokenize-node-options-env.js';

const flagSchema = {
	// https://nodejs.org/api/cli.html#-c-condition---conditionscondition
	conditions: {
		type: [String],
		alias: 'C',
	},

	// https://nodejs.org/api/cli.html#--no-addons
	noAddons: [Boolean],
} as const;

export const { flags: envFlags } = typeFlag(flagSchema, tokenizeNodeOptions());
export const { flags: cliFlags } = typeFlag(flagSchema, process.execArgv);
