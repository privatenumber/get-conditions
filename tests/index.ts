import { describe, expect } from 'manten';
import { createFixture } from 'fs-fixture';
import { execaNode } from 'execa';
import { getNodeConditions } from './utils.js';

const getConditionsPath = import.meta.resolve('#get-conditions');

describe('get-conditions', ({ test }) => {
	test('Detects argv', async ({ onTestFinish }) => {
		const fixture = await createFixture({
			'file.mjs': `
			import { getConditions } from '${getConditionsPath}';
			console.log(JSON.stringify(getConditions()));
			`,
		});

		onTestFinish(async () => await fixture.rm());

		const nodeOptions = [
			'--conditions=foo',
			'--conditions=bar',
		];

		const { stdout } = await execaNode('file.mjs', {
			nodeOptions: [
				...process.execArgv,
				...nodeOptions,
			],
			cwd: fixture.path,
		});
		const result = JSON.parse(stdout);

		const expected = await getNodeConditions({ nodeOptions });
		expect(result).toStrictEqual(expected);
	});

	test('Detects NODE_OPTIONS', async ({ onTestFinish }) => {
		const fixture = await createFixture({
			'file.mjs': `
				import { getConditions } from '${getConditionsPath}';
				console.log(JSON.stringify(getConditions()));
			`,
		});

		onTestFinish(async () => await fixture.rm());

		const NODE_OPTIONS = '--conditions=foo --conditions=bar';

		const { stdout } = await execaNode('file.mjs', {
			env: { NODE_OPTIONS },
			cwd: fixture.path,
		});
		const result = JSON.parse(stdout);

		const expected = await getNodeConditions({ NODE_OPTIONS });
		expect(result).toStrictEqual(expected);
	});

	test('Mix argv + NODE_OPTIONS', async ({ onTestFinish }) => {
		const fixture = await createFixture({
			'file.mjs': `
				import { getConditions } from '${getConditionsPath}';
				console.log(JSON.stringify(getConditions({
					import: true,
				})));
			`,
		});

		onTestFinish(async () => await fixture.rm());

		const NODE_OPTIONS = '--conditions=1 --conditions=2 --no-addons=0';
		const nodeOptions = [
			'--conditions=3',
			'--conditions=4',
		];

		const { stdout } = await execaNode('file.mjs', {
			env: { NODE_OPTIONS },
			nodeOptions: [
				...process.execArgv,
				...nodeOptions,
			],
			cwd: fixture.path,
		});
		const result = JSON.parse(stdout);

		const expected = await getNodeConditions({
			nodeOptions,
			NODE_OPTIONS,
		});

		expect(result).toStrictEqual(expected);
	});
});
