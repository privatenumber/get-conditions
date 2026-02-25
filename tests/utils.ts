import { createFixture } from 'fs-fixture';
import spawn, { type Options } from 'nano-spawn';

export const node = (
	args: string[],
	options?: Options,
) => spawn(process.execPath, [...process.execArgv, ...args], options);

export const getNodeConditions = async ({
	nodeOptions = [],
	NODE_OPTIONS = '',
}: {
	nodeOptions?: string[];
	NODE_OPTIONS?: string;
}) => {
	await using fixture = await createFixture({
		'file.mjs': '',

		'register.mjs': `
		import { register } from 'node:module';
		register('./loader.mjs', import.meta.url);
		`,

		'loader.mjs': `
		let loggedConditions = false;
		export const resolve = async (specifier, context, nextResolve) => {
			if (!loggedConditions) {
				loggedConditions = true;

				const conditions = context.conditions.filter(c => !['import', 'require'].includes(c));
				console.log(JSON.stringify(conditions));
			}
			return nextResolve(specifier);
		};
		`,
	});

	const { stdout } = await node([
		'--import',
		'./register.mjs',
		...nodeOptions,
		'file.mjs',
	], {
		cwd: fixture.path,
		env: { NODE_OPTIONS },
	});
	return JSON.parse(stdout);
};
