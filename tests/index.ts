import {
	describe, test, expect, onFinish,
} from 'manten';
import { createFixture } from 'fs-fixture';
import getNode from 'get-node';
import { createNode, getNodeConditions } from './utils.ts';

const nodeVersions = ['20', '22', '24', '25'];
const getConditionsPath = import.meta.resolve('#get-conditions');

for (const version of nodeVersions) {
	describe(`Node.js ${version}`, async () => {
		const node = createNode(await getNode(version));

		const fixture = await createFixture({
			'file.mjs': `
			import { getConditions } from '${getConditionsPath}';
			console.log(JSON.stringify({ conditions: getConditions(), execArgv: process.execArgv }));
			`,

			'lazy.mjs': `
			import { getConditions } from '${getConditionsPath}';
			process.env.NODE_OPTIONS = '--conditions=set-after-import';
			console.log(JSON.stringify(getConditions()));
			`,
		});
		onFinish(() => fixture.rm());

		test('Default conditions (no flags)', async () => {
			const { stdout } = await node(['file.mjs'], { cwd: fixture.path });
			const { conditions } = JSON.parse(stdout);

			const expected = await getNodeConditions(node, {});
			expect(conditions).toStrictEqual(expected);
		});

		test('Detects -C short alias', async () => {
			const nodeOptions = ['-C', 'foo', '-C', 'bar'];

			const { stdout } = await node([
				...nodeOptions,
				'file.mjs',
			], { cwd: fixture.path });
			const { conditions } = JSON.parse(stdout);

			const expected = await getNodeConditions(node, { nodeOptions });
			expect(conditions).toStrictEqual(expected);
		});

		test('Detects space-separated --conditions', async () => {
			const nodeOptions = ['--conditions', 'foo', '--conditions', 'bar'];

			const { stdout } = await node([
				...nodeOptions,
				'file.mjs',
			], { cwd: fixture.path });
			const { conditions } = JSON.parse(stdout);

			const expected = await getNodeConditions(node, { nodeOptions });
			expect(conditions).toStrictEqual(expected);
		});

		test('--no-addons excludes node-addons', async () => {
			const { stdout } = await node([
				'--no-addons',
				'file.mjs',
			], { cwd: fixture.path });
			const { conditions } = JSON.parse(stdout);

			expect(conditions).not.toContain('node-addons');
		});

		test('--no_addons underscore alias excludes node-addons', async () => {
			const nodeOptions = ['--no_addons'];

			const { stdout } = await node([
				...nodeOptions,
				'file.mjs',
			], { cwd: fixture.path });
			const { conditions } = JSON.parse(stdout);

			expect(conditions).not.toContain('node-addons');

			const expected = await getNodeConditions(node, { nodeOptions });
			expect(conditions).toStrictEqual(expected);
		});

		test('Boolean flag values are ignored (--no-addons=false still disables)', async () => {
			const nodeOptions = ['--no-addons=false'];

			const { stdout } = await node([
				...nodeOptions,
				'file.mjs',
			], { cwd: fixture.path });
			const { conditions } = JSON.parse(stdout);

			expect(conditions).not.toContain('node-addons');

			const expected = await getNodeConditions(node, { nodeOptions });
			expect(conditions).toStrictEqual(expected);
		});

		test('Last addons flag wins (--no-addons --addons)', async () => {
			const nodeOptions = ['--no-addons', '--addons'];

			const { stdout } = await node([
				...nodeOptions,
				'file.mjs',
			], { cwd: fixture.path });
			const { conditions } = JSON.parse(stdout);

			expect(conditions).toContain('node-addons');

			const expected = await getNodeConditions(node, { nodeOptions });
			expect(conditions).toStrictEqual(expected);
		});

		test('argv --addons overrides NODE_OPTIONS --no-addons', async () => {
			const NODE_OPTIONS = '--no-addons';
			const nodeOptions = ['--addons'];

			const { stdout } = await node([
				...nodeOptions,
				'file.mjs',
			], {
				cwd: fixture.path,
				env: { NODE_OPTIONS },
			});
			const { conditions } = JSON.parse(stdout);

			expect(conditions).toContain('node-addons');

			const expected = await getNodeConditions(node, {
				nodeOptions,
				NODE_OPTIONS,
			});
			expect(conditions).toStrictEqual(expected);
		});

		test('Flags are parsed lazily on first call', async () => {
			const { stdout } = await node(['lazy.mjs'], { cwd: fixture.path });
			const conditions = JSON.parse(stdout);

			expect(conditions).toContain('set-after-import');
		});

		test('NODE_OPTIONS conditions come before argv conditions', async () => {
			const NODE_OPTIONS = '--conditions=from-env';
			const nodeOptions = ['--conditions=from-cli'];

			const { stdout } = await node([
				...nodeOptions,
				'file.mjs',
			], {
				cwd: fixture.path,
				env: { NODE_OPTIONS },
			});
			const { conditions } = JSON.parse(stdout);

			const envIndex = conditions.indexOf('from-env');
			const cliIndex = conditions.indexOf('from-cli');
			expect(envIndex).not.toBe(-1);
			expect(cliIndex).not.toBe(-1);
			expect(envIndex).toBeLessThan(cliIndex);
		});

		test('Detects argv', async () => {
			const nodeOptions = [
				'--conditions=foo',
				'--conditions=bar',
			];

			const { stdout } = await node([
				...nodeOptions,
				'file.mjs',
			], { cwd: fixture.path });
			const { conditions } = JSON.parse(stdout);

			const expected = await getNodeConditions(node, { nodeOptions });
			expect(conditions).toStrictEqual(expected);
		});

		test('Detects NODE_OPTIONS', async () => {
			const NODE_OPTIONS = '--conditions=foo --conditions=bar';

			const { stdout } = await node(['file.mjs'], {
				cwd: fixture.path,
				env: { NODE_OPTIONS },
			});
			const { conditions } = JSON.parse(stdout);

			const expected = await getNodeConditions(node, { NODE_OPTIONS });
			expect(conditions).toStrictEqual(expected);
		});

		test('Does not mutate process.execArgv', async () => {
			const nodeOptions = ['--conditions=foo'];

			const { stdout } = await node([
				...nodeOptions,
				'file.mjs',
			], { cwd: fixture.path });
			const { execArgv } = JSON.parse(stdout);

			expect(execArgv).toContain('--conditions=foo');
		});

		test('Mix argv + NODE_OPTIONS', async () => {
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
			const { conditions } = JSON.parse(stdout);

			const expected = await getNodeConditions(node, {
				nodeOptions,
				NODE_OPTIONS,
			});

			expect(conditions).toStrictEqual(expected);
		});
	});
}
