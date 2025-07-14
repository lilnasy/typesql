import assert from 'node:assert';
import type { MySqlDialect, SchemaDef } from '../src/types';
import { parseSql } from '../src/describe-query';
import { createMysqlClientForTest } from '../src/queryExectutor';
import { isLeft } from 'fp-ts/lib/Either';

describe('Parse window functions', () => {
	let client!: MySqlDialect;
	before(async () => {
		client = await createMysqlClientForTest('mysql://root:password@localhost/mydb');
	});

	it('SELECT ROW_NUMBER() OVER() as num', async () => {
		const sql = `
        SELECT
            ROW_NUMBER() OVER() as num
        FROM mytable1
        `;
		const actual = await parseSql(client, sql);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'num',
					type: 'bigint',
					notNull: true,
					table: '' //TODO - not implemented
				}
			],
			parameters: []
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('SELECT *, (ROW_NUMBER() OVER()) as num', async () => {
		const sql = `
        SELECT
            *,
            (ROW_NUMBER() OVER()) as num
        FROM mytable1
        `;
		const actual = await parseSql(client, sql);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'id',
					type: 'int',
					notNull: true,
					table: 'mytable1'
				},
				{
					name: 'value',
					type: 'int',
					notNull: false,
					table: 'mytable1'
				},
				{
					name: 'num',
					type: 'bigint',
					notNull: true,
					table: ''
				}
			],
			parameters: []
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('FIRST_VALUE(id), LAST_VALUE(name), RANK() and DENSE_RANK()', async () => {
		const sql = `
        SELECT
            FIRST_VALUE(id) OVER() as firstId,
            LAST_VALUE(name) OVER() as lastName,
            RANK() OVER() as rankValue,
            DENSE_RANK() OVER() as denseRankValue
        FROM mytable2
        `;
		const actual = await parseSql(client, sql);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'firstId',
					type: 'int',
					notNull: true,
					table: 'mytable2'
				},
				{
					name: 'lastName',
					type: 'varchar',
					notNull: false,
					table: 'mytable2'
				},
				{
					name: 'rankValue',
					type: 'bigint',
					notNull: true,
					table: ''
				},
				{
					name: 'denseRankValue',
					type: 'bigint',
					notNull: true,
					table: ''
				}
			],
			parameters: []
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('SUM(value) OVER() AS total', async () => {
		const sql = `
        SELECT
            SUM(value) OVER() AS total
        FROM mytable1
        `;
		const actual = await parseSql(client, sql);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'total',
					type: 'decimal',
					notNull: false,
					table: 'mytable1'
				}
			],
			parameters: []
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('SELECT AVG(value) OVER() as avgResult FROM mytable1', async () => {
		const sql = `
        SELECT AVG(value) OVER() as avgResult FROM mytable1
        `;
		const actual = await parseSql(client, sql);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'avgResult',
					type: 'decimal',
					notNull: false,
					table: 'mytable1'
				}
			],
			parameters: []
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});

	it('LEAD() and LAG()', async () => {
		const sql = `
        SELECT
            LEAD(id) OVER() as leadValue,
            LAG(name) OVER() as lagValue
        FROM mytable2
        `;
		const actual = await parseSql(client, sql);
		const expected: SchemaDef = {
			sql,
			queryType: 'Select',
			multipleRowsResult: true,
			columns: [
				{
					name: 'leadValue',
					type: 'int',
					notNull: false,
					table: 'mytable2'
				},
				{
					name: 'lagValue',
					type: 'varchar',
					notNull: false,
					table: 'mytable2'
				}
			],
			parameters: []
		};
		if (isLeft(actual)) {
			assert.fail(`Shouldn't return an error: ${actual.left.description}`);
		}
		assert.deepStrictEqual(actual.right, expected);
	});
});
