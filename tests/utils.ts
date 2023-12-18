import { createFixture, type FsFixture } from 'fs-fixture';
import { execaNode } from 'execa';

export const getNodeConditions = async ({
	nodeOptions = [],
	NODE_OPTIONS = '',
}: {
	nodeOptions?: string[];
	NODE_OPTIONS?: string;
}) => {
	let fixture: FsFixture | undefined;

	try {
		fixture = await createFixture({
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

		const { stdout } = await execaNode('file.mjs', {
			nodeOptions: [
				...process.execArgv,
				'--import',
				'./register.mjs',
				...nodeOptions,
			],
			cwd: fixture.path,
			env: {
				NODE_OPTIONS,
			},
		});
		return JSON.parse(stdout);
	} finally {
		if (fixture) {
			await fixture.rm();
		}
	}
};
