import { envFlags, cliFlags } from './node-options.ts';

/**
 * ESM conditions
 * https://github.com/nodejs/node/blob/v24.11.0/lib/internal/modules/esm/utils.js#L57-L73
 *
 * CJS conditions
 * https://github.com/nodejs/node/blob/v24.11.0/lib/internal/modules/helpers.js#L60-L76
 */
export const getConditions = () => {
	const noAddons = envFlags['no-addons'] || cliFlags['no-addons'];
	return [
		'node',
		...(process.features?.require_module ? ['module-sync'] : []),
		...(noAddons ? [] : ['node-addons']),
		...(envFlags.conditions ?? []),
		...(cliFlags.conditions ?? []),
	];
};
