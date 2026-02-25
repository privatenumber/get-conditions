import { describe, test, expect } from 'manten';
import { createFixture } from 'fs-fixture';
import { node, getNodeConditions } from './utils.ts';

const getConditionsPath = import.meta.resolve('#get-conditions');

describe('get-conditions', () => {
	test('Detects argv', async () => {
		await using fixture = await createFixture({
			'file.mjs': `
			import { getConditions } from '${getConditionsPath}';
			console.log(JSON.stringify(getConditions()));
			`,
		});

		const nodeOptions = [
			'--conditions=foo',
			'--conditions=bar',
		];

		const { stdout } = await node([
			...nodeOptions,
			'file.mjs',
		], { cwd: fixture.path });
		const result = JSON.parse(stdout);

		const expected = await getNodeConditions({ nodeOptions });
		expect(result).toStrictEqual(expected);
	});

	test('Detects NODE_OPTIONS', async () => {
		await using fixture = await createFixture({
			'file.mjs': `
				import { getConditions } from '${getConditionsPath}';
				console.log(JSON.stringify(getConditions()));
			`,
		});

		const NODE_OPTIONS = '--conditions=foo --conditions=bar';

		const { stdout } = await node(['file.mjs'], {
			cwd: fixture.path,
			env: { NODE_OPTIONS },
		});
		const result = JSON.parse(stdout);

		const expected = await getNodeConditions({ NODE_OPTIONS });
		expect(result).toStrictEqual(expected);
	});

	test('Does not mutate process.execArgv', async () => {
		await using fixture = await createFixture({
			'file.mjs': `
				import { getConditions } from '${getConditionsPath}';
				getConditions();
				console.log(JSON.stringify(process.execArgv));
			`,
		});

		const nodeOptions = ['--conditions=foo'];

		const { stdout } = await node([
			...nodeOptions,
			'file.mjs',
		], { cwd: fixture.path });
		const result = JSON.parse(stdout);

		expect(result).toContain('--conditions=foo');
	});

	test('Mix argv + NODE_OPTIONS', async () => {
		await using fixture = await createFixture({
			'file.mjs': `
				import { getConditions } from '${getConditionsPath}';
				console.log(JSON.stringify(getConditions()));
			`,
		});

		const NODE_OPTIONS = '--conditions=1 --conditions=2 --no-addons=0';
		const nodeOptions = [
			'--conditions=3',
			'--conditions=4',
		];

		const { stdout } = await node([
			...nodeOptions,
			'file.mjs',
		], {
			cwd: fixture.path,
			env: { NODE_OPTIONS },
		});
		const result = JSON.parse(stdout);

		const expected = await getNodeConditions({
			nodeOptions,
			NODE_OPTIONS,
		});

		expect(result).toStrictEqual(expected);
	});
});
