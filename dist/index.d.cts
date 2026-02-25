/**
 * ESM conditions
 * https://github.com/nodejs/node/blob/v24.11.0/lib/internal/modules/esm/utils.js#L57-L73
 *
 * CJS conditions
 * https://github.com/nodejs/node/blob/v24.11.0/lib/internal/modules/helpers.js#L60-L76
 */
declare const getConditions: () => string[];

export { getConditions };
