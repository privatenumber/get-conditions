import { getNodeFlags } from './node-options.ts';

/**
 * ESM conditions
 * https://github.com/nodejs/node/blob/v24.11.0/lib/internal/modules/esm/utils.js#L57-L73
 *
 * CJS conditions
 * https://github.com/nodejs/node/blob/v24.11.0/lib/internal/modules/helpers.js#L60-L76
 */
export const getConditions = () => {
	const { conditions, addons } = getNodeFlags();
	return [
		'node',
		...(process.features?.require_module ? ['module-sync'] : []),
		...(addons ? ['node-addons'] : []),
		...(conditions ?? []),
	];
};
