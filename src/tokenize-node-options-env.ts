import { parse as tokenizeArgv } from 'shell-quote';

export const tokenizeNodeOptions = () => {
	const { NODE_OPTIONS } = process.env;
	if (!NODE_OPTIONS) {
		return [];
	}

	return tokenizeArgv(NODE_OPTIONS)
		.map((token) => {
			if (typeof token === 'string') {
				return token;
			}
			if ('op' in token && token.op === 'glob') {
				return token.pattern;
			}
			return undefined;
		})
		.filter(Boolean);
};
